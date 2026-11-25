import { expect, test, type Page } from "@playwright/test";

async function ready(page: Page) {
  await page.waitForFunction(() => document.documentElement.dataset.storeHydrated === "true");
}

/** Wait until the persisted store in localStorage reflects the expected stock level. */
async function waitForStockQty(page: Page, stockId: string, expected: number) {
  await page.waitForFunction(
    ({ id, qty }) => {
      const raw = window.localStorage.getItem("tanawastore_pos_v1");
      if (!raw) return false;
      const state = JSON.parse(raw) as { stockItems?: { id: string; stock: number }[] };
      const item = state.stockItems?.find((entry) => entry.id === id);
      return item != null && Math.abs(item.stock - qty) < 1e-9;
    },
    { id: stockId, qty: expected },
  );
}

test("ordering unit -> supply -> inventory check updates stock and movements", async ({ page }) => {
  // 1. Create an ordering unit: one box = 10 pcs.
  await page.goto("/manage/inventory/ordering-units");
  await ready(page);
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByRole("heading", { name: "New Ordering Unit" }).waitFor();
  await page.getByPlaceholder("e.g. Box of 30").fill("Box of 10");
  await page.getByLabel("Quantity", { exact: true }).fill("10");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("cell", { name: "Box of 10", exact: true })).toBeVisible();
  await page.waitForFunction(() => {
    const raw = window.localStorage.getItem("tanawastore_pos_v1");
    return raw != null && (JSON.parse(raw) as { orderingUnits?: unknown[] }).orderingUnits?.length === 1;
  });

  // 2. Record a supply using the pack unit: 2 packs = 20 pcs at ₱4.00.
  await page.goto("/manage/inventory/supplies");
  await ready(page);
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByRole("heading", { name: "Add Supply" }).waitFor();
  const modal = page.locator("form");
  await modal.locator("select").filter({ has: page.getByRole("option", { name: /Box of 10/ }) }).selectOption({ label: "Box of 10 (10.00 pcs)" });
  await modal.getByLabel("Pack quantity").fill("2");
  await modal.getByLabel("Unit cost").fill("4");
  await expect(modal.getByText(/2 pack\(s\) = 20\.00 pcs/)).toBeVisible();
  await modal.getByRole("button", { name: "Save Supply & Update Stock" }).click();
  await expect(page.getByRole("cell", { name: "Borjomi 0.5l", exact: false }).first()).toBeVisible();
  // stk-1 = Borjomi 0.5l; 20 pcs seed + 2 packs × 10 = 40 pcs.
  await waitForStockQty(page, "stk-1", 40);

  // 3. Stock now holds 20 + 20 = 40 pcs.
  await page.goto("/manage/inventory/stock");
  await ready(page);
  await page.getByPlaceholder("Search...").fill("Borjomi");
  await expect(page.getByRole("cell", { name: "40.00 pcs", exact: true })).toBeVisible();

  // 4. Run an inventory check with a shortage of 5 pcs.
  await page.goto("/manage/inventory/inventory-checks");
  await ready(page);
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByRole("heading", { name: "New Inventory Check" }).waitFor();
  const borjomiRow = page.locator("tr").filter({ hasText: "Borjomi 0.5l" });
  await borjomiRow.locator('input[type="number"]').fill("35");
  await expect(borjomiRow.getByText("-5.00 pcs", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Complete Check" }).click();
  await expect(page.getByRole("cell", { name: "-20.00 ₱", exact: true })).toBeVisible();
  await waitForStockQty(page, "stk-1", 35);

  // 5. The stock balance and the ingredients movements agree with both records.
  await page.goto("/manage/inventory/stock");
  await ready(page);
  await page.getByPlaceholder("Search...").fill("Borjomi");
  await expect(page.getByRole("cell", { name: "35.00 pcs", exact: true })).toBeVisible();

  await page.goto("/manage/inventory/ingredients-movements");
  await ready(page);
  const movementsRow = page.locator("tr").filter({ hasText: "Borjomi 0.5l" }).first();
  // Supplies column aggregates the seed delivery (20) + the new 2-pack supply (20);
  // Expense picks up the 5 pcs inventory-check shortage; balance lands on 35.
  await expect(movementsRow).toContainText("40.00 pcs");
  await expect(movementsRow).toContainText("5.00 pcs");
  await expect(movementsRow).toContainText("35.00 pcs");
});
