"use client";

import { useState, type ReactNode } from "react";
import {
  Banknote,
  Bike,
  ChevronDown,
  Columns3,
  CreditCard,
  Download,
  Gift,
  MoreVertical,
  Pencil,
  Printer,
  Wallet,
  X,
} from "lucide-react";
import { usePosStore } from "@/lib/pos-store";
import type { OrderSource, PaymentMethodConfig, PaymentMethodIcon, PosPaymentType } from "@/lib/console-data";
import { Card, ROW, TD, TH, Toggle } from "../ui";

export type OrdersTab = "sources" | "methods";

const PAYMENT_TYPES: PosPaymentType[] = ["Cash", "Cashless", "Other"];

const INPUT =
  "w-full rounded-md border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1A73E8] dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white";

function MethodIcon({ icon, muted }: { icon: PaymentMethodIcon; muted?: boolean }) {
  const className = `h-4 w-4 ${muted ? "text-slate-400" : "text-[#4EA1FF]"}`;
  switch (icon) {
    case "cash": return <Banknote className={className} />;
    case "card": return <CreditCard className={className} />;
    case "gift": return <Gift className={className} />;
    case "wallet": return <Wallet className={className} />;
    default: return <Bike className={className} />;
  }
}

function feeLabel(pct: number | null): string {
  return pct === null ? "—" : `${pct.toFixed(3)}%`;
}

type ModalState =
  | { kind: "source"; id: string | null }
  | { kind: "method"; id: string | null }
  | null;

