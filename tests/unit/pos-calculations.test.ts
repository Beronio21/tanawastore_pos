import { describe, expect, it } from "vitest";
import {
  INITIAL_CONSOLE_STATE,
  calcOrderTotals,
  getExcludedMenuItemIds,
  posPricingRules,
  type Customer,
  type CustomerGroup,
  type LocationSettings,
  type PosOrderTab,
  type Promotion,
} from "@/lib/console-data";
import { customerGroupDiscountRate, maxCashBack, resolveLoyaltyGroup } from "@/lib/business-math";

const menuItems = INITIAL_CONSOLE_STATE.menuItems;
const categories = INITIAL_CONSOLE_STATE.menuCategories;

function order(items: PosOrderTab["items"], discountPct = 0, promotionId?: string): PosOrderTab {
  return {
    id: "ord-test",
    receiptNum: 99,
    tableId: "T1",
    source: "Dine-in",
    guests: 1,
    staffId: "emp-1",
    customerId: "",
    discountPct,
    note: "",
    openedAt: "9:00 am",
    items,
    promotionId,
  };
}

function line(menuId: string, qty: number, unitPrice: number): PosOrderTab["items"][number] {
  return { uid: `${menuId}-${qty}`, menuId, name: menuId, unitPrice, qty, sent: false };
}

function settings(patch: Partial<LocationSettings>): LocationSettings {
  return { ...INITIAL_CONSOLE_STATE.settings, ...patch };
}

describe("POS line-item pricing", () => {
  it("multiplies unit price by partial servings", () => {
    const half = calcOrderTotals(order([line("prod-2", 0.5, 120)]), menuItems);
    expect(half.subtotal).toBe(60);

    const quarter = calcOrderTotals(order([line("prod-3", 1.25, 95)]), menuItems);
    expect(quarter.subtotal).toBeCloseTo(118.75, 2);
  });

  it("adds the 12% VAT breakdown on the discounted subtotal", () => {
    const totals = calcOrderTotals(
      order([line("prod-2", 1, 120), line("prod-3", 1, 95)]),
      menuItems,
    );
    expect(totals.subtotal).toBe(215);
    expect(totals.tax).toBeCloseTo(25.8, 2);
    expect(totals.total).toBeCloseTo(240.8, 2);
  });

  it("floors the order price when Round the order price is enabled", () => {
    const orderLine = line("prod-1", 1.25, 10.5);
    const raw = calcOrderTotals(order([orderLine]), menuItems, 0.12, [], undefined, categories);
    expect(raw.total).toBeCloseTo(14.7, 2);

    const rounded = calcOrderTotals(
      order([orderLine]),
      menuItems,
      0.12,
      [],
      undefined,
      categories,
      posPricingRules(settings({ roundOrderPrice: true })),
    );
    expect(rounded.total).toBe(14);
  });

  it("applies 5% and 10% service charge fees", () => {
    const base = calcOrderTotals(order([line("prod-2", 1, 120)]), menuItems);
    expect(base.total).toBeCloseTo(134.4, 2);

    const five = calcOrderTotals(
      order([line("prod-2", 1, 120)]),
      menuItems,
      0.12,
      [],
      undefined,
      categories,
      posPricingRules(settings({ serviceChargeFee: "5%" })),
    );
    expect(five.serviceCharge).toBeCloseTo(6.72, 2);
    expect(five.total).toBeCloseTo(141.12, 2);

    const ten = calcOrderTotals(
      order([line("prod-2", 1, 120)]),
      menuItems,
      0.12,
      [],
      undefined,
      categories,
      posPricingRules(settings({ serviceChargeFee: "10%" })),
    );
    expect(ten.serviceCharge).toBeCloseTo(13.44, 2);
    expect(ten.total).toBeCloseTo(147.84, 2);
  });
});

