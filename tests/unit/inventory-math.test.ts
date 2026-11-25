import { describe, expect, it } from "vitest";
import {
  inventoryCheckTotals,
  inventoryDiscrepancy,
  linesValue,
  packToBase,
  transferBalances,
  weightedAverageCost,
} from "@/lib/business-math";
import { INITIAL_CONSOLE_STATE, type InventoryCheckLine } from "@/lib/console-data";

describe("Ordering units", () => {
  it("converts packs to base units", () => {
    expect(packToBase(4, 12)).toBe(48);
    expect(packToBase(1.5, 10)).toBe(15);
    expect(packToBase(0, 30)).toBe(0);
  });
});

describe("Supplies and weighted average cost", () => {
  it("blends the existing stock value with the received cost", () => {
    // 10 pcs at ₱4.00 + 20 pcs at ₱6.00 = ₱160 / 30 pcs
    expect(weightedAverageCost(10, 4, 20, 6)).toBeCloseTo(5.3333, 4);
  });

  it("uses the received cost when there was no stock on hand", () => {
    expect(weightedAverageCost(0, 0, 5, 8)).toBe(8);
    expect(weightedAverageCost(0, 99, 0, 3)).toBe(3);
  });
});

describe("Inventory checks", () => {
  it("values a shortage as (actual - expected) × cost", () => {
    expect(inventoryDiscrepancy(8, 10, 4)).toEqual({ qty: -2, value: -8 });
    expect(inventoryDiscrepancy(13, 10, 2.5)).toEqual({ qty: 3, value: 7.5 });
    expect(inventoryDiscrepancy(10, 10, 4)).toEqual({ qty: 0, value: 0 });
  });

  it("sums discrepancy values across check lines", () => {
    const lines: InventoryCheckLine[] = [
      { stockId: "stk-1", title: "Borjomi", expected: 20, actual: 18, unit: "pcs", cost: 4, discrepancyQty: -2, discrepancyValue: -8 },
      { stockId: "stk-2", title: "Coffee", expected: 2, actual: 2.5, unit: "kg", cost: 30, discrepancyQty: 0.5, discrepancyValue: 15 },
    ];
    expect(inventoryCheckTotals(lines)).toEqual({ totalValue: 7, counted: 20.5 });
  });
});

describe("Transfers and stock deductions", () => {
  it("moves stock between storage locations without changing the total", () => {
    const balances = { "Storage 1": 20, "Storage 2": 5 };
    const result = transferBalances(balances, "Storage 1", "Storage 2", 8);
    expect(result.moved).toBe(true);
    expect(result.balances).toEqual({ "Storage 1": 12, "Storage 2": 13 });
    expect(balances).toEqual({ "Storage 1": 20, "Storage 2": 5 });
  });

  it("rejects a transfer larger than the source balance", () => {
    const result = transferBalances({ "Storage 1": 2 }, "Storage 1", "Storage 2", 3);
    expect(result.moved).toBe(false);
    expect(result.balances).toEqual({ "Storage 1": 2 });
  });

  it("values supplies, transfers and deductions from their line items", () => {
    expect(linesValue([
      { quantity: 2, cost: 4 },
      { quantity: 0.5, cost: 30 },
    ])).toBe(23);
  });

  it("keeps the seeded tanawa inventory valuation at ₱215.20", () => {
    const value = INITIAL_CONSOLE_STATE.stockItems.reduce(
      (sum, item) => sum + item.stock * item.cost,
      0,
    );
    expect(value).toBeCloseTo(215.2, 2);
  });
});
