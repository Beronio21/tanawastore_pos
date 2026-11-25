/**
 * Pure, framework-free business math shared by the POS store, console reports
 * and the Phase 02 test suite. Keeping these formulas here lets Vitest verify
 * the exact arithmetic the UI renders without mounting React.
 */

import type {
  CommissionRate,
  Customer,
  CustomerGroup,
  InventoryCheckLine,
  MenuCategory,
  MenuItem,
  Receipt,
  ReceiptItem,
  ReceiptReportRow,
} from "./console-data";

export type SalesKpis = {
  revenue: number;
  profit: number;
  receipts: number;
  customers: number;
  average: number;
};

/** Line total: unit price × quantity, including partial servings. */
export function lineSubtotal(unitPrice: number, qty: number): number {
  return unitPrice * qty;
}

/** Ordering units → base stock units (`packs × packQuantity`). */
export function packToBase(packs: number, packQuantity: number): number {
  return packs * packQuantity;
}

/** Weighted average unit cost after receiving stock at a new unit cost. */
export function weightedAverageCost(
  previousStock: number,
  previousUnitCost: number,
  receivedQty: number,
  receivedUnitCost: number,
): number {
  const totalQty = previousStock + receivedQty;
  if (totalQty <= 0) return receivedUnitCost;
  return (previousStock * previousUnitCost + receivedQty * receivedUnitCost) / totalQty;
}

/** Inventory check discrepancy: `(actual - expected) × cost`. */
export function inventoryDiscrepancy(actual: number, expected: number, unitCost: number): {
  qty: number;
  value: number;
} {
  const qty = actual - expected;
  return { qty, value: qty * unitCost };
}

/** Storage balances after moving stock between two storage locations. */
export function transferBalances(
  balances: Record<string, number>,
  fromStorage: string,
  toStorage: string,
  quantity: number,
): { balances: Record<string, number>; moved: boolean } {
  const available = balances[fromStorage] ?? 0;
  if (quantity <= 0 || available < quantity) {
    return { balances: { ...balances }, moved: false };
  }
  return {
    balances: {
      ...balances,
      [fromStorage]: available - quantity,
      [toStorage]: (balances[toStorage] ?? 0) + quantity,
    },
    moved: true,
  };
}

/** Value of a stock deduction / transfer / supply line set. */
export function linesValue(lines: { quantity: number; cost: number }[]): number {
  return lines.reduce((sum, line) => sum + line.quantity * line.cost, 0);
}

/** Group discount rate: the customer group's rate wins over the manual rate. */
export function customerGroupDiscountRate(groups: CustomerGroup[], customer: Customer): number {
  const group = groups.find((entry) => entry.title === customer.group);
  if (group) {
    return !group.deleted && group.loyaltyProgram === "Discount system" ? group.rate : 0;
  }
  return customer.discountPct;
}

/** Loyalty cash-back redemption cap: `min(balance, eligible × Maximum %)`. */
export function maxCashBack(
  bonusBalance: number,
  eligibleTotal: number,
  maximumPct: number,
): number {
  const pct = Math.max(0, Math.min(100, maximumPct));
  return Math.min(Math.max(0, bonusBalance), eligibleTotal * pct / 100);
}

/** Highest qualifying loyalty group once `Overall sum` crosses a threshold. */
export function resolveLoyaltyGroup(
  overallSum: number,
  groups: CustomerGroup[],
  conditions: { threshold: number; groupId: string }[],
): CustomerGroup | null {
  const eligible = conditions
    .filter((condition) => condition.groupId && condition.threshold > 0 && condition.threshold <= overallSum)
    .sort((left, right) => right.threshold - left.threshold);
  for (const condition of eligible) {
    const group = groups.find((entry) => !entry.deleted && entry.id === condition.groupId);
    if (group) return group;
  }
  return null;
}

/** Aggregate Sales Report KPIs for a receipt list. */
export function summarizeReceipts(list: Receipt[], costOf: (receipt: Receipt) => number): SalesKpis {
  const revenue = list.reduce((sum, receipt) => sum + receipt.total, 0);
  const cost = list.reduce((sum, receipt) => sum + costOf(receipt), 0);
  const customers = new Set(list.map((receipt) => receipt.customerName?.trim()).filter(Boolean)).size;
  return {
    revenue,
    profit: revenue - cost,
    receipts: list.length,
    customers,
    average: list.length ? revenue / list.length : 0,
  };
}

/** Parse a clock label like "9:32 am" into a 24-hour hour, or null. */
export function receiptHour(receipt: Receipt): number | null {
  const match = receipt.closedAt.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const suffix = match[3]?.toLowerCase();
  if (suffix === "pm" && hour < 12) hour += 12;
  if (suffix === "am" && hour === 12) hour = 0;
  return hour >= 0 && hour < 24 ? hour : null;
}

export type TimeBucket = { key: string; label: string; revenue: number; profit: number; receipts: number };

/** `Reports -> Sales -> By Hour`: 24 buckets keyed by the receipt clock time. */
export function summarizeByHour(list: Receipt[], costOf: (receipt: Receipt) => number): TimeBucket[] {
  const buckets: TimeBucket[] = Array.from({ length: 24 }, (_, hour) => ({
    key: String(hour),
    label: `${String(hour).padStart(2, "0")}:00`,
    revenue: 0,
    profit: 0,
    receipts: 0,
  }));
  list.forEach((receipt) => {
    const hour = receiptHour(receipt);
    if (hour === null) return;
    const bucket = buckets[hour];
    bucket.revenue += receipt.total;
    bucket.profit += receipt.total - costOf(receipt);
    bucket.receipts += 1;
  });
  return buckets;
}

