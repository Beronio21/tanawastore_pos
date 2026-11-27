import { createHmac } from "node:crypto";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PosStoreProvider, usePosStore } from "@/lib/pos-store";
import { elapsedTone, nextTicketStatus, ticketActionLabel } from "@/lib/kitchen";
import { POST as billingWebhook } from "@/app/api/webhooks/billing/route";

function KitchenProbe() {
  const { state, actions } = usePosStore();
  const order = state.posOrders.find((entry) => entry.id === state.activePosOrderId) ?? state.posOrders[0];
  return (
    <div>
      <pre data-testid="tickets">
        {JSON.stringify(state.kdsTickets.map((ticket) => ({ id: ticket.id, status: ticket.status, station: ticket.station, source: ticket.source })))}
      </pre>
      <pre data-testid="receipts">
        {JSON.stringify(state.receipts.map((receipt) => ({ num: receipt.receiptNum, method: receipt.paymentMethod, total: receipt.total })))}
      </pre>
      <pre data-testid="accounts">{JSON.stringify(state.accounts.map((account) => ({ name: account.name, balance: account.balance })))}</pre>
      <pre data-testid="plan">{JSON.stringify({ plan: state.plan, status: state.subscriptionStatus, invoices: state.paidInvoices.length })}</pre>
      <button type="button" onClick={() => actions.sendOrderToKitchen(order.id)}>To kitchen</button>
      <button type="button" onClick={() => actions.bumpKdsTicket(state.kdsTickets[0]?.id ?? "")}>Advance ticket</button>
      <button type="button" onClick={() => actions.completePosSale(order.id, "GCash", 0)}>Pay GCash</button>
      <button type="button" onClick={() => actions.setPlan("enterprise", "INV-TEST-1")}>Activate enterprise</button>
    </div>
  );
}

async function snapshot(testId: string) {
  const element = await screen.findByTestId(testId);
  return JSON.parse(element.textContent ?? "null");
}

describe("station-based kitchen routing", () => {
  it("splits unsent items into Bar and Kitchen tickets and advances status", async () => {
    const user = userEvent.setup();
    render(<PosStoreProvider><KitchenProbe /></PosStoreProvider>);

    expect(await snapshot("tickets")).toEqual([]);
    await user.click(screen.getByRole("button", { name: "To kitchen" }));

    await waitFor(async () => {
      const tickets = await snapshot("tickets");
      expect(tickets).toHaveLength(2);
    });

    const created = await snapshot("tickets") as { id: string; status: string; station: string; source: string }[];
    expect(created.map((ticket) => ticket.station).sort()).toEqual(["Bar", "Kitchen"]);
    expect(created.every((ticket) => ticket.status === "queued")).toBe(true);
    expect(created.every((ticket) => ticket.source === "Dine-in")).toBe(true);

    await user.click(screen.getByRole("button", { name: "Advance ticket" }));
    await waitFor(async () => {
      const tickets = await snapshot("tickets");
      expect(tickets[0].status).toBe("preparing");
    });

    await user.click(screen.getByRole("button", { name: "Advance ticket" }));
    await waitFor(async () => {
      const tickets = await snapshot("tickets");
      expect(tickets[0].status).toBe("ready");
    });

    await user.click(screen.getByRole("button", { name: "Advance ticket" }));
    await waitFor(async () => {
      const tickets = await snapshot("tickets");
      expect(tickets).toHaveLength(1);
    });
  });

  it("labels actions and elapsed thresholds", () => {
    expect(nextTicketStatus("queued")).toBe("preparing");
    expect(nextTicketStatus("preparing")).toBe("ready");
    expect(nextTicketStatus("ready")).toBe("served");
    expect(ticketActionLabel("queued")).toBe("Start Prep");
    expect(ticketActionLabel("ready")).toBe("Bump / Served");

    const now = Date.now();
    const ticket = { id: "t", receiptNum: 1, tableName: "Table 1", station: "Bar", time: "8:00", items: [], openedAtMs: now - 9 * 60_000 };
    expect(elapsedTone(ticket, now)).toBe("amber");
    expect(elapsedTone({ ...ticket, openedAtMs: now - 16 * 60_000 }, now)).toBe("red");
    expect(elapsedTone({ ...ticket, openedAtMs: now - 60_000 }, now)).toBe("normal");
  });
});

