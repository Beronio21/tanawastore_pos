import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PosStoreProvider, usePosStore } from "@/lib/pos-store";

function TenantProbe() {
  const { state, actions } = usePosStore();
  return (
    <div>
      <pre data-testid="company">{state.settings.companyName}</pre>
      <pre data-testid="categories">{state.menuCategories.length}</pre>
      <button type="button" onClick={() => actions.updateSettings({ companyName: "Tenant A Co" })}>
        Rename workspace
      </button>
      <button type="button" onClick={() => actions.createMenuCategory("Tenant A Category")}>
        Add tenant category
      </button>
    </div>
  );
}

async function mountTenant(tenantId: string) {
  const view = render(
    <PosStoreProvider tenantId={tenantId}>
      <TenantProbe />
    </PosStoreProvider>,
  );
  await waitFor(() => expect(screen.getByTestId("company")).toHaveTextContent("tanawa"));
  return view;
}

describe("multi-tenant workspace isolation", () => {
  it("keeps state, catalog and settings separate per tenantId", async () => {
    const user = userEvent.setup();
    const tenantA = await mountTenant("tenant-a");

    await user.click(screen.getByRole("button", { name: "Rename workspace" }));
    await waitFor(() => expect(screen.getByTestId("company")).toHaveTextContent("Tenant A Co"));
    await user.click(screen.getByRole("button", { name: "Add tenant category" }));
    await waitFor(() => expect(screen.getByTestId("categories")).toHaveTextContent("4"));

    await waitFor(() => {
      const stored = window.localStorage.getItem("tanawa_pos_state_tenant-a");
      expect(stored).toContain("Tenant A Co");
    });
    expect(window.localStorage.getItem("tanawa_pos_state_tenant-b")).toBeNull();
    tenantA.unmount();

    // Tenant B starts from the seed, not Tenant A's catalog/settings.
    const tenantB = await mountTenant("tenant-b");
    expect(screen.getByTestId("company")).toHaveTextContent("tanawa");
    expect(screen.getByTestId("categories")).toHaveTextContent("3");
    expect(window.localStorage.getItem("tanawa_pos_state_tenant-b")).not.toContain("Tenant A Co");
    tenantB.unmount();

    // Switching back re-hydrates Tenant A's own namespace.
    render(
      <PosStoreProvider tenantId="tenant-a">
        <TenantProbe />
      </PosStoreProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("company")).toHaveTextContent("Tenant A Co"));
    await waitFor(() => expect(screen.getByTestId("categories")).toHaveTextContent("4"));
  });
});
