"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Monitor, TabletSmartphone } from "lucide-react";

const FIELD =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1A73E8] dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white";

export default function PairRegisterPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!login.trim() || !password || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/v1/pos/pair", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ login: login.trim(), password }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Pairing failed. Check the register credentials.");
        setBusy(false);
        return;
      }
      router.push("/pos?lock=1");
    } catch {
      setError("Network unavailable. Connect the tablet and try again.");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#17191C] px-4 text-white">
      <div className="w-full max-w-sm">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A73E8]">
            <TabletSmartphone className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-bold">Pair this register</h1>
            <p className="text-xs text-slate-400">Enter the tablet credentials from Access → Tablets.</p>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl bg-[#24272C] p-5">
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Register login</span>
            <input
              className={FIELD}
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              placeholder="tanawa"
              autoComplete="username"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">Register password</span>
            <input
              className={`${FIELD} font-mono`}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") void submit(); }}
              placeholder="8-character password"
              autoComplete="current-password"
            />
          </label>

          {error && <p role="alert" className="text-[11px] font-semibold text-rose-400">{error}</p>}

          <button
            type="button"
            onClick={submit}
            disabled={!login.trim() || !password || busy}
            className="w-full cursor-pointer rounded-lg bg-[#1DB954] py-2.5 text-xs font-bold text-white hover:bg-[#18A348] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Pairing…" : "Pair register"}
          </button>
          <p className="text-center text-[10px] text-slate-500">
            The tablet opens the POS locked on the 4-digit staff PIN screen.
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
          <Link href="/pos" className="inline-flex items-center gap-1 hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to POS
          </Link>
          <span className="inline-flex items-center gap-1">
            <Monitor className="h-3.5 w-3.5" /> TanAwa POS
          </span>
        </div>
      </div>
    </div>
  );
}
