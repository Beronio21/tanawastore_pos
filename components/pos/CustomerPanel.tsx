"use client";

import { useState } from "react";
import { BarChart3, ChevronLeft, Search, UserPlus } from "lucide-react";
import { usePosStore } from "@/lib/pos-store";
import { formatMoney } from "@/lib/format";
import type { Customer } from "@/lib/console-data";

const INPUT =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#1A73E8] focus:outline-none dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white";

function groupBadge(customer: Customer, groups: { id: string; title: string; rate: number; loyaltyProgram: string; deleted?: boolean }[]) {
  const group = groups.find((entry) => entry.title === customer.group);
  const pct = group?.loyaltyProgram === "Discount system" ? group.rate : customer.discountPct;
  return (
    <span className="shrink-0 rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-600 dark:text-sky-300">
      {customer.group || "No group"}{pct > 0 ? ` · ${pct}%` : ""}
    </span>
  );
}

export function CustomerPanel({ orderId, onApply }: { orderId: string; onApply: () => void }) {
  const { state, actions } = usePosStore();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", group: "", gender: "" });

  const symbol = state.settings.currencySymbol;
  const money = (value: number) => formatMoney(value, symbol);
  const groups = state.customerGroups.filter((group) => !group.deleted);
  const query = search.trim().toLowerCase();
  const customers = state.customers.filter(
    (customer) =>
      !query ||
      customer.name.toLowerCase().includes(query) ||
      customer.phone.includes(query) ||
      customer.profileNum.toLowerCase().includes(query),
  );
  const selected = state.customers.find((customer) => customer.id === selectedId);
  const selectedGroup = selected ? groups.find((group) => group.title === selected.group) : undefined;
  const purchases = selected
    ? state.receipts.filter((receipt) => receipt.customerName === selected.name && !receipt.refunded)
    : [];
  const attachedId = state.posOrders.find((order) => order.id === orderId)?.customerId ?? "";

  const apply = (customerId: string) => {
    actions.attachCustomerToOrder(orderId, customerId);
    onApply();
  };

  const switchGroup = (customer: Customer, groupTitle: string) => {
    const group = groups.find((entry) => entry.title === groupTitle);
    actions.updateCustomer(customer.id, {
      name: customer.name,
      profileNum: customer.profileNum,
      phone: customer.phone,
      group: groupTitle,
      discountPct: group?.loyaltyProgram === "Discount system" ? group.rate : customer.discountPct,
    });
  };

  const create = () => {
    const name = form.name.trim();
    if (!name) {
      actions.showToast("Customer name is required.", "info");
      return;
    }
    const group = groups.find((entry) => entry.title === form.group);
    const newId = actions.createCustomer({
      name,
      phone: form.phone.trim(),
      group: form.group || undefined,
      gender: form.gender || undefined,
      discountPct: group?.loyaltyProgram === "Discount system" ? group.rate : 0,
    });
    setForm({ name: "", phone: "", group: "", gender: "" });
    setCreating(false);
    if (newId) {
      apply(newId);
    } else {
      setSelectedId("");
    }
  };

  if (selected && !creating) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2 px-1 pb-3">
          <div className="min-w-0">
            <button type="button" onClick={() => setSelectedId("")} className="mb-1 inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-[#1A73E8] hover:underline dark:text-[#7EB3F5]">
              <ChevronLeft className="h-3.5 w-3.5" /> Customers
            </button>
            <h3 className="truncate text-base font-bold">{selected.name}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{selected.profileNum}</p>
          </div>
          <button
            type="button"
            onClick={() => apply(selected.id)}
            className="shrink-0 cursor-pointer rounded-lg bg-[#1DB954] px-4 py-2 text-xs font-bold text-white hover:bg-[#18A348]"
          >
            {attachedId === selected.id ? "Applied" : "Apply"}
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
          <div className="rounded-xl border border-slate-200 p-3 dark:border-[#3E434C]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Customer group</span>
              <select
                value={selected.group}
                onChange={(event) => switchGroup(selected, event.target.value)}
                className="cursor-pointer rounded-md border border-slate-200 bg-transparent px-1.5 py-1 text-[11px] font-semibold dark:border-[#3E434C]"
              >
                {groups.map((group) => <option key={group.id} value={group.title}>{group.title}</option>)}
              </select>
            </div>
            <p className="mt-1.5 text-xs font-semibold">
              {selected.group || "No group"}
              <span className="ml-1 font-normal text-slate-500 dark:text-slate-400">
                — Discount {selectedGroup?.loyaltyProgram === "Discount system" ? `${selectedGroup.rate}%` : `${selected.discountPct}%`}
              </span>
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-3 dark:border-[#3E434C]">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Bonus balance</span>
            <p className="mt-1 font-mono text-sm font-bold">{money(selected.bonusBalance ?? 0)}</p>
          </div>

          <div className="rounded-xl border border-slate-200 p-3 dark:border-[#3E434C]">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Gender &amp; Phone</span>
            <p className="mt-1 text-xs font-semibold">{[selected.gender, selected.phone].filter(Boolean).join(" · ") || "—"}</p>
          </div>

          <div className="rounded-xl border border-slate-200 p-3 dark:border-[#3E434C]">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400"><BarChart3 className="h-3.5 w-3.5" />Purchase reports</span>
            {purchases.length ? (
              <div className="mt-2 space-y-1.5">
                {purchases.slice(0, 8).map((receipt) => (
                  <div key={`${receipt.receiptNum}-${receipt.closedAt}`} className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] dark:bg-[#2C3036]">
                    <span className="font-semibold">#{receipt.receiptNum} · {receipt.tableName}</span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">{money(receipt.total)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 flex flex-col items-center py-4 text-center">
                <BarChart3 className="h-7 w-7 text-slate-300 dark:text-slate-600" />
                <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">Customer&apos;s purchase reports will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or phone" className={`${INPUT} pl-8`} />
      </div>

      {creating ? (
        <div className="mt-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold">New customer</h4>
            <button type="button" onClick={() => setCreating(false)} className="cursor-pointer text-[11px] font-semibold text-slate-500 hover:underline">Cancel</button>
          </div>
          <input value={form.name} onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))} placeholder="Full name" className={INPUT} />
          <input value={form.phone} onChange={(event) => setForm((f) => ({ ...f, phone: event.target.value }))} placeholder="Phone" className={INPUT} />
          <select value={form.group} onChange={(event) => setForm((f) => ({ ...f, group: event.target.value }))} className={`${INPUT} cursor-pointer`}>
            <option value="">Customer group</option>
            {groups.map((group) => <option key={group.id} value={group.title}>{group.title}</option>)}
          </select>
          <select value={form.gender} onChange={(event) => setForm((f) => ({ ...f, gender: event.target.value }))} className={`${INPUT} cursor-pointer`}>
            <option value="">Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <button type="button" onClick={create} className="w-full cursor-pointer rounded-lg bg-[#1DB954] py-2 text-xs font-bold text-white hover:bg-[#18A348]">Save customer</button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="mt-2 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-2 text-xs font-bold text-[#1A73E8] hover:bg-sky-500/5 dark:border-[#3E434C] dark:text-[#7EB3F5]"
          >
            <UserPlus className="h-3.5 w-3.5" />
            New customer
          </button>
          <div className="mt-2 min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200 dark:divide-[#2C3036] dark:border-[#33373E]">
            {customers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => setSelectedId(customer.id)}
                className={`flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-white/[0.03] ${customer.id === attachedId ? "bg-emerald-500/5" : ""}`}
              >
                <span className="min-w-0 truncate text-xs font-semibold">{customer.name}</span>
                {groupBadge(customer, groups)}
              </button>
            ))}
            {!customers.length && (
              <p className="px-3 py-8 text-center text-xs text-slate-500 dark:text-slate-400">{state.customers.length ? "No customers match your search." : "No customers yet — create one above."}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
