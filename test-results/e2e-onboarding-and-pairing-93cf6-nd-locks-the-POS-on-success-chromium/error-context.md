# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\onboarding-and-pairing.spec.ts >> tablet pairing rejects bad credentials and locks the POS on success
- Location: tests\e2e\onboarding-and-pairing.spec.ts:32:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Invalid register login or password')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Invalid register login or password') with timeout 15000ms
  - waiting for getByText('Invalid register login or password')

```

```yaml
- heading "Pair this register" [level=1]
- paragraph: Enter the tablet credentials from Access → Tablets.
- text: Register login
- textbox "Register login":
  - /placeholder: tanawa
  - text: tanawa
- text: Register password
- textbox "Register password":
  - /placeholder: 8-character password
  - text: wrongpass
- alert: Pairing failed. Check the register credentials.
- button "Pair register"
- paragraph: The tablet opens the POS locked on the 4-digit staff PIN screen.
- link "Back to POS":
  - /url: /pos
- text: TanAwa POS
- alert
```

# Test source

```ts
  1  | import { expect, test, type Page } from "@playwright/test";
  2  | 
  3  | async function ready(page: Page) {
  4  |   await page.waitForFunction(() => document.documentElement.dataset.storeHydrated === "true");
  5  | }
  6  | 
  7  | test("onboarding presets switch floor plan and station routing", async ({ page }) => {
  8  |   await page.goto("/onboarding");
  9  |   await ready(page);
  10 | 
  11 |   await expect(page.getByRole("heading", { name: "Set up your workspace" })).toBeVisible();
  12 | 
  13 |   // Restaurant: floor plan + Kitchen & Bar stations.
  14 |   await page.getByRole("button", { name: /Full-Service Restaurant/ }).click();
  15 |   await expect(page.getByText("Floor plan: enabled")).toBeVisible();
  16 |   await expect(page.getByText("Stations: Kitchen, Bar")).toBeVisible();
  17 |   await expect(page.getByText("Service charge: 10%")).toBeVisible();
  18 | 
  19 |   // Café: counter mode + Bar station only.
  20 |   await page.getByRole("button", { name: /Café, Coffee Shop/ }).click();
  21 |   await expect(page.getByText("Floor plan: counter mode")).toBeVisible();
  22 |   await expect(page.getByText("Stations: Bar", { exact: true })).toBeVisible();
  23 | 
  24 |   // Walk through to the launch summary.
  25 |   await page.getByRole("button", { name: /Continue/ }).click();
  26 |   await expect(page.getByLabel("Register password")).toHaveValue(/^[a-z0-9]{8}$/);
  27 |   await page.getByRole("button", { name: /Continue/ }).click();
  28 |   await expect(page.getByText("Trial plan")).toBeVisible();
  29 |   await expect(page.getByRole("button", { name: /Launch store/ })).toBeEnabled();
  30 | });
  31 | 
  32 | test("tablet pairing rejects bad credentials and locks the POS on success", async ({ page }) => {
  33 |   await page.goto("/pos/pair");
  34 |   await expect(page.getByRole("heading", { name: "Pair this register" })).toBeVisible();
  35 | 
  36 |   await page.getByPlaceholder("tanawa").fill("tanawa");
  37 |   await page.getByPlaceholder("8-character password").fill("wrongpass");
  38 |   await page.getByRole("button", { name: "Pair register" }).click();
> 39 |   await expect(page.getByText("Invalid register login or password")).toBeVisible();
     |                                                                      ^ Error: expect(locator).toBeVisible() failed
  40 | 
  41 |   await page.getByPlaceholder("8-character password").fill("m8hezbkf");
  42 |   await page.getByRole("button", { name: "Pair register" }).click();
  43 |   await page.waitForURL(/\/pos(\?lock=1)?$/);
  44 |   await expect(page.getByText("Point of Sale")).toBeVisible();
  45 |   await expect(page.getByText("Enter a staff PIN to unlock")).toBeVisible();
  46 | });
  47 | 
```