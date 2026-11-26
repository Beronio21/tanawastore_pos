"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Banknote, Bike, ClipboardList, CreditCard, Gift, History, Lock, Monitor, MoreHorizontal, PackagePlus, Printer, ScanLine, Search, Sparkles, Utensils, User, Wallet, X } from "lucide-react";
import { usePosStore } from "@/lib/pos-store";
import { CustomerPanel } from "@/components/pos/CustomerPanel";
import { OrderHistoryDrawer } from "@/components/pos/OrderHistoryDrawer";
import { PinLockScreen } from "@/components/pos/PinLockScreen";
import { PromotionsModal } from "@/components/pos/PromotionsModal";
import { calcOrderTotals, FLOOR_TABLES, floorTableName, getActivePromotions, getExcludedMenuItemIds, posPricingRules, type AdminPasswordRule, type ConsoleState, type PaymentMethod, type PaymentMethodConfig, type Promotion } from "@/lib/console-data";
import { formatMoney, formatQty, formatTimestamp } from "@/lib/format";
import { hasPermission } from "@/lib/rbac";
import { maxCashBack as maxCashBackAmount } from "@/lib/business-math";
import { ThermalReceiptModal } from "@/components/console/Modals";

type Mode = "register" | "floor" | "kitchen";

function posPayMethodFor(config: PaymentMethodConfig): PaymentMethod {
  if (config.title === "Cash") return "Cash";
  if (config.title === "e-Wallet") return "e-Wallet";
  return "Card";
}

function MethodGlyph({ method }: { method: PaymentMethodConfig }) {
  const className = "mr-1 inline h-3.5 w-3.5";
  switch (method.icon) {
    case "cash": return <Banknote className={className} />;
    case "card": return <CreditCard className={className} />;
    case "gift": return <Gift className={className} />;
    case "wallet": return <Wallet className={className} />;
    default: return <Bike className={className} />;
  }
}

function methodButtonClass(method: PaymentMethodConfig): string {
  if (method.paymentType === "Cash") return "bg-[#1DB954]";
  if (method.paymentType === "Cashless") return "bg-[#1A73E8]";
  return "bg-violet-600";
}

