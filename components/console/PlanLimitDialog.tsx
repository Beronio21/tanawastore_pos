"use client";

import Link from "next/link";
import { ArrowUpRight, X } from "lucide-react";
import { getPlan, planLimitLabel, type PlanResource } from "@/lib/billing-plans";

/** Shown when Access → Locations / Tablets reaches the tenant's plan cap. */
export function PlanLimitDialog({
  open,
  resource,
  plan,
  used,
  limit,
  onClose,
}: {
  open: boolean;
  resource: PlanResource;
  plan: string;
  used: number;
  limit: number;
  onClose: () => void;
}) {
  if (!open) return null;
  const tier = getPlan(plan);
  const label = resource === "locations" ? "locations" : resource === "registers" ? "registers" : "employees";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-[#33373E] dark:bg-[#2C3036]">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-[#33373E]">
          <h2 className="text-sm font-bold">Upgrade your plan</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 p-5 text-xs">
          <p className="text-slate-600 dark:text-slate-300">
            Your <strong>{tier.name}</strong> plan includes up to <strong>{planLimitLabel(limit)}</strong> {label}, and you are using{" "}
            <strong>{used}</strong>. Upgrade to add another {resource === "locations" ? "location" : resource === "registers" ? "register" : "employee"}.
          </p>
          <div className="rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-[#24272C]">
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span>Usage</span>
              <span className="font-mono">{used} / {planLimitLabel(limit)}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-[#33373E]">
              <div
                className="h-full rounded-full bg-[#1A73E8]"
                style={{ width: `${Number.isFinite(limit) && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 100}%` }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold dark:border-[#3E434C]">
              Not now
            </button>
            <Link
              href="/manage/settings/billing"
              onClick={onClose}
              className="inline-flex items-center gap-1 rounded-lg bg-[#0077FF] px-4 py-2 text-xs font-bold text-white hover:bg-[#0067DF]"
            >
              View plans <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
