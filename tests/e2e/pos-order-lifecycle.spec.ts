import { expect, test, type Page } from "@playwright/test";

function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

async function waitForHydration(page: Page) {
  await page.waitForFunction(() => document.documentElement.dataset.storeHydrated === "true");
}

test("POS order lifecycle: lock, PIN unlock, customers, kitchen, payment and receipts report", async ({ page }) => {
  const errors = collectConsoleErrors(page);

  // The demo register starts restricted; allow kitchen tickets from this register.
  await page.goto("/manage/settings/security");
  await waitForHydration(page);
  const ticketSection = page.locator("section").filter({ hasText: "Tickets for kitchen" });
  await ticketSection.locator("select").nth(1).selectOption("Always");
  await page.getByRole("button", { name: "Save", exact: true }).click();

  await page.goto("/pos");
  await waitForHydration(page);
  await page.getByRole("button", { name: "Lock" }).click();
  await expect(page.getByText("Point of Sale")).toBeVisible();

  for (const digit of ["0", "0", "0", "0"]) {
    await page.getByRole("button", { name: digit, exact: true }).click();
  }
  await expect(page.getByRole("button", { name: "Receipt #1" })).toBeVisible();

  // Receipt #2 opens as an independent tab without duplicating Receipt #1.
  await page.getByRole("button", { name: "+ New", exact: true }).click();
  await expect(page.getByRole("button", { name: "Receipt #2" })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Receipt #\d+$/ })).toHaveCount(2);
  await page.getByRole("button", { name: "Receipt #1" }).click();

  // Create a customer from the Customer tab and apply it to the check.
  await page.getByRole("button", { name: "Customer", exact: true }).click();
  await page.getByRole("button", { name: "New customer" }).click();
  await page.getByPlaceholder("Full name").fill("E2E Customer");
  await page.getByPlaceholder("Phone", { exact: true }).fill("09990001111");
  await page.getByRole("button", { name: "Save customer" }).click();
  await expect(page.getByRole("option", { name: /E2E Customer/ })).toBeAttached();
  await expect(page.getByRole("button", { name: "Customer card" })).toBeVisible();

  // Add a product, then route the check to the Kitchen Kit.
  await page.getByRole("button", { name: /Capucino 250ml/ }).click();
  await page.getByRole("button", { name: "To Kitchen" }).click();
  await expect(page.getByRole("button", { name: /Kitchen Kit \(2\)/ })).toBeVisible();
  await page.getByRole("button", { name: /Kitchen Kit/ }).click();
  await expect(page.getByText("2 × Capucino 250ml")).toBeVisible();
  await expect(page.getByText("1 × Croissant with chocolate")).toBeVisible();
  await page.getByRole("button", { name: "Register", exact: true }).click();

  // Pay the check in cash.
  await page.getByRole("button", { name: /^Pay / }).click();
  await expect(page.getByLabel("Amount tendered")).toBeVisible();
  await page.getByRole("button", { name: "Cash" }).click();
  await expect(page.getByText("Powered by Poster POS")).toBeVisible();
  await page.getByRole("button", { name: "Done" }).click();

  // The sale is visible in the POS order history.
  await page.getByRole("button", { name: "Orders" }).click();
  await expect(page.getByRole("heading", { name: "Order history" })).toBeVisible();
  await expect(page.getByText("#1", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("Receipt #1 •", { exact: false })).toBeVisible();
  await page.locator("aside").getByRole("button", { name: "Close" }).click();

  // And in the Management Console receipts report.
  await page.goto("/manage/reports/receipts");
  await expect(page.getByRole("heading", { name: "Receipts" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "1", exact: true }).first()).toBeVisible();
  await expect(page.getByText(/375\.20/).first()).toBeVisible();

  expect(errors).toEqual([]);
});
