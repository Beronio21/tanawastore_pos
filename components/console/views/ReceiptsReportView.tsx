"use client";

import { useState } from "react";
import { Calendar, ChevronDown, ChevronUp, Columns3, Printer, Search, Upload, X } from "lucide-react";
import { usePosStore } from "@/lib/pos-store";
import { summarizeReceiptRows } from "@/lib/business-math";
import { formatMoney } from "@/lib/format";
import { seedReceiptReportRows, type ReceiptReportRow } from "@/lib/console-data";
import { Card, PageHeader, TD, TH } from "../ui";

type StatusFilter = "All" | "Open" | "Close";

const DATE_PRESETS = [
  { label: "Today", days: 0 },
  { label: "Yesterday", days: 1 },
  { label: "Last 7 days", days: 6 },
];

const PRISTINE_SEED_UIDS = ["li-1", "li-2"];

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthLong(date: Date): string {
  return date.toLocaleDateString("en-GB", { month: "long" });
}

const ACTION =
  "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-[#1A73E8] hover:bg-sky-500/10 dark:text-[#7EB3F5]";

const PILL =
  "cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-medium text-[#1A73E8] hover:bg-sky-500/10 dark:text-[#7EB3F5]";

/** The untouched POS seed check means the account has no newer POS activity yet. */
function isPristinePosSeed(orders: { id: string; items: { uid: string; qty: number }[] }[]): boolean {
  if (orders.length !== 1) return false;
  const [order] = orders;
  if (order.id !== "ord-1" || order.items.length !== PRISTINE_SEED_UIDS.length) return false;
  return order.items.every((item, index) => item.uid === PRISTINE_SEED_UIDS[index] && item.qty === 1);
}

