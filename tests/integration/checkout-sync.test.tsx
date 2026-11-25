import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PosStoreProvider, usePosStore } from "@/lib/pos-store";
import { summarizeReceiptRows, summarizeReceipts } from "@/lib/business-math";
import type { ReceiptReportRow } from "@/lib/console-data";

function CheckoutProbe() {
  const { state, actions } = usePosStore();
  const activeOrder = state.posOrders.find((order) => order.id === state.activePosOrderId);
  const costOf = (receipt: typeof state.receipts[number]) =>
    receipt.items.reduce((sum, line) => {
      const menuItem = state.menuItems.find((entry) => entry.id === line.menuId);
      return sum + (menuItem?.cost ?? 0) * line.qty;
    }, 0);

  const closedRows: ReceiptReportRow[] = state.receipts.map((receipt) => ({
    key: `receipt-${receipt.receiptNum}`,
    number: receipt.receiptNum,
    waiter: receipt.staffName,
    openedAt: receipt.openedAt,
    closedAt: receipt.closedAt,
    paid: receipt.total,
    discount: receipt.discountAmt,
    profit: receipt.profit,
    status: "Close",
    paymentMethod: receipt.paymentMethod,
    subtotal: receipt.subtotal,
    tax: receipt.tax,
    serviceCharge: receipt.serviceCharge ?? 0,
    cashBack: receipt.cashBackRedeemed ?? 0,
    items: receipt.items,
  }));

  const sales = summarizeReceipts(state.receipts.filter((receipt) => !receipt.refunded), costOf);
  const receiptsSummary = summarizeReceiptRows(closedRows);
  const snapshot = {
    receiptCount: state.receipts.length,
    refunded: state.receipts[0]?.refunded ?? false,
    receiptTotal: state.receipts[0]?.total ?? 0,
    receiptProfit: state.receipts[0]?.profit ?? 0,
    transactionCount: state.transactions.length,
    transactions: state.transactions.map((transaction) => ({
      category: transaction.category,
      sum: transaction.sum,
      type: transaction.type,
      account: transaction.account,
    })),
    cashBalance: state.accounts.find((account) => account.isCashDrawer)?.balance ?? 0,
    stock: Object.fromEntries(state.stockItems.map((item) => [item.id, item.stock])),
    movementCount: state.stockMovements.length,
    movementReasons: state.stockMovements.map((movement) => movement.reason),
    sales,
    receiptsSummary,
    customer: state.customers[0] ?? null,
    registrationBonus: state.loyaltySettings.registrationBonus,
    orderCount: state.posOrders.length,
    activeOrderId: state.activePosOrderId,
    activeItems: activeOrder?.items.length ?? 0,
  };

  return (
    <div>
      <pre data-testid="snapshot">{JSON.stringify(snapshot)}</pre>
      <button type="button" onClick={() => actions.completePosSale(state.activePosOrderId, "Cash", 500)}>
        Complete cash sale
      </button>
      <button type="button" onClick={() => actions.refundReceipt(1)}>
        Refund receipt 1
      </button>
      <button
        type="button"
        onClick={() => actions.saveLoyaltySettings({ ...state.loyaltySettings, registrationBonus: 25 })}
      >
        Configure registration bonus
      </button>
      <button
        type="button"
        onClick={() => actions.createCustomer({ name: "Maria Santos", phone: "09991234567", group: "New customers" })}
      >
        Create customer
      </button>
    </div>
  );
}

async function readSnapshot() {
  const element = await screen.findByTestId("snapshot");
  return JSON.parse(element.textContent ?? "{}") as Record<string, unknown> & {
    stock: Record<string, number>;
    transactions: { category: string; sum: number; type: string; account: string }[];
    sales: { revenue: number; profit: number; average: number };
    receiptsSummary: { netRevenue: number; discounts: number; grossProfit: number };
    customer: { bonusBalance: number; receiptCount: number } | null;
    registrationBonus: number;
  };
}

function renderProbe() {
  return render(
    <PosStoreProvider>
      <CheckoutProbe />
    </PosStoreProvider>,
  );
}

