import { expect, test, type Page } from "@playwright/test";

async function ready(page: Page) {
  await page.waitForFunction(() => document.documentElement.dataset.storeHydrated === "true");
}

test("admin password blocks deletes after a check is printed", async ({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());

  // Configure Security -> Require admin password -> delete item after a printed check.
  await page.goto("/manage/settings/security");
  await ready(page);
  const section = page.locator("section").filter({ hasText: "Require admin password" });
  const deleteRule = section.locator("select").first();
  await deleteRule.selectOption("In cases...");
  const afterCheckPrinted = section.getByLabel("After a check is printed");
  if (!(await afterCheckPrinted.isChecked())) await afterCheckPrinted.check();
  await page.getByRole("button", { name: "Save", exact: true }).click();

  // Print a check on the POS, then try to delete a line item.
  await page.goto("/pos");
  await ready(page);
  await expect(page.getByRole("button", { name: "Receipt #1" })).toBeVisible();
  await page.getByRole("button", { name: "Print check" }).click();

  const orderPanel = page.locator("aside").first();
  const minus = orderPanel.getByRole("button", { name: "−" }).first();
  await minus.click(); // 1 -> 0.5, still allowed
  await minus.click(); // 0.5 -> 0 triggers the admin guard
  await expect(page.getByRole("heading", { name: "Admin password required" })).toBeVisible();

  const password = page.getByPlaceholder("Admin password");
  await password.fill("9999");
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByRole("heading", { name: "Admin password required" })).toBeVisible();
  await expect(orderPanel.getByText("Capucino 250ml")).toHaveCount(1);

  await password.fill("1234");
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByRole("heading", { name: "Admin password required" })).toHaveCount(0);
  await expect(orderPanel.getByText("Capucino 250ml")).toHaveCount(0);

  // Clearing the whole order also requires the admin password.
  await page.getByLabel("Order actions").click();
  await page.getByRole("button", { name: "Clear order" }).click();
  await expect(page.getByRole("heading", { name: "Admin password required" })).toBeVisible();
  await page.getByPlaceholder("Admin password").fill("1234");
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(orderPanel.getByText("Croissant with chocolate")).toHaveCount(0);
});