export default function PosPage() {
  const { state, actions } = usePosStore();
  const [mode, setMode] = useState<Mode>("register");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [kdsStation, setKdsStation] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [posDrawer, setPosDrawer] = useState<"" | "inventory" | "supply">("");
  const [tendered, setTendered] = useState("");
  const [cashBackRedeem, setCashBackRedeem] = useState("0");
  const [adminPrompt, setAdminPrompt] = useState<{ reason: string; run: () => void } | null>(null);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [checkPrinted, setCheckPrinted] = useState(false);
  const [ticketPrinted, setTicketPrinted] = useState(false);
  const [panelView, setPanelView] = useState<"receipt" | "customer">("receipt");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [promotionsOpen, setPromotionsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [cartSelect, setCartSelect] = useState(false);
  const [selectedLines, setSelectedLines] = useState<string[]>([]);
  const [scanMode, setScanMode] = useState(false);
  const [scanFlash, setScanFlash] = useState("");
  const order = state.posOrders.find((entry) => entry.id === state.activePosOrderId) ?? state.posOrders[0];
  const activeRegister = state.registers[0];
  const selectedCustomer = state.customers.find((entry) => entry.id === order.customerId);
  const selectedCustomerGroup = state.customerGroups.find((entry) => !entry.deleted && entry.title === selectedCustomer?.group);
  const activePromotions = getActivePromotions(state.promotions);
  const appliedPromotion = order.promotionId === undefined
    ? activePromotions[0]
    : activePromotions.find((promotion) => promotion.id === order.promotionId);
  const excludedMenuItemIds = getExcludedMenuItemIds(
    state.menuItems,
    state.menuCategories,
    state.excludedCategoryIds,
    state.excludedProductIds,
  );
  const totals = calcOrderTotals(order, state.menuItems, state.settings.vatRate, excludedMenuItemIds, appliedPromotion, state.menuCategories, posPricingRules(state.settings));
  const qtyStep = state.settings.enablePartialServing !== false ? 0.5 : 1;
  const maxCashBack = selectedCustomer
    ? maxCashBackAmount(selectedCustomer.bonusBalance ?? 0, totals.cashBackEligibleTotal, state.loyaltySettings.maximumPct)
    : 0;
  const cashBackAmount = Math.min(Number(cashBackRedeem) || 0, maxCashBack);
  const setCashBackAmount = (value: string) => {
    const amount = Math.max(0, Math.min(maxCashBack, Number(value) || 0));
    setCashBackRedeem(amount ? amount.toFixed(2) : value === "" ? "" : "0");
    setTendered(Math.max(0, totals.total - amount).toFixed(2));
  };
  const money = (value: number) => formatMoney(value, state.settings.currencySymbol);
  const visibleItems = state.menuItems.filter((item) => (category === "All" || item.category === category) && item.title.toLowerCase().includes(search.toLowerCase()));
  const pending = state.kdsTickets.filter((ticket) => ticket.items.length).length;
  const inventoryIntegration = state.integrations?.find((entry) => entry.posFeature === "inventory-check");
  const supplyIntegration = state.integrations?.find((entry) => entry.posFeature === "supply");
  const inventoryEnabled = Boolean(inventoryIntegration?.active);
  const supplyEnabled = Boolean(supplyIntegration?.active);
  const activeSources = (state.orderSources ?? []).filter((source) => source.displayOnPos);
  const currentSource = order.source ?? activeSources[0]?.title ?? "Dine-in";
  const sourceOptions = activeSources.some((source) => source.title === currentSource)
    ? activeSources
    : [...activeSources, { id: "current-source", title: currentSource, displayOnPos: true, serviceFeePct: 0 }];
  const checkoutMethods = (state.paymentMethods ?? []).filter((method) => method.displayedOnPos);
  const floorPlanOn = state.settings.showFloorPlan;
  const deliverySettings = state.deliverySettings;
  const deliveryEnabled = Boolean(deliverySettings?.enabled);
  const deliveryAreas = deliverySettings?.areas ?? [];
  const deliveryArea = order.deliveryArea ? deliveryAreas.find((area) => area.name === order.deliveryArea) : undefined;
  const deliveryFee = deliveryArea?.cost ?? 0;
  const displayTotal = totals.total + deliveryFee;
  const security = state.securitySettings;
  const activeEmployee = state.employees.find((entry) => entry.id === state.currentStaffId) ?? state.employees[0];
  const activePosition = state.positions.find((entry) => entry.title === activeEmployee?.position) ?? null;
  const canApplyDiscounts = hasPermission(activePosition, "canApplyDiscounts");
  const canPrintCheck = security?.blockPrintBeforeClose !== true;
  const kitchenTicketsAllowed = security?.kitchenTicketsAnyRegister !== "Never";
  const adminRules = security?.adminRules;
  const adminRequiredFor = (rule: AdminPasswordRule | undefined): boolean => {
    if (!rule || rule === "Never") return false;
    if (rule === "Always") return true;
    if (rule === "After a check is printed") return checkPrinted;
    const cases = adminRules?.deleteItemCases;
    return Boolean((cases?.afterCheckPrinted && checkPrinted) || (cases?.afterTicketPrinted && ticketPrinted));
  };
  const guardAdmin = (rule: AdminPasswordRule | undefined, reason: string, run: () => void) => {
    if (adminRequiredFor(rule)) {
      setAdminPasswordInput("");
      setAdminPrompt({ reason, run });
    } else {
      run();
    }
  };
  const changeItemQty = (line: { uid: string; qty: number }, delta: number) => {
    if (delta < 0 && line.qty + delta <= 0) {
      guardAdmin(adminRules?.deleteItem, "deleting an item", () => actions.updateOrderItemQty(line.uid, delta));
    } else {
      actions.updateOrderItemQty(line.uid, delta);
    }
  };
  const printedReceiptRef = useRef("");

  // Paired tablets arrive locked on the staff PIN screen.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("lock") === "1") {
      actions.lockPosTerminal();
      window.history.replaceState({}, "", "/pos");
    }
  }, [actions]);

  // Flush offline receipt mutations on reconnect and every 15 seconds.
  useEffect(() => {
    if (typeof window === "undefined") return;
    void actions.flushOfflineQueue();
    const interval = window.setInterval(() => { void actions.flushOfflineQueue(); }, 15_000);
    const onOnline = () => { void actions.flushOfflineQueue(); };
    window.addEventListener("online", onOnline);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("online", onOnline);
    };
  }, [actions]);

  useEffect(() => {
    const receipt = state.receiptPreview;
    if (!receipt || state.receiptSettings?.autoPrint !== true) return;
    const key = `${receipt.receiptNum}|${receipt.closedAt}`;
    if (printedReceiptRef.current === key) return;
    printedReceiptRef.current = key;
    const timer = setTimeout(() => window.print(), 400);
    return () => clearTimeout(timer);
  }, [state.receiptPreview, state.receiptSettings?.autoPrint]);

  const flashScan = (message: string) => {
    setScanFlash(message);
    window.setTimeout(() => setScanFlash(""), 1600);
  };
  const tryScan = (value: string) => {
    const query = value.trim().toLowerCase();
    if (!query) return false;
    const item = state.menuItems.find((entry) => entry.sku?.toLowerCase() === query || entry.id.toLowerCase() === query);
    if (!item) {
      flashScan("No product matches that code");
      return true;
    }
    actions.addItemToOrder(item.id);
    flashScan(`Added ${item.title}`);
    setSearch("");
    return true;
  };

  const printCheck = () => {
    setCheckPrinted(true);
    if (security?.autoKitchenTickets === "When printing a check") {
      actions.sendOrderToKitchen(order.id);
      setTicketPrinted(true);
    }
    actions.showToast("Check sent to printer.", "success");
  };

  if (state.posLocked) {
    return <PinLockScreen />;
  }

  return <div className="min-h-screen bg-[#F3F5F7] text-[#1F2328] dark:bg-[#17191C] dark:text-white">
    <header className="flex h-14 items-center justify-between bg-[#1D2024] px-4 text-white"><div className="flex items-center gap-3"><Monitor className="h-5 w-5 text-sky-400" /><div><span className="font-bold">{activeRegister?.title ?? `${state.settings.companyName} POS`}</span><span className="ml-2 text-[10px] text-slate-400">{activeRegister?.login ?? state.settings.companyName}</span></div><SyncPill state={state} /></div><nav className="flex items-center gap-1">{(["register", "floor", "kitchen"] as Mode[]).filter((item) => item !== "floor" || state.settings.showFloorPlan).map((item) => <button key={item} type="button" onClick={() => setMode(item)} className={`rounded-md px-3 py-1.5 text-xs font-bold capitalize ${mode === item ? "bg-[#1A73E8]" : "hover:bg-white/10"}`}>{item === "kitchen" ? `Kitchen Kit${pending ? ` (${pending})` : ""}` : item === "floor" ? "Floor Plan" : "Register"}</button>)}</nav><div className="flex items-center gap-2 text-xs">{state.settings.cashRegisterShifts && <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300" title="Cash shift is open">Shift · {state.shiftOpenedAt}</span>}<span>{state.employees.find((entry) => entry.id === state.currentStaffId)?.name}</span><button type="button" onClick={() => setHistoryOpen(true)} className="rounded-md bg-white/10 px-2 py-1.5"><History className="inline h-3.5 w-3.5" /> Orders</button><button type="button" onClick={actions.lockPosTerminal} className="rounded-md bg-white/10 px-2 py-1.5"><Lock className="inline h-3.5 w-3.5" /> Lock</button><Link href="/manage/welcome" className="rounded-md bg-white/10 px-2 py-1.5"><ArrowLeft className="inline h-3.5 w-3.5" /> Console</Link></div></header>
    {mode === "register" && <div className="grid min-h-[calc(100vh-56px)] lg:grid-cols-[390px_1fr]"><aside className="flex min-h-0 flex-col border-r border-slate-200 bg-white p-4 dark:border-[#33373E] dark:bg-[#24272C]"><div className="mb-3 flex rounded-lg bg-slate-100 p-1 dark:bg-[#33373E]"><button type="button" onClick={() => setPanelView("receipt")} className={`flex-1 cursor-pointer rounded-md py-1.5 text-xs font-bold ${panelView === "receipt" ? "bg-white text-slate-900 shadow-sm dark:bg-[#24272C] dark:text-white" : "text-slate-500 dark:text-slate-400"}`}>Receipt</button><button type="button" onClick={() => setPanelView("customer")} className={`flex-1 cursor-pointer rounded-md py-1.5 text-xs font-bold ${panelView === "customer" ? "bg-white text-slate-900 shadow-sm dark:bg-[#24272C] dark:text-white" : "text-slate-500 dark:text-slate-400"}`}>Customer</button></div>{panelView === "customer" ? <CustomerPanel orderId={order.id} onApply={() => setPanelView("receipt")} /> : <><div className="flex items-center gap-2"><div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">{state.posOrders.map((entry) => <button key={entry.id} type="button" onClick={() => { actions.selectOrderTab(entry.id); setPanelView("receipt"); }} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold ${entry.id === order.id ? "bg-[#1A73E8] text-white" : "bg-slate-100 dark:bg-[#33373E]"}`}>{floorPlanOn ? `${floorTableName(entry.tableId)} #${entry.receiptNum}` : `Receipt #${entry.receiptNum}`}</button>)}</div><button type="button" onClick={() => actions.createOrderTab()} className="shrink-0 rounded-lg bg-[#1DB954] px-3 py-2 text-xs font-bold text-white">+ New</button></div>{floorPlanOn && <div className="mt-4 flex items-center justify-between text-xs"><span className="font-semibold">Table</span><select aria-label="Table" className="rounded border bg-transparent px-2 py-1" value={order.tableId} onChange={(event) => actions.assignTableToOrder(order.id, event.target.value)}><option value="TAKEAWAY">Takeaway</option>{FLOOR_TABLES.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}</select></div>}<div className="mt-2 flex items-center justify-between text-xs"><span className="font-semibold">Order source</span><select aria-label="Order source" className="rounded border bg-transparent px-2 py-1" value={currentSource} onChange={(event) => actions.setOrderSource(order.id, event.target.value)}>{sourceOptions.map((source) => <option key={source.id} value={source.title}>{source.title}</option>)}</select></div>{deliveryEnabled && <div className="mt-2 flex items-center justify-between text-xs"><span className="font-semibold">Delivery</span><select aria-label="Delivery area" className="rounded border bg-transparent px-2 py-1" value={order.deliveryArea ?? ""} onChange={(event) => actions.setOrderDelivery(order.id, event.target.value)}><option value="">None</option>{deliveryAreas.map((area) => <option key={area.id} value={area.name}>{area.name} · {money(area.cost)} · ~{area.serviceTimeMin} min</option>)}</select></div>}{deliveryArea && <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Delivery · {deliveryArea.name} · {money(deliveryFee)} · ETA ~{deliveryArea.serviceTimeMin} min</p>}<label className="mt-3 block text-xs"><span className="mb-1 block font-semibold">Customer</span><select aria-label="Customer" className="w-full rounded border bg-transparent px-2 py-2 dark:border-[#3E434C]" value={order.customerId} onChange={(event) => guardAdmin(adminRules?.addCustomer, "adding a customer from register", () => actions.attachCustomerToOrder(order.id, event.target.value))}><option value="">No customer</option>{state.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} · {customer.profileNum}</option>)}</select></label><button type="button" onClick={() => setPanelView("customer")} className="mt-1.5 inline-flex cursor-pointer items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-[#1A73E8] hover:bg-sky-500/5 dark:border-[#3E434C] dark:text-[#7EB3F5]"><User className="h-3 w-3" />{selectedCustomer ? "Customer card" : "+ New customer"}</button>{selectedCustomerGroup && <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{selectedCustomerGroup.loyaltyProgram === "Discount system" ? `${selectedCustomerGroup.rate}% group discount applied` : `Earns ${selectedCustomerGroup.rate}% bonus on eligible sales`}</p>}<div className="mt-5 flex items-center justify-between"><button type="button" onClick={() => { setCartSelect((value) => !value); setSelectedLines([]); setMoreOpen(false); }} className={`cursor-pointer rounded-full px-3 py-1 text-[11px] font-bold ${cartSelect ? "bg-[#1A73E8] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-[#33373E] dark:text-slate-300"}`}>{cartSelect ? "Done" : "Select"}</button><div className="relative"><button type="button" aria-label="Order actions" onClick={() => setMoreOpen((value) => !value)} className="cursor-pointer rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-[#33373E]"><MoreHorizontal className="h-4 w-4" /></button>{moreOpen && <div className="absolute right-0 top-8 z-20 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-xl dark:border-[#3E434C] dark:bg-[#2C3036]"><button type="button" onClick={() => { setNoteOpen((value) => !value); setMoreOpen(false); }} className="block w-full cursor-pointer px-3 py-2 text-left text-xs font-semibold hover:bg-slate-50 dark:hover:bg-white/[0.04]">Leave a comment</button><button type="button" onClick={() => { setMoreOpen(false); guardAdmin(adminRules?.deleteItem, "clearing the order", () => { if (order.items.length && window.confirm("Clear all items from this order?")) actions.clearOrderItems(); }); }} className="block w-full cursor-pointer px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10">Clear order</button></div>}</div></div>{noteOpen && <input value={order.note} onChange={(event) => actions.setOrderNote(event.target.value)} placeholder="Order comment — printed on the receipt" className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs dark:border-[#3E434C] dark:bg-[#1D2024]" />}{cartSelect && selectedLines.length > 0 && <div className="mt-2 flex items-center gap-2 rounded-lg bg-sky-50 p-2 text-[11px] dark:bg-sky-500/10"><span className="font-semibold text-sky-700 dark:text-sky-300">{selectedLines.length} selected</span><button type="button" onClick={() => { actions.removeOrderLines(selectedLines); setSelectedLines([]); }} className="cursor-pointer font-bold text-rose-600 hover:underline dark:text-rose-300">Remove</button><label className="ml-auto flex items-center gap-1 text-slate-500 dark:text-slate-400">Disc %<input type="number" min={0} max={100} value={order.discountPct} onChange={(event) => { const pctValue = Number(event.target.value); if (canApplyDiscounts) actions.setOrderDiscount(order.id, pctValue); else guardAdmin("Always", "applying a discount", () => actions.setOrderDiscount(order.id, pctValue)); }} className="w-14 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-right font-mono dark:border-[#3E434C] dark:bg-[#1D2024]" /></label></div>}<div className="mt-3 space-y-2">{order.items.map((item) => <div key={item.uid} className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 text-xs dark:bg-[#2C3036]">{cartSelect && <input type="checkbox" aria-label={`Select ${item.name}`} checked={selectedLines.includes(item.uid)} onChange={(event) => setSelectedLines((current) => event.target.checked ? [...current, item.uid] : current.filter((uid) => uid !== item.uid))} className="h-3.5 w-3.5 shrink-0 accent-[#1A73E8]" />}<span className="min-w-0 flex-1 truncate">{item.name}</span><button type="button" onClick={() => changeItemQty(item, -qtyStep)} className="rounded bg-slate-200 px-2 dark:bg-[#3A4048]">−</button><span className="w-5 text-center font-mono">{item.qty}</span><button type="button" onClick={() => changeItemQty(item, qtyStep)} className="rounded bg-slate-200 px-2 dark:bg-[#3A4048]">+</button><span className="w-16 text-right font-mono">{money(item.unitPrice * item.qty)}</span></div>)}</div><div className="mt-6 space-y-1 border-t border-slate-200 pt-4 text-xs dark:border-[#33373E]"><div className="flex justify-between"><span>Subtotal</span><span className="font-mono">{money(totals.subtotal)}</span></div><div className="flex justify-between"><span>VAT</span><span className="font-mono">{money(totals.tax)}</span></div>{deliveryFee > 0 && <div className="flex justify-between"><span>Delivery · {deliveryArea?.name}</span><span className="font-mono">{money(deliveryFee)}</span></div>}<div className="flex justify-between text-base font-bold"><span>Total</span><span className="font-mono">{money(displayTotal)}</span></div></div><div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={() => { if (kitchenTicketsAllowed) { actions.sendOrderToKitchen(order.id); setTicketPrinted(true); } else actions.showToast("Kitchen tickets are restricted to the main register in Security settings.", "info"); }} className="rounded-lg border border-sky-500 py-2 text-xs font-bold text-sky-600 disabled:opacity-40 dark:text-sky-300" title={kitchenTicketsAllowed ? "Send unsent items to Kitchen Kit" : "Disabled in Security settings"}>To Kitchen</button><button type="button" onClick={() => guardAdmin(adminRules?.closeReceipt, "closing a receipt", () => { setTendered(displayTotal.toFixed(2)); setPaymentOpen(true); })} disabled={!order.items.length} className="rounded-lg bg-[#1DB954] py-2 text-xs font-bold text-white disabled:opacity-40">Pay {money(displayTotal)}</button></div><div className={`mt-2 grid ${canPrintCheck ? "grid-cols-3" : "grid-cols-2"} gap-2`}>{canPrintCheck && <button type="button" onClick={printCheck} className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-bold text-slate-600 dark:border-[#33373E] dark:text-slate-300"><Printer className="h-3.5 w-3.5" />Print check</button>}<button type="button" disabled={!inventoryEnabled} title={inventoryEnabled ? "Quick inventory check" : "Requires the POS Inventory check integration"} onClick={() => setPosDrawer("inventory")} className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#33373E] dark:text-slate-300"><ClipboardList className="h-3.5 w-3.5" />Inventory</button><button type="button" disabled={!supplyEnabled} title={supplyEnabled ? "Quick supply delivery" : "Requires the Supply at the POS integration"} onClick={() => setPosDrawer("supply")} className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#33373E] dark:text-slate-300"><PackagePlus className="h-3.5 w-3.5" />Supply</button></div></>}</aside><main className="p-4 sm:p-6"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setCategory("All")} className={`rounded-full px-3 py-1.5 text-xs font-bold ${category === "All" ? "bg-[#1A73E8] text-white" : "bg-white dark:bg-[#2C3036]"}`}>All</button>{state.menuCategories.map((item) => <button key={item.id} type="button" onClick={() => setCategory(item.name)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${category === item.name ? "bg-[#1A73E8] text-white" : "bg-white dark:bg-[#2C3036]"}`}>{item.emoji} {item.name}</button>)}<label className="relative ml-auto"><Search className="absolute left-2 top-1.5 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") tryScan(search); }} placeholder={scanMode ? "Scan barcode / SKU + Enter" : "Search menu"} className="w-44 rounded-full border bg-white py-1.5 pl-8 pr-9 text-xs dark:border-[#33373E] dark:bg-[#24272C]" /><button type="button" aria-label="Barcode scan" title="Barcode quick-scan" onClick={() => setScanMode((value) => !value)} className={`absolute right-1.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-1 ${scanMode ? "bg-[#1A73E8] text-white" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}><ScanLine className="h-3.5 w-3.5" /></button></label><button type="button" onClick={() => setPromotionsOpen(true)} className="flex cursor-pointer items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"><Sparkles className="h-3.5 w-3.5" />Promotions</button>{scanFlash && <span className="self-center rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">{scanFlash}</span>}</div><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{visibleItems.map((item) => <button type="button" key={item.id} onClick={() => actions.addItemToOrder(item.id)} className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-sky-400 dark:border-[#33373E] dark:bg-[#2C3036]"><span className="text-3xl">{item.emoji}</span><span className="mt-3 block text-sm font-bold">{item.title}</span><span className="mt-1 block font-mono text-xs text-slate-500">{money(item.price)}</span></button>)}</div></main></div>}
    {mode === "floor" && <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">{FLOOR_TABLES.map((table) => { const occupied = state.posOrders.some((entry) => entry.tableId === table.id && entry.items.length); return <button type="button" key={table.id} onClick={() => { const existing = state.posOrders.find((entry) => entry.tableId === table.id); if (existing) actions.selectOrderTab(existing.id); else actions.createOrderTab(table.id); setMode("register"); }} className={`min-h-32 rounded-2xl border-2 p-4 text-left ${occupied ? "border-[#1A73E8] bg-blue-50 dark:bg-blue-950/30" : "border-slate-200 bg-white dark:border-[#33373E] dark:bg-[#24272C]"}`}><Utensils className="h-6 w-6" /><span className="mt-4 block font-bold">{table.name}</span><span className="text-xs text-slate-500">{table.seats} seats</span></button>; })}</div>}
    {mode === "kitchen" && <div className="p-6"><div className="mb-5 flex flex-wrap gap-2"><button type="button" onClick={() => setKdsStation("")} className={`rounded-full px-3 py-1.5 text-xs font-bold ${kdsStation === "" ? "bg-[#1A73E8] text-white" : "bg-white dark:bg-[#2C3036]"}`}>All stations</button>{state.stations.map((station) => <button key={station.id} type="button" onClick={() => setKdsStation(station.title)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${kdsStation === station.title ? "bg-[#1A73E8] text-white" : "bg-white dark:bg-[#2C3036]"}`}>{station.title}</button>)}</div><div className="grid gap-5 md:grid-cols-2">{state.stations.filter((station) => !kdsStation || station.title === kdsStation).map((station) => <section key={station.id}><h2 className="mb-3 text-lg font-bold">{station.title}</h2><div className="space-y-3">{state.kdsTickets.filter((ticket) => ticket.station === station.title).map((ticket) => <div key={ticket.id} className="rounded-xl border bg-white p-4 dark:border-[#33373E] dark:bg-[#24272C]"><div className="flex justify-between text-xs font-bold"><span>{ticket.tableName} #{ticket.receiptNum}</span><span>{ticket.time}</span></div>{ticket.items.map((item) => <div className="mt-2 text-sm" key={item.name}>{item.qty} × {item.name}</div>)}<button type="button" onClick={() => actions.bumpKdsTicket(ticket.id)} className="mt-4 rounded-lg bg-[#1DB954] px-3 py-1.5 text-xs font-bold text-white">Bump / Ready</button></div>)}</div></section>)}</div></div>}
    {paymentOpen && <PaymentModal total={displayTotal} money={money} tendered={tendered} setTendered={setTendered} cashBackRedeem={cashBackAmount.toFixed(2)} maxCashBack={maxCashBack} setCashBackRedeem={setCashBackAmount} promotions={activePromotions} selectedPromotionId={appliedPromotion?.id ?? ""} onPromotionChange={(id) => { actions.setOrderPromotion(order.id, id); setCashBackRedeem("0"); }} methods={checkoutMethods} onClose={() => { setCashBackRedeem("0"); setPaymentOpen(false); }} onPay={(config) => { if (security?.autoKitchenTickets === "When closing an order") { actions.sendOrderToKitchen(order.id); setTicketPrinted(true); } actions.completePosSale(order.id, posPayMethodFor(config), Number(tendered) || 0, cashBackAmount); setCashBackRedeem("0"); setPaymentOpen(false); if (security?.printTwoReceipts) actions.showToast("Second receipt copy printed.", "success"); }} />}
    {state.receiptPreview && <ThermalReceiptModal />}
    {posDrawer === "inventory" && inventoryEnabled && <PosInventoryDrawer onClose={() => setPosDrawer("")} />}
    {posDrawer === "supply" && supplyEnabled && <PosSupplyDrawer onClose={() => setPosDrawer("")} requireAdmin={(run) => guardAdmin(adminRules?.addSupplyTablet, "adding a supply on a tablet", run)} />}

    {historyOpen && <OrderHistoryDrawer onClose={() => setHistoryOpen(false)} />}
    {promotionsOpen && <PromotionsModal orderId={order.id} onClose={() => setPromotionsOpen(false)} />}
    {adminPrompt && <AdminPasswordModal reason={adminPrompt.reason} value={adminPasswordInput} onChange={setAdminPasswordInput} onCancel={() => setAdminPrompt(null)} onSubmit={() => { if (actions.verifyAdminPassword(adminPasswordInput)) { const run = adminPrompt.run; setAdminPrompt(null); run(); } }} />}
  </div>;
}

function SyncPill({ state }: { state: ConsoleState }) {
  if (!state.isOnline) {
    return (
      <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-300" title="Cashier can keep selling offline">
        Offline • {state.offlineQueued} queued
      </span>
    );
  }
  if (state.syncing) {
    return (
      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
        Syncing{state.offlineQueued ? ` (${state.offlineQueued})` : ""}…
      </span>
    );
  }
  return (
    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300" title={state.lastSyncedAt ? `Last sync ${state.lastSyncedAt}` : "All receipts synced"}>
      Online • Synced
    </span>
  );
}

function PosDrawerShell({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/50" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside className="flex h-full w-full max-w-sm flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-[#33373E] dark:bg-[#24272C]">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-[#33373E]">
          <h2 className="text-sm font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="cursor-pointer rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-[#33373E]"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </aside>
    </div>
  );
}

function PosInventoryDrawer({ onClose }: { onClose: () => void }) {
  const { state, actions } = usePosStore();
  const [counts, setCounts] = useState<Record<string, string>>({});
  const storage = state.storageLocations[0] ?? "Storage 1";
  const stamp = formatTimestamp();
  const lines = state.stockItems.map((item) => ({
    stockId: item.id,
    title: item.title,
    expected: item.stock,
    actual: Math.max(0, counts[item.id] !== undefined && counts[item.id] !== "" ? Number(counts[item.id]) || 0 : item.stock),
    unit: item.unit,
    cost: item.cost,
    discrepancyQty: 0,
    discrepancyValue: 0,
  }));
  const submit = () => {
    actions.createInventoryCheck({ storage, type: "Full", startingDate: stamp, completedDate: stamp, lines });
    onClose();
  };
  return (
    <PosDrawerShell title="POS Inventory check" onClose={onClose}>
      <p className="mb-3 text-[11px] text-slate-500 dark:text-slate-400">Count each item and enter the actual quantity. Differences are written to Inventory → Inventory checks.</p>
      <div className="space-y-2">
        {state.stockItems.map((item) => (
          <div key={item.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-[#2C3036]">
            <span className="min-w-0 flex-1 truncate font-medium">{item.title}</span>
            <span className="font-mono text-slate-500 dark:text-slate-400">exp {formatQty(item.stock, item.unit)}</span>
            <input
              aria-label={`Counted ${item.title}`}
              type="number"
              min="0"
              step="any"
              value={counts[item.id] ?? String(item.stock)}
              onChange={(event) => setCounts((current) => ({ ...current, [item.id]: event.target.value }))}
              className="w-20 rounded border border-slate-300 bg-white px-2 py-1 text-right font-mono dark:border-[#3E434C] dark:bg-[#1D2024]"
            />
          </div>
        ))}
      </div>
      <button type="button" onClick={submit} className="mt-4 w-full rounded-lg bg-[#1DB954] py-2 text-xs font-bold text-white hover:bg-[#18A348]">Complete inventory check</button>
    </PosDrawerShell>
  );
}

function PosSupplyDrawer({ onClose, requireAdmin }: { onClose: () => void; requireAdmin: (run: () => void) => void }) {
  const { state, actions } = usePosStore();
  const [stockId, setStockId] = useState(state.stockItems[0]?.id ?? "");
  const [qty, setQty] = useState("1");
  const [cost, setCost] = useState("");
  const selected = state.stockItems.find((item) => item.id === stockId);
  const quantity = Number(qty) || 0;
  const unitCost = cost === "" ? (selected?.cost ?? 0) : Number(cost) || 0;
  const money = (value: number) => formatMoney(value, state.settings.currencySymbol);
  const submit = () => {
    if (!stockId || quantity <= 0) return;
    requireAdmin(() => {
      actions.createSupply(stockId, quantity, unitCost);
      onClose();
    });
  };
  return (
    <PosDrawerShell title="Supply at the POS" onClose={onClose}>
      <div className="space-y-3 text-xs">
        <label className="block"><span className="mb-1 block font-semibold">Item</span>
          <select value={stockId} onChange={(event) => { setStockId(event.target.value); setCost(""); }} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-[#3E434C] dark:bg-[#1D2024]">
            {state.stockItems.map((item) => <option key={item.id} value={item.id}>{item.title} · {formatQty(item.stock, item.unit)} on hand</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="mb-1 block font-semibold">Quantity</span>
            <input type="number" min="0" step="any" value={qty} onChange={(event) => setQty(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono dark:border-[#3E434C] dark:bg-[#1D2024]" />
          </label>
          <label className="block"><span className="mb-1 block font-semibold">Unit cost ({state.settings.currencySymbol})</span>
            <input type="number" min="0" step="any" value={cost} placeholder={selected ? String(selected.cost) : "0"} onChange={(event) => setCost(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono dark:border-[#3E434C] dark:bg-[#1D2024]" />
          </label>
        </div>
        {selected && <p className="text-slate-500 dark:text-slate-400">Total: <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">{money(quantity * unitCost)}</span></p>}
        <button type="button" disabled={!stockId || quantity <= 0} onClick={submit} className="w-full rounded-lg bg-[#1DB954] py-2 text-xs font-bold text-white hover:bg-[#18A348] disabled:cursor-not-allowed disabled:opacity-40">Add supply</button>
      </div>
    </PosDrawerShell>
  );
}

function AdminPasswordModal({ reason, value, onChange, onCancel, onSubmit }: { reason: string; value: string; onChange: (value: string) => void; onCancel: () => void; onSubmit: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-[#2C3036]">
        <h2 className="text-lg font-bold">Admin password required</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Enter the admin password to confirm {reason}.</p>
        <input
          type="password"
          autoFocus
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") onSubmit(); }}
          placeholder="Admin password"
          className="mt-4 w-full rounded-lg border bg-transparent px-3 py-2 font-mono dark:border-[#3E434C]"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg border px-4 py-2 text-xs font-bold dark:border-[#3E434C]">Cancel</button>
          <button type="button" onClick={onSubmit} className="rounded-lg bg-[#1A73E8] px-4 py-2 text-xs font-bold text-white">Confirm</button>
        </div>
      </div>
    </div>
  );
}

function PaymentModal({ total, money, tendered, setTendered, cashBackRedeem, maxCashBack, setCashBackRedeem, promotions, selectedPromotionId, onPromotionChange, methods, onClose, onPay }: { total: number; money: (value: number) => string; tendered: string; setTendered: (value: string) => void; cashBackRedeem: string; maxCashBack: number; setCashBackRedeem: (value: string) => void; promotions: Promotion[]; selectedPromotionId: string; onPromotionChange: (id: string) => void; methods: PaymentMethodConfig[]; onClose: () => void; onPay: (method: PaymentMethodConfig) => void }) {
  const due = Math.max(0, total - (Number(cashBackRedeem) || 0));
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 dark:bg-[#2C3036]"><div className="flex justify-between"><h2 className="text-lg font-bold">Checkout</h2><button type="button" onClick={onClose}><X /></button></div>{promotions.length > 0 && <label className="mt-4 block text-xs"><span className="mb-1 block font-semibold">Promotion</span><select value={selectedPromotionId} onChange={(event) => onPromotionChange(event.target.value)} className="w-full rounded-lg border bg-transparent px-3 py-2 dark:border-[#3E434C]"><option value="">No promotion</option>{promotions.map((promotion) => <option key={promotion.id} value={promotion.id}>{promotion.title}</option>)}</select></label>}<p className="mt-4 text-sm">Total <strong className="font-mono">{money(total)}</strong></p>{maxCashBack > 0 && <label className="mt-4 block text-xs"><span className="mb-1 block">Cash-back to redeem (available {money(maxCashBack)})</span><input value={cashBackRedeem} onChange={(event) => setCashBackRedeem(event.target.value)} type="number" min="0" max={maxCashBack} step="0.01" className="w-full rounded-lg border bg-transparent px-3 py-2 font-mono" /></label>}<p className="mt-3 text-sm">Amount due <strong className="font-mono">{money(due)}</strong></p><input aria-label="Amount tendered" value={tendered} onChange={(event) => setTendered(event.target.value)} type="number" min={due} className="mt-3 w-full rounded-lg border bg-transparent px-3 py-2 font-mono" /><div className="mt-4 grid grid-cols-2 gap-2">{methods.map((method) => <button type="button" key={method.id} onClick={() => onPay(method)} className={`rounded-lg py-2 text-xs font-bold text-white ${methodButtonClass(method)}`}><MethodGlyph method={method} />{method.title}</button>)}</div></div></div>;
}