describe("PayMongo digital checkout", () => {
  it("closes a GCash sale, credits the bank account and marks the receipt method", async () => {
    const user = userEvent.setup();
    render(<PosStoreProvider><KitchenProbe /></PosStoreProvider>);
    await screen.findByTestId("receipts");

    await user.click(screen.getByRole("button", { name: "Pay GCash" }));
    await waitFor(async () => {
      const receipts = await snapshot("receipts");
      expect(receipts).toHaveLength(1);
    });

    const receipts = await snapshot("receipts") as { method: string; total: number }[];
    expect(receipts[0].method).toBe("GCash");
    expect(receipts[0].total).toBeCloseTo(240.8, 2);
    const accounts = await snapshot("accounts") as { name: string; balance: number }[];
    const bank = accounts.find((account) => account.name === "Bank account");
    expect(bank?.balance).toBeCloseTo(240.8, 2);
  });

  it("activates a paid plan and records the invoice", async () => {
    const user = userEvent.setup();
    render(<PosStoreProvider><KitchenProbe /></PosStoreProvider>);
    await screen.findByTestId("plan");

    await user.click(screen.getByRole("button", { name: "Activate enterprise" }));
    await waitFor(async () => {
      const plan = await snapshot("plan");
      expect(plan.plan).toBe("enterprise");
      expect(plan.status).toBe("Paid");
      expect(plan.invoices).toBe(1);
    });
  });
});

const originalEnv = {
  databaseUrl: process.env.DATABASE_URL,
  billingSecret: process.env.BILLING_WEBHOOK_SECRET,
  paymongoSecret: process.env.PAYMONGO_WEBHOOK_SECRET,
};

beforeEach(() => {
  delete process.env.DATABASE_URL;
  delete process.env.BILLING_WEBHOOK_SECRET;
  delete process.env.PAYMONGO_WEBHOOK_SECRET;
});

afterEach(() => {
  if (originalEnv.databaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalEnv.databaseUrl;
  if (originalEnv.billingSecret === undefined) delete process.env.BILLING_WEBHOOK_SECRET;
  else process.env.BILLING_WEBHOOK_SECRET = originalEnv.billingSecret;
  if (originalEnv.paymongoSecret === undefined) delete process.env.PAYMONGO_WEBHOOK_SECRET;
  else process.env.PAYMONGO_WEBHOOK_SECRET = originalEnv.paymongoSecret;
});

describe("POST /api/webhooks/billing", () => {
  it("accepts the legacy shared-secret payload and activates the plan", async () => {
    process.env.BILLING_WEBHOOK_SECRET = "billing_test_secret";
    const response = await billingWebhook(new Request("http://localhost/api/webhooks/billing", {
      method: "POST",
      headers: { "content-type": "application/json", "x-billing-secret": "billing_test_secret" },
      body: JSON.stringify({ tenantId: "tenant_demo_tanawa", plan: "enterprise", invoiceId: "INV-42", status: "paid" }),
    }));
    expect(response.status).toBe(200);
    const payload = (await response.json()) as { plan: string; mode: string; invoiceNumber: string };
    expect(payload).toMatchObject({ plan: "enterprise", mode: "local", invoiceNumber: "INV-42" });
  });

  it("verifies the Paymongo-Signature header and derives the plan from centavos", async () => {
    process.env.PAYMONGO_WEBHOOK_SECRET = "whsec_test";
    const timestamp = Math.floor(Date.now() / 1000);
    const body = JSON.stringify({
      data: {
        id: "evt_1",
        attributes: {
          type: "payment.paid",
          data: {
            id: "pay_123",
            attributes: {
              reference_number: "tenant_demo_tanawa",
              amount: 149000,
              status: "paid",
              metadata: { tenant_id: "tenant_demo_tanawa" },
            },
          },
        },
      },
    });
    const signature = createHmac("sha256", "whsec_test").update(`${timestamp}.${body}`).digest("hex");
    const response = await billingWebhook(new Request("http://localhost/api/webhooks/billing", {
      method: "POST",
      headers: { "content-type": "application/json", "paymongo-signature": `t=${timestamp},te=${signature}` },
      body,
    }));
    expect(response.status).toBe(200);
    const payload = (await response.json()) as { plan: string; tenantId: string; status: string };
    expect(payload).toMatchObject({ plan: "starter", tenantId: "tenant_demo_tanawa", status: "paid" });
  });

  it("rejects an unsigned webhook", async () => {
    const response = await billingWebhook(new Request("http://localhost/api/webhooks/billing", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tenantId: "tenant_demo_tanawa", plan: "pro" }),
    }));
    expect(response.status).toBe(401);
  });
});
