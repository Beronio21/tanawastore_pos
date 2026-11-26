import { describe, expect, it } from "vitest";
import { INITIAL_CONSOLE_STATE, type PositionRole } from "@/lib/console-data";
import { applyReceiptMutation, unseenMutations, type QueuedMutation } from "@/lib/offline-sync";
import { canSeeSection, hasPermission, permissionsForPosition } from "@/lib/rbac";
import {
  BILLING_PLANS,
  planLimit,
  withinPlanLimit,
} from "@/lib/billing-plans";

function receiptMutation(clientMutationId: string): QueuedMutation {
  return {
    clientMutationId,
    timestamp: new Date("2026-11-26T10:00:00Z").toISOString(),
    tenantId: "tenant-a",
    type: "receipt",
    payload: {
      receiptNum: 1,
      paymentMethod: "Cash",
      subtotal: 240.8,
      discountAmt: 0,
      tax: 25.8,
      total: 240.8,
      profit: 188.3,
      tableName: "Takeaway",
      items: [{ menuId: "prod-2", name: "Capucino 250ml", qty: 1, unitPrice: 120 }],
    },
  };
}

function position(overrides: Partial<PositionRole>): PositionRole {
  return {
    id: "role-test",
    title: "Test",
    color: "#000000",
    systemRole: false,
    posAccess: true,
    editAllOrders: false,
    orderAdministration: false,
    consoleAccess: {
      reports: "Without access",
      finances: "Without access",
      menu: "Without access",
      inventory: "Without access",
      marketing: "Without access",
      accessSettings: "Without access",
      accountSettings: "Without access",
      securitySettings: "Without access",
    },
    appInstallation: false,
    courier: false,
    payroll: { perHour: 0, perShift: 0, perMonth: 0, commissionRates: [] },
    ...overrides,
  };
}

describe("offline receipt sync idempotency", () => {
  it("applies stock deductions and revenue once when a mutation is replayed", () => {
    const initial = structuredClone(INITIAL_CONSOLE_STATE);
    const mutation = receiptMutation("cm-1");

    const first = applyReceiptMutation(initial, mutation);
    expect(first.applied).toBe(true);
    expect(first.state.stockItems.find((item) => item.id === "stk-2")?.stock).toBeCloseTo(1.982, 3);
    expect(first.state.stockItems.find((item) => item.id === "stk-8")?.stock).toBeCloseTo(3.8, 3);
    expect(first.state.accounts.find((account) => account.isCashDrawer)?.balance).toBeCloseTo(240.8, 2);
    expect(first.state.transactions).toHaveLength(1);
    expect(first.state.syncedMutationIds).toEqual(["cm-1"]);

    const replay = applyReceiptMutation(first.state, mutation);
    expect(replay.applied).toBe(false);
    expect(replay.state.stockItems.find((item) => item.id === "stk-2")?.stock).toBeCloseTo(1.982, 3);
    expect(replay.state.accounts.find((account) => account.isCashDrawer)?.balance).toBeCloseTo(240.8, 2);
    expect(replay.state.transactions).toHaveLength(1);
  });

  it("skips already-processed mutation ids in a batch", () => {
    const batch = [receiptMutation("cm-1"), receiptMutation("cm-2"), receiptMutation("cm-3")];
    const unseen = unseenMutations(["cm-1", "cm-3"], batch);
    expect(unseen.map((mutation) => mutation.clientMutationId)).toEqual(["cm-2"]);
  });
});

describe("position-based RBAC", () => {
  it("grants owners every permission", () => {
    const owner = position({ title: "Owner", systemRole: true });
    const permissions = permissionsForPosition(owner);
    expect(Object.values(permissions).every(Boolean)).toBe(true);
    expect(canSeeSection(owner, "settings")).toBe(true);
  });

  it("restricts waiters to POS access and blocks refunds, discounts and console sections", () => {
    const waiter = position({ title: "Waiter" });
    expect(hasPermission(waiter, "canRefundOrders")).toBe(false);
    expect(hasPermission(waiter, "canApplyDiscounts")).toBe(false);
    expect(canSeeSection(waiter, "reports")).toBe(false);
    expect(canSeeSection(waiter, "settings")).toBe(false);
    expect(canSeeSection(waiter, "get-started")).toBe(true);
  });

  it("maps Access → Positions console rights to visible sections", () => {
    const storekeeper = position({
      title: "Storekeeper",
      consoleAccess: { ...position({}).consoleAccess, menu: "Full access", inventory: "Full access" },
    });
    expect(canSeeSection(storekeeper, "menu")).toBe(true);
    expect(canSeeSection(storekeeper, "calculations")).toBe(true);
    expect(canSeeSection(storekeeper, "finances")).toBe(false);
    expect(canSeeSection(storekeeper, "access")).toBe(false);
  });
});

describe("subscription plan caps", () => {
  it("enforces starter caps for one location, one register and five employees", () => {
    expect(planLimit("starter", "locations")).toBe(1);
    expect(withinPlanLimit("starter", "locations", 0)).toBe(true);
    expect(withinPlanLimit("starter", "locations", 1)).toBe(false);
    expect(withinPlanLimit("starter", "registers", 1)).toBe(false);
    expect(withinPlanLimit("starter", "employees", 4)).toBe(true);
    expect(withinPlanLimit("starter", "employees", 5)).toBe(false);
  });

  it("enforces pro caps and treats enterprise as unlimited", () => {
    expect(withinPlanLimit("pro", "locations", 2)).toBe(true);
    expect(withinPlanLimit("pro", "locations", 3)).toBe(false);
    expect(withinPlanLimit("pro", "registers", 4)).toBe(true);
    expect(BILLING_PLANS.enterprise.limits.locations).toBe(Number.POSITIVE_INFINITY);
    expect(withinPlanLimit("enterprise", "registers", 10_000)).toBe(true);
  });
});
