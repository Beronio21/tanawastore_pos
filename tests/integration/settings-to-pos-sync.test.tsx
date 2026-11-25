import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PosStoreProvider, usePosStore } from "@/lib/pos-store";
import PosPage from "@/app/pos/page";

function SettingsProbe() {
  const { state, actions } = usePosStore();
  return (
    <div>
      <button type="button" onClick={() => actions.updateSettings({ showFloorPlan: true })}>
        Enable floor plan
      </button>
      <button
        type="button"
        onClick={() => actions.saveOrderSource("os-takeout", { title: "Takeout", displayOnPos: true, serviceFeePct: 0 })}
      >
        Enable takeout source
      </button>
      <button type="button" onClick={() => actions.togglePaymentMethodPos("pm-card")}>
        Hide card payment
      </button>
      <button
        type="button"
        onClick={() =>
          actions.saveDeliverySettings({
            ...state.deliverySettings,
            areas: [{ id: "da-express", name: "Express lane", cost: 25, serviceTimeMin: 20 }],
          })
        }
      >
        Set delivery area
      </button>
      <button
        type="button"
        onClick={() =>
          actions.saveSecuritySettings({
            ...state.securitySettings,
            adminRules: { ...state.securitySettings.adminRules, deleteItem: "Always" },
          })
        }
      >
        Require admin for delete
      </button>
      <button
        type="button"
        onClick={() =>
          actions.saveReceiptSettings({
            ...state.receiptSettings,
            printComments: true,
            printPredictions: true,
            predictions: ["Test prediction"],
          })
        }
      >
        Enable receipt extras
      </button>
      <button
        type="button"
        onClick={() =>
          actions.saveReceiptSettings({
            ...state.receiptSettings,
            printComments: true,
            printPredictions: false,
            predictions: ["Test prediction"],
          })
        }
      >
        Disable predictions
      </button>
      <button type="button" onClick={() => actions.setOrderNote("Integration note")}>
        Set order note
      </button>
      <button type="button" onClick={() => actions.addItemToOrder("prod-2")}>
        Add coffee
      </button>
    </div>
  );
}

function renderPos() {
  return render(
    <PosStoreProvider>
      <SettingsProbe />
      <PosPage />
    </PosStoreProvider>,
  );
}

async function payCash(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /^Pay / }));
  const tendered = screen.getByLabelText("Amount tendered");
  await user.clear(tendered);
  await user.type(tendered, "500");
  await user.click(screen.getByRole("button", { name: "Cash" }));
}

describe("settings to POS synchronization", () => {
  it("shows the Floor Plan tab, order sources and delivery areas immediately", async () => {
    const user = userEvent.setup();
    renderPos();
    await screen.findByRole("button", { name: "Receipt #1" });
    expect(screen.queryByRole("button", { name: "Floor Plan" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Enable floor plan" }));
    expect(await screen.findByRole("button", { name: "Floor Plan" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Enable takeout source" }));
    const sourceSelect = screen.getByLabelText("Order source");
    expect(Array.from(sourceSelect.querySelectorAll("option")).map((option) => option.textContent)).toContain("Takeout");

    await user.click(screen.getByRole("button", { name: "Set delivery area" }));
    const deliverySelect = screen.getByLabelText("Delivery area");
    expect(deliverySelect.textContent).toContain("Express lane");
  });

  it("hides a payment method from checkout when it is disabled", async () => {
    const user = userEvent.setup();
    renderPos();
    await screen.findByRole("button", { name: "Receipt #1" });

    await user.click(screen.getByRole("button", { name: "Hide card payment" }));
    await user.click(screen.getByRole("button", { name: /^Pay / }));

    expect(screen.getByRole("button", { name: "Cash" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Card" })).not.toBeInTheDocument();
  });

  it("enforces the admin password rule after a settings change", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderPos();
    await screen.findByRole("button", { name: "Receipt #1" });

    await user.click(screen.getByRole("button", { name: "Require admin for delete" }));
    await user.click(screen.getByLabelText("Order actions"));
    await user.click(screen.getByRole("button", { name: "Clear order" }));

    expect(await screen.findByRole("heading", { name: "Admin password required" })).toBeInTheDocument();
    const password = screen.getByPlaceholderText("Admin password");

    await user.type(password, "9999");
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(screen.getByRole("heading", { name: "Admin password required" })).toBeInTheDocument();

    await user.clear(password);
    await user.type(password, "1234");
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Admin password required" })).not.toBeInTheDocument();
    });
    expect(confirmSpy).toHaveBeenCalled();
  });

  it("prints receipt comments and predictions when enabled", async () => {
    const user = userEvent.setup();
    renderPos();
    await screen.findByRole("button", { name: "Receipt #1" });

    await user.click(screen.getByRole("button", { name: "Enable receipt extras" }));
    await user.click(screen.getByRole("button", { name: "Set order note" }));
    await payCash(user);

    expect(await screen.findByText(/Comment: Integration note/)).toBeInTheDocument();
    expect(screen.getByText("Test prediction")).toBeInTheDocument();
  });

  it("omits predictions when Print predictions is disabled", async () => {
    const user = userEvent.setup();
    renderPos();
    await screen.findByRole("button", { name: "Receipt #1" });

    await user.click(screen.getByRole("button", { name: "Disable predictions" }));
    await user.click(screen.getByRole("button", { name: "Set order note" }));
    await payCash(user);

    expect(await screen.findByText(/Comment: Integration note/)).toBeInTheDocument();
    expect(screen.queryByText("Test prediction")).not.toBeInTheDocument();
  });
});