export function ReceiptsReportView() {
  const { state, actions } = usePosStore();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("All");
  const [statusOpen, setStatusOpen] = useState(false);
  const [presetIndex, setPresetIndex] = useState(0);
  const [dateOpen, setDateOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [detail, setDetail] = useState<ReceiptReportRow | null>(null);

  const symbol = state.settings.currencySymbol;
  const money = (value: number) => formatMoney(value, symbol);
  const q = search.trim().toLowerCase();

  const preset = DATE_PRESETS[presetIndex];
  const today = startOfDay(new Date());
  const rangeStart = addDays(today, -preset.days);
  const rangeEnd = today;
  const allowedDays = new Set<string>();
  for (let cursor = rangeStart; cursor <= rangeEnd; cursor = addDays(cursor, 1)) {
    allowedDays.add(isoDate(cursor));
  }

  const staffName = (id: string) => state.employees.find((employee) => employee.id === id)?.name ?? "—";

  const closedRows: ReceiptReportRow[] = state.receipts
    .filter((receipt) => allowedDays.has(receipt.closedDate ?? isoDate(today)))
    .map((receipt) => ({
      key: `receipt-${receipt.receiptNum}`,
      number: receipt.receiptNum,
      waiter: receipt.staffName,
      openedAt: receipt.openedAt,
      closedAt: receipt.closedAt,
      paid: receipt.total,
      discount: receipt.discountAmt,
      profit: receipt.profit,
      status: "Close",
      paymentMethod: receipt.paymentMethod,
      subtotal: receipt.subtotal,
      tax: receipt.tax,
      serviceCharge: receipt.serviceCharge ?? 0,
      cashBack: receipt.cashBackRedeemed ?? 0,
      items: receipt.items,
    }));

  const closedNumbers = new Set(state.receipts.map((receipt) => receipt.receiptNum));
  const openRows: ReceiptReportRow[] = allowedDays.has(isoDate(today))
    ? state.posOrders
        .filter((order) => !closedNumbers.has(order.receiptNum))
        .map((order) => {
          const subtotal = order.items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
          const discount = subtotal * (order.discountPct / 100);
          const cost = order.items.reduce((sum, item) => {
            const menuItem = state.menuItems.find((entry) => entry.id === item.menuId);
            return sum + (menuItem?.cost ?? 0) * item.qty;
          }, 0);
          const paid = subtotal - discount;
          return {
            key: `order-${order.id}`,
            number: order.receiptNum,
            waiter: staffName(order.staffId),
            openedAt: order.openedAt,
            closedAt: "",
            paid,
            discount,
            profit: paid - cost,
            status: "Open",
            paymentMethod: state.posPayMethod,
            subtotal,
            tax: 0,
            serviceCharge: 0,
            cashBack: 0,
            items: order.items,
          };
        })
    : [];

  const demoMode = state.receipts.length === 0 && isPristinePosSeed(state.posOrders);
  const rows = (demoMode ? seedReceiptReportRows() : [...closedRows, ...openRows]).sort(
    (left, right) => right.number - left.number,
  );

  const filtered = rows.filter((row) => {
    if (status !== "All" && row.status !== status) return false;
    if (!q) return true;
    return (
      String(row.number).includes(q) ||
      row.waiter.toLowerCase().includes(q) ||
      row.items.some((item) => item.name.toLowerCase().includes(q))
    );
  });

  const {
    netRevenue,
    cash,
    cards,
    giftCards,
    online,
    discounts,
    grossProfit,
    taxes,
    serviceCharges,
    bonuses,
    closedReceipts,
  } = summarizeReceiptRows(filtered);

  const summary = [
    { label: "Net revenue", value: money(netRevenue), zero: netRevenue === 0, className: "" },
    { label: "Cash", value: money(cash), zero: cash === 0, className: "" },
    { label: "Cards", value: money(cards), zero: cards === 0, className: "" },
    { label: "Gift cards", value: money(giftCards), zero: giftCards === 0, className: "" },
    { label: "Online payment", value: money(online), zero: online === 0, className: "" },
    { label: "Discounts", value: money(discounts), zero: false, className: "font-bold text-[#1F2328] dark:text-white" },
    {
      label: "Gross profits",
      value: money(grossProfit),
      zero: false,
      className: `font-bold ${grossProfit < 0 ? "text-[#EF4444]" : "text-[#1F2328] dark:text-white"}`,
    },
  ];

  const dateLabel =
    preset.days === 0
      ? `${today.getDate()} ${monthLong(today)}`
      : preset.days === 1
        ? `${rangeStart.getDate()} ${monthLong(rangeStart)}`
        : `${rangeStart.getDate()} ${monthLong(rangeStart)} — ${rangeEnd.getDate()} ${monthLong(rangeEnd)}`;

  return (
    <div>
      <PageHeader
        title="Receipts"
        count={filtered.length}
        actions={{
          extra: (
            <>
              <button type="button" className={ACTION} onClick={() => actions.showToast("All table columns displayed")}>
                <Columns3 className="h-3.5 w-3.5" />
                <span>Columns ▾</span>
              </button>
              <button
                type="button"
                className={ACTION}
                onClick={() => actions.showToast("Exported Receipts report to CSV", "success")}
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Export ▾</span>
              </button>
              <button type="button" className={ACTION} onClick={() => window.print()}>
                <Printer className="h-3.5 w-3.5" />
                <span>Print</span>
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDateOpen((open) => !open)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-md border border-[#E5E8EC] px-3 py-1.5 text-xs font-medium text-[#1F2328] hover:bg-slate-50 dark:border-[#33373E] dark:text-[#E6E8EC] dark:hover:bg-white/5"
                >
                  <Calendar className="h-3.5 w-3.5 text-[#1A73E8] dark:text-[#7EB3F5]" />
                  <span>{dateLabel}</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                {dateOpen && (
                  <div className="absolute right-0 z-30 mt-1 w-40 overflow-hidden rounded-lg border border-[#E5E8EC] bg-white py-1 shadow-xl dark:border-[#33373E] dark:bg-[#1D2024]">
                    {DATE_PRESETS.map((option, index) => (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => {
                          setPresetIndex(index);
                          setDateOpen(false);
                        }}
                        className={`block w-full cursor-pointer px-3 py-1.5 text-left text-xs font-medium hover:bg-[#E8EFF7] dark:hover:bg-[#33373E] ${
                          index === presetIndex ? "text-[#1A73E8] dark:text-[#7EB3F5]" : ""
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ),
        }}
      />

      <div className="flex flex-wrap items-center gap-2.5 py-3.5 text-xs">
        <div className="relative w-52">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Quick search"
            className="w-full rounded-md border border-[#D1D5DB] bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#1A73E8] focus:outline-none dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white dark:placeholder:text-slate-500"
          />
        </div>
        <button type="button" className={PILL} onClick={() => actions.showToast("Filter by waiter is not set")}>
          Waiter ▾
        </button>
        <button type="button" className={PILL} onClick={() => actions.showToast("Filter by payments count is not set")}>
          Payments count ▾
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setStatusOpen((open) => !open)}
            className={`${PILL} ${status !== "All" ? "bg-[#E8EFF7] dark:bg-[#33373E]" : ""}`}
          >
            Status ▾
          </button>
          {statusOpen && (
            <div className="absolute left-0 z-30 mt-1 w-32 overflow-hidden rounded-lg border border-[#E5E8EC] bg-white py-1 shadow-xl dark:border-[#33373E] dark:bg-[#1D2024]">
              {(["All", "Open", "Close"] as StatusFilter[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setStatus(option);
                    setStatusOpen(false);
                  }}
                  className={`block w-full cursor-pointer px-3 py-1.5 text-left text-xs font-medium hover:bg-[#E8EFF7] dark:hover:bg-[#33373E] ${
                    option === status ? "font-bold text-[#1A73E8] dark:text-[#7EB3F5]" : ""
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
        <button type="button" className={PILL} onClick={() => actions.showToast("Filter by online orders is not set")}>
          Online orders ▾
        </button>
        <button type="button" className={PILL} onClick={() => actions.showToast("Advanced filters")}>
          + Filter
        </button>
      </div>

      <div className="overflow-x-auto border-t border-[#E5E8EC] dark:border-[#33373E]">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr>
              <th className={TH}># ▾</th>
              <th className={TH}>Waiter</th>
              <th className={TH}>Open</th>
              <th className={TH}>Close</th>
              <th className={`${TH} text-right`}>Paid</th>
              <th className={`${TH} text-right`}>Order discount</th>
              <th className={`${TH} text-right`}>Profit</th>
              <th className={TH}>Status</th>
              <th className={`${TH} text-right`} aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const open = row.status === "Open";
              return (
                <tr
                  key={row.key}
                  className={`border-b border-[#E5E8EC] last:border-0 dark:border-[#33373E] ${
                    open ? "bg-[#FEF9E7] dark:bg-[#3A3320]" : "bg-white dark:bg-transparent"
                  }`}
                >
                  <td className={`${TD} font-mono font-bold`}>{row.number}</td>
                  <td className={`${TD} font-medium`}>{row.waiter}</td>
                  <td className={`${TD} text-slate-600 dark:text-slate-300`}>{row.openedAt || "—"}</td>
                  <td className={`${TD} text-slate-600 dark:text-slate-300`}>{row.closedAt || "—"}</td>
                  <td className={`${TD} text-right font-mono ${row.paid === 0 ? "text-slate-400 dark:text-slate-500" : ""}`}>
                    {money(row.paid)}
                  </td>
                  <td
                    className={`${TD} text-right font-mono ${
                      row.discount === 0 ? "text-slate-400 dark:text-slate-500" : ""
                    }`}
                  >
                    {money(row.discount)}
                  </td>
                  <td
                    className={`${TD} text-right font-mono ${
                      row.profit < 0
                        ? "font-bold text-[#EF4444]"
                        : row.profit === 0
                          ? "text-slate-400 dark:text-slate-500"
                          : ""
                    }`}
                  >
                    {money(row.profit)}
                  </td>
                  <td className={TD}>
                    <span
                      className={`rounded-sm px-2 py-0.5 text-[11px] font-semibold ${
                        open
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                          : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className={`${TD} text-right`}>
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setDetail(row)}
                        className="cursor-pointer font-medium text-[#1A73E8] hover:underline dark:text-[#7EB3F5]"
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        aria-label={`More actions for receipt #${row.number}`}
                        onClick={() => actions.showToast(`Receipt #${row.number}: no additional actions`)}
                        className="cursor-pointer rounded px-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
                      >
                        •••
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
            No receipts match the selected filters.
          </div>
        )}
      </div>

      <Card className="mt-4 rounded-xl border-[#E5E7EB] bg-[#F8F9FA] p-4 dark:border-[#33373E] dark:bg-[#262A30]">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4 lg:grid-cols-7">
            {summary.map((metric) => (
              <div key={metric.label}>
                <div
                  className={`font-mono text-sm ${metric.className} ${
                    metric.zero ? "text-slate-400 dark:text-slate-500" : ""
                  }`}
                >
                  {metric.value}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">{metric.label}</div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSummaryOpen((open) => !open)}
            className="flex cursor-pointer items-center gap-1.5 rounded-md border border-[#D1D5DB] px-3 py-1.5 text-xs font-semibold text-[#1F2328] hover:bg-white dark:border-[#3E434C] dark:text-[#E6E8EC] dark:hover:bg-white/5"
          >
            <span>Details</span>
            {summaryOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

        {summaryOpen && (
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-[#E5E7EB] pt-4 text-xs sm:grid-cols-4 dark:border-[#33373E]">
            <div>
              <div className="font-mono font-semibold">{money(taxes)}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Taxes</div>
            </div>
            <div>
              <div className="font-mono font-semibold">{money(serviceCharges)}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Service charges</div>
            </div>
            <div>
              <div className="font-mono font-semibold">{money(bonuses)}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Bonuses</div>
            </div>
            <div>
              <div className="font-mono font-semibold">{closedReceipts}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Closed receipts</div>
            </div>
          </div>
        )}
      </Card>

      {detail && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setDetail(null)} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Receipt #${detail.number} details`}
            className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-[#E5E8EC] bg-white shadow-2xl dark:border-[#33373E] dark:bg-[#2C3036]"
          >
            <div className="flex items-start justify-between border-b border-[#E5E8EC] px-5 py-4 dark:border-[#33373E]">
              <div>
                <h2 className="text-base font-bold">Receipt #{detail.number}</h2>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  {detail.waiter} · {detail.status}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close receipt details"
                onClick={() => setDetail(null)}
                className="cursor-pointer rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Open</div>
                  <div className="mt-0.5 font-medium">{detail.openedAt || "—"}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Close</div>
                  <div className="mt-0.5 font-medium">{detail.closedAt || "—"}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Waiter</div>
                  <div className="mt-0.5 font-medium">{detail.waiter}</div>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto rounded-lg border border-[#E5E8EC] dark:border-[#33373E]">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="bg-[#F8F9FA] dark:bg-white/[0.04]">
                    <tr>
                      <th className={TH}>Product</th>
                      <th className={`${TH} text-right`}>Qty</th>
                      <th className={`${TH} text-right`}>Price</th>
                      <th className={`${TH} text-right`}>Discount</th>
                      <th className={`${TH} text-right`}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.items.map((item, index) => (
                      <tr key={`${detail.key}-${item.menuId}-${index}`} className="border-b border-[#E5E8EC] last:border-0 dark:border-[#33373E]">
                        <td className={`${TD} font-medium`}>{item.name}</td>
                        <td className={`${TD} text-right font-mono`}>{item.qty}</td>
                        <td className={`${TD} text-right font-mono`}>{money(item.unitPrice)}</td>
                        <td className={`${TD} text-right font-mono`}>{money(0)}</td>
                        <td className={`${TD} text-right font-mono`}>{money(item.unitPrice * item.qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 space-y-1.5">
                {[
                  ["Subtotal", money(detail.subtotal)],
                  ["Discount", money(detail.discount)],
                  ["Tax", money(detail.tax)],
                  ["Service charge", money(detail.serviceCharge)],
                  ["Payment method", detail.paymentMethod],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>{label}</span>
                    <span className="font-mono text-[#1F2328] dark:text-[#E6E8EC]">{value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-[#E5E8EC] pt-2 font-bold dark:border-[#33373E]">
                  <span>Paid</span>
                  <span className="font-mono">{money(detail.paid)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#E5E8EC] px-5 py-3.5 dark:border-[#33373E]">
              <button
                type="button"
                onClick={() => actions.showToast(`Receipt #${detail.number} sent to printer`, "success")}
                className="flex cursor-pointer items-center gap-1.5 rounded-md border border-[#D1D5DB] px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 dark:border-[#3E434C] dark:hover:bg-white/5"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print receipt</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (detail.status === "Open") {
                    actions.showToast("Open checks must be closed before they can be refunded.", "info");
                    return;
                  }
                  actions.refundReceipt(detail.number);
                  setDetail(null);
                }}
                className="cursor-pointer rounded-md border border-[#FCA5A5] px-3 py-1.5 text-xs font-semibold text-[#DC2626] hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-400 dark:hover:bg-rose-500/10"
              >
                Issue refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
