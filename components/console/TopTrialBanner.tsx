"use client";

import { usePosStore } from "@/lib/pos-store";

/** Sticky 32px subscription banner shown on every console and POS screen. */
export function TopTrialBanner() {
  const { state, actions } = usePosStore();

  if (state.subscriptionStatus === "Paid") return null;

  return (
    <div className="sticky top-0 z-50 flex h-8 shrink-0 items-center justify-center bg-[#0077FF] px-3 text-center text-[11px] font-medium text-white">
      <p className="truncate">
        Trial period ends on 7 December 2026 year. To avoid blocking the POS, pay for the subscription.
        <button
          type="button"
          onClick={() => actions.openModal("subscription")}
          className="ml-1 cursor-pointer font-semibold underline underline-offset-2 hover:text-sky-100"
        >
          Pay
        </button>
      </p>
    </div>
  );
}
