"use client";

import Link from "next/link";
import { useState } from "react";
import { usePosStore } from "@/lib/pos-store";
import { formatMoney } from "@/lib/format";
import { accountDisplayName, type FinanceCategoryFlag } from "@/lib/console-data";
import { Card, EmptyState, FilterToolbar, PageHeader, ROW, TD, TH, Toggle } from "../ui";

const ALIASES: Record<string, string> = {
  cash_flow: "cashflow",
  cash_shift: "cash_shift",
  "cash-shifts": "cash_shift",
  "cash-flow": "cashflow",
  payroll: "salary",
  salary: "salary",
};

export function FinancesView({ slug }: { slug: string }) {
  const { state, actions } = usePosStore();
  const [search, setSearch] = useState("");
  const sub = ALIASES[slug] ?? slug;
  const symbol = state.settings.currencySymbol;
  const money = (value: number) => formatMoney(value, symbol);
  const q = search.trim().toLowerCase();
  const company = state.settings.companyName;
  if (sub === "transactions") {
    const transactions = state.transactions.filter(
      (tx) =>
        tx.comment.toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q) ||
        tx.account.toLowerCase().includes(q),
    );
    return (
      <div>
        <PageHeader
          title="Transactions"
          count={transactions.length}
          actions={{
            columns: true,
            export: true,
            print: true,
            dateRange: "Full calendar ▾",
            aiImport: true,
            addLabel: "Add",
            addOnClick: () => actions.openModal("add-tx"),
          }}
        />
        <FilterToolbar
          search={search}
          onSearchChange={setSearch}
          pills={[{ label: "Category ▾" }, { label: "Account ▾" }, { label: "+ Filter" }]}
        />
        <div className="overflow-x-auto border-t border-[#E5E8EC] dark:border-[#33373E]">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr>
                <th className={TH}>Date ▾</th>
                <th className={TH}>Category</th>
                <th className={TH}>Comment</th>
                <th className={`${TH} text-right`}>Sum</th>
                <th className={TH}>Account</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className={ROW}>
                  <td className={`${TD} text-slate-500 dark:text-slate-400`}>{tx.date}</td>
                  <td className={`${TD} font-medium`}>{tx.category}</td>
                  <td className={TD}>{tx.comment}</td>
                  <td
                    className={`${TD} text-right font-mono font-bold ${
                      tx.type === "expense" ? "text-rose-500" : "text-[#1DB954]"
                    }`}
                  >
                    {tx.type === "expense" ? "-" : "+"}
                    {money(tx.sum)}
                  </td>
                  <td className={`${TD} text-slate-500 dark:text-slate-400`}>{tx.account}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {transactions.length === 0 && (
          <div className="mx-auto max-w-md space-y-3 py-20 text-center">
            <div className="text-5xl">💸</div>
            <h2 className="text-lg font-bold">Your transactions will be here</h2>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Transactions are used to record income and expenses for your business. You will find here all the
              transactions added by your sellers on the Point of Sale and the ones you add through the Management
              Console.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              For example, to keep track of your expenses for rent, create{" "}
              <button
                type="button"
                onClick={() => actions.openModal("add-tx")}
                className="cursor-pointer font-semibold text-[#1A73E8] hover:underline dark:text-[#7EB3F5]"
              >
                an expense transaction
              </button>{" "}
              under the Rent category.
            </p>
            <button
              type="button"
              onClick={() => actions.showToast("Video tutorial: Recording income & rent expenses in Poster POS", "blue")}
              className="cursor-pointer text-xs font-semibold text-[#1A73E8] hover:underline dark:text-[#7EB3F5]"
            >
              ▶ Watch the video
            </button>
          </div>
        )}
      </div>
    );
  }

  if (sub === "cashflow") {
    const selectedAccount = state.accounts.find((account) => account.id === state.cashFlowAccountFilter);
    const filtered = selectedAccount
      ? state.transactions.filter((tx) => tx.account === accountDisplayName(selectedAccount, company))
      : state.transactions;
    const income = filtered.filter((tx) => tx.type === "income").reduce((sum, tx) => sum + tx.sum, 0);
    const expense = filtered.filter((tx) => tx.type === "expense").reduce((sum, tx) => sum + tx.sum, 0);
    const net = income - expense;
    const endingBalance = selectedAccount
      ? selectedAccount.balance
      : state.accounts.reduce((sum, account) => sum + account.balance, 0);

    const rowLabel = "bg-[#F3F4F6] font-bold dark:bg-white/[0.04]";

    return (
      <div className="space-y-4">
        <PageHeader
          title="Cash flow"
          actions={{ columns: true, export: true, dateRange: "Sep 1 — Nov 23" }}
        />

        <div className="flex items-start gap-3 rounded-lg bg-[#E6F4FA] px-4 py-3.5 text-xs leading-relaxed text-[#1F2328] dark:border dark:border-sky-800/60 dark:bg-sky-950/50 dark:text-sky-100">
          <span className="mt-0.5 shrink-0 text-xl leading-none">☝️</span>
          <div className="space-y-0.5">
            <p>
              This is a new version of the Cash flow report, — give it a try and{" "}
              <button
                type="button"
                onClick={() => actions.showToast("Thank you! Feedback panel opened for Cash flow report.", "blue")}
                className="cursor-pointer font-medium text-[#1A73E8] hover:underline dark:text-[#7EB3F5]"
              >
                share your feedback
              </button>
              .
            </p>
            <p>Expand the categories and click on the amount cells to view the details for each transaction.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1 text-xs">
          <select
            value={state.cashFlowAccountFilter}
            onChange={(event) => actions.setCashFlowAccountFilter(event.target.value)}
            className="cursor-pointer bg-transparent py-1 font-medium text-[#1A73E8] focus:outline-none dark:text-[#7EB3F5]"
          >
            <option value="All">Account: All</option>
            {state.accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {accountDisplayName(account, company)}
              </option>
            ))}
          </select>
        </div>

        <div className="max-w-4xl overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400">
                <th className="w-64 px-3 py-2.5 text-left font-medium" />
                <th className="px-3 py-2.5 text-right font-medium">September</th>
                <th className="px-3 py-2.5 text-right font-medium">October</th>
                <th className="px-3 py-2.5 text-right font-medium">November</th>
                <th className="px-3 py-2.5 text-right font-medium">Over the Period</th>
              </tr>
            </thead>
            <tbody>
              <tr className={`${rowLabel} cursor-pointer`} onClick={() => actions.toggleCashFlowRow("begin")}>
                <td className="flex items-center gap-1.5 px-3 py-2.5">
                  <span className="text-[10px] opacity-70">{state.cashFlowExpanded.begin ? "⌄" : "›"}</span>
                  <span>Beginning Cash Balance</span>
                </td>
                {[0, 1, 2, 3].map((index) => (
                  <td key={index} className="px-3 py-2.5 text-right font-mono">0.00</td>
                ))}
              </tr>
              {state.cashFlowExpanded.begin &&
                state.accounts.map((account) => (
                  <tr key={account.id} className={ROW}>
                    <td className={`py-2 pl-7 pr-3 text-xs text-slate-500 dark:text-slate-400`}>
                      {accountDisplayName(account, company)}
                    </td>
                    {[0, 1, 2, 3].map((index) => (
                      <td key={index} className={`px-3 py-2 text-right font-mono text-xs text-slate-500 dark:text-slate-400`}>0.00</td>
                    ))}
                  </tr>
                ))}

              <tr className={`${rowLabel} cursor-pointer`} onClick={() => actions.toggleCashFlowRow("end")}>
                <td className="flex items-center gap-1.5 px-3 py-2.5">
                  <span className="text-[10px] opacity-70">{state.cashFlowExpanded.end ? "⌄" : "›"}</span>
                  <span>Ending Cash Balance</span>
                </td>
                <td className="px-3 py-2.5 text-right font-mono">0.00</td>
                <td className="px-3 py-2.5 text-right font-mono">0.00</td>
                <td className="px-3 py-2.5 text-right font-mono">{endingBalance.toFixed(2)}</td>
                <td className="px-3 py-2.5 text-right font-mono">{endingBalance.toFixed(2)}</td>
              </tr>
              {state.cashFlowExpanded.end &&
                state.accounts.map((account) => (
                  <tr key={account.id} className={ROW}>
                    <td className="py-2 pl-7 pr-3 text-xs text-slate-500 dark:text-slate-400">
                      {accountDisplayName(account, company)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-slate-500 dark:text-slate-400">0.00</td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-slate-500 dark:text-slate-400">0.00</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">{account.balance.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">{account.balance.toFixed(2)}</td>
                  </tr>
                ))}

              <tr className={`${rowLabel} cursor-pointer`} onClick={() => actions.toggleCashFlowRow("net")}>
                <td className="px-3 py-2.5">Net Cash Flow</td>
                <td className="px-3 py-2.5 text-right font-mono">0.00 ▾</td>
                <td className="px-3 py-2.5 text-right font-mono">0.00 ▾</td>
                <td className="px-3 py-2.5 text-right font-mono">{net.toFixed(2)} ▾</td>
                <td className="px-3 py-2.5 text-right font-mono">{net.toFixed(2)} ▾</td>
              </tr>
              {state.cashFlowExpanded.net && (
                <>
                  <tr className={ROW}>
                    <td className="py-2 pl-7 pr-3 text-xs font-medium text-[#1DB954]">+ Operating Income</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">0.00</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">0.00</td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-[#1DB954]">+{income.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-[#1DB954]">+{income.toFixed(2)}</td>
                  </tr>
                  <tr className={ROW}>
                    <td className="py-2 pl-7 pr-3 text-xs font-medium text-rose-500">- Operating Expenses</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">0.00</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">0.00</td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-rose-500">-{expense.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-rose-500">-{expense.toFixed(2)}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (sub === "cash_shift") {
    const cashAccount = state.accounts.find((account) => account.isCashDrawer);
    const employee = state.employees.find((entry) => entry.id === state.currentStaffId) ?? state.employees[0];
    return (
      <div>
        <PageHeader title="Cash shifts" actions={{ print: true, dateRange: "23 October — 23 November ↕" }} />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr>
                <th className={TH}>#</th>
                <th className={TH}>Shift is open</th>
                <th className={TH}>Shift is closed</th>
                <th className={`${TH} text-right`}>Start of shift</th>
                <th className={`${TH} text-right`}>Safe drop</th>
                <th className={`${TH} text-right`}>In cash register</th>
                <th className={`${TH} text-right`}>Variance</th>
              </tr>
            </thead>
            <tbody>
              {state.settings.cashRegisterShifts && (
                <tr className={ROW}>
                  <td className={`${TD} font-mono font-bold`}>1</td>
                  <td className={TD}>
                    <div className="font-medium">{state.shiftOpenedAt}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{employee?.name}</div>
                  </td>
                  <td className={TD}>
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-600">Open</span>
                  </td>
                  <td className={`${TD} text-right font-mono`}>{money(0)}</td>
                  <td className={`${TD} text-right font-mono`}>{money(0)}</td>
                  <td className={`${TD} text-right font-mono font-bold`}>{money(cashAccount?.balance ?? 0)}</td>
                  <td className={`${TD} text-right font-mono text-[#1DB954]`}>{money(0)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!state.settings.cashRegisterShifts && (
          <EmptyState
            emoji="💵"
            title="Tracking of cash register shifts is off"
            description={
              <>
                To turn the tracking of cash register shifts on use the “Cash register shifts” switch box in{" "}
                <Link href="/manage/settings/general" className="font-medium text-[#1A73E8] hover:underline dark:text-[#7EB3F5]">
                  «Settings»
                </Link>
                .
              </>
            }
          />
        )}
      </div>
    );
  }

  if (sub === "salary") {
    const payrollEnabled = state.settings.payrollTracking;
    const rows = payrollEnabled
      ? state.employees.filter(
          (employee) =>
            employee.name.toLowerCase().includes(q) || employee.position.toLowerCase().includes(q),
        )
      : [];
    return (
      <div>
        <PageHeader
          title="Salary"
          count={rows.length}
          actions={{ columns: true, export: true, print: true, dateRange: "23 October — 23 November ▾" }}
        />
        <FilterToolbar search={search} onSearchChange={setSearch} pills={[{ label: "Position ▾" }, { label: "+ Filter" }]} />
        <div className="overflow-x-auto border-t border-[#E5E8EC] dark:border-[#33373E]">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr>
                <th className={TH}>Position ▾</th>
                <th className={`${TH} text-right`}>Shifts</th>
                <th className={`${TH} text-right`}>Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((employee) => {
                const position = state.positions.find((entry) => entry.title === employee.position);
                const payroll = position?.payroll;
                const receiptItems = state.receipts
                  .filter((receipt) => receipt.staffId === employee.id)
                  .flatMap((receipt) => receipt.items);
                const fallbackHourlyRate = employee.hourlyRate ?? 120;
                const basePay = payroll?.perMonth
                  ? payroll.perMonth
                  : payroll?.perShift
                    ? payroll.perShift
                    : (payroll?.perHour || fallbackHourlyRate) * 8;
                const defaultCommission = payroll?.commissionRates.length ? 0 : 5;
                const allCategoriesRate = payroll?.commissionRates.find((rate) => rate.categoryId === "")?.percentage ?? defaultCommission;
                const commission = receiptItems.reduce((sum, item) => {
                  const menuItem = state.menuItems.find((entry) => entry.id === item.menuId);
                  const categoryId = state.menuCategories.find((category) => category.name === menuItem?.category)?.id;
                  const categoryRate = payroll?.commissionRates.find((rate) => rate.categoryId && rate.categoryId === categoryId)?.percentage;
                  return sum + item.unitPrice * item.qty * (categoryRate ?? allCategoriesRate) / 100;
                }, 0);
                const totalPay = basePay + commission;
                const fixedRateDescription = payroll?.perMonth
                  ? `${money(payroll.perMonth)}/month`
                  : payroll?.perShift
                    ? `${money(payroll.perShift)}/shift`
                    : `${money(payroll?.perHour || fallbackHourlyRate)}/hr × 8h`;
                return (
                  <tr key={employee.id} className={ROW}>
                    <td className={TD}>
                      <div className="font-bold">{employee.position} — {employee.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {fixedRateDescription} + {payroll?.commissionRates.length ? "configured personal sales commission" : "5% sales bonus"}
                      </div>
                    </td>
                    <td className={`${TD} text-right font-mono`}>1</td>
                    <td className={`${TD} text-right font-mono font-bold text-[#1DB954]`}>{money(totalPay)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!payrollEnabled && (
          <EmptyState
            emoji="💵👩‍💼🙋‍♂️💶"
            title="Your employees’ payroll will be here"
            description="Poster will automatically calculate the payroll for your employees. Turn on staff time tracking and payroll calculation to get started."
            action={
              <button
                type="button"
                onClick={actions.enablePayrollTracking}
                className="cursor-pointer rounded-lg bg-[#1A73E8] px-4 py-2 text-xs font-bold text-white"
              >
                Enable payroll calculation
              </button>
            }
          />
        )}
      </div>
    );
  }

  if (sub === "accounts") {
    const accounts = state.accounts.filter(
      (account) =>
        accountDisplayName(account, company).toLowerCase().includes(q) || account.type.toLowerCase().includes(q),
    );
    const total = accounts.reduce((sum, account) => sum + account.balance, 0);
    return (
      <div>
        <PageHeader
          title="Accounts"
          count={accounts.length}
          actions={{
            trash: true,
            columns: true,
            export: true,
            print: true,
            addLabel: "Add",
            addOnClick: () => actions.openModal("add-account"),
          }}
        />
        <FilterToolbar search={search} onSearchChange={setSearch} pills={[{ label: "+ Filter" }]} />
        <div className="overflow-x-auto border-t border-[#E5E8EC] dark:border-[#33373E]">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr>
                <th className={TH}>Name ▲</th>
                <th className={TH}>Type</th>
                <th className={`${TH} text-right`}>Balance</th>
                <th className={`${TH} text-right`} />
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className={ROW}>
                  <td className={`${TD} font-medium`}>{accountDisplayName(account, company)}</td>
                  <td className={`${TD} text-slate-500 dark:text-slate-400`}>{account.type}</td>
                  <td className={`${TD} text-right font-mono ${account.balance === 0 ? "text-slate-500 dark:text-slate-400" : "font-bold"}`}>
                    {money(account.balance)}
                  </td>
                  <td className={`${TD} space-x-3 text-right`}>
                    <button
                      type="button"
                      onClick={() => actions.openModal("add-tx")}
                      className="cursor-pointer font-medium text-[#1A73E8] hover:underline dark:text-[#7EB3F5]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => actions.showToast(`Account ID: ${account.id}`)}
                      className="cursor-pointer font-bold text-[#1A73E8] dark:text-[#7EB3F5]"
                      aria-label="Account actions"
                    >
                      •••
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-[#E5E8EC] font-bold dark:border-[#33373E]">
                <td className={TD} colSpan={2}>Total</td>
                <td className={`${TD} text-right font-mono`}>{total !== 0 ? money(total) : ""}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  }

  if (sub === "categories") {
    const categories = state.financeCategories.filter((category) => category.name.toLowerCase().includes(q));
    return (
      <div>
        <PageHeader
          title="Categories"
          count={categories.length}
          actions={{ addLabel: "Add", addOnClick: () => actions.openModal("add-finance-category") }}
        />
        <FilterToolbar search={search} onSearchChange={setSearch} />
        <div className="overflow-x-auto border-t border-[#E5E8EC] dark:border-[#33373E]">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr>
                <th className={TH}>Name</th>
                <th className={TH}>Allowed transactions</th>
                <th className={TH}>Display on the POS</th>
                <th className={TH}>Include in P&amp;L</th>
                <th className={`${TH} text-right`} />
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <CategoryRows key={category.id} categoryId={category.id} actions={actions} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (sub === "pnl") {
    if (!state.pnlConnected) {
      return (
        <div className="space-y-4">
          <PageHeader
            title="Profit and Loss"
            actions={{ columns: true, export: true, dateRange: "Nov 17 — Nov 23" }}
          />
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#F9E79F] bg-[#FEF9E7] px-4 py-3.5 text-xs text-[#1F2328] dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100">
            <div className="flex min-w-[260px] flex-1 items-center gap-3">
              <span className="shrink-0 text-xl">💡</span>
              <p className="leading-relaxed">
                This is an example of what your P&amp;L report might look like. It will help you see the real
                numbers of your business and avoid unexpected financial differences. Connect the report and find
                out the state of your establishment.
              </p>
            </div>
            <button
              type="button"
              onClick={() => actions.setPnlConnected(true)}
              className="shrink-0 cursor-pointer rounded-md border border-slate-400/60 bg-white/80 px-4 py-1.5 font-semibold text-slate-900 hover:bg-white"
            >
              Connect
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl bg-[#DCEBFA] p-5 sm:p-8 dark:bg-[#1D2836]">
            <div className="grid min-w-[820px] grid-cols-12 items-start gap-6">
              <div className="col-span-8 overflow-hidden rounded-xl border border-slate-200/80 bg-white text-xs text-slate-900 shadow-sm">
                <div className="divide-y divide-slate-200">
                  <PnlRow label="⌄ Revenue" first="240 703,14" second="235 735,22" header />
                  <PnlRow label="› Revenue of products and dishes sold" first="240 703,14" second="235 735,22" />
                  <PnlRow label="⌄ Cost" first="−90 077,79" second="−93 727,77" header />
                  <PnlRow label="› Cost of products and dishes sold" first="−88 559,57" second="−86 784,91" />
                  <PnlRow label="› Stock deductions" first="−1 518,22" second="−6 942,86" callout />
                  <PnlRow label="Margin" first="150 625,35" second="142 007,45" header />
                  <PnlRow label="⌄ Expenses" first="−113 844,00" second="−115 579,00" header />
                  <PnlRow label="Banking services and commission fees" first="−4 894,00" second="−5 300,00" />
                  <PnlRow label="Utility bills" first="−5 750,00" second="−4 983,00" />
                  <PnlRow label="› Labour cost" first="−80 100,00" second="−78 700,00" />
                  <PnlRow label="Marketing" first="−6 000,00" second="−5 750,00" />
                  <PnlRow label="Rent" first="−11 500,00" second="−11 500,00" />
                  <PnlRow label="Operating Supplies" first="−4 600,00" second="−8 346,00" />
                  <PnlRow label="IT & Software" first="−1 000,00" second="−1 000,00" />
                  <PnlRow label="Profit before taxation" first="36 781,35" second="26 428,45" header />
                  <PnlRow label="⌄ Taxes" first="−21 571,02" second="−21 143,21" header />
                  <PnlRow label="Turnover Tax" first="−8 957,52" second="−8 896,91" />
                  <PnlRow label="VAT" first="−12 613,50" second="−12 246,30" />
                  <PnlRow label="Profit after taxation" first="15 210,33" second="5 285,24" callout final />
                </div>
              </div>
              <div className="col-span-4 flex h-full flex-col justify-between py-16 pl-2">
                <div className="mt-6 space-y-2">
                  <h3 className="text-lg font-extrabold leading-snug text-slate-900 dark:text-slate-100">
                    Has your waste percentage gone up?
                  </h3>
                  <p className="text-sm opacity-85 dark:text-slate-300">It might be time to optimize your menu.</p>
                  <div className="pt-1 text-xl font-bold text-rose-500">↖</div>
                </div>
                <div className="mt-64 space-y-1.5">
                  <h3 className="text-lg font-extrabold leading-snug text-slate-900 dark:text-slate-100">
                    How much does your restaurant actually make?
                  </h3>
                  <p className="text-sm opacity-85 dark:text-slate-300">See your net profit.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const revenue = state.receipts.reduce((sum, receipt) => sum + receipt.subtotal, 0);
    const cogs = state.receipts.reduce((sum, receipt) => sum + (receipt.subtotal - receipt.profit), 0);
    const margin = revenue - cogs;
    const stockDeductions = state.stockDeductions.reduce((sum, deduction) => sum + deduction.sum, 0);
    const expenses = state.transactions
      .filter((tx) => {
        if (tx.type !== "expense") return false;
        if (tx.category === "Stock deductions") return false;
        const category = state.financeCategories.find((entry) => entry.name === tx.category);
        return category ? category.includeInPnl : true;
      })
      .reduce((sum, tx) => sum + tx.sum, 0);
    const vat = state.receipts.reduce((sum, receipt) => sum + receipt.tax, 0);
    const net = margin - stockDeductions - expenses - vat;
    const pct = (value: number) => (revenue > 0 ? `${((Math.abs(value) / revenue) * 100).toFixed(2)}%` : "0.00%");

    return (
      <div className="space-y-4">
        <PageHeader title="Profit and Loss" count="Connected" actions={{ columns: true, export: true, dateRange: "Nov 17 — Nov 23" }} />
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E5E8EC] px-4 py-2.5 text-xs dark:border-[#33373E]">
          <span>
            Showing live Profit &amp; Loss calculated from <strong>{company}</strong> POS receipts, recipe food
            costs, and P&amp;L-enabled expense categories.
          </span>
          <button
            type="button"
            onClick={() => actions.setPnlConnected(false)}
            className="cursor-pointer font-semibold text-[#1A73E8] hover:underline dark:text-[#7EB3F5]"
          >
            View sample preview
          </button>
        </div>
        <Card className="max-w-3xl overflow-hidden text-xs">
          <div className="divide-y divide-[#E5E8EC] dark:divide-[#33373E]">
            <LivePnlRow label="Revenue (POS Sales)" value={money(revenue)} percent="100.00%" />
            <LivePnlRow label="Cost of products and dishes sold" value={`-${money(cogs)}`} percent={pct(cogs)} negative />
            <LivePnlRow label="Stock deductions" value={`-${money(stockDeductions)}`} percent={pct(stockDeductions)} negative />
            <LivePnlRow label="Gross Margin" value={money(margin)} percent={pct(margin)} green highlight />
            <LivePnlRow label="Operating Expenses (Included in P&L)" value={`-${money(expenses)}`} percent={pct(expenses)} negative />
            <LivePnlRow label="VAT Collected" value={`-${money(vat)}`} percent={pct(vat)} />
            <LivePnlRow label="Profit after taxation" value={money(net)} percent={pct(net)} accent final />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Finances" />
      <EmptyState emoji="💳" title="Finance view not found" description="Choose a finance page from the sidebar." />
    </div>
  );
}

function PnlRow({
  label,
  first,
  second,
  header,
  callout,
  final,
}: {
  label: string;
  first: string;
  second: string;
  header?: boolean;
  callout?: boolean;
  final?: boolean;
}) {
  const percentFirst = `100,00%`;
  const percentSecond = `100,00%`;
  const content = (
    <>
      <span className="col-span-6">{label}</span>
      <span className="col-span-2 text-right font-mono">{first}</span>
      <span className="col-span-1 text-right font-mono">{percentFirst}</span>
      <span className="col-span-2 text-right font-mono">{second}</span>
      <span className="col-span-1 text-right font-mono">{percentSecond}</span>
    </>
  );

  if (callout) {
    return (
      <div className={`relative z-10 -mx-2 ${final ? "mt-1 py-3" : "my-1 py-2.5"} grid grid-cols-12 items-center rounded-xl border border-slate-200 bg-white px-6 shadow-lg`}>
        {content}
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-12 px-4 py-2 ${header ? "bg-slate-50/90 font-bold" : "pl-7 text-slate-700"} ${label.startsWith("›") ? "pl-7" : ""}`}
    >
      {content}
    </div>
  );
}

function LivePnlRow({
  label,
  value,
  percent,
  negative,
  green,
  accent,
  highlight,
  final,
}: {
  label: string;
  value: string;
  percent: string;
  negative?: boolean;
  green?: boolean;
  accent?: boolean;
  highlight?: boolean;
  final?: boolean;
}) {
  return (
    <div
      className={`flex justify-between px-4 py-3 font-bold ${highlight ? "bg-slate-50 dark:bg-white/5" : ""} ${
        final ? "bg-[#E8EFF7] py-3.5 text-sm font-extrabold dark:bg-white/10" : ""
      }`}
    >
      <span>{label}</span>
      <span
        className={`font-mono ${negative ? "text-rose-500" : ""} ${green ? "text-[#1DB954]" : ""} ${
          accent ? (value.startsWith("-") ? "text-rose-500" : "text-[#1DB954]") : ""
        }`}
      >
        {value}
        <span className="ml-3 text-slate-500 dark:text-slate-400">{percent}</span>
      </span>
    </div>
  );
}

function CategoryRows({
  categoryId,
  actions,
}: {
  categoryId: string;
  actions: ReturnType<typeof usePosStore>["actions"];
}) {
  const { state } = usePosStore();
  const category = state.financeCategories.find((entry) => entry.id === categoryId);
  if (!category) return null;

  const flag = (field: FinanceCategoryFlag) => actions.toggleFinanceCategoryFlag(category.id, field);

  return (
    <>
      <tr className={ROW}>
        <td className={`${TD} font-medium`}>
          {category.expandable ? (
            <button
              type="button"
              onClick={() => actions.toggleFinanceCategoryExpand(category.id)}
              className="inline-flex cursor-pointer items-center gap-1.5"
            >
              <span className="text-[10px] opacity-60">{category.expanded ? "⌄" : "›"}</span>
              <span>{category.name}</span>
            </button>
          ) : (
            <span>{category.name}</span>
          )}
        </td>
        <td className={`${TD} text-slate-500 dark:text-slate-400`}>{category.allowed}</td>
        <td className={TD}>
          {category.hasPosSwitch ? (
            <Toggle checked={category.displayOnPos} onChange={() => flag("displayOnPos")} label={`Display ${category.name} on POS`} />
          ) : null}
        </td>
        <td className={TD}>
          <Toggle checked={category.includeInPnl} onChange={() => flag("includeInPnl")} label={`Include ${category.name} in P&L`} />
        </td>
        <td className={`${TD} space-x-3 text-right`}>
          <button
            type="button"
            onClick={() => actions.showToast(`Editing category: ${category.name}`)}
            className="cursor-pointer font-medium text-[#1A73E8] hover:underline dark:text-[#7EB3F5]"
          >
            Edit
          </button>
          {category.hasPosSwitch && (
            <button
              type="button"
              onClick={() => actions.deleteFinanceCategory(category.id)}
              className="cursor-pointer font-bold text-[#1A73E8] dark:text-[#7EB3F5]"
              aria-label={`Delete ${category.name}`}
            >
              •••
            </button>
          )}
        </td>
      </tr>
      {category.expandable &&
        category.expanded &&
        (category.children ?? []).map((childName) => (
          <tr key={childName} className={ROW}>
            <td className={`py-2 pl-8 pr-3 text-xs text-slate-500 dark:text-slate-400`}>• {childName}</td>
            <td className={`px-3 py-2 text-xs text-slate-500 dark:text-slate-400`}>{category.allowed}</td>
            <td />
            <td />
            <td />
          </tr>
        ))}
    </>
  );
}
