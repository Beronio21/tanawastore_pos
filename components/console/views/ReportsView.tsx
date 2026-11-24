"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePosStore } from "@/lib/pos-store";
import { formatMoney } from "@/lib/format";
import { Card, EmptyState, FilterToolbar, PageHeader, ROW, TD, TH } from "../ui";

const ALIASES: Record<string, string> = {
  employees: "waiters",
  stations: "workshops",
  categories: "category",
  "abc-analysis": "abc",
  feedback: "feedbacks",
  "payments-count": "payments",
};

const DATE = "23 October — 23 November ▾";

export function ReportsView({ slug }: { slug: string }) {
  const { state, actions } = usePosStore();
  const [search, setSearch] = useState("");
  const sub = ALIASES[slug] ?? slug;
  const symbol = state.settings.currencySymbol;
  const money = (value: number) => formatMoney(value, symbol);
  const q = search.trim().toLowerCase();

  useEffect(() => {
    actions.markReportsViewed();
  }, [actions]);

  const dateActions = { dateRange: DATE, export: true, print: true };

  if (sub === "sales") {
    const totalRevenue = state.receipts.reduce((sum, receipt) => sum + receipt.total, 0);
    const totalProfit = state.receipts.reduce((sum, receipt) => sum + receipt.profit, 0);
    const average = state.receipts.length ? totalRevenue / state.receipts.length : 0;

    return (
      <div>
        <PageHeader title="Sales" count={`${state.receipts.length} receipts`} actions={dateActions} />
        <div className="my-5 grid grid-cols-1 gap-4 sm:grid-cols-4">
          {[
            { label: "Revenue", value: money(totalRevenue), accent: "" },
            { label: "Profit", value: money(totalProfit), accent: "text-[#1DB954]" },
            { label: "Receipts", value: String(state.receipts.length), accent: "" },
            { label: "Average receipt", value: money(average), accent: "" },
          ].map((card) => (
            <Card key={card.label} className="p-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">{card.label}</div>
              <div className={`mt-1 font-mono text-xl font-extrabold ${card.accent}`}>{card.value}</div>
            </Card>
          ))}
        </div>

        <Card className="space-y-3 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-bold">Revenue &amp; Profit Dynamics (23 October — 23 November)</span>
            <Link
              href="/pos"
              className="rounded-lg bg-[#1DB954] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#18A348]"
            >
              + Make POS Sale
            </Link>
          </div>
          <svg viewBox="0 0 600 150" className="h-36 w-full">
            <line x1="0" y1="130" x2="600" y2="130" stroke="#94A3B8" strokeOpacity="0.25" />
            <line x1="0" y1="80" x2="600" y2="80" stroke="#94A3B8" strokeOpacity="0.15" />
            <line x1="0" y1="30" x2="600" y2="30" stroke="#94A3B8" strokeOpacity="0.15" />
            <path
              d={`M 20 125 L 140 125 L 260 125 L 380 125 L 480 ${totalRevenue > 0 ? 75 : 125} L 580 ${totalRevenue > 0 ? 30 : 125}`}
              fill="none"
              stroke="#1A73E8"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="580" cy={totalRevenue > 0 ? 30 : 125} r="4.5" fill="#1DB954" />
          </svg>
        </Card>
      </div>
    );
  }

  if (sub === "customers") {
    const customers = state.customers.filter((customer) => customer.name.toLowerCase().includes(q));
    return (
      <div>
        <PageHeader title="Customers" count={customers.length} actions={{ ...dateActions, columns: true }} />
        <FilterToolbar search={search} onSearchChange={setSearch} pills={[{ label: "Group ▾" }, { label: "+ Filter" }]} />
        <div className="overflow-x-auto border-t border-[#E5E8EC] dark:border-[#33373E]">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr>
                <th className={TH}>Client ▲</th>
                <th className={TH}>Phone</th>
                <th className={`${TH} text-right`}>Without discount</th>
                <th className={`${TH} text-right`}>Cash</th>
                <th className={`${TH} text-right`}>By card</th>
                <th className={`${TH} text-right`}>Profit</th>
                <th className={`${TH} text-right`}>Receipts</th>
                <th className={`${TH} text-right`}>Average receipt</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className={ROW}>
                  <td className={`${TD} font-medium text-[#1A73E8] dark:text-[#7EB3F5]`}>{customer.name}</td>
                  <td className={`${TD} text-slate-500 dark:text-slate-400`}>{customer.phone || "—"}</td>
                  <td className={`${TD} text-right font-mono`}>{money(customer.overallSum)}</td>
                  <td className={`${TD} text-right font-mono`}>{money(customer.cashSum)}</td>
                  <td className={`${TD} text-right font-mono`}>{money(customer.cardSum)}</td>
                  <td className={`${TD} text-right font-mono`}>{money(customer.overallSum * 0.65)}</td>
                  <td className={`${TD} text-right font-mono`}>{customer.receiptCount}</td>
                  <td className={`${TD} text-right font-mono`}>
                    {money(customer.receiptCount ? customer.overallSum / customer.receiptCount : 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {customers.length === 0 && (
          <EmptyState
            emoji="🙋"
            title="No customer sales recorded yet"
            description="Attach a customer on the POS register to track customer metrics."
          />
        )}
      </div>
    );
  }

  if (sub === "waiters") {
    const employees = state.employees.filter((employee) => employee.name.toLowerCase().includes(q));
    return (
      <div>
        <PageHeader title="Waiters" count={employees.length} actions={{ ...dateActions, columns: true }} />
        <FilterToolbar search={search} onSearchChange={setSearch} pills={[{ label: "Position ▾" }, { label: "+ Filter" }]} />
        <div className="overflow-x-auto border-t border-[#E5E8EC] dark:border-[#33373E]">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr>
                <th className={TH}>Employee ▲</th>
                <th className={TH}>Position</th>
                <th className={`${TH} text-right`}>Receipts</th>
                <th className={`${TH} text-right`}>Revenue</th>
                <th className={`${TH} text-right`}>Profit</th>
                <th className={`${TH} text-right`}>Average receipt</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => {
                const receipts = state.receipts.filter((receipt) => receipt.staffId === employee.id);
                const revenue = receipts.reduce((sum, receipt) => sum + receipt.total, 0);
                const profit = receipts.reduce((sum, receipt) => sum + receipt.profit, 0);
                return (
                  <tr key={employee.id} className={ROW}>
                    <td className={`${TD} font-medium`}>{employee.name}</td>
                    <td className={`${TD} text-slate-500 dark:text-slate-400`}>{employee.position}</td>
                    <td className={`${TD} text-right font-mono`}>{receipts.length}</td>
                    <td className={`${TD} text-right font-mono font-bold`}>{money(revenue)}</td>
                    <td className={`${TD} text-right font-mono text-[#1DB954]`}>{money(profit)}</td>
                    <td className={`${TD} text-right font-mono`}>{money(receipts.length ? revenue / receipts.length : 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (sub === "workshops") {
    return (
      <div>
        <PageHeader title="Stations" count={state.stations.length} actions={dateActions} />
        <div className="mt-3 overflow-x-auto border-t border-[#E5E8EC] dark:border-[#33373E]">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr>
                <th className={TH}>Station</th>
                <th className={`${TH} text-right`}>Items sold</th>
                <th className={`${TH} text-right`}>Revenue</th>
                <th className={`${TH} text-right`}>Profit</th>
              </tr>
            </thead>
            <tbody>
              {state.stations.map((station) => {
                let count = 0;
                let revenue = 0;
                let cost = 0;
                state.receipts.forEach((receipt) => {
                  receipt.items.forEach((item) => {
                    const menuItem = state.menuItems.find((entry) => entry.id === item.menuId);
                    if ((menuItem?.station ?? "Bar") === station.title) {
                      count += item.qty;
                      revenue += item.unitPrice * item.qty;
                      cost += (menuItem?.cost ?? 0) * item.qty;
                    }
                  });
                });
                return (
                  <tr key={station.id} className={ROW}>
                    <td className={`${TD} font-bold`}>{station.title}</td>
                    <td className={`${TD} text-right font-mono`}>{count}</td>
                    <td className={`${TD} text-right font-mono font-bold`}>{money(revenue)}</td>
                    <td className={`${TD} text-right font-mono text-[#1DB954]`}>{money(Math.max(0, revenue - cost))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (sub === "category") {
    const categories = [...new Set(state.menuItems.map((item) => item.category))];
    return (
      <div>
        <PageHeader title="Categories" count={categories.length} actions={dateActions} />
        <div className="mt-3 overflow-x-auto border-t border-[#E5E8EC] dark:border-[#33373E]">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr>
                <th className={TH}>Category</th>
                <th className={`${TH} text-right`}>Items sold</th>
                <th className={`${TH} text-right`}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => {
                let count = 0;
                let revenue = 0;
                state.receipts.forEach((receipt) => {
                  receipt.items.forEach((item) => {
                    const menuItem = state.menuItems.find((entry) => entry.id === item.menuId);
                    if (menuItem?.category === category) {
                      count += item.qty;
                      revenue += item.unitPrice * item.qty;
                    }
                  });
                });
                return (
                  <tr key={category} className={ROW}>
                    <td className={`${TD} font-medium`}>{category}</td>
                    <td className={`${TD} text-right font-mono`}>{count}</td>
                    <td className={`${TD} text-right font-mono font-bold`}>{money(revenue)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (sub === "products") {
    const items = state.menuItems.filter((item) => item.title.toLowerCase().includes(q));
    return (
      <div>
        <PageHeader title="Products" count={items.length} actions={{ ...dateActions, columns: true }} />
        <FilterToolbar search={search} onSearchChange={setSearch} pills={[{ label: "Category ▾" }, { label: "+ Filter" }]} />
        <div className="overflow-x-auto border-t border-[#E5E8EC] dark:border-[#33373E]">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr>
                <th className={TH}>Product / Dish ▲</th>
                <th className={TH}>Category</th>
                <th className={`${TH} text-right`}>Sold</th>
                <th className={`${TH} text-right`}>Revenue</th>
                <th className={`${TH} text-right`}>Profit</th>
              </tr>
            </thead>
            <tbody>
              {items.map((menuItem) => {
                let sold = 0;
                let revenue = 0;
                state.receipts.forEach((receipt) => {
                  receipt.items.forEach((item) => {
                    if (item.menuId === menuItem.id) {
                      sold += item.qty;
                      revenue += item.unitPrice * item.qty;
                    }
                  });
                });
                return (
                  <tr key={menuItem.id} className={ROW}>
                    <td className={`${TD} font-medium`}>{menuItem.emoji} {menuItem.title}</td>
                    <td className={`${TD} text-slate-500 dark:text-slate-400`}>{menuItem.category}</td>
                    <td className={`${TD} text-right font-mono`}>{sold}</td>
                    <td className={`${TD} text-right font-mono font-bold`}>{money(revenue)}</td>
                    <td className={`${TD} text-right font-mono text-[#1DB954]`}>
                      {money(Math.max(0, revenue - sold * menuItem.cost))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (sub === "abc") {
    const items = state.menuItems.filter((item) => item.title.toLowerCase().includes(q));
    return (
      <div>
        <PageHeader title="ABC-analysis" count={items.length} actions={dateActions} />
        <FilterToolbar search={search} onSearchChange={setSearch} pills={[{ label: "Category ▾" }, { label: "+ Filter" }]} />
        <div className="overflow-x-auto border-t border-[#E5E8EC] dark:border-[#33373E]">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr>
                <th className={TH}>Title ▲</th>
                <th className={TH}>Category</th>
                <th className={`${TH} text-center`}>Qty group</th>
                <th className={`${TH} text-center`}>Revenue group</th>
                <th className={`${TH} text-center`}>Profit group</th>
              </tr>
            </thead>
            <tbody>
              {items.map((menuItem, index) => {
                const group = index === 0 ? "A" : index === 1 ? "B" : "C";
                const badge =
                  group === "A"
                    ? "bg-emerald-500/15 text-emerald-600"
                    : group === "B"
                      ? "bg-amber-500/15 text-amber-600"
                      : "bg-[#F8E5E5] text-rose-600";
                return (
                  <tr key={menuItem.id} className={`${group === "C" ? "bg-[#F8E5E5]/60 dark:bg-rose-950/20" : ""} ${ROW}`}>
                    <td className={`${TD} font-medium`}>{menuItem.emoji} {menuItem.title}</td>
                    <td className={`${TD} text-slate-500 dark:text-slate-400`}>{menuItem.category}</td>
                    {[0, 1, 2].map((column) => (
                      <td key={column} className={`${TD} text-center`}>
                        <span className={`rounded-sm px-2 py-0.5 font-bold ${badge}`}>{group}</span>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (sub === "receipts") {
    const receipts = state.receipts.filter(
      (receipt) =>
        String(receipt.receiptNum).includes(q) ||
        receipt.staffName.toLowerCase().includes(q) ||
        receipt.tableName.toLowerCase().includes(q),
    );
    const total = receipts.reduce((sum, receipt) => sum + receipt.total, 0);
    return (
      <div>
        <PageHeader title="Receipts" count={receipts.length} actions={{ ...dateActions, columns: true }} />
        <FilterToolbar search={search} onSearchChange={setSearch} pills={[{ label: "Payment method ▾" }, { label: "+ Filter" }]} />
        <div className="overflow-x-auto border-t border-[#E5E8EC] dark:border-[#33373E]">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr>
                <th className={TH}>Receipt #</th>
                <th className={TH}>Closed</th>
                <th className={TH}>Waiter</th>
                <th className={TH}>Table</th>
                <th className={TH}>Payment</th>
                <th className={`${TH} text-right`}>Total</th>
                <th className={`${TH} text-right`}>Profit</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((receipt) => (
                <tr
                  key={receipt.receiptNum}
                  onClick={() => actions.setReceiptPreview(receipt)}
                  className={`${ROW} cursor-pointer`}
                >
                  <td className={`${TD} font-mono font-bold text-[#1A73E8] dark:text-[#7EB3F5]`}>#{receipt.receiptNum}</td>
                  <td className={`${TD} text-slate-500 dark:text-slate-400`}>{receipt.closedAt}</td>
                  <td className={TD}>{receipt.staffName}</td>
                  <td className={TD}>{receipt.tableName}</td>
                  <td className={TD}>{receipt.paymentMethod}</td>
                  <td className={`${TD} text-right font-mono font-bold`}>{money(receipt.total)}</td>
                  <td className={`${TD} text-right font-mono text-[#1DB954]`}>{money(receipt.profit)}</td>
                </tr>
              ))}
            </tbody>
            {receipts.length > 0 && (
              <tfoot className="sticky bottom-0 bg-white shadow-[0_-1px_0_#E5E8EC] dark:bg-[#2C3036] dark:shadow-[0_-1px_0_#33373E]">
                <tr className="font-bold">
                  <td className={`${TD} font-bold`} colSpan={5}>
                    {receipts.length} receipts
                  </td>
                  <td className={`${TD} text-right font-mono font-bold`}>{money(total)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        {receipts.length === 0 && (
          <EmptyState
            emoji="🧾"
            title="No closed receipts yet"
            description="Click Open POS to ring up and close your first check."
            action={
              <Link href="/pos" className="inline-block rounded-lg bg-[#1DB954] px-4 py-2 text-xs font-bold text-white">
                Open POS
              </Link>
            }
          />
        )}
      </div>
    );
  }

  if (sub === "feedbacks") {
    return (
      <div>
        <PageHeader title="Feedbacks" count={state.feedbackList.length} actions={{ dateRange: DATE, export: true }} />
        <div className="space-y-2.5 py-4">
          {state.feedbackList.length === 0 ? (
            <EmptyState
              emoji="⭐"
              title="Customer QR Menu reviews appear here"
              description="Open Applications -> QR Menu to test leaving a guest rating."
              action={
                <button
                  type="button"
                  onClick={() => actions.openModal("qr-menu")}
                  className="cursor-pointer rounded-lg bg-[#1A73E8] px-3.5 py-1.5 text-xs font-bold text-white"
                >
                  Preview QR Menu
                </button>
              }
            />
          ) : (
            state.feedbackList.map((feedback, index) => (
              <Card key={`${feedback.time}-${index}`} className="flex items-center justify-between p-4 text-xs">
                <div>
                  <div className="font-bold text-amber-500">
                    {"★".repeat(feedback.stars)}
                    {"☆".repeat(5 - feedback.stars)}
                  </div>
                  <div className="mt-1 font-medium">{feedback.comment}</div>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{feedback.time}</span>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

  if (sub === "payments") {
    const methods = ["Cash", "Card", "e-Wallet"] as const;
    return (
      <div>
        <PageHeader title="Payments count" count={methods.length} actions={dateActions} />
        <div className="mt-3 overflow-x-auto border-t border-[#E5E8EC] dark:border-[#33373E]">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr>
                <th className={TH}>Payment method</th>
                <th className={`${TH} text-right`}>Receipts</th>
                <th className={`${TH} text-right`}>Total sum</th>
              </tr>
            </thead>
            <tbody>
              {methods.map((method) => {
                const matching = state.receipts.filter((receipt) => receipt.paymentMethod === method);
                return (
                  <tr key={method} className={ROW}>
                    <td className={`${TD} font-medium`}>{method}</td>
                    <td className={`${TD} text-right font-mono`}>{matching.length}</td>
                    <td className={`${TD} text-right font-mono font-bold`}>
                      {money(matching.reduce((sum, receipt) => sum + receipt.total, 0))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (sub === "taxes") {
    const totalTax = state.receipts.reduce((sum, receipt) => sum + receipt.tax, 0);
    const taxable = state.receipts.reduce((sum, receipt) => sum + (receipt.subtotal - receipt.discountAmt), 0);
    return (
      <div>
        <PageHeader title="Taxes" count={1} actions={dateActions} />
        <div className="mt-3 overflow-x-auto border-t border-[#E5E8EC] dark:border-[#33373E]">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr>
                <th className={TH}>Tax name</th>
                <th className={`${TH} text-right`}>Rate</th>
                <th className={`${TH} text-right`}>Taxable turnover</th>
                <th className={`${TH} text-right`}>Tax sum</th>
              </tr>
            </thead>
            <tbody>
              <tr className={ROW}>
                <td className={`${TD} font-medium`}>VAT (Value Added Tax)</td>
                <td className={`${TD} text-right font-mono`}>{Math.round(state.settings.vatRate * 100)}%</td>
                <td className={`${TD} text-right font-mono`}>{money(taxable)}</td>
                <td className={`${TD} text-right font-mono font-bold`}>{money(totalTax)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Reports" count={0} />
      <EmptyState emoji="📊" title="Report not found" description="Choose a report from the sidebar." />
    </div>
  );
}
