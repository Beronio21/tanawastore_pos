"use client";

import { useEffect, useState } from "react";
import { usePosStore } from "@/lib/pos-store";
import { formatMoney } from "@/lib/format";
import { Card, EmptyState, FilterToolbar, PageHeader, ROW, TD, TH } from "../ui";
import { ReceiptsReportView } from "./ReceiptsReportView";
import { SalesReportView } from "./SalesReportView";

const ALIASES: Record<string, string> = {
  employees: "waiters",
  stations: "workshops",
  categories: "category",
  "abc-analysis": "abc",
  feedback: "feedbacks",
  "payments-count": "payments",
  stat: "sales",
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
    return <SalesReportView />;
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
    return <ReceiptsReportView />;
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
