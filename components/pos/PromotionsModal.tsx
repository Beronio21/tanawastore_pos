"use client";

import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { usePosStore } from "@/lib/pos-store";
import { getActivePromotions } from "@/lib/console-data";

export function PromotionsModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const { state, actions } = usePosStore();
  const promotions = getActivePromotions(state.promotions);
  const order = state.posOrders.find((entry) => entry.id === orderId);
  const appliedId = order?.promotionId === undefined ? promotions[0]?.id ?? "" : order.promotionId;

  const rewardLabel = (promotion: (typeof promotions)[number]) => {
    if (promotion.rewardType === "Discount %") return `${promotion.rewardValue}% off`;
    if (promotion.rewardType === "Fixed discount") return `${state.settings.currencySymbol}${promotion.rewardValue} off`;
    return `+${promotion.rewardValue} bonus points`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl bg-white p-5 dark:bg-[#2C3036]">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold"><Sparkles className="h-4 w-4 text-amber-500" />Promotions &amp; Bonuses</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="cursor-pointer rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-[#33373E]"><X className="h-4 w-4" /></button>
        </div>

        {promotions.length ? (
          <div className="mt-4 space-y-2">
            {promotions.map((promotion) => {
              const applied = appliedId === promotion.id;
              return (
                <div key={promotion.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-[#3E434C]">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold">{promotion.title}</span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400">{rewardLabel(promotion)} · {promotion.scope}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => { actions.setOrderPromotion(orderId, promotion.id); onClose(); }}
                    className={`shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-[11px] font-bold ${applied ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" : "bg-[#1A73E8] text-white hover:bg-[#1668d4]"}`}
                  >
                    {applied ? "Applied" : "Apply"}
                  </button>
                </div>
              );
            })}
            {appliedId && (
              <button
                type="button"
                onClick={() => { actions.setOrderPromotion(orderId, ""); onClose(); }}
                className="w-full cursor-pointer rounded-lg border border-slate-200 py-2 text-[11px] font-bold text-slate-500 hover:bg-slate-50 dark:border-[#3E434C] dark:text-slate-400 dark:hover:bg-[#33373E]"
              >
                Remove promotion
              </button>
            )}
          </div>
        ) : (
          <div className="mt-6 mb-2 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">You haven&apos;t set up any promotions yet.</p>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Create discounts and bonus campaigns in Marketing.</p>
            <Link href="/manage/marketing/promotions" onClick={onClose} className="mt-3 inline-block cursor-pointer rounded-lg bg-[#1A73E8] px-4 py-2 text-[11px] font-bold text-white hover:bg-[#1668d4]">
              Go to Promotions
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
