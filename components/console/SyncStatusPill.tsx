"use client";

import { CloudOff, Check, Loader2 } from "lucide-react";
import { usePosStore } from "@/lib/pos-store";

/** Subtle PostgreSQL persistence indicator for the Management Console header. */
export function SyncStatusPill() {
  const { state } = usePosStore();
  const status = !state.isOnline ? "offline" : state.syncStatus;

  const tone =
    status === "offline"
      ? "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900"
      : status === "saving"
        ? "text-slate-600 bg-slate-50 border-[#E5E8EC] dark:bg-[#2C3036] dark:text-slate-300 dark:border-[#33373E]"
        : "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900";

  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tone}`}
    >
      {status === "offline" ? (
        <CloudOff className="h-3 w-3" />
      ) : status === "saving" ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Check className="h-3 w-3" />
      )}
      {status === "offline" ? "Offline" : status === "saving" ? "Saving…" : "Saved"}
    </span>
  );
}
