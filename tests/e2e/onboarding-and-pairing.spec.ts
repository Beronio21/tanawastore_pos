import { expect, test, type Page } from "@playwright/test";

async function ready(page: Page) {
  await page.waitForFunction(() => document.documentElement.dataset.storeHydrated === "true");
}

test("onboarding presets switch floor plan and station routing", async ({ page }) => {
  await page.goto("/onboarding");
  await ready(page);

  await expect(page.getByRole("heading", { name: "Set up your workspace" })).toBeVisible();

  // Restaurant: floor plan + Kitchen & Bar stations.
  await page.getByRole("button", { name: /Full-Service Restaurant/ }).click();
  await expect(page.getByText("Floor plan: enabled")).toBeVisible();
  await expect(page.getByText("Stations: Kitchen, Bar")).toBeVisible();
  await expect(page.getByText("Service charge: 10%")).toBeVisible();

  // Café: counter mode + Bar station only.
  await page.getByRole("button", { name: /Café, Coffee Shop/ }).click();
  await expect(page.getByText("Floor plan: counter mode")).toBeVisible();
  await expect(page.getByText("Stations: Bar", { exact: true })).toBeVisible();

  // Walk through to the launch summary.
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByLabel("Register password")).toHaveValue(/^[a-z0-9]{8}$/);
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByText("Trial plan")).toBeVisible();
  await expect(page.getByRole("button", { name: /Launch store/ })).toBeEnabled();
});

test("tablet pairing rejects bad credentials and locks the POS on success", async ({ page }) => {
  await page.goto("/pos/pair");
  await expect(page.getByRole("heading", { name: "Pair this register" })).toBeVisible();

  await page.getByPlaceholder("tanawa").fill("tanawa");
  await page.getByPlaceholder("8-character password").fill("wrongpass");
  await page.getByRole("button", { name: "Pair register" }).click();
  await expect(page.getByText("Invalid register login or password")).toBeVisible();

  await page.getByPlaceholder("8-character password").fill("m8hezbkf");
  await page.getByRole("button", { name: "Pair register" }).click();
  await page.waitForURL(/\/pos(\?lock=1)?$/);
  await expect(page.getByText("Point of Sale")).toBeVisible();
  await expect(page.getByText("Enter a staff PIN to unlock")).toBeVisible();
});
