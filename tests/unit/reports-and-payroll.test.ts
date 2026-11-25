import { describe, expect, it } from "vitest";
import {
  calculatePayroll,
  summarizeByDay,
  summarizeByHour,
  summarizeReceiptRows,
  summarizeReceipts,
} from "@/lib/business-math";
import {
  INITIAL_CONSOLE_STATE,
  type Receipt,
  type ReceiptReportRow,
} from "@/lib/console-data";

function receipt(patch: Partial<Receipt> & Pick<Receipt, "receiptNum" | "closedAt">): Receipt {
  return {
    staffId: "emp-1",
    staffName: "Philip Venje Beronio",
    tableName: "Table 1",
    openedAt: "9:00 am",
    closedDate: "2026-11-25",
    paymentMethod: "Cash",
    subtotal: patch.total ?? 0,
    discountAmt: 0,
    tax: 0,
    profit: patch.total ?? 0,
    total: 0,
    items: [],
    ...patch,
  };
}

const coffee = receipt({
  receiptNum: 1,
  closedAt: "9:32 am",
  total: 120,
  customerName: "Maria",
  items: [{ menuId: "prod-2", name: "Capucino 250ml", qty: 1, unitPrice: 120 }],
});
const croissant = receipt({
  receiptNum: 2,
  closedAt: "02:05 pm",
  total: 95,
  customerName: "Maria",
  items: [{ menuId: "prod-3", name: "Croissant with chocolate", qty: 1, unitPrice: 95 }],
});

const costOf = (entry: Receipt) => (entry.receiptNum === 1 ? 10 : 15);

describe("Reports -> Sales KPIs", () => {
  it("computes revenue, profit = revenue - COGS, and average receipt", () => {
    const summary = summarizeReceipts([coffee, croissant], costOf);
    expect(summary.revenue).toBe(215);
    expect(summary.profit).toBeCloseTo(190, 2);
    expect(summary.receipts).toBe(2);
    expect(summary.customers).toBe(1);
    expect(summary.average).toBeCloseTo(107.5, 2);
  });

  it("returns zeroed averages for an empty period", () => {
    expect(summarizeReceipts([], costOf)).toEqual({
      revenue: 0,
      profit: 0,
      receipts: 0,
      customers: 0,
      average: 0,
    });
  });

  it("groups By Hour from the receipt clock label", () => {
    const buckets = summarizeByHour([coffee, croissant], costOf);
    expect(buckets).toHaveLength(24);
    expect(buckets[9]).toMatchObject({ revenue: 120, profit: 110, receipts: 1 });
    expect(buckets[14]).toMatchObject({ revenue: 95, profit: 80, receipts: 1 });
    expect(buckets[10].revenue).toBe(0);
  });

  it("groups By Day from the local sale date", () => {
    const secondDay = receipt({ receiptNum: 3, closedAt: "11:00 am", total: 50, closedDate: "2026-11-24" });
    const buckets = summarizeByDay([coffee, croissant, secondDay], () => 0);
    expect(buckets.map((bucket) => bucket.key)).toEqual(["2026-11-24", "2026-11-25"]);
    expect(buckets[0].revenue).toBe(50);
    expect(buckets[1].revenue).toBe(215);
    expect(buckets[1].receipts).toBe(2);
  });
});

describe("Reports -> Receipts summary bar", () => {
  const rows: ReceiptReportRow[] = [
    {
      key: "receipt-1",
      number: 1,
      waiter: "Philip",
      openedAt: "9:00 am",
      closedAt: "9:32 am",
      paid: 120,
      discount: 12,
      profit: 100,
      status: "Close",
      paymentMethod: "Cash",
      subtotal: 108,
      tax: 12.96,
      serviceCharge: 0,
      cashBack: 0,
      items: [],
    },
    {
      key: "receipt-2",
      number: 2,
      waiter: "Philip",
      openedAt: "1:00 pm",
      closedAt: "2:05 pm",
      paid: 95,
      discount: 0,
      profit: 80,
      status: "Close",
      paymentMethod: "Card",
      subtotal: 84.82,
      tax: 10.18,
      serviceCharge: 0,
      cashBack: 0,
      items: [],
    },
    {
      key: "order-3",
      number: 3,
      waiter: "Philip",
      openedAt: "3:00 pm",
      closedAt: "",
      paid: 50,
      discount: 0,
      profit: 30,
      status: "Open",
      paymentMethod: "Cash",
      subtotal: 50,
      tax: 0,
      serviceCharge: 0,
      cashBack: 0,
      items: [],
    },
  ];

  it("totals Net revenue, Discounts and Gross profits from closed rows only", () => {
    const summary = summarizeReceiptRows(rows);
    expect(summary.netRevenue).toBe(215);
    expect(summary.discounts).toBe(12);
    expect(summary.grossProfit).toBe(180);
    expect(summary.cash).toBe(120);
    expect(summary.cards).toBe(95);
    expect(summary.taxes).toBeCloseTo(23.14, 2);
  });
});

describe("Finances -> Payroll", () => {
  const receiptItems = [
    ...coffee.items,
    ...croissant.items,
  ];
  const base = {
    receiptItems,
    menuItems: INITIAL_CONSOLE_STATE.menuItems,
    menuCategories: INITIAL_CONSOLE_STATE.menuCategories,
    fallbackHourlyRate: 120,
  };

  it("pays Per hour × 8h plus the default 5% sales bonus", () => {
    const pay = calculatePayroll({ ...base, payroll: { perHour: 100, perShift: 0, perMonth: 0, commissionRates: [] } });
    expect(pay.basePay).toBe(800);
    expect(pay.commission).toBeCloseTo(10.75, 2);
    expect(pay.total).toBeCloseTo(810.75, 2);
    expect(pay.rateKind).toBe("Per hour");
    expect(pay.usesDefaultCommission).toBe(true);
  });

  it("uses Per shift when configured", () => {
    const pay = calculatePayroll({ ...base, payroll: { perHour: 0, perShift: 500, perMonth: 0, commissionRates: [] } });
    expect(pay.basePay).toBe(500);
    expect(pay.rateKind).toBe("Per shift");
    expect(pay.total).toBeCloseTo(510.75, 2);
  });

  it("uses Per month and configured category commission percentages", () => {
    const pay = calculatePayroll({
      ...base,
      payroll: {
        perHour: 0,
        perShift: 0,
        perMonth: 12000,
        commissionRates: [
          { id: "r-all", categoryId: "", percentage: 2 },
          { id: "r-coffee", categoryId: "mc-1", percentage: 10 },
        ],
      },
    });
    expect(pay.basePay).toBe(12000);
    expect(pay.rateKind).toBe("Per month");
    expect(pay.commission).toBeCloseTo(13.9, 2);
    expect(pay.total).toBeCloseTo(12013.9, 2);
    expect(pay.usesDefaultCommission).toBe(false);
  });

  it("falls back to the employee hourly rate when no payroll rate is set", () => {
    const pay = calculatePayroll({ ...base, fallbackHourlyRate: 150 });
    expect(pay.basePay).toBe(1200);
    expect(pay.rateValue).toBe(150);
  });
});
