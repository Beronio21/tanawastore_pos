import { expect, test, type Page } from "@playwright/test";

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => document.documentElement.dataset.storeHydrated === "true");
}

test("Kitchen Kit progression, receipts CSV export and thermal receipt preview", async ({ page }) => {
  // Allow kitchen tickets from this register (default is restricted).
  await page.goto("/manage/settings/security");
  await waitForHydration(page);
  const ticketSection = page.locator("section").filter({ hasText: "Tickets for kitchen" });
  await ticketSection.locator("select").nth(1).selectOption("Always");
  await page.getByRole("button", { name: "Save", exact: true }).click();

  await page.goto("/pos");
  await waitForHydration(page);

  // Route the seeded check to the station-based Kitchen Kit.
  await page.getByRole("button", { name: "To Kitchen" }).click();
  await expect(page.getByRole("button", { name: /Kitchen Kit \(2\)/ })).toBeVisible();
  await page.getByRole("button", { name: /Kitchen Kit/ }).click();

  // Station filter pills and ticket cards.
  await expect(page.getByRole("button", { name: /All stations \(2\)/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Bar \(\d+\)/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Kitchen \(\d+\)/ })).toBeVisible();
  await expect(page.getByText(/1 × Capucino 250ml/)).toBeVisible();
  await expect(page.getByText(/1 × Croissant with chocolate/)).toBeVisible();

  // queued → preparing → ready → served.
  const firstCard = page.locator("article").first();
  await firstCard.getByRole("button", { name: /Start Prep/ }).click();
  await expect(firstCard.getByRole("button", { name: /Mark Ready/ })).toBeVisible();
  await firstCard.getByRole("button", { name: /Mark Ready/ }).click();
  await expect(firstCard.getByRole("button", { name: /Bump \/ Served/ })).toBeVisible();
  await firstCard.getByRole("button", { name: /Bump \/ Served/ }).click();
  await expect(page.locator("article")).toHaveCount(1);

  // The dedicated kitchen display screen renders the same board.
  await page.goto("/pos/kitchen");
  await expect(page.getByRole("heading", { name: "Kitchen Kit" })).toBeVisible();

  // Reports → Receipts CSV export downloads with the UTF-8 BOM filename.
  await page.goto("/manage/reports/receipts");
  await expect(page.getByRole("heading", { name: "Receipts" })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Export/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^tanawa-receipts-report-\d{4}-\d{2}-\d{2}\.csv$/);

  // Thermal preview shows the BIR VAT breakdown after a cash sale.
  await page.goto("/pos");
  await waitForHydration(page);
  await page.getByRole("button", { name: /^Pay / }).click();
  await page.getByRole("button", { name: "Cash", exact: true }).click();
  await expect(page.getByText("Powered by Poster POS")).toBeVisible();
  await expect(page.getByText("VATable Sales")).toBeVisible();
  await expect(page.getByText("VAT Amount (12%)")).toBeVisible();
  await expect(page.getByText(/TOTAL \(₱\)/)).toBeVisible();
  await page.getByRole("button", { name: "Done" }).click();
});