/** `Reports -> Sales -> By Day`: one bucket per `YYYY-MM-DD` sale date. */
export function summarizeByDay(list: Receipt[], costOf: (receipt: Receipt) => number): TimeBucket[] {
  const buckets = new Map<string, TimeBucket>();
  list.forEach((receipt) => {
    const key = receipt.closedDate ?? "unknown";
    const bucket = buckets.get(key) ?? { key, label: key, revenue: 0, profit: 0, receipts: 0 };
    bucket.revenue += receipt.total;
    bucket.profit += receipt.total - costOf(receipt);
    bucket.receipts += 1;
    buckets.set(key, bucket);
  });
  return [...buckets.values()].sort((left, right) => left.key.localeCompare(right.key));
}

export type ReceiptsSummary = {
  netRevenue: number;
  cash: number;
  cards: number;
  giftCards: number;
  online: number;
  discounts: number;
  grossProfit: number;
  taxes: number;
  serviceCharges: number;
  bonuses: number;
  closedReceipts: number;
};

/** `Reports -> Receipts` summary bar, computed from closed rows only. */
export function summarizeReceiptRows(rows: ReceiptReportRow[]): ReceiptsSummary {
  const closed = rows.filter((row) => row.status === "Close");
  const total = (pick: (row: ReceiptReportRow) => number) => closed.reduce((sum, row) => sum + pick(row), 0);
  return {
    netRevenue: total((row) => row.paid),
    cash: total((row) => (row.paymentMethod === "Cash" ? row.paid : 0)),
    cards: total((row) => (row.paymentMethod === "Card" ? row.paid : 0)),
    giftCards: total((row) => (/gift/i.test(row.paymentMethod) ? row.paid : 0)),
    online: total((row) => (row.paymentMethod === "e-Wallet" ? row.paid : 0)),
    discounts: total((row) => row.discount),
    grossProfit: total((row) => row.profit),
    taxes: total((row) => row.tax),
    serviceCharges: total((row) => row.serviceCharge),
    bonuses: total((row) => row.cashBack),
    closedReceipts: closed.length,
  };
}

export type PayrollConfig = {
  perHour: number;
  perShift: number;
  perMonth: number;
  commissionRates: CommissionRate[];
};

export type PayrollResult = {
  basePay: number;
  commission: number;
  total: number;
  rateKind: "Per month" | "Per shift" | "Per hour";
  rateValue: number;
  commissionRate: number;
  usesDefaultCommission: boolean;
};

/**
 * `Finances -> Payroll`: choose one fixed rate (monthly, per shift, or hourly
 * × 8h) and add the category sales commission percentage.
 */
export function calculatePayroll(options: {
  payroll?: PayrollConfig;
  fallbackHourlyRate?: number;
  hours?: number;
  receiptItems: ReceiptItem[];
  menuItems: Pick<MenuItem, "id" | "category">[];
  menuCategories: Pick<MenuCategory, "id" | "name">[];
}): PayrollResult {
  const hours = options.hours ?? 8;
  const payroll = options.payroll;
  const fallbackHourlyRate = options.fallbackHourlyRate ?? 120;

  let rateKind: PayrollResult["rateKind"] = "Per hour";
  let rateValue = payroll?.perHour || fallbackHourlyRate;
  let basePay = rateValue * hours;
  if (payroll?.perMonth) {
    rateKind = "Per month";
    rateValue = payroll.perMonth;
    basePay = payroll.perMonth;
  } else if (payroll?.perShift) {
    rateKind = "Per shift";
    rateValue = payroll.perShift;
    basePay = payroll.perShift;
  }

  const usesDefaultCommission = !payroll?.commissionRates.length;
  const defaultCommission = usesDefaultCommission ? 5 : 0;
  const allCategoriesRate =
    payroll?.commissionRates.find((rate) => rate.categoryId === "")?.percentage ?? defaultCommission;
  const commission = options.receiptItems.reduce((sum, item) => {
    const menuItem = options.menuItems.find((entry) => entry.id === item.menuId);
    const categoryId = options.menuCategories.find((category) => category.name === menuItem?.category)?.id;
    const categoryRate = payroll?.commissionRates.find(
      (rate) => rate.categoryId && rate.categoryId === categoryId,
    )?.percentage;
    return sum + item.unitPrice * item.qty * (categoryRate ?? allCategoriesRate) / 100;
  }, 0);

  return {
    basePay,
    commission,
    total: basePay + commission,
    rateKind,
    rateValue,
    commissionRate: allCategoriesRate,
    usesDefaultCommission,
  };
}

/** Convenience for inventory check rows built in the POS inventory drawer. */
export function inventoryCheckTotals(lines: InventoryCheckLine[]): { totalValue: number; counted: number } {
  return lines.reduce(
    (totals, line) => ({
      totalValue: totals.totalValue + line.discrepancyValue,
      counted: totals.counted + line.actual,
    }),
    { totalValue: 0, counted: 0 },
  );
}
