"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, BellOff } from "lucide-react";
import { usePosStore } from "@/lib/pos-store";
import type { KdsTicket } from "@/lib/console-data";
import {
  activeTickets,
  elapsedLabel,
  elapsedTone,
  nextTicketStatus,
  ticketActionLabel,
  ticketStatus,
} from "@/lib/kitchen";

const MUTE_KEY = "tanawa_kds_muted";

const STATUS_LABEL: Record<string, string> = {
  queued: "Queued",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
};

const SOURCE_TONE: Record<string, string> = {
  "Dine-in": "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  Takeout: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  Delivery: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
};

/** Two-tone Web Audio chime; silently ignored when autoplay is blocked. */
function playChime() {
  if (typeof window === "undefined") return;
  const Ctor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;
  try {
    const context = new Ctor();
    const gain = context.createGain();
    gain.gain.value = 0.06;
    gain.connect(context.destination);
    [880, 1174].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      oscillator.start(context.currentTime + index * 0.14);
      oscillator.stop(context.currentTime + index * 0.14 + 0.12);
    });
    window.setTimeout(() => void context.close(), 700);
  } catch {
    // Audio is a progressive enhancement.
  }
}

export function KitchenBoard({ fullScreen = false }: { fullScreen?: boolean }) {
  const { state, actions } = usePosStore();
  const [station, setStation] = useState("");
  const [muted, setMuted] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const seenRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setMuted(window.localStorage.getItem(MUTE_KEY) === "1");
      } catch {
        // Private mode.
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Poll the live API every 5 seconds when PostgreSQL is active.
  useEffect(() => {
    void actions.refreshKitchenTickets();
    const interval = window.setInterval(() => void actions.refreshKitchenTickets(), 5_000);
    return () => window.clearInterval(interval);
  }, [actions]);

  // Live elapsed timers.
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(interval);
  }, []);

  const tickets = useMemo(() => activeTickets(state.kdsTickets), [state.kdsTickets]);

  // Chime when a new ticket arrives from any register/tab.
  useEffect(() => {
    if (seenRef.current === null) {
      seenRef.current = new Set(tickets.map((ticket) => ticket.id));
      return;
    }
    const fresh = tickets.filter((ticket) => !seenRef.current?.has(ticket.id));
    for (const ticket of tickets) seenRef.current.add(ticket.id);
    if (fresh.length > 0 && !muted) playChime();
  }, [tickets, muted]);

  const stations = useMemo(() => {
    const configured = state.stations.map((entry) => entry.title);
    for (const ticket of tickets) if (!configured.includes(ticket.station)) configured.push(ticket.station);
    return configured;
  }, [state.stations, tickets]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const ticket of tickets) map.set(ticket.station, (map.get(ticket.station) ?? 0) + 1);
    return map;
  }, [tickets]);

  const visible = station ? tickets.filter((ticket) => ticket.station === station) : tickets;

  const toggleMute = () => {
    setMuted((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(MUTE_KEY, next ? "1" : "0");
      } catch {
        // Private mode.
      }
      return next;
    });
  };

  return (
    <div className={fullScreen ? "min-h-screen bg-[#F3F5F7] p-6 text-[#1F2328] dark:bg-[#17191C] dark:text-white" : ""}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {fullScreen && (
            <Link href="/pos" className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs dark:bg-[#24272C] dark:text-slate-200">
              <ArrowLeft className="h-3.5 w-3.5" /> POS
            </Link>
          )}
          <h2 className="text-lg font-bold">Kitchen Kit</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-[#33373E] dark:text-slate-300">
            {tickets.length} open
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${state.isOnline ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/15 text-rose-600 dark:text-rose-300"}`}>
            {state.isOnline ? "Live" : "Offline"}
          </span>
          <button
            type="button"
            onClick={toggleMute}
            aria-pressed={muted}
            className="inline-flex items-center gap-1 rounded-md border border-[#E5E8EC] bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:border-[#33373E] dark:bg-[#24272C] dark:text-slate-300"
          >
            {muted ? <BellOff className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
            {muted ? "Unmute" : "Mute"}
          </button>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStation("")}
          className={`rounded-full px-3 py-1.5 text-xs font-bold ${station === "" ? "bg-[#1A73E8] text-white" : "bg-white dark:bg-[#2C3036]"}`}
        >
          All stations ({tickets.length})
        </button>
        {stations.map((title) => (
          <button
            key={title}
            type="button"
            onClick={() => setStation(title)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${station === title ? "bg-[#1A73E8] text-white" : "bg-white dark:bg-[#2C3036]"}`}
          >
            {title} ({counts.get(title) ?? 0})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 py-16 text-center text-xs text-slate-500 dark:border-[#33373E] dark:bg-[#24272C]/60 dark:text-slate-400">
          No active tickets. Send an order “To Kitchen” from the POS Register.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              now={now}
              onAdvance={() => actions.bumpKdsTicket(ticket.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TicketCard({ ticket, now, onAdvance }: { ticket: KdsTicket; now: number; onAdvance: () => void }) {
  const status = ticketStatus(ticket);
  const tone = elapsedTone(ticket, now);
  const timerClass =
    tone === "red"
      ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
      : tone === "amber"
        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
        : "bg-slate-100 text-slate-600 dark:bg-[#33373E] dark:text-slate-300";

  return (
    <article className="flex flex-col rounded-xl border border-[#E5E8EC] bg-white p-4 shadow-2xs dark:border-[#33373E] dark:bg-[#24272C]">
      <header className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-bold">
            {ticket.tableName} <span className="text-slate-400">#{ticket.receiptNum}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${SOURCE_TONE[ticket.source ?? ""] ?? "bg-slate-100 text-slate-600 dark:bg-[#33373E] dark:text-slate-300"}`}>
              {ticket.source ?? "Dine-in"}
            </span>
            <span className="rounded-full bg-[#E8EFF7] px-2 py-0.5 text-[10px] font-bold text-[#1A73E8] dark:bg-[#33373E] dark:text-[#7EB3F5]">
              {STATUS_LABEL[status]}
            </span>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${timerClass}`} title="Elapsed since sent to kitchen">
          {elapsedLabel(ticket, now)}
        </span>
      </header>

      {ticket.comment && (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          {ticket.comment}
        </p>
      )}

      <ul className="mt-3 flex-1 space-y-1.5 text-sm">
        {ticket.items.map((item, index) => (
          <li key={`${item.name}-${index}`} className="flex justify-between gap-2">
            <span className="font-medium">{item.qty} × {item.name}</span>
            <span className="font-mono font-bold text-slate-400">{ticket.station}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onAdvance}
        className={`mt-4 w-full rounded-lg py-2 text-xs font-bold text-white ${
          status === "ready" ? "bg-[#1A73E8]" : "bg-[#1DB954]"
        }`}
      >
        {ticketActionLabel(status)} → {STATUS_LABEL[nextTicketStatus(status)]}
      </button>
      <span className="mt-1.5 text-center text-[10px] text-slate-400">{ticket.station} · sent {ticket.time}</span>
    </article>
  );
}
