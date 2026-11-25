"use client";

import { useEffect, useState } from "react";
import { Delete, Monitor } from "lucide-react";
import { usePosStore } from "@/lib/pos-store";

export function PinLockScreen() {
  const { state, actions } = usePosStore();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const register = state.registers[0];

  const submit = (value: string) => {
    if (value.length !== 4) return;
    if (actions.unlockPosWithPin(value)) {
      setPin("");
      setError(false);
    } else {
      setError(true);
      setPin("");
    }
  };

  const press = (digit: string) => {
    setError(false);
    const next = `${pin}${digit}`.slice(-4);
    setPin(next);
    if (next.length === 4) submit(next);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (/^[0-9]$/.test(event.key)) press(event.key);
      else if (event.key === "Backspace") setPin((current) => current.slice(0, -1));
      else if (event.key === "Escape") setPin("");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div className="flex min-h-screen flex-col bg-[#17191C] text-white">
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <Monitor className="h-9 w-9 text-sky-400" />
        <h1 className="mt-3 text-xl font-bold">{state.settings.companyName}</h1>
        <p className="text-xs text-slate-400">Point of Sale</p>

        <div className="mt-6 flex gap-3">
          {[0, 1, 2, 3].map((index) => (
            <span
              key={index}
              className={`h-3.5 w-3.5 rounded-full border-2 transition-all ${index < pin.length ? "scale-110 border-sky-400 bg-sky-400" : "border-slate-600"} ${error ? "border-rose-400" : ""}`}
            />
          ))}
        </div>
        {error && <p className="mt-2 text-[11px] font-semibold text-rose-400">Incorrect PIN — try again</p>}

        <div className="mt-6 grid grid-cols-3 gap-3">
          {keys.map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => press(digit)}
              className="h-14 w-14 cursor-pointer rounded-full bg-[#24272C] text-lg font-bold text-white transition hover:bg-[#33373E] active:scale-95"
            >
              {digit}
            </button>
          ))}
          <button type="button" onClick={() => setPin("")} className="h-14 w-14 cursor-pointer rounded-full bg-[#24272C] text-xs font-bold text-slate-300 transition hover:bg-[#33373E] active:scale-95">
            Clear
          </button>
          <button type="button" onClick={() => press("0")} className="h-14 w-14 cursor-pointer rounded-full bg-[#24272C] text-lg font-bold text-white transition hover:bg-[#33373E] active:scale-95">
            0
          </button>
          <button type="button" onClick={() => setPin((current) => current.slice(0, -1))} aria-label="Backspace" className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-[#24272C] text-white transition hover:bg-[#33373E] active:scale-95">
            <Delete className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-4 text-[10px] text-slate-500">Enter a staff PIN to unlock</p>
      </div>

      <div className="flex items-center justify-between px-5 pb-5 text-[11px] text-slate-400">
        <span>{state.settings.companyName}</span>
        <span>{register?.title ?? "Register"}</span>
        <span className="font-mono">305637</span>
      </div>
    </div>
  );
}
