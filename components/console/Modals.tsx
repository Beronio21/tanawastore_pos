"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Check,
  Lock,
  Printer,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import { usePosStore } from "@/lib/pos-store";
import { formatMoney, formatQty } from "@/lib/format";
import { accountDisplayName, type ButcheryLineItem, type InventoryCheckLine, type StockDeductionLine, type SupplyLineItem, type TransferLineItem } from "@/lib/console-data";

const INPUT =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#1A73E8] focus:outline-none dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white";
const LABEL = "mb-1 block font-semibold text-slate-700 dark:text-slate-300";
const CANCEL =
  "cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 dark:border-[#3E434C] dark:text-slate-300";
const SUBMIT =
  "cursor-pointer rounded-lg bg-[#1DB954] px-4 py-2 text-xs font-bold text-white hover:bg-[#18A348]";
const TH =
  "border-b border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-500 dark:border-[#33373E] dark:text-slate-400";

function Overlay({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
}

function Card({ children, className = "max-w-md" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`w-full overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-2xl dark:border-[#33373E] dark:bg-[#2C3036] dark:text-slate-100 ${className}`}
    >
      {children}
    </div>
  );
}

function Header({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5 dark:border-[#33373E] dark:bg-[#24272C]">
      <h3 className="text-sm font-bold">{title}</h3>
      <button type="button" onClick={onClose} aria-label="Close" className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-white">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function SubscriptionModal() {
  const { actions } = usePosStore();
  const plans = [
    { name: "Mini", price: "$26", features: ["1 POS Register", "Up to 100 menu items", "Basic stock & sales reports"], popular: false },
    { name: "Business", price: "$44", features: ["300 menu items & modifiers", "Kitchen Kit (KDS) & Delivery", "Payroll & Promotions"], popular: true },
    { name: "Pro", price: "$62", features: ["1,500 menu items", "Floor plan & reservations", "Full P&L & access control"], popular: false },
  ];

  return (
    <Overlay onClose={actions.closeModal}>
      <Card className="max-w-2xl rounded-2xl">
        <div className="flex items-center justify-between bg-[#0077FF] px-6 py-4 text-white">
          <div>
            <h3 className="text-base font-bold">Poster POS Subscription Plans</h3>
            <p className="text-xs text-sky-100">Trial period ends on 7 December 2026 • Account: tanawastore.pos</p>
          </div>
          <button type="button" onClick={actions.closeModal} aria-label="Close subscription modal" className="cursor-pointer text-white/80 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 p-6 text-xs sm:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col justify-between space-y-4 rounded-xl border p-4 ${
                plan.popular ? "border-2 border-[#1DB954] bg-emerald-50/30 dark:bg-emerald-950/20" : "border-slate-200 dark:border-[#33373E]"
              }`}
            >
              <div>
                {plan.popular && (
                  <span className="rounded-full bg-[#1DB954] px-2 py-0.5 text-[10px] font-bold text-white">POPULAR</span>
                )}
                <div className="mt-1 text-base font-bold">{plan.name}</div>
                <div className="mt-1 font-mono text-2xl font-extrabold text-[#1A73E8] dark:text-[#7EB3F5]">
                  {plan.price}
                  <span className="text-xs font-normal text-slate-400">/mo</span>
                </div>
                <ul className="mt-3 space-y-1.5 text-slate-600 dark:text-slate-300">
                  {plan.features.map((feature) => (
                    <li key={feature}>• {feature}</li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={() => {
                  actions.closeModal();
                  actions.showToast(`Selected Poster POS "${plan.name}" plan!`, "success");
                }}
                className={
                  plan.popular
                    ? "w-full cursor-pointer rounded-lg bg-[#1DB954] py-2 font-bold text-white hover:bg-[#18A348]"
                    : "w-full cursor-pointer rounded-lg border border-[#1A73E8] py-2 font-bold text-[#1A73E8] hover:bg-[#E8EFF7] dark:text-[#7EB3F5]"
                }
              >
                Select {plan.name}
              </button>
            </div>
          ))}
        </div>
      </Card>
    </Overlay>
  );
}

export function AddMenuItemModal() {
  const { state, actions } = usePosStore();
  const [type, setType] = useState<"Product" | "Dish">("Dish");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(state.menuCategories[0]?.name ?? "Coffee");
  const [station, setStation] = useState(state.stations[0]?.title ?? "Bar");
  const [cost, setCost] = useState("18.00");
  const [price, setPrice] = useState("110.00");
  const [recipeChoice, setRecipeChoice] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const recipe =
      recipeChoice === "coffee"
        ? [
            { stockId: "stk-2", qty: 0.018 },
            { stockId: "stk-8", qty: 0.2 },
            { stockId: "stk-10", qty: 1 },
          ]
        : recipeChoice === "flour"
          ? [
              { stockId: "stk-7", qty: 0.12 },
              { stockId: "stk-5", qty: 0.03 },
              { stockId: "stk-6", qty: 1 },
            ]
          : [];
    actions.createMenuItem({
      title: title.trim(),
      type,
      category,
      station,
      cost: Number(cost) || 0,
      price: Number(price) || 0,
      emoji: recipeChoice === "coffee" ? "☕" : recipeChoice === "flour" ? "🥐" : "🍽️",
      recipe,
    });
    actions.closeModal();
  }

  return (
    <Overlay onClose={actions.closeModal}>
      <Card>
        <Header title={`Add ${type}`} onClose={actions.closeModal} />
        <form onSubmit={submit} className="space-y-3.5 p-5 text-xs">
          <div>
            <label className={LABEL}>Title *</label>
            <input type="text" required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Iced Caramel Macchiato" className={INPUT} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={LABEL}>Type</label>
              <select value={type} onChange={(event) => setType(event.target.value as "Product" | "Dish")} className={INPUT}>
                <option value="Dish">Dish</option>
                <option value="Product">Product</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Category</label>
              <select value={category} onChange={(event) => setCategory(event.target.value)} className={INPUT}>
                {state.menuCategories.map((entry) => (
                  <option key={entry.id} value={entry.name}>{entry.name}</option>
                ))}
                <option value="Kitchen">Kitchen</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Station</label>
              <select value={station} onChange={(event) => setStation(event.target.value)} className={INPUT}>
                {state.stations.map((entry) => (
                  <option key={entry.id} value={entry.title}>{entry.title}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Cost without VAT (₱)</label>
              <input type="number" step="0.01" min="0" required value={cost} onChange={(event) => setCost(event.target.value)} className={`${INPUT} font-mono`} />
            </div>
            <div>
              <label className={LABEL}>Price (₱) *</label>
              <input type="number" step="0.01" min="0.01" required value={price} onChange={(event) => setPrice(event.target.value)} className={`${INPUT} font-mono`} />
            </div>
          </div>
          <div>
            <label className={LABEL}>Recipe Ingredient Deduction</label>
            <select value={recipeChoice} onChange={(event) => setRecipeChoice(event.target.value)} className={INPUT}>
              <option value="">None (Direct Product)</option>
              <option value="coffee">Coffee (0.018 kg) + Milk (0.200 l) + Paper cup 250ml (1 pcs)</option>
              <option value="flour">Flour (0.120 kg) + Dark chocolate (0.030 kg) + Egg (1 pcs)</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={actions.closeModal} className={CANCEL}>Cancel</button>
            <button type="submit" className={SUBMIT}>Save to Menu &amp; POS</button>
          </div>
        </form>
      </Card>
    </Overlay>
  );
}

export function AddInventoryCheckModal() {
  const { state, actions } = usePosStore();
  const locations = state.storageLocations?.length ? state.storageLocations : ["Storage 1"];
  const [storage, setStorage] = useState(locations[0] ?? "Storage 1");
  const [type, setType] = useState<"Full" | "Partial">("Full");
  const [checkDate, setCheckDate] = useState(() => {
    const now = new Date();
    return `${now.toISOString().slice(0, 10)}T${now.toISOString().slice(11, 16)}`;
  });
  const quantityAtStorage = (itemId: string, title: string) => {
    const item = state.stockItems.find((entry) => entry.id === itemId);
    if (!item) return 0;
    return item.storageQuantities?.[title] ?? (title === locations[0] ? item.stock : 0);
  };
  const [lines, setLines] = useState<InventoryCheckLine[]>(
    state.stockItems.map((item) => ({
      stockId: item.id,
      title: item.title,
      expected: quantityAtStorage(item.id, storage),
      actual: quantityAtStorage(item.id, storage),
      unit: item.unit,
      cost: item.cost,
      discrepancyQty: 0,
      discrepancyValue: 0,
    })),
  );
  const totalValue = lines.reduce((sum, line) => sum + (line.actual - line.expected) * line.cost, 0);

  return (
    <Overlay onClose={actions.closeModal}>
      <Card className="max-w-4xl">
        <Header title="New Inventory Check" onClose={actions.closeModal} />
        <form
          onSubmit={(event) => {
            event.preventDefault();
            actions.createInventoryCheck({
              storage,
              type,
              startingDate: checkDate,
              completedDate: checkDate,
              lines,
            });
            actions.closeModal();
          }}
          className="space-y-4 p-5 text-xs"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <div><label className={LABEL}>Storage</label><select value={storage} onChange={(event) => {
              const nextStorage = event.target.value;
              setStorage(nextStorage);
              setLines((current) => current.map((line) => {
                const expected = quantityAtStorage(line.stockId, nextStorage);
                return { ...line, expected, actual: expected };
              }));
            }} className={INPUT}>{locations.map((location) => <option key={location}>{location}</option>)}</select></div>
            <div><label className={LABEL}>Type</label><select value={type} onChange={(event) => setType(event.target.value as "Full" | "Partial")} className={INPUT}><option>Full</option><option>Partial</option></select></div>
            <div><label className={LABEL}>Check date/time</label><input type="datetime-local" value={checkDate} onChange={(event) => setCheckDate(event.target.value)} className={INPUT} required /></div>
          </div>

          <div className="max-h-[420px] overflow-auto rounded-lg border border-slate-200 dark:border-[#33373E]">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 dark:bg-[#24272C]"><tr><th className={TH}>Item</th><th className={`${TH} text-right`}>Expected stock</th><th className={`${TH} text-right`}>Actual stock</th><th className={`${TH} text-right`}>Discrepancy Qty</th><th className={`${TH} text-right`}>Discrepancy Value</th></tr></thead>
              <tbody>{lines.map((line, index) => {
                const discrepancy = line.actual - line.expected;
                const value = discrepancy * line.cost;
                return (
                  <tr key={line.stockId} className="border-b border-slate-100 dark:border-[#33373E]">
                    <td className="px-3 py-2 font-medium">{line.title}</td>
                    <td className="px-3 py-2 text-right font-mono">{formatQty(line.expected, line.unit)}</td>
                    <td className="px-3 py-2 text-right"><input type="number" step="0.001" min="0" value={line.actual} onChange={(event) => setLines((current) => current.map((entry, lineIndex) => lineIndex === index ? { ...entry, actual: Number(event.target.value) || 0 } : entry))} className="w-28 rounded-md border border-slate-300 bg-white px-2 py-1 text-right font-mono dark:border-[#3E434C] dark:bg-[#1D2024]" /></td>
                    <td className={`px-3 py-2 text-right font-mono ${discrepancy > 0 ? "text-emerald-600" : discrepancy < 0 ? "text-rose-500" : "text-slate-500"}`}>{discrepancy > 0 ? "+" : ""}{formatQty(discrepancy, line.unit)}</td>
                    <td className={`px-3 py-2 text-right font-mono ${value > 0 ? "text-emerald-600" : value < 0 ? "text-rose-500" : "text-slate-500"}`}>{value > 0 ? "+" : ""}{formatMoney(value, state.settings.currencySymbol)}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-[#33373E]"><span className="font-semibold">Total discrepancy value</span><span className={`font-mono font-bold ${totalValue > 0 ? "text-emerald-600" : totalValue < 0 ? "text-rose-500" : ""}`}>{totalValue > 0 ? "+" : ""}{formatMoney(totalValue, state.settings.currencySymbol)}</span></div>
          <div className="flex justify-end gap-2"><button type="button" onClick={actions.closeModal} className={CANCEL}>Cancel</button><button type="submit" className={SUBMIT}>Complete Check</button></div>
        </form>
      </Card>
    </Overlay>
  );
}

export function AddButcheryModal() {
  const { state, actions } = usePosStore();
  const locations = state.storageLocations?.length ? state.storageLocations : ["Storage 1"];
  const [storage, setStorage] = useState(locations[0] ?? "Storage 1");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [comment, setComment] = useState("");
  const firstItem = state.stockItems[0];
  const [primary, setPrimary] = useState<ButcheryLineItem>({
    stockId: firstItem?.id ?? "",
    title: firstItem?.title ?? "",
    quantity: 1,
    unit: firstItem?.unit ?? "pcs",
  });
  const [finals, setFinals] = useState<ButcheryLineItem[]>([
    {
      stockId: state.stockItems[1]?.id ?? firstItem?.id ?? "",
      title: state.stockItems[1]?.title ?? firstItem?.title ?? "",
      quantity: 1,
      unit: state.stockItems[1]?.unit ?? firstItem?.unit ?? "pcs",
    },
  ]);

  const updateFinal = (index: number, patch: Partial<ButcheryLineItem>) => {
    setFinals((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line));
  };

  return (
    <Overlay onClose={actions.closeModal}>
      <Card className="max-w-2xl">
        <Header title="New Butchery" onClose={actions.closeModal} />
        <form
          onSubmit={(event) => {
            event.preventDefault();
            actions.createButchery({ date, storage, comment, primary, finals });
            actions.closeModal();
          }}
          className="space-y-4 p-5 text-xs"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={LABEL}>Storage location</label>
              <select value={storage} onChange={(event) => setStorage(event.target.value)} className={INPUT}>{locations.map((location) => <option key={location}>{location}</option>)}</select>
            </div>
            <div>
              <label className={LABEL}>Date</label>
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className={INPUT} required />
            </div>
          </div>

          <div>
            <label className={LABEL}>Primary item</label>
            <div className="grid grid-cols-[minmax(0,1fr)_140px] gap-2">
              <select
                value={primary.stockId}
                onChange={(event) => {
                  const item = state.stockItems.find((entry) => entry.id === event.target.value);
                  if (item) setPrimary({ stockId: item.id, title: item.title, quantity: primary.quantity, unit: item.unit });
                }}
                className={INPUT}
              >
                {state.stockItems.map((item) => <option key={item.id} value={item.id}>{item.title} ({formatMoney(item.cost, state.settings.currencySymbol)}/{item.unit})</option>)}
              </select>
              <input type="number" step="0.001" min="0.001" required aria-label="Primary quantity" value={primary.quantity} onChange={(event) => setPrimary((current) => ({ ...current, quantity: Number(event.target.value) || 0 }))} className={`${INPUT} font-mono`} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={LABEL}>Final items</label>
              <button type="button" onClick={() => {
                const item = state.stockItems[0];
                if (item) setFinals((current) => [...current, { stockId: item.id, title: item.title, quantity: 1, unit: item.unit }]);
              }} className="text-[11px] font-bold text-[#1A73E8] dark:text-[#7EB3F5]">+ Add final item</button>
            </div>
            {finals.map((line, index) => (
              <div key={`${index}-${line.stockId}`} className="grid grid-cols-[minmax(0,1fr)_140px_24px] gap-2">
                <select
                  value={line.stockId}
                  onChange={(event) => {
                    const item = state.stockItems.find((entry) => entry.id === event.target.value);
                    if (item) updateFinal(index, { stockId: item.id, title: item.title, unit: item.unit });
                  }}
                  className={INPUT}
                >
                  {state.stockItems.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
                <input type="number" step="0.001" min="0.001" required aria-label="Final quantity" value={line.quantity} onChange={(event) => updateFinal(index, { quantity: Number(event.target.value) || 0 })} className={`${INPUT} font-mono`} />
                <button type="button" aria-label="Remove final item" disabled={finals.length === 1} onClick={() => setFinals((current) => current.filter((_, lineIndex) => lineIndex !== index))} className="text-slate-400 hover:text-rose-500 disabled:opacity-30">×</button>
              </div>
            ))}
          </div>

          <div>
            <label className={LABEL}>Comment</label>
            <textarea value={comment} onChange={(event) => setComment(event.target.value)} className={`${INPUT} min-h-16 resize-y`} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={actions.closeModal} className={CANCEL}>Cancel</button>
            <button type="submit" className={SUBMIT}>Save Butchery</button>
          </div>
        </form>
      </Card>
    </Overlay>
  );
}

export function AddTransferModal() {
  const { state, actions } = usePosStore();
  const locations = state.storageLocations?.length ? state.storageLocations : ["Storage 1"];
  const [fromStorage, setFromStorage] = useState(locations[0] ?? "Storage 1");
  const [toStorage, setToStorage] = useState(locations[1] ?? locations[0] ?? "Storage 1");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [employee, setEmployee] = useState("Philip Venje Beronio");
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const firstItem = state.stockItems[0];
  const [lines, setLines] = useState<TransferLineItem[]>([
    {
      stockId: firstItem?.id ?? "",
      title: firstItem?.title ?? "",
      quantity: 1,
      unit: firstItem?.unit ?? "pcs",
      cost: firstItem?.cost ?? 0,
    },
  ]);
  const sum = lines.reduce((total, line) => {
    const item = state.stockItems.find((entry) => entry.id === line.stockId);
    return total + line.quantity * (item?.cost ?? line.cost);
  }, 0);

  const updateLine = (index: number, patch: Partial<TransferLineItem>) => {
    setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line));
  };

  return (
    <Overlay onClose={actions.closeModal}>
      <Card className="max-w-2xl">
        <Header title="New Transfer" onClose={actions.closeModal} />
        <form
          onSubmit={(event) => {
            event.preventDefault();
            actions.createTransfer({ date, name: name || comment, comment, employee, fromStorage, toStorage, lines });
            actions.closeModal();
          }}
          className="space-y-4 p-5 text-xs"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className={LABEL}>From storage</label><select value={fromStorage} onChange={(event) => setFromStorage(event.target.value)} className={INPUT}>{locations.map((location) => <option key={location}>{location}</option>)}</select></div>
            <div><label className={LABEL}>To storage</label><select value={toStorage} onChange={(event) => setToStorage(event.target.value)} className={INPUT}>{locations.map((location) => <option key={location}>{location}</option>)}</select></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className={LABEL}>Date</label><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className={INPUT} required /></div>
            <div><label className={LABEL}>Employee</label><select value={employee} onChange={(event) => setEmployee(event.target.value)} className={INPUT}>{state.employees.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></div>
          </div>
          <div><label className={LABEL}>Name / Comment</label><input value={name || comment} onChange={(event) => { setName(event.target.value); setComment(event.target.value); }} className={INPUT} placeholder="Optional" /></div>

          <div className="space-y-2">
            <div className="flex items-center justify-between"><label className={LABEL}>Items to transfer</label><button type="button" onClick={() => {
              const item = state.stockItems[0];
              if (item) setLines((current) => [...current, { stockId: item.id, title: item.title, quantity: 1, unit: item.unit, cost: item.cost }]);
            }} className="text-[11px] font-bold text-[#1A73E8] dark:text-[#7EB3F5]">+ Add item</button></div>
            {lines.map((line, index) => (
              <div key={`${index}-${line.stockId}`} className="grid grid-cols-[minmax(0,1fr)_140px_24px] gap-2">
                <select value={line.stockId} onChange={(event) => {
                  const item = state.stockItems.find((entry) => entry.id === event.target.value);
                  if (item) updateLine(index, { stockId: item.id, title: item.title, unit: item.unit, cost: item.cost });
                }} className={INPUT}>{state.stockItems.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
                <input type="number" step="0.001" min="0.001" required aria-label="Transfer quantity" value={line.quantity} onChange={(event) => updateLine(index, { quantity: Number(event.target.value) || 0 })} className={`${INPUT} font-mono`} />
                <button type="button" aria-label="Remove transfer item" disabled={lines.length === 1} onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))} className="text-slate-400 hover:text-rose-500 disabled:opacity-30">×</button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-[#33373E]"><span className="font-semibold">Sum</span><span className="font-mono font-bold">{formatMoney(sum, state.settings.currencySymbol)}</span></div>
          <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={actions.closeModal} className={CANCEL}>Cancel</button><button type="submit" className={SUBMIT}>Save Transfer</button></div>
        </form>
      </Card>
    </Overlay>
  );
}

export function AddStockDeductionModal() {
  const { state, actions } = usePosStore();
  const locations = state.storageLocations?.length ? state.storageLocations : ["Storage 1"];
  const [storage, setStorage] = useState(locations[0] ?? "Storage 1");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [employee, setEmployee] = useState("Philip Venje Beronio");
  const [reason, setReason] = useState(state.wasteReasons[0]?.name ?? "");
  const firstItem = state.stockItems[0];
  const [lines, setLines] = useState<StockDeductionLine[]>([
    { stockId: firstItem?.id ?? "", title: firstItem?.title ?? "", quantity: 1, unit: firstItem?.unit ?? "pcs", cost: firstItem?.cost ?? 0 },
  ]);
  const sum = lines.reduce((total, line) => {
    const item = state.stockItems.find((entry) => entry.id === line.stockId);
    return total + line.quantity * (item?.cost ?? line.cost);
  }, 0);
  const updateLine = (index: number, patch: Partial<StockDeductionLine>) => {
    setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line));
  };

  return (
    <Overlay onClose={actions.closeModal}>
      <Card className="max-w-2xl">
        <Header title="New Stock Deduction" onClose={actions.closeModal} />
        <form onSubmit={(event) => {
          event.preventDefault();
          actions.createStockDeductionRecord({ date, storage, employee, reason, lines });
          actions.closeModal();
        }} className="space-y-4 p-5 text-xs">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className={LABEL}>Storage</label><select value={storage} onChange={(event) => setStorage(event.target.value)} className={INPUT}>{locations.map((location) => <option key={location}>{location}</option>)}</select></div>
            <div><label className={LABEL}>Date</label><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className={INPUT} required /></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className={LABEL}>Employee</label><select value={employee} onChange={(event) => setEmployee(event.target.value)} className={INPUT}>{state.employees.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></div>
            <div><label className={LABEL}>Reason</label><select value={reason} onChange={(event) => setReason(event.target.value)} className={INPUT} required>{state.wasteReasons.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between"><label className={LABEL}>Products / ingredients</label><button type="button" onClick={() => {
              const item = state.stockItems[0];
              if (item) setLines((current) => [...current, { stockId: item.id, title: item.title, quantity: 1, unit: item.unit, cost: item.cost }]);
            }} className="text-[11px] font-bold text-[#1A73E8] dark:text-[#7EB3F5]">+ Add item</button></div>
            {lines.map((line, index) => (
              <div key={`${index}-${line.stockId}`} className="grid grid-cols-[minmax(0,1fr)_140px_24px] gap-2">
                <select value={line.stockId} onChange={(event) => {
                  const item = state.stockItems.find((entry) => entry.id === event.target.value);
                  if (item) updateLine(index, { stockId: item.id, title: item.title, unit: item.unit, cost: item.cost });
                }} className={INPUT}>{state.stockItems.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
                <input type="number" step="0.001" min="0.001" required aria-label="Deduction quantity" value={line.quantity} onChange={(event) => updateLine(index, { quantity: Number(event.target.value) || 0 })} className={`${INPUT} font-mono`} />
                <button type="button" aria-label="Remove deduction item" disabled={lines.length === 1} onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))} className="text-slate-400 hover:text-rose-500 disabled:opacity-30">×</button>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-[#33373E]"><span className="font-semibold">Sum</span><span className="font-mono font-bold">{formatMoney(sum, state.settings.currencySymbol)}</span></div>
          <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={actions.closeModal} className={CANCEL}>Cancel</button><button type="submit" className={SUBMIT}>Save Deduction</button></div>
        </form>
      </Card>
    </Overlay>
  );
}

export function AddWasteReasonModal() {
  const { actions } = usePosStore();
  const [name, setName] = useState("");
  return (
    <Overlay onClose={actions.closeModal}>
      <Card>
        <Header title="Add Waste Reason" onClose={actions.closeModal} />
        <form onSubmit={(event) => { event.preventDefault(); actions.addWasteReason(name); actions.closeModal(); }} className="space-y-4 p-5 text-xs">
          <div><label className={LABEL}>Name</label><input autoFocus value={name} onChange={(event) => setName(event.target.value)} className={INPUT} required /></div>
          <div className="flex justify-end gap-2"><button type="button" onClick={actions.closeModal} className={CANCEL}>Cancel</button><button type="submit" className={SUBMIT}>Save Reason</button></div>
        </form>
      </Card>
    </Overlay>
  );
}

type SupplyDraftLine = SupplyLineItem & {
  orderingUnitId: string;
  packCount: number;
};

export function AddSupplyModal() {
  const { state, actions } = usePosStore();
  const [supplier, setSupplier] = useState("Supplier");
  const locations = state.storageLocations?.length ? state.storageLocations : ["Storage 1"];
  const [storage, setStorage] = useState(locations[0] ?? "Storage 1");
  const [accountId, setAccountId] = useState(state.accounts[0]?.id ?? "");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"Paid" | "Unpaid">("Paid");
  const [lines, setLines] = useState<SupplyDraftLine[]>([
    {
      stockId: state.stockItems[0]?.id ?? "",
      title: state.stockItems[0]?.title ?? "",
      quantity: 1,
      unit: state.stockItems[0]?.unit ?? "pcs",
      cost: state.stockItems[0]?.cost ?? 0,
      orderingUnitId: "",
      packCount: 1,
    },
  ]);
  const baseQuantity = (line: SupplyDraftLine) => {
    const orderingUnit = state.orderingUnits.find((entry) => entry.id === line.orderingUnitId);
    return orderingUnit ? line.packCount * orderingUnit.quantity : line.quantity;
  };
  const total = lines.reduce((sum, line) => sum + baseQuantity(line) * line.cost, 0);

  const updateLine = (index: number, patch: Partial<SupplyDraftLine>) => {
    setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line));
  };

  return (
    <Overlay onClose={actions.closeModal}>
      <Card className="max-w-2xl">
        <Header title="Add Supply" onClose={actions.closeModal} />
        <form
          onSubmit={(event) => {
            event.preventDefault();
            actions.createSupplyDelivery({
              supplier,
              storage,
              accountId,
              comment,
              status,
              lines: lines.map((line) => ({
                stockId: line.stockId,
                title: line.title,
                quantity: baseQuantity(line),
                unit: line.unit,
                cost: line.cost,
              })),
            });
            actions.closeModal();
          }}
          className="space-y-3.5 p-5 text-xs"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={LABEL}>Supplier</label>
              <select value={supplier} onChange={(event) => setSupplier(event.target.value)} className={INPUT}>
                {state.suppliers.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>Storage location</label>
              <select value={storage} onChange={(event) => setStorage(event.target.value)} className={INPUT}>{locations.map((location) => <option key={location}>{location}</option>)}</select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={LABEL}>Account</label>
              <select value={accountId} onChange={(event) => setAccountId(event.target.value)} className={INPUT}>
                {state.accounts.map((item) => (
                  <option key={item.id} value={item.id}>{accountDisplayName(item, state.settings.companyName)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Status</label>
              <select value={status} onChange={(event) => setStatus(event.target.value as "Paid" | "Unpaid")} className={INPUT}>
                <option>Paid</option>
                <option>Unpaid</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between"><label className={LABEL}>Product / ingredient line items</label><button type="button" onClick={() => {
              const item = state.stockItems[0];
              if (item) setLines((current) => [...current, { stockId: item.id, title: item.title, quantity: 1, unit: item.unit, cost: item.cost, orderingUnitId: "", packCount: 1 }]);
            }} className="text-[11px] font-bold text-[#1A73E8] dark:text-[#7EB3F5]">+ Add line</button></div>
            {lines.map((line, index) => (
              <div key={`${index}-${line.stockId}`} className="grid grid-cols-[minmax(0,1fr)_minmax(110px,0.7fr)_75px_95px_24px] gap-2">
                <select
                  value={line.stockId}
                  onChange={(event) => {
                    const item = state.stockItems.find((entry) => entry.id === event.target.value);
                    if (item) updateLine(index, { stockId: item.id, title: item.title, unit: item.unit, cost: item.cost, orderingUnitId: "", quantity: 1, packCount: 1 });
                  }}
                  className={INPUT}
                >
                  {state.stockItems.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
                <select value={line.orderingUnitId} onChange={(event) => updateLine(index, { orderingUnitId: event.target.value, packCount: 1, quantity: 1 })} className={INPUT}>
                  <option value="">Base unit ({line.unit})</option>
                  {state.orderingUnits.filter((entry) => entry.unit === line.unit).map((entry) => <option key={entry.id} value={entry.id}>{entry.title} ({formatQty(entry.quantity, entry.unit)})</option>)}
                </select>
                <input type="number" step={line.orderingUnitId ? "1" : "0.001"} min={line.orderingUnitId ? "1" : "0.001"} required aria-label={line.orderingUnitId ? "Pack quantity" : "Quantity"} value={line.orderingUnitId ? line.packCount : line.quantity} onChange={(event) => updateLine(index, line.orderingUnitId ? { packCount: Number(event.target.value) || 0 } : { quantity: Number(event.target.value) || 0 })} className={`${INPUT} font-mono`} />
                <input type="number" step="0.01" min="0" required aria-label="Unit cost" value={line.cost} onChange={(event) => updateLine(index, { cost: Number(event.target.value) || 0 })} className={`${INPUT} font-mono`} />
                <button type="button" aria-label="Remove line" disabled={lines.length === 1} onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))} className="text-slate-400 hover:text-rose-500 disabled:opacity-30">×</button>
                {line.orderingUnitId && <p className="col-span-full -mt-1 text-[10px] text-slate-500 dark:text-slate-400">{line.packCount} pack(s) = {formatQty(baseQuantity(line), line.unit)} · cost is entered per base unit</p>}
              </div>
            ))}
          </div>
          <div>
            <label className={LABEL}>Comment</label>
            <textarea value={comment} onChange={(event) => setComment(event.target.value)} className={`${INPUT} min-h-16 resize-y`} />
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-[#33373E]">
            <span className="font-semibold">Total</span>
            <span className="font-mono font-bold">{formatMoney(total, state.settings.currencySymbol)}</span>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={actions.closeModal} className={CANCEL}>Cancel</button>
            <button type="submit" className={SUBMIT}>Save Supply &amp; Update Stock</button>
          </div>
        </form>
      </Card>
    </Overlay>
  );
}

export function AddTransactionModal() {
  const { state, actions } = usePosStore();
  const [type, setType] = useState<"expense" | "income">("expense");
  const [category, setCategory] = useState("Supplies");
  const [sum, setSum] = useState("");
  const [accountId, setAccountId] = useState(
    state.accounts.find((entry) => entry.isCashDrawer)?.id ?? state.accounts[0]?.id ?? "",
  );
  const [comment, setComment] = useState("");

  return (
    <Overlay onClose={actions.closeModal}>
      <Card>
        <Header title="New Financial Transaction" onClose={actions.closeModal} />
        <form
          onSubmit={(event) => {
            event.preventDefault();
            actions.createFinanceTx({ type, category, comment: comment.trim(), sum: Number(sum) || 0, accountId });
            actions.closeModal();
          }}
          className="space-y-3.5 p-5 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Type</label>
              <select value={type} onChange={(event) => setType(event.target.value as "expense" | "income")} className={INPUT}>
                <option value="expense">Expense (-)</option>
                <option value="income">Income (+)</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Category</label>
              <select value={category} onChange={(event) => setCategory(event.target.value)} className={INPUT}>
                {state.financeCategories.map((entry) => (
                  <option key={entry.id} value={entry.name}>{entry.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Sum *</label>
              <input type="number" step="0.01" min="0.01" required value={sum} onChange={(event) => setSum(event.target.value)} placeholder="500.00" className={`${INPUT} font-mono`} />
            </div>
            <div>
              <label className={LABEL}>Account</label>
              <select value={accountId} onChange={(event) => setAccountId(event.target.value)} className={INPUT}>
                {state.accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {accountDisplayName(account, state.settings.companyName)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={LABEL}>Comment</label>
            <input type="text" required value={comment} onChange={(event) => setComment(event.target.value)} placeholder="e.g. Rent for November" className={INPUT} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={actions.closeModal} className={CANCEL}>Cancel</button>
            <button type="submit" className={SUBMIT}>Save</button>
          </div>
        </form>
      </Card>
    </Overlay>
  );
}

export function AddAccountModal() {
  const { actions } = usePosStore();
  const [name, setName] = useState("");
  const [type, setType] = useState<"Bank account" | "Cash" | "e-Wallet">("Bank account");
  const [balance, setBalance] = useState("0.00");

  return (
    <Overlay onClose={actions.closeModal}>
      <Card>
        <Header title="Add Account" onClose={actions.closeModal} />
        <form
          onSubmit={(event) => {
            event.preventDefault();
            actions.createAccount(name.trim(), type, Number(balance) || 0);
            actions.closeModal();
          }}
          className="space-y-3.5 p-5 text-xs"
        >
          <div>
            <label className={LABEL}>Account Name *</label>
            <input type="text" required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. GCash Business Wallet" className={INPUT} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Type</label>
              <select value={type} onChange={(event) => setType(event.target.value as typeof type)} className={INPUT}>
                <option value="Bank account">Bank account</option>
                <option value="Cash">Cash</option>
                <option value="e-Wallet">e-Wallet</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Opening Balance (₱)</label>
              <input type="number" step="0.01" required value={balance} onChange={(event) => setBalance(event.target.value)} className={`${INPUT} font-mono`} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={actions.closeModal} className={CANCEL}>Cancel</button>
            <button type="submit" className={SUBMIT}>Save</button>
          </div>
        </form>
      </Card>
    </Overlay>
  );
}

export function AddFinanceCategoryModal() {
  const { actions } = usePosStore();
  const [name, setName] = useState("");
  const [allowed, setAllowed] = useState<"All transactions" | "Expenses only" | "Income only">("Expenses only");
  const [displayOnPos, setDisplayOnPos] = useState(true);
  const [includeInPnl, setIncludeInPnl] = useState(true);

  return (
    <Overlay onClose={actions.closeModal}>
      <Card>
        <Header title="Add Finance Category" onClose={actions.closeModal} />
        <form
          onSubmit={(event) => {
            event.preventDefault();
            actions.createFinanceCategory(name.trim(), allowed, displayOnPos, includeInPnl);
            actions.closeModal();
          }}
          className="space-y-3.5 p-5 text-xs"
        >
          <div>
            <label className={LABEL}>Category Name *</label>
            <input type="text" required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Delivery Packaging" className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Allowed transactions</label>
            <select value={allowed} onChange={(event) => setAllowed(event.target.value as typeof allowed)} className={INPUT}>
              <option value="Expenses only">Expenses only</option>
              <option value="Income only">Income only</option>
              <option value="All transactions">All transactions</option>
            </select>
          </div>
          <div className="flex items-center gap-6 pt-1">
            <label className="flex cursor-pointer items-center gap-2 font-medium">
              <input type="checkbox" checked={displayOnPos} onChange={(event) => setDisplayOnPos(event.target.checked)} />
              <span>Display on the POS</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 font-medium">
              <input type="checkbox" checked={includeInPnl} onChange={(event) => setIncludeInPnl(event.target.checked)} />
              <span>Include in P&amp;L</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={actions.closeModal} className={CANCEL}>Cancel</button>
            <button type="submit" className={SUBMIT}>Save</button>
          </div>
        </form>
      </Card>
    </Overlay>
  );
}

export function PostieAiModal() {
  const { actions } = usePosStore();

  return (
    <Overlay onClose={actions.closeModal}>
      <Card className="max-w-lg rounded-2xl">
        <div className="flex items-center justify-between bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-4 text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <h3 className="text-sm font-bold">Postie AI Assistant — Invoice &amp; Bank Statement Parser</h3>
          </div>
          <button type="button" onClick={actions.closeModal} aria-label="Close Postie AI" className="cursor-pointer text-white/80 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 p-5 text-xs">
          <p className="leading-relaxed text-slate-600 dark:text-slate-300">
            Postie AI reads supplier invoice photos and bank statements to automatically create supply entries in{" "}
            <strong>Inventory -&gt; Stock</strong> and expense rows in <strong>Finances -&gt; Transactions</strong>.
          </p>
          <div className="space-y-2 rounded-xl border border-violet-200 bg-violet-50 p-3.5 dark:border-violet-800 dark:bg-violet-950/40">
            <div className="font-bold text-violet-900 dark:text-violet-200">Detected Supplier Invoice #INV-2026-11</div>
            <div className="space-y-1 font-mono text-[11px] text-violet-800 dark:text-violet-300">
              <div>• Coffee: +2.000 kg @ ₱30.00 = ₱60.00</div>
              <div>• Milk: +6.000 l @ ₱2.00 = ₱12.00</div>
              <div>• Paper cup 250ml: +100.00 pcs @ ₱0.20 = ₱20.00</div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={actions.closeModal} className={CANCEL}>Close</button>
            <button
              type="button"
              onClick={actions.runPostieAiImport}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 font-bold text-white hover:bg-violet-700"
            >
              <Wand2 className="h-3.5 w-3.5" />
              <span>Auto-Import Supply &amp; Expense</span>
            </button>
          </div>
        </div>
      </Card>
    </Overlay>
  );
}

export function AddEntityModal({ kind }: { kind: "customer" | "employee" }) {
  const { state, actions } = usePosStore();
  const customerGroups = state.customerGroups.filter((entry) => !entry.deleted);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileNum, setProfileNum] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [comment, setComment] = useState("");
  const [group, setGroup] = useState(customerGroups[0]?.title ?? "New customers");
  const [discount, setDiscount] = useState("10");
  const [position, setPosition] = useState("Cashier");
  const [pin, setPin] = useState("1111");

  return (
    <Overlay onClose={actions.closeModal}>
      <Card>
        <Header title={kind === "customer" ? "Add Customer" : "Add Employee"} onClose={actions.closeModal} />
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (kind === "customer") {
              actions.createCustomer({
                name: name.trim(),
                profileNum: profileNum.trim() || undefined,
                phone: phone.trim(),
                email: email.trim(),
                birthday,
                comment: comment.trim(),
                group,
                discountPct: Number(discount) || 0,
              });
            } else {
              actions.createEmployee({ name: name.trim(), phone: phone.trim(), position, pin });
            }
            actions.closeModal();
          }}
          className="space-y-3.5 p-5 text-xs"
        >
          <div>
            <label className={LABEL}>Full Name *</label>
            <input type="text" required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Maria Clara Santos" className={INPUT} />
          </div>
          {kind === "customer" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Profile number</label>
                <input type="text" value={profileNum} onChange={(event) => setProfileNum(event.target.value)} placeholder="Auto-generated" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Email</label>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={INPUT} />
              </div>
            </div>
          )}
          <div>
            <label className={LABEL}>Phone Number</label>
            <input type="text" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="00639175550192" className={INPUT} />
          </div>
          {kind === "customer" ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Group</label>
                  <select value={group} onChange={(event) => setGroup(event.target.value)} className={INPUT}>
                    {customerGroups.map((entry) => <option key={entry.id} value={entry.title}>{entry.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Discount / Bonus %</label>
                  <input type="number" min="0" max="100" value={discount} onChange={(event) => setDiscount(event.target.value)} className={`${INPUT} font-mono`} />
                </div>
              </div>
              <div>
                <label className={LABEL}>Birthday</label>
                <input type="date" value={birthday} onChange={(event) => setBirthday(event.target.value)} className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Comment</label>
                <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={2} className={INPUT} />
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Position</label>
                <select value={position} onChange={(event) => setPosition(event.target.value)} className={INPUT}>
                  <option value="Cashier">Cashier</option>
                  <option value="Waiter">Waiter</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>
              <div>
                <label className={LABEL}>4-Digit PIN</label>
                <input type="text" maxLength={4} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))} className={`${INPUT} font-mono`} />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={actions.closeModal} className={CANCEL}>Cancel</button>
            <button type="submit" className={SUBMIT}>Save</button>
          </div>
        </form>
      </Card>
    </Overlay>
  );
}

export function QrMenuModal() {
  const { state, actions } = usePosStore();
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");

  return (
    <Overlay onClose={actions.closeModal}>
      <Card className="max-w-xs rounded-3xl border-4 border-slate-900">
        <div className="flex items-center justify-between bg-amber-500 px-4 py-3 text-white">
          <div className="text-sm font-extrabold">{state.settings.companyName} — Poster QR Menu</div>
          <button type="button" onClick={actions.closeModal} aria-label="Close QR menu" className="cursor-pointer text-white/90 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-96 space-y-2.5 overflow-y-auto p-4 text-xs">
          {state.menuItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-[#33373E]">
              <div>
                <div className="font-bold">{item.emoji} {item.title}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.category}</div>
              </div>
              <span className="font-mono font-extrabold text-[#1DB954]">{formatMoney(item.price, state.settings.currencySymbol)}</span>
            </div>
          ))}
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!comment.trim()) return;
            actions.submitGuestFeedback(stars, comment.trim());
            setComment("");
          }}
          className="space-y-2 border-t border-slate-200 bg-slate-50 p-3 text-xs dark:border-[#33373E] dark:bg-[#24272C]"
        >
          <div className="font-bold text-slate-700 dark:text-slate-300">Leave Poster QR Feedback:</div>
          <div className="flex items-center gap-2">
            <select
              value={stars}
              onChange={(event) => setStars(Number(event.target.value))}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 font-bold text-slate-800 dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white"
            >
              <option value={5}>★★★★★ (5)</option>
              <option value={4}>★★★★☆ (4)</option>
              <option value={3}>★★★☆☆ (3)</option>
            </select>
            <input
              type="text"
              required
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Great coffee & croissant!"
              className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-1 dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white"
            />
          </div>
          <button type="submit" className="w-full cursor-pointer rounded-lg bg-[#1A73E8] py-1.5 font-bold text-white">
            Send Rating to Reports
          </button>
        </form>
      </Card>
    </Overlay>
  );
}

export function PinLockModal() {
  const { state, actions } = usePosStore();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  function press(digit: string) {
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    setError(false);
    if (next.length === 4) {
      const ok = actions.unlockPosWithPin(next);
      if (ok) {
        actions.closeModal();
        setPin("");
      } else {
        window.setTimeout(() => {
          setError(true);
          setPin("");
        }, 150);
      }
    }
  }

  return (
    <Overlay onClose={actions.closeModal}>
      <Card className="max-w-xs rounded-2xl">
        <div className="space-y-4 p-5 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A73E8] text-white">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold">Switch Staff / PIN Lock</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Enter the 4-digit PIN or tap a staff profile</p>
          </div>

          <div className="flex justify-center gap-2">
            {[0, 1, 2, 3].map((index) => (
              <span
                key={index}
                className={`flex h-3 w-3 rounded-full ${pin.length > index ? "bg-[#1A73E8]" : "bg-slate-300 dark:bg-slate-600"} ${
                  error ? "bg-rose-500" : ""
                }`}
              />
            ))}
          </div>
          {error && <p className="text-[11px] font-semibold text-rose-500">Incorrect PIN — try 0000.</p>}

          <div className="mx-auto grid max-w-[190px] grid-cols-3 gap-1.5">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => press(digit)}
                className="rounded-lg bg-slate-100 py-2 font-mono text-sm font-bold text-slate-800 hover:bg-slate-200 dark:bg-[#24272C] dark:text-slate-100 dark:hover:bg-[#33373E]"
              >
                {digit}
              </button>
            ))}
            <button type="button" onClick={() => setPin("")} className="rounded-lg bg-slate-100 py-2 text-[11px] font-bold text-slate-500 dark:bg-[#24272C] dark:text-slate-300">
              Clear
            </button>
            <button type="button" onClick={() => press("0")} className="rounded-lg bg-slate-100 py-2 font-mono text-sm font-bold text-slate-800 hover:bg-slate-200 dark:bg-[#24272C] dark:text-slate-100">
              0
            </button>
            <button type="button" onClick={() => setPin((value) => value.slice(0, -1))} className="rounded-lg bg-slate-100 py-2 text-[11px] font-bold text-slate-500 dark:bg-[#24272C] dark:text-slate-300">
              ⌫
            </button>
          </div>

          <div className="space-y-2 text-left">
            {state.employees.map((employee) => (
              <button
                key={employee.id}
                type="button"
                onClick={() => {
                  actions.setActiveEmployee(employee.id);
                  actions.unlockPosWithPin(employee.pin);
                  actions.closeModal();
                }}
                className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-xs ${
                  employee.id === state.currentStaffId
                    ? "border-[#1A73E8] bg-[#E8EFF7] dark:bg-[#2C3441]"
                    : "border-slate-200 hover:bg-slate-50 dark:border-[#33373E] dark:hover:bg-white/5"
                }`}
              >
                <div>
                  <div className="font-bold">{employee.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{employee.position}</div>
                </div>
                <span className="font-mono font-bold text-[#1A73E8] dark:text-[#7EB3F5]">PIN: {employee.pin}</span>
              </button>
            ))}
          </div>

          <button type="button" onClick={actions.closeModal} className="w-full rounded-lg bg-slate-100 py-2 text-xs font-semibold text-slate-600 dark:bg-[#24272C] dark:text-slate-300">
            Close
          </button>
        </div>
      </Card>
    </Overlay>
  );
}

