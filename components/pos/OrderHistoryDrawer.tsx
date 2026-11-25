"use client";

import { useMemo, useState } from "react";
import { History, Printer, RotateCcw, X } from "lucide-react";
import { usePosStore } from "@/lib/pos-store";
import { formatMoney } from "@/lib/format";
import type { PaymentMethod, Receipt } from "@/lib/console-data";

type Filter = "all" | "cash" | "card" | "refunds";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All orders" },
  { key: "cash", label: "Cash" },
  { key: "card", label: "Card" },
  { key: "refunds", label: "Refunds" },
];

function receiptMatches(receipt: Receipt, filter: Filter): boolean {
  if (filter === "refunds") return Boolean(receipt.refunded);
  if (filter === "cash") return receipt.paymentMethod === "Cash" && !receipt.refunded;
  if (filter === "card") return (receipt.paymentMethod === "Card" || receipt.paymentMethod === "e-Wallet") && !receipt.refunded;
  return true;
}

const PAGE_SIZE = 100;

export function OrderHistoryDrawer({ onClose }: { onClose: () => void }) {
  const { state, actions } = usePosStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [shown, setShown] = useState(PAGE_SIZE);
  const [selectedNum, setSelectedNum] = useState<number | null>(null);
  const [confirmRefund, setConfirmRefund] = useState<number | null>(null);

  const symbol = state.settings.currencySymbol;
  const money = (value: number) => formatMoney(value, symbol);

  const filtered = useMemo(
    () => state.receipts.filter((receipt) => receiptMatches(receipt, filter)),
    [state.receipts, filter],
  );
  const selected = state.receipts.find((receipt) => receipt.receiptNum === selectedNum) ?? filtered[0] ?? null;

  const methodLabel = (method: PaymentMethod) => (method === "Cash" ? "Cash" : method === "e-Wallet" ? "e-Wallet" : "Card");

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/50" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside className="flex h-full w-full max-w-3xl flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-[#33373E] dark:bg-[#24272C]">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-[#33373E]">
          <h2 className="flex items-center gap-2 text-sm font-bold"><History className="h-4 w-4 text-sky-500" />Order history</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="cursor-pointer rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-[#33373E]"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-2.5 dark:border-[#33373E]">
          {FILTERS.map((entry) => (
            <button
              key={entry.key}
              type="button"
              onClick={() => { setFilter(entry.key); setShown(PAGE_SIZE); }}
              className={`cursor-pointer rounded-full px-3 py-1 text-[11px] font-bold ${filter === entry.key ? "bg-[#1A73E8] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-[#33373E] dark:text-slate-300"}`}
            >
              {entry.label}
            </button>
          ))}
          <select aria-label="Date range" className="ml-auto cursor-pointer rounded-md border border-slate-200 bg-transparent px-2 py-1 text-[11px] font-semibold dark:border-[#3E434C]">
            <option>Today</option>
            <option>Yesterday</option>
            <option>This week</option>
            <option>All time</option>
          </select>
        </div>

        <div className="flex min-h-0 flex-1">
          <div className="w-64 shrink-0 overflow-y-auto border-r border-slate-200 dark:border-[#33373E]">
            {filtered.slice(0, shown).map((receipt) => (
              <button
                key={`${receipt.receiptNum}-${receipt.closedAt}`}
                type="button"
                onClick={() => { setSelectedNum(receipt.receiptNum); setConfirmRefund(null); }}
                className={`block w-full cursor-pointer border-b border-slate-100 px-3 py-2.5 text-left hover:bg-slate-50 dark:border-[#2C3036] dark:hover:bg-white/[0.03] ${selected?.receiptNum === receipt.receiptNum ? "bg-sky-500/10" : ""}`}
              >
                <span className="flex items-center justify-between text-xs font-bold">
                  <span>#{receipt.receiptNum} {receipt.refunded && <span className="rounded bg-rose-100 px-1 text-[9px] font-bold text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">REFUNDED</span>}</span>
                  <span className="font-mono">{money(receipt.total)}</span>
                </span>
                <span className="mt-0.5 block text-[10px] text-slate-500 dark:text-slate-400">{receipt.tableName} · {methodLabel(receipt.paymentMethod)} · {receipt.closedAt}</span>
              </button>
            ))}
            {!filtered.length && (
              <p className="px-4 py-10 text-center text-xs text-slate-500 dark:text-slate-400">No orders in this view.</p>
            )}
            {filtered.length > shown && (
              <button
                type="button"
                onClick={() => setShown((count) => count + PAGE_SIZE)}
                className="block w-full cursor-pointer border-t border-slate-200 px-3 py-2.5 text-center text-[11px] font-bold text-[#1A73E8] hover:bg-slate-50 dark:border-[#33373E] dark:text-[#7EB3F5] dark:hover:bg-white/[0.03]"
              >
                Show more ({filtered.length - shown} remaining)
              </button>
            )}
          </div>

          <div className="min-w-0 flex-1 overflow-y-auto p-4">
            {selected ? (
              <div className="mx-auto max-w-sm">
                <div className="rounded-xl border border-slate-200 p-4 font-mono text-xs dark:border-[#3E434C]">
                  <div className="space-y-1 border-b border-dashed border-slate-300 pb-3 text-center">
                    <div className="text-sm font-extrabold uppercase">{state.settings.companyName}</div>
                    <div className="text-[11px] text-slate-500">Receipt #{selected.receiptNum} • {selected.closedAt}</div>
                    <div className="text-[11px] text-slate-500">{selected.tableName} • {methodLabel(selected.paymentMethod)}</div>
                    {selected.customerName && <div className="text-[11px] text-slate-500">{selected.customerName}</div>}
                  </div>
                  <div className="space-y-1.5 border-b border-dashed border-slate-300 py-3">
                    {selected.items.map((item, index) => (
                      <div key={`${item.menuId}-${index}`} className="flex justify-between">
                        <span>{item.qty}x {item.name}</span>
                        <span className="font-bold">{money(item.qty * item.unitPrice)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1 pt-3 text-[11px]">
                    <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{money(selected.subtotal)}</span></div>
                    {selected.discountAmt > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-{money(selected.discountAmt)}</span></div>}
                    {(selected.serviceCharge ?? 0) > 0 && <div className="flex justify-between text-slate-500"><span>Service charge</span><span>{money(selected.serviceCharge ?? 0)}</span></div>}
                    {(selected.deliveryFee ?? 0) > 0 && <div className="flex justify-between text-slate-500"><span>Delivery</span><span>{money(selected.deliveryFee ?? 0)}</span></div>}
                    <div className="flex justify-between text-slate-500"><span>VAT (12%)</span><span>{money(selected.tax)}</span></div>
                    <div className="flex justify-between pt-1 text-sm font-extrabold"><span>TOTAL</span><span>{money(selected.total)}</span></div>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => actions.setReceiptPreview(selected)}
                    className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-[#3E434C] dark:text-slate-200 dark:hover:bg-[#33373E]"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Reprint receipt
                  </button>
                  {!selected.refunded ? (
                    confirmRefund === selected.receiptNum ? (
                      <button
                        type="button"
                        onClick={() => { actions.refundReceipt(selected.receiptNum); setConfirmRefund(null); }}
                        className="flex-1 cursor-pointer rounded-lg bg-rose-600 py-2 text-xs font-bold text-white hover:bg-rose-500"
                      >
                        Confirm refund
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmRefund(selected.receiptNum)}
                        className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-rose-200 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Issue refund
                      </button>
                    )
                  ) : (
                    <span className="flex-1 rounded-lg bg-slate-100 py-2 text-center text-xs font-bold text-slate-400 dark:bg-[#33373E]">Refunded</span>
                  )}
                </div>
              </div>
            ) : (
              <p className="py-16 text-center text-xs text-slate-500 dark:text-slate-400">Select an order to preview its receipt.</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