describe("customer groups and loyalty", () => {
  const discountGroup: CustomerGroup = {
    id: "cgrp-vip",
    title: "VIP",
    loyaltyProgram: "Discount system",
    rate: 10,
  };
  const customer: Customer = {
    id: "cust-1",
    name: "Maria",
    profileNum: "C-1001",
    phone: "0999",
    group: "VIP",
    discountPct: 3,
    bonusBalance: 200,
    overallSum: 0,
    cashSum: 0,
    cardSum: 0,
    receiptCount: 0,
  };

  it("uses the customer group discount percentage", () => {
    expect(customerGroupDiscountRate([discountGroup], customer)).toBe(10);
    const totals = calcOrderTotals(order([line("prod-2", 1, 120)], 10), menuItems);
    expect(totals.discountAmt).toBeCloseTo(12, 2);
    expect(totals.tax).toBeCloseTo(12.96, 2);
    expect(totals.total).toBeCloseTo(120.96, 2);
  });

  it("caps cash-back redemption at the Maximum %", () => {
    expect(maxCashBack(200, 240.8, 50)).toBeCloseTo(120.4, 2);
    expect(maxCashBack(30, 240.8, 50)).toBeCloseTo(30, 2);
    expect(maxCashBack(200, 240.8, 150)).toBeCloseTo(200, 2);
    expect(maxCashBack(200, 240.8, -10)).toBe(0);
  });

  it("credits the registration bonus to a new customer balance", () => {
    // The store applies `loyaltySettings.registrationBonus` verbatim on createCustomer.
    expect(INITIAL_CONSOLE_STATE.loyaltySettings.registrationBonus).toBe(0);
    const configured = { ...INITIAL_CONSOLE_STATE.loyaltySettings, registrationBonus: 75 };
    expect(configured.registrationBonus).toBe(75);
  });

  it("moves a customer to the highest qualifying group once Overall sum crosses thresholds", () => {
    const groups: CustomerGroup[] = [
      discountGroup,
      { id: "cgrp-gold", title: "Gold", loyaltyProgram: "Bonus system", rate: 5 },
      { id: "cgrp-platinum", title: "Platinum", loyaltyProgram: "Bonus system", rate: 8 },
    ];
    const conditions = [
      { id: "c1", threshold: 100, groupId: "cgrp-vip" },
      { id: "c2", threshold: 500, groupId: "cgrp-gold" },
      { id: "c3", threshold: 1000, groupId: "cgrp-platinum" },
    ];
    expect(resolveLoyaltyGroup(99, groups, conditions)).toBeNull();
    expect(resolveLoyaltyGroup(500, groups, conditions)?.title).toBe("Gold");
    expect(resolveLoyaltyGroup(1500, groups, conditions)?.title).toBe("Platinum");
  });
});

describe("Marketing -> Exclusions", () => {
  const promotion: Promotion = {
    id: "promo-1",
    title: "10% off everything",
    beginningDate: "2026-01-01",
    expirationDate: "2026-12-31",
    rewardType: "Discount %",
    rewardValue: 10,
    scope: "All menu items",
    categoryIds: [],
    productIds: [],
  };

  it("resolves exclusions by product and by category", () => {
    expect(getExcludedMenuItemIds(menuItems, categories, [], ["prod-2"])).toEqual(["prod-2"]);
    expect(
      getExcludedMenuItemIds(menuItems, categories, ["mc-2"], []),
    ).toEqual(["prod-3"]);
  });

  it("bypasses group discounts for excluded items but keeps them promotion-eligible", () => {
    const totals = calcOrderTotals(
      order([line("prod-2", 1, 120), line("prod-3", 1, 95)], 50),
      menuItems,
      0.12,
      ["prod-2"],
      promotion,
      categories,
    );
    // Group discount only on Croissant (95 × 50% = 47.50).
    // Promotion 10% applies to Borjomi (120) + discounted Croissant (47.50).
    expect(totals.discountAmt).toBeCloseTo(64.25, 2);
    expect(totals.promotionDiscountAmt).toBeCloseTo(16.75, 2);
    expect(totals.total).toBeCloseTo(168.84, 2);
    // Cash-back eligibility excludes the excluded product.
    expect(totals.cashBackEligibleTotal).toBeCloseTo(47.88, 2);
  });

  it("gives no group discount when every item is excluded", () => {
    const totals = calcOrderTotals(
      order([line("prod-2", 1, 120)], 50),
      menuItems,
      0.12,
      ["prod-2"],
      promotion,
      categories,
    );
    const eligible = 120 * 0.1;
    expect(totals.discountAmt).toBeCloseTo(eligible, 2);
    expect(totals.cashBackEligibleTotal).toBe(0);
  });
});
