"use client";

import Link from "next/link";
import { CheckCircle2, Monitor, QrCode, Smartphone } from "lucide-react";
import { usePosStore } from "@/lib/pos-store";
import { Card } from "@/components/console/ui";

export default function WelcomePage() {
  const { state, actions } = usePosStore();
  const employee = state.employees.find((entry) => entry.id === state.currentStaffId) ?? state.employees[0];
  const remaining =
    3 - Number(state.onboarding.createdItem) - Number(state.onboarding.madeSale) - Number(state.onboarding.viewedReports);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E8EC] pb-3 dark:border-[#33373E]">
        <div>
          <h1 className="text-xl font-bold">Welcome to Poster POS, {employee?.name}!</h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Complete these quick setup steps for <strong>{state.settings.address}</strong> ({remaining} remaining)
          </p>
        </div>
        <Link
          href="/pos"
          className="rounded-lg bg-[#1DB954] px-4 py-2 text-xs font-bold text-white hover:bg-[#18A348]"
        >
          Open POS Terminal →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-3">
        <Card className="flex flex-col justify-between space-y-4 p-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  state.onboarding.createdItem
                    ? "bg-emerald-500/15 text-emerald-600"
                    : "bg-sky-500/15 text-[#1A73E8] dark:text-[#7EB3F5]"
                }`}
              >
                {state.onboarding.createdItem ? "✓ Completed" : "Step 1"}
              </span>
              <span className="text-xl">☕</span>
            </div>
            <h2 className="text-sm font-bold">Add dishes &amp; products</h2>
            <p className="leading-relaxed text-slate-500 dark:text-slate-400">
              Configure your menu items, recipes, and prices so they appear on the POS register.
            </p>
          </div>
          <button
            type="button"
            onClick={() => actions.openModal("add-item")}
            className="w-full cursor-pointer rounded-lg border border-[#E5E8EC] py-2 font-bold text-[#1A73E8] hover:bg-sky-500/10 dark:border-[#33373E] dark:text-[#7EB3F5]"
          >
            + Add Dish or Product
          </button>
        </Card>

        <Card className="flex flex-col justify-between space-y-4 p-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  state.onboarding.madeSale
                    ? "bg-emerald-500/15 text-emerald-600"
                    : "bg-sky-500/15 text-[#1A73E8] dark:text-[#7EB3F5]"
                }`}
              >
                {state.onboarding.madeSale ? "✓ Completed" : "Step 2"}
              </span>
              <span className="text-xl">🧾</span>
            </div>
            <h2 className="text-sm font-bold">Make your first POS sale</h2>
            <p className="leading-relaxed text-slate-500 dark:text-slate-400">
              Open the Point of Sale register, ring up an order, and print a thermal receipt.
            </p>
          </div>
          <Link
            href="/pos"
            className="w-full rounded-lg bg-[#1A73E8] py-2 text-center font-bold text-white hover:bg-blue-700"
          >
            Launch POS Register
          </Link>
        </Card>

        <Card className="flex flex-col justify-between space-y-4 p-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  state.onboarding.viewedReports
                    ? "bg-emerald-500/15 text-emerald-600"
                    : "bg-sky-500/15 text-[#1A73E8] dark:text-[#7EB3F5]"
                }`}
              >
                {state.onboarding.viewedReports ? "✓ Completed" : "Step 3"}
              </span>
              <span className="text-xl">📊</span>
            </div>
            <h2 className="text-sm font-bold">Review Sales &amp; Finances</h2>
            <p className="leading-relaxed text-slate-500 dark:text-slate-400">
              Track real-time revenue, profit margins, stock deductions, and cash flow.
            </p>
          </div>
          <Link
            href="/manage/dash/sales"
            className="w-full rounded-lg border border-[#E5E8EC] py-2 text-center font-bold text-[#1A73E8] hover:bg-sky-500/10 dark:border-[#33373E] dark:text-[#7EB3F5]"
          >
            View Sales Reports
          </Link>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="flex items-start gap-4 p-5 text-xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#5B08B8] text-white">
            <QrCode className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <h2 className="text-sm font-bold">Poster QR Menu</h2>
            <p className="leading-relaxed text-slate-500 dark:text-slate-400">
              Let guests browse the live menu and leave feedback straight to Reports → Feedbacks.
            </p>
            <button
              type="button"
              onClick={() => actions.openModal("qr-menu")}
              className="cursor-pointer rounded-lg border border-[#5B08B8] px-3 py-1.5 font-bold text-[#5B08B8] hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-950/40"
            >
              Preview QR Menu
            </button>
          </div>
        </Card>

        <Card className="flex items-start gap-4 p-5 text-xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1A73E8] text-white">
            <Smartphone className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <h2 className="text-sm font-bold">Install the POS on a tablet</h2>
            <p className="leading-relaxed text-slate-500 dark:text-slate-400">
              Open <strong>/pos</strong> on the register tablet and add it to the home screen for a full-screen
              touch terminal. Default owner PIN is <span className="font-mono font-bold">0000</span>.
            </p>
            <ul className="space-y-1 text-slate-500 dark:text-slate-400">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#1DB954]" /> Works offline with queued receipts
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#1DB954]" /> Station-routed Kitchen Kit tickets
              </li>
            </ul>
            <Link href="/pos" className="inline-flex items-center gap-1.5 font-bold text-[#1A73E8] dark:text-[#7EB3F5]">
              <Monitor className="h-3.5 w-3.5" /> Open the terminal
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