describe("closing a paid order synchronizes POS and console state", () => {
  it("deducts recipe stock and logs ingredient movements", async () => {
    const user = userEvent.setup();
    renderProbe();
    const initial = await readSnapshot();
    expect(initial.stock["stk-2"]).toBe(2);
    expect(initial.stock["stk-8"]).toBe(4);

    await user.click(screen.getByRole("button", { name: "Complete cash sale" }));
    await waitFor(async () => {
      const after = await readSnapshot();
      expect(after.receiptCount).toBe(1);
    });

    const after = await readSnapshot();
    // Capucino: 0.018 kg coffee, 0.2 l milk, 1 paper cup, 1 cover, 1 stirrer.
    expect(after.stock["stk-2"]).toBeCloseTo(1.982, 3);
    expect(after.stock["stk-8"]).toBeCloseTo(3.8, 3);
    expect(after.stock["stk-10"]).toBe(99);
    expect(after.stock["stk-4"]).toBe(49);
    expect(after.stock["stk-3"]).toBe(99);
    // Croissant: 0.12 kg flour, 0.03 kg chocolate, 1 egg, 0.015 kg sugar.
    expect(after.stock["stk-7"]).toBeCloseTo(2.88, 3);
    expect(after.stock["stk-5"]).toBeCloseTo(0.97, 3);
    expect(after.stock["stk-6"]).toBe(5);
    expect(after.movementCount).toBe(9);
    expect((after.movementReasons as string[]).every((reason) => reason.includes("Receipt #1"))).toBe(true);
  });

  it("credits the cash account and POS Sales transaction", async () => {
    const user = userEvent.setup();
    renderProbe();
    await readSnapshot();

    await user.click(screen.getByRole("button", { name: "Complete cash sale" }));
    await waitFor(async () => {
      const after = await readSnapshot();
      expect(after.receiptCount).toBe(1);
    });

    const after = await readSnapshot();
    expect(after.receiptTotal).toBeCloseTo(240.8, 2);
    expect(after.receiptProfit).toBeCloseTo(188.3, 2);
    expect(after.cashBalance).toBeCloseTo(240.8, 2);
    expect(after.transactionCount).toBe(1);
    expect(after.transactions[0]).toMatchObject({
      type: "income",
      category: "POS Sales",
      account: "Cash drawer for tanawa",
    });
    expect(after.transactions[0].sum).toBeCloseTo(240.8, 2);
  });

  it("updates Reports -> Sales and Reports -> Receipts aggregates live", async () => {
    const user = userEvent.setup();
    renderProbe();
    await readSnapshot();

    await user.click(screen.getByRole("button", { name: "Complete cash sale" }));
    await waitFor(async () => {
      const after = await readSnapshot();
      expect(after.receiptCount).toBe(1);
    });

    const after = await readSnapshot();
    expect(after.sales.revenue).toBeCloseTo(240.8, 2);
    // Sales Report profit = revenue - COGS (240.80 - 26.70).
    expect(after.sales.profit).toBeCloseTo(214.1, 2);
    expect(after.sales.average).toBeCloseTo(240.8, 2);
    expect(after.receiptsSummary.netRevenue).toBeCloseTo(240.8, 2);
    // Receipts Report gross profit uses the stored receipt profit (ex-VAT).
    expect(after.receiptsSummary.grossProfit).toBeCloseTo(188.3, 2);
  });

  it("restores stock and logs a refund expense", async () => {
    const user = userEvent.setup();
    renderProbe();
    await readSnapshot();

    await user.click(screen.getByRole("button", { name: "Complete cash sale" }));
    await waitFor(async () => {
      const after = await readSnapshot();
      expect(after.receiptCount).toBe(1);
    });

    await user.click(screen.getByRole("button", { name: "Refund receipt 1" }));
    await waitFor(async () => {
      const after = await readSnapshot();
      expect(after.refunded).toBe(true);
    });

    const after = await readSnapshot();
    expect(after.stock["stk-2"]).toBe(2);
    expect(after.stock["stk-8"]).toBe(4);
    expect(after.stock["stk-10"]).toBe(100);
    expect(after.cashBalance).toBeCloseTo(0, 2);
    expect(after.transactionCount).toBe(2);
    expect(after.transactions[0]).toMatchObject({ type: "expense", category: "POS Refunds" });
    expect(after.transactions[0].sum).toBeCloseTo(240.8, 2);
    expect((after.movementReasons as string[]).some((reason) => reason.includes("Refund Receipt #1"))).toBe(true);
  });

  it("credits a new customer's registration bonus", async () => {
    const user = userEvent.setup();
    renderProbe();
    await readSnapshot();

    await user.click(screen.getByRole("button", { name: "Configure registration bonus" }));
    await waitFor(async () => {
      const after = await readSnapshot();
      expect(after.registrationBonus).toBe(25);
    });
    await user.click(screen.getByRole("button", { name: "Create customer" }));
    await waitFor(async () => {
      const after = await readSnapshot();
      expect(after.customer).not.toBeNull();
    });

    const after = await readSnapshot();
    expect(after.customer?.bonusBalance).toBe(25);
    expect(after.customer?.receiptCount).toBe(0);
  });
});
