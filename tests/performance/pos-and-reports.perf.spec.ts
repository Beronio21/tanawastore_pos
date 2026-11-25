import { expect, test, type Page } from "@playwright/test";
import { largeStoreInitScript } from "./seed-large-store";

const rows: Record<string, string>[] = [];
const INTERACTION_THRESHOLD = 100;
const REPORT_THRESHOLD = 300;

function record(metric: string, measured: number, threshold: number) {
  rows.push({
    Metric: metric,
    "Measured (ms)": measured.toFixed(1),
    "Threshold (ms)": String(threshold),
    Status: measured <= threshold ? "PASS" : "FAIL",
  });
  expect(measured, `${metric} must stay under ${threshold} ms`).toBeLessThanOrEqual(threshold);
}

test.afterAll(() => {
  console.log("\nConsole benchmark summary");
  console.table(rows);
});

async function seedLargeStore(page: Page) {
  const { key, value } = largeStoreInitScript();
  await page.addInitScript(
    ({ storageKey, payload }) => {
      window.localStorage.setItem(storageKey, payload);
    },
    { storageKey: key, payload: value },
  );
}

/** Resolves with the `performance.now()` timestamp at which the store finished hydrating. */
async function ready(page: Page): Promise<number> {
  const handle = await page.waitForFunction(() => {
    if (document.documentElement.dataset.storeHydrated === "true") return performance.now();
    return false;
  });
  return Number(await handle.jsonValue());
}

/** Client render cost: DOMContentLoaded -> store hydrated + first paint. */
async function renderSinceDCL(page: Page, hydratedAt: number): Promise<number> {
  return page.evaluate((at) => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    return at - nav.domContentLoadedEventEnd;
  }, hydratedAt);
}

/**
 * Measures steady-state initial render for a route: one warmup load to absorb
 * cold chunk JIT, then the best of two measured reloads.
 */
async function measureInitialRender(page: Page, route: string): Promise<number> {
  await page.goto(route);
  await ready(page);
  const samples: number[] = [];
  for (let run = 0; run < 2; run += 1) {
    await page.goto(route);
    const hydratedAt = await ready(page);
    samples.push(await renderSinceDCL(page, hydratedAt));
  }
  return Math.min(...samples);
}

/** Click a button by visible text and measure through two painted frames. */
async function measureClick(page: Page, label: string): Promise<number> {
  return page.evaluate(async (text) => {
    const button = Array.from(document.querySelectorAll("button")).find((entry) =>
      (entry.textContent ?? "").includes(text),
    );
    if (!button) throw new Error(`Button not found: ${text}`);
    const start = performance.now();
    button.click();
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    return performance.now() - start;
  }, label);
}

/** Change an input value and measure through two painted frames. */
async function measureFilter(page: Page, placeholder: string, value: string): Promise<number> {
  return page.evaluate(async ({ placeholderText, nextValue }) => {
    const input = Array.from(document.querySelectorAll("input")).find(
      (entry) => entry.placeholder === placeholderText,
    ) as HTMLInputElement | undefined;
    if (!input) throw new Error(`Input not found: ${placeholderText}`);
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    const start = performance.now();
    setter?.call(input, nextValue);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    return performance.now() - start;
  }, { placeholderText: placeholder, nextValue: value });
}

test.describe("POS terminal responsiveness", () => {
  test("adding items, switching panels and opening order history stay under 100 ms", async ({ page }) => {
    await seedLargeStore(page);
    await page.goto("/pos");
    await ready(page);
    await expect(page.getByRole("button", { name: "Receipt #1001" })).toBeVisible();

    // Warm up JIT/render paths with an unmeasured add, then measure steady-state.
    await measureClick(page, "Perf Product 0");
    const addMs = await measureClick(page, "Perf Product 0");
    await expect(page.locator("aside").getByText("Perf Product 0").first()).toBeVisible();
    record("POS add item", addMs, INTERACTION_THRESHOLD);

    const customerMs = await measureClick(page, "Customer");
    await expect(page.getByPlaceholder("Search by name or phone")).toBeVisible();
    record("POS switch Receipt -> Customer", customerMs, INTERACTION_THRESHOLD);

    const receiptMs = await measureClick(page, "Receipt");
    await expect(page.getByRole("button", { name: "Receipt #1001" })).toBeVisible();
    record("POS switch Customer -> Receipt", receiptMs, INTERACTION_THRESHOLD);

    const kitchenMs = await measureClick(page, "Kitchen Kit");
    await expect(page.getByRole("button", { name: "All stations" })).toBeVisible();
    record("POS switch to Kitchen Kit", kitchenMs, INTERACTION_THRESHOLD);

    const historyMs = await measureClick(page, "Orders");
    await expect(page.getByRole("heading", { name: "Order history" })).toBeVisible();
    record("POS open Order history", historyMs, INTERACTION_THRESHOLD);
  });

  test("creates 20 consecutive receipts and 50 lines without duplicate keys", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    await seedLargeStore(page);
    await page.goto("/pos");
    await ready(page);
    await expect(page.getByRole("button", { name: "Receipt #1001" })).toBeVisible();

    const productTile = page.getByRole("button", { name: /Perf Product 0/ }).first();
    for (let index = 0; index < 20; index += 1) {
      await page.getByRole("button", { name: "+ New", exact: true }).click();
      await productTile.click();
      await productTile.click();
      if (index < 10) {
        await page.getByRole("button", { name: /Perf Product 1/ }).first().click();
      }
    }

    const labels = await page.getByRole("button", { name: /^Receipt #\d+$/ }).allTextContents();
    expect(labels).toHaveLength(21);
    expect(new Set(labels).size).toBe(labels.length);
    expect(errors).toEqual([]);
  });
});

test.describe("Console report aggregation with 1,000 receipts", () => {
  test("initial render and filtering stay under 300 ms", async ({ page }) => {
    await seedLargeStore(page);

    await page.goto("/manage/dash/stat");
    await expect(page.getByRole("heading", { name: "Sales Report" })).toBeVisible();
    record("Sales Report initial render", await measureInitialRender(page, "/manage/dash/stat"), REPORT_THRESHOLD);

    await page.getByRole("button", { name: /—/ }).first().click();
    const dateMs = await measureClick(page, "This month");
    await expect(page.getByText("This month")).toHaveCount(0);
    record("Sales Report date preset filter", dateMs, REPORT_THRESHOLD);

    await page.goto("/manage/reports/receipts");
    await expect(page.getByRole("heading", { name: "Receipts" })).toBeVisible();
    record("Receipts Report initial render", await measureInitialRender(page, "/manage/reports/receipts"), REPORT_THRESHOLD);

    const receiptFilterMs = await measureFilter(page, "Quick search", "no-such-receipt");
    await expect(page.getByText("No receipts match the selected filters.")).toBeVisible();
    record("Receipts Report search filter", receiptFilterMs, REPORT_THRESHOLD);

    await page.goto("/manage/inventory/stock");
    await expect(page.getByRole("heading", { name: "Stock" })).toBeVisible();
    record("Stock initial render", await measureInitialRender(page, "/manage/inventory/stock"), REPORT_THRESHOLD);

    const stockFilterMs = await measureFilter(page, "Search...", "Perf Stock 28");
    await expect(page.getByText("Perf Stock 28", { exact: true })).toBeVisible();
    record("Stock search filter", stockFilterMs, REPORT_THRESHOLD);
  });
});