export function ThermalReceiptModal() {
  const { state, actions } = usePosStore();
  const receipt = state.receiptPreview;
  const symbol = state.settings.currencySymbol;
  const money = useMemo(() => (value: number) => formatMoney(value, symbol), [symbol]);
  const [prediction] = useState(() => {
    const predictions = state.receiptSettings?.predictions?.filter((entry) => entry.trim()) ?? [];
    return predictions.length ? predictions[Math.floor(Math.random() * predictions.length)] : "";
  });

  if (!receipt) return null;

  const receiptSettings = state.receiptSettings;
  const headerName = receiptSettings?.printOnReceipt === "Business name"
    ? (state.locations[0]?.name ?? state.settings.companyName)
    : state.settings.companyName;
  const activePredictions = receiptSettings?.printPredictions ? prediction : "";

  return (
    <Overlay onClose={() => actions.setReceiptPreview(null)}>
      <div className="w-full max-w-sm space-y-4">
        <div id="printable-receipt-area" className="thermal-receipt space-y-3 p-6 font-mono text-xs">
          <div className="space-y-1 border-b border-dashed border-slate-300 pb-3 text-center">
            {state.settings.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={state.settings.logo} alt="" className="mx-auto mb-1 h-10 w-auto max-w-[160px] object-contain" />
            )}
            <div className="text-sm font-extrabold uppercase">{headerName}</div>
            {receiptSettings?.printAddress !== false && (
              <div className="text-[11px] text-slate-500">{state.settings.address}</div>
            )}
            <div className="text-[11px] text-slate-500">
              {receiptSettings?.printReceiptNumber !== false && `Receipt #${receipt.receiptNum} • `}{receipt.closedAt}
            </div>
            <div className="text-[11px] text-slate-500">Waiter: {receipt.staffName}</div>
            <div className="text-[11px] text-slate-500">{receipt.tableName} • {receipt.paymentMethod}</div>
            {receiptSettings?.printCustomerContact && receipt.customerName && (
              <div className="text-[11px] text-slate-500">
                {receipt.customerName}
                {receipt.customerPhone ? ` • ${receipt.customerPhone}` : ""}
                {receipt.customerAddress ? ` • ${receipt.customerAddress}` : ""}
              </div>
            )}
            {receiptSettings?.printComments && receipt.comment && (
              <div className="text-[11px] italic text-slate-500">Comment: {receipt.comment}</div>
            )}
          </div>
          <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
            {receipt.items.map((item, index) => (
              <div key={`${item.menuId}-${index}`} className="flex justify-between">
                <span>{item.qty}x {item.name}</span>
                <span className="font-bold">{money(item.qty * item.unitPrice)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{money(receipt.subtotal)}</span></div>
            {receipt.discountAmt > 0 && (
              <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-{money(receipt.discountAmt)}</span></div>
            )}
            {(receipt.serviceCharge ?? 0) > 0 && (
              <div className="flex justify-between text-slate-500"><span>Service charge</span><span>{money(receipt.serviceCharge ?? 0)}</span></div>
            )}
            {(receipt.deliveryFee ?? 0) > 0 && (
              <div className="flex justify-between text-slate-500"><span>Delivery{receipt.deliveryArea ? ` · ${receipt.deliveryArea}` : ""}</span><span>{money(receipt.deliveryFee ?? 0)}</span></div>
            )}
            <div className="flex justify-between text-slate-500"><span>VAT (12%)</span><span>{money(receipt.tax)}</span></div>
            <div className="flex justify-between pt-1 text-sm font-extrabold"><span>TOTAL</span><span>{money(receipt.total)}</span></div>
            <div className="flex justify-between text-slate-500"><span>Payment</span><span>{receipt.paymentMethod}</span></div>
            {receipt.paymentMethod === "Cash" && receipt.tendered !== undefined && (
              <>
                <div className="flex justify-between text-slate-500"><span>Tendered</span><span>{money(receipt.tendered)}</span></div>
                <div className="flex justify-between text-slate-500"><span>Change</span><span>{money(receipt.change ?? 0)}</span></div>
              </>
            )}
          </div>
          {receiptSettings?.printWifi && receiptSettings.wifiName && (
            <div className="border-t border-dashed border-slate-300 pt-2 text-center text-[11px] text-slate-500">
              Wi-Fi: {receiptSettings.wifiName}{receiptSettings.wifiPassword ? ` / ${receiptSettings.wifiPassword}` : ""}
            </div>
          )}
          {activePredictions && (
            <div className="border-t border-dashed border-slate-300 pt-2 text-center text-[11px] italic text-slate-500">{activePredictions}</div>
          )}
          <div className="pt-2 text-center text-[10px] text-slate-400">Powered by Poster POS</div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-white py-2.5 text-xs font-bold text-slate-900 shadow-lg"
          >
            <Printer className="h-4 w-4" />
            Print Receipt
          </button>
          <button
            type="button"
            onClick={() => actions.setReceiptPreview(null)}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#1A73E8] py-2.5 text-xs font-bold text-white shadow-lg"
          >
            <Check className="h-4 w-4" />
            Done
          </button>
        </div>
      </div>
    </Overlay>
  );
}

/** Renders whichever console modal is currently active. */
export function ConsoleModals() {
  const { state } = usePosStore();

  return (
    <>
      {state.activeModal === "subscription" && <SubscriptionModal />}
      {state.activeModal === "add-item" && <AddMenuItemModal />}
      {state.activeModal === "add-supply" && <AddSupplyModal />}
      {state.activeModal === "add-butchery" && <AddButcheryModal />}
      {state.activeModal === "add-transfer" && <AddTransferModal />}
      {state.activeModal === "add-stock-deduction" && <AddStockDeductionModal />}
      {state.activeModal === "add-waste-reason" && <AddWasteReasonModal />}
      {state.activeModal === "add-inventory-check" && <AddInventoryCheckModal />}
      {state.activeModal === "add-tx" && <AddTransactionModal />}
      {state.activeModal === "add-account" && <AddAccountModal />}
      {state.activeModal === "add-finance-category" && <AddFinanceCategoryModal />}
      {state.activeModal === "add-customer" && <AddEntityModal kind="customer" />}
      {state.activeModal === "add-employee" && <AddEntityModal kind="employee" />}
      {state.activeModal === "postie-ai" && <PostieAiModal />}
      {state.activeModal === "qr-menu" && <QrMenuModal />}
      {state.activeModal === "pin-lock" && <PinLockModal />}
      <ThermalReceiptModal />
    </>
  );
}