export function OrdersSettingsView({ initialTab = "sources" }: { initialTab?: OrdersTab }) {
  const { state, actions } = usePosStore();
  const [tab, setTab] = useState<OrdersTab>(initialTab);
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<PosPaymentType | "All">("All");
  const [modal, setModal] = useState<ModalState>(null);

  const query = search.trim().toLowerCase();
  const sources = state.orderSources ?? [];
  const methods = state.paymentMethods ?? [];
  const visibleSources = sources.filter(
    (source) =>
      source.title.toLowerCase().includes(query) &&
      (!posFilter || (posFilter === "yes" ? source.displayOnPos : !source.displayOnPos)),
  );
  const visibleMethods = methods.filter(
    (method) =>
      method.title.toLowerCase().includes(query) &&
      (typeFilter === "All" || method.paymentType === typeFilter),
  );
  const count = tab === "sources" ? sources.length : methods.length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E8EC] pb-3.5 dark:border-[#33373E]">
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-xl font-bold tracking-tight">Orders</h1>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{count}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <button type="button" className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-[#1A73E8] hover:bg-sky-500/10 dark:text-[#7EB3F5]" onClick={() => actions.showToast("All table columns displayed")}>
            <Columns3 className="h-3.5 w-3.5" /> Columns <ChevronDown className="h-3 w-3" />
          </button>
          <button type="button" className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-[#1A73E8] hover:bg-sky-500/10 dark:text-[#7EB3F5]" onClick={() => actions.showToast(`Exported ${count} rows to CSV`, "success")}>
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button type="button" className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-[#1A73E8] hover:bg-sky-500/10 dark:text-[#7EB3F5]" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
          <button
            type="button"
            onClick={() => setModal(tab === "sources" ? { kind: "source", id: null } : { kind: "method", id: null })}
            className="ml-1 cursor-pointer rounded-md bg-[#1DB954] px-4 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#18A348]"
          >
            Add
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 py-3.5">
        {(["sources", "methods"] as OrdersTab[]).map((entry) => (
          <button
            key={entry}
            type="button"
            onClick={() => setTab(entry)}
            className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold ${
              tab === entry ? "bg-[#E8F1FD] text-[#0077FF]" : "text-[#4EA1FF] hover:bg-sky-50 dark:hover:bg-white/5"
            }`}
          >
            {entry === "sources" ? "Order source" : "Order payment methods"}
          </button>
        ))}
      </div>

      {tab === "sources" ? (
        <>
          <div className="flex flex-wrap items-center gap-2.5 py-1 text-xs">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Quick search" className="w-52 rounded-md border border-[#D1D5DB] bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#1A73E8] focus:outline-none dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white dark:placeholder:text-slate-500" />
            <select value={posFilter} onChange={(event) => setPosFilter(event.target.value)} className="cursor-pointer rounded-md border border-[#E5E8EC] bg-white px-2.5 py-1.5 font-medium text-[#1A73E8] dark:border-[#33373E] dark:bg-[#1D2024] dark:text-[#7EB3F5]">
              <option value="">Display on the POS ▾</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
            <button type="button" onClick={() => actions.showToast("Choose a filter to refine order sources", "blue")} className="rounded-md px-2.5 py-1.5 font-medium text-[#1A73E8] hover:bg-sky-500/10 dark:text-[#7EB3F5]">+ Filter</button>
          </div>
          <Card className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr>
                  <th className={TH}>Order source ▲</th>
                  <th className={TH}>Display on the POS</th>
                  <th className={`${TH} w-24 text-right`}>Edit</th>
                </tr>
              </thead>
              <tbody>
                {visibleSources.map((source) => (
                  <tr key={source.id} className={ROW}>
                    <td className={`${TD} font-medium`}>{source.title}</td>
                    <td className={TD}>
                      <Toggle checked={source.displayOnPos} label={`Display ${source.title} on POS`} onChange={() => actions.toggleOrderSourcePos(source.id)} />
                    </td>
                    <td className={`${TD} text-right`}>
                      <button type="button" onClick={() => setModal({ kind: "source", id: source.id })} className="inline-flex cursor-pointer items-center gap-1 text-[#1A73E8] hover:underline dark:text-[#7EB3F5]">
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {visibleSources.length === 0 && (
                  <tr><td colSpan={3} className={`${TD} py-10 text-center text-slate-500 dark:text-slate-400`}>No order sources found</td></tr>
                )}
              </tbody>
            </table>
          </Card>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2.5 py-1 text-xs">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Quick search" className="w-52 rounded-md border border-[#D1D5DB] bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#1A73E8] focus:outline-none dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white dark:placeholder:text-slate-500" />
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as PosPaymentType | "All")} className="cursor-pointer rounded-md border border-[#E5E8EC] bg-white px-2.5 py-1.5 font-medium text-[#1A73E8] dark:border-[#33373E] dark:bg-[#1D2024] dark:text-[#7EB3F5]">
              <option value="All">Payment type: All ▾</option>
              {PAYMENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <button type="button" onClick={() => actions.showToast("Choose a filter to refine payment methods", "blue")} className="rounded-md px-2.5 py-1.5 font-medium text-[#1A73E8] hover:bg-sky-500/10 dark:text-[#7EB3F5]">+ Filter</button>
          </div>
          <Card className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr>
                  <th className={TH}>Method title</th>
                  <th className={TH}>Payment type</th>
                  <th className={`${TH} text-right`}>Service fee</th>
                  <th className={`${TH} text-right`}>Displayed on the POS ▾</th>
                  <th className={`${TH} w-28 text-right`}> </th>
                </tr>
              </thead>
              <tbody>
                {visibleMethods.map((method) => (
                  <tr key={method.id} className={ROW}>
                    <td className={`${TD} font-medium ${method.muted ? "text-slate-400 dark:text-slate-500" : ""}`}>
                      <span className="mr-2 inline-flex align-middle"><MethodIcon icon={method.icon} muted={method.muted} /></span>
                      {method.title}
                    </td>
                    <td className={`${TD} ${method.muted ? "text-slate-400 dark:text-slate-500" : ""}`}>{method.paymentType}</td>
                    <td className={`${TD} text-right font-mono ${method.muted ? "text-slate-400 dark:text-slate-500" : ""}`}>{feeLabel(method.serviceFeePct)}</td>
                    <td className={`${TD} text-right ${method.muted ? "text-slate-400 dark:text-slate-500" : ""}`}>{method.displayedOnPos ? "Yes" : "No"}</td>
                    <td className={`${TD} text-right`}>
                      <span className="inline-flex items-center gap-2">
                        {method.canEdit !== false && !method.systemLocked && (
                          <button type="button" onClick={() => setModal({ kind: "method", id: method.id })} className="inline-flex cursor-pointer items-center gap-1 text-[#1A73E8] hover:underline dark:text-[#7EB3F5]">
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                        )}
                        {method.hasMenu && (
                          <button type="button" aria-label={`Actions for ${method.title}`} onClick={() => actions.showToast(`Actions for ${method.title}`, "blue")} className="cursor-pointer text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
                {visibleMethods.length === 0 && (
                  <tr><td colSpan={5} className={`${TD} py-10 text-center text-slate-500 dark:text-slate-400`}>No payment methods found</td></tr>
                )}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {modal?.kind === "source" && <OrderSourceModal source={sources.find((entry) => entry.id === modal.id)} onClose={() => setModal(null)} />}
      {modal?.kind === "method" && <PaymentMethodModal method={methods.find((entry) => entry.id === modal.id)} onClose={() => setModal(null)} />}
    </div>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-[#33373E] dark:bg-[#2C3036]">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-[#33373E]">
          <h3 className="text-sm font-bold">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function OrderSourceModal({ source, onClose }: { source?: OrderSource; onClose: () => void }) {
  const { actions } = usePosStore();
  const [title, setTitle] = useState(source?.title ?? "");
  const [displayOnPos, setDisplayOnPos] = useState(source?.displayOnPos ?? true);
  const [serviceFee, setServiceFee] = useState(source ? String(source.serviceFeePct || "") : "");

  const submit = () => {
    actions.saveOrderSource(source?.id ?? null, {
      title,
      displayOnPos,
      serviceFeePct: Number(serviceFee) || 0,
    });
    onClose();
  };

  return (
    <ModalShell title={source ? "Edit order source" : "Add order source"} onClose={onClose}>
      <div className="space-y-3.5 text-xs">
        <label className="block"><span className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">Title</span><input value={title} onChange={(event) => setTitle(event.target.value)} className={INPUT} placeholder="e.g. Dine-in" /></label>
        <label className="flex items-center justify-between gap-3 rounded-lg border border-[#E5E8EC] px-3 py-2.5 dark:border-[#33373E]">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Display on the POS</span>
          <Toggle checked={displayOnPos} label="Display on the POS" onChange={() => setDisplayOnPos((current) => !current)} />
        </label>
        <label className="block"><span className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">Service fee % <span className="font-normal text-slate-400">(optional)</span></span><input type="number" min="0" step="0.001" value={serviceFee} onChange={(event) => setServiceFee(event.target.value)} className={`${INPUT} font-mono`} placeholder="0.000" /></label>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 dark:border-[#3E434C] dark:text-slate-300">Cancel</button>
          <button type="button" disabled={!title.trim()} onClick={submit} className="flex-1 cursor-pointer rounded-lg bg-[#1DB954] px-4 py-2 text-xs font-bold text-white hover:bg-[#18A348] disabled:opacity-50">Save</button>
        </div>
      </div>
    </ModalShell>
  );
}

function PaymentMethodModal({ method, onClose }: { method?: PaymentMethodConfig; onClose: () => void }) {
  const { actions } = usePosStore();
  const [title, setTitle] = useState(method?.title ?? "");
  const [paymentType, setPaymentType] = useState<PosPaymentType>(method?.paymentType ?? "Cashless");
  const [serviceFee, setServiceFee] = useState(method?.serviceFeePct === null || method?.serviceFeePct === undefined ? "" : String(method.serviceFeePct));
  const [displayedOnPos, setDisplayedOnPos] = useState(method?.displayedOnPos ?? true);

  const submit = () => {
    actions.savePaymentMethodConfig(method?.id ?? null, {
      title,
      paymentType,
      serviceFeePct: serviceFee.trim() === "" ? null : Number(serviceFee) || 0,
      displayedOnPos,
    });
    onClose();
  };

  return (
    <ModalShell title={method ? "Edit payment method" : "Add payment method"} onClose={onClose}>
      <div className="space-y-3.5 text-xs">
        <label className="block"><span className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">Method title</span><input value={title} onChange={(event) => setTitle(event.target.value)} className={INPUT} placeholder="e.g. Card" /></label>
        <label className="block"><span className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">Payment type</span>
          <select value={paymentType} onChange={(event) => setPaymentType(event.target.value as PosPaymentType)} className={`${INPUT} cursor-pointer`}>
            {PAYMENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <label className="block"><span className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">Service fee % <span className="font-normal text-slate-400">(leave empty for —)</span></span><input type="number" min="0" step="0.001" value={serviceFee} onChange={(event) => setServiceFee(event.target.value)} className={`${INPUT} font-mono`} placeholder="0.000" /></label>
        <label className="flex items-center justify-between gap-3 rounded-lg border border-[#E5E8EC] px-3 py-2.5 dark:border-[#33373E]">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Displayed on the POS</span>
          <Toggle checked={displayedOnPos} label="Displayed on the POS" onChange={() => setDisplayedOnPos((current) => !current)} />
        </label>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 dark:border-[#3E434C] dark:text-slate-300">Cancel</button>
          <button type="button" disabled={!title.trim()} onClick={submit} className="flex-1 cursor-pointer rounded-lg bg-[#1DB954] px-4 py-2 text-xs font-bold text-white hover:bg-[#18A348] disabled:opacity-50">Save</button>
        </div>
      </div>
    </ModalShell>
  );
}
