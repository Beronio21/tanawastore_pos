# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\pos-order-lifecycle.spec.ts >> POS order lifecycle: lock, PIN unlock, customers, kitchen, payment and receipts report
- Location: tests\e2e\pos-order-lifecycle.spec.ts:16:1

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 7

- Array []
+ Array [
+   "Failed to load resource: the server responded with a status of 401 (Unauthorized)",
+   "Failed to load resource: the server responded with a status of 401 (Unauthorized)",
+   "Failed to load resource: the server responded with a status of 401 (Unauthorized)",
+   "Failed to load resource: the server responded with a status of 401 (Unauthorized)",
+   "Failed to load resource: the server responded with a status of 401 (Unauthorized)",
+ ]
```

# Page snapshot

```yaml
- generic [active] [ref=f2e1]:
  - generic [ref=f2e2]:
    - paragraph [ref=f2e4]:
      - text: Trial period ends on 7 December 2026 year. To avoid blocking the POS, pay for the subscription.
      - button "Pay" [ref=f2e5] [cursor=pointer]
    - generic [ref=f2e6]:
      - complementary [ref=f2e7]:
        - generic [ref=f2e8]:
          - generic [ref=f2e9]:
            - button "Collapse / Expand Sidebar" [ref=f2e10] [cursor=pointer]
            - link "T TanAwa POS" [ref=f2e14] [cursor=pointer]:
              - /url: /manage/welcome
              - generic [ref=f2e15]: T
              - generic [ref=f2e16]: TanAwa POS
            - link "Open POS Terminal" [ref=f2e17] [cursor=pointer]:
              - /url: /pos
          - navigation [ref=f2e21]:
            - button "Get started 1" [ref=f2e23] [cursor=pointer]:
              - generic [ref=f2e24]: Get started
              - generic [ref=f2e29]: "1"
            - button "Reports" [ref=f2e31] [cursor=pointer]
            - button "Finances" [ref=f2e37] [cursor=pointer]
            - button "Menu" [ref=f2e43] [cursor=pointer]
            - button "Inventory" [ref=f2e50] [cursor=pointer]
            - button "Marketing" [ref=f2e58] [cursor=pointer]
            - button "Access" [ref=f2e65] [cursor=pointer]
            - button "Applications" [ref=f2e74] [cursor=pointer]
            - button "Settings" [ref=f2e83] [cursor=pointer]
            - link "Open POS" [ref=f2e90] [cursor=pointer]:
              - /url: /pos
        - generic [ref=f2e100]:
          - button "PV Philip Venje Beronio" [ref=f2e101]:
            - generic [ref=f2e102]: PV
            - generic [ref=f2e103]: Philip Venje Beronio
          - button "Toggle Light / Dark Console Theme" [ref=f2e106] [cursor=pointer]
      - main [ref=f2e109]:
        - status [ref=f2e111]: Saved
        - generic [ref=f2e115]:
          - generic [ref=f2e116]:
            - generic [ref=f2e117]:
              - heading "Receipts" [level=1] [ref=f2e118]
              - generic [ref=f2e119]: "3"
            - generic [ref=f2e120]:
              - button "Columns ▾" [ref=f2e121]
              - button "Export ▾" [ref=f2e125]
              - button "Print" [ref=f2e130]
              - button "27 November" [ref=f2e137] [cursor=pointer]
          - generic [ref=f2e143]:
            - textbox "Quick search" [ref=f2e145]
            - button "Waiter ▾" [ref=f2e146] [cursor=pointer]
            - button "Payments count ▾" [ref=f2e147] [cursor=pointer]
            - button "Status ▾" [ref=f2e149] [cursor=pointer]
            - button "Online orders ▾" [ref=f2e150] [cursor=pointer]
            - button "+ Filter" [ref=f2e151] [cursor=pointer]
          - table [ref=f2e153]:
            - rowgroup [ref=f2e154]:
              - row [ref=f2e155]:
                - columnheader "# ▾" [ref=f2e156]
                - columnheader "Waiter" [ref=f2e157]
                - columnheader "Open" [ref=f2e158]
                - columnheader "Close" [ref=f2e159]
                - columnheader "Paid" [ref=f2e160]
                - columnheader "Order discount" [ref=f2e161]
                - columnheader "Profit" [ref=f2e162]
                - columnheader "Status" [ref=f2e163]
                - columnheader "Actions" [ref=f2e164]
            - rowgroup [ref=f2e165]:
              - row [ref=f2e166]:
                - cell "3" [ref=f2e167]
                - cell "Philip Venje Beronio" [ref=f2e168]
                - cell "12:18 PM" [ref=f2e169]
                - cell "—" [ref=f2e170]
                - cell "0.00 ₱" [ref=f2e171]
                - cell "0.00 ₱" [ref=f2e172]
                - cell "0.00 ₱" [ref=f2e173]
                - cell "Open" [ref=f2e174]
                - cell [ref=f2e175]:
                  - generic [ref=f2e176]:
                    - button "Details" [ref=f2e177] [cursor=pointer]
                    - 'button "More actions for receipt #3" [ref=f2e178] [cursor=pointer]': •••
              - row [ref=f2e179]:
                - cell "2" [ref=f2e180]
                - cell "Philip Venje Beronio" [ref=f2e181]
                - cell "12:18 PM" [ref=f2e182]
                - cell "—" [ref=f2e183]
                - cell "0.00 ₱" [ref=f2e184]
                - cell "0.00 ₱" [ref=f2e185]
                - cell "0.00 ₱" [ref=f2e186]
                - cell "Open" [ref=f2e187]
                - cell [ref=f2e188]:
                  - generic [ref=f2e189]:
                    - button "Details" [ref=f2e190] [cursor=pointer]
                    - 'button "More actions for receipt #2" [ref=f2e191] [cursor=pointer]': •••
              - row [ref=f2e192]:
                - cell "1" [ref=f2e193]
                - cell "Philip Venje Beronio" [ref=f2e194]
                - cell "8:10 pm" [ref=f2e195]
                - cell "12:18 PM" [ref=f2e196]
                - cell "375.20 ₱" [ref=f2e197]
                - cell "0.00 ₱" [ref=f2e198]
                - cell "295.80 ₱" [ref=f2e199]
                - cell "Close" [ref=f2e200]
                - cell [ref=f2e201]:
                  - generic [ref=f2e202]:
                    - button "Details" [ref=f2e203] [cursor=pointer]
                    - 'button "More actions for receipt #1" [ref=f2e204] [cursor=pointer]': •••
          - generic [ref=f2e206]:
            - generic [ref=f2e207]:
              - generic [ref=f2e208]:
                - generic [ref=f2e209]: 375.20 ₱
                - generic [ref=f2e210]: Net revenue
              - generic [ref=f2e211]:
                - generic [ref=f2e212]: 375.20 ₱
                - generic [ref=f2e213]: Cash
              - generic [ref=f2e214]:
                - generic [ref=f2e215]: 0.00 ₱
                - generic [ref=f2e216]: Cards
              - generic [ref=f2e217]:
                - generic [ref=f2e218]: 0.00 ₱
                - generic [ref=f2e219]: Gift cards
              - generic [ref=f2e220]:
                - generic [ref=f2e221]: 0.00 ₱
                - generic [ref=f2e222]: Online payment
              - generic [ref=f2e223]:
                - generic [ref=f2e224]: 0.00 ₱
                - generic [ref=f2e225]: Discounts
              - generic [ref=f2e226]:
                - generic [ref=f2e227]: 295.80 ₱
                - generic [ref=f2e228]: Gross profits
            - button "Details" [ref=f2e229] [cursor=pointer]
    - generic [ref=f2e233]:
      - generic [ref=f2e234]:
        - button "Dismiss support bubble" [ref=f2e235] [cursor=pointer]
        - generic [ref=f2e239]:
          - generic [ref=f2e240]: AK
          - generic [ref=f2e241]: ML
        - paragraph [ref=f2e242]: Got any questions? Please tell us more about what you need help with. Describe your question in a single message, providing as much detail as possible.
      - button "Poster Support Chat" [ref=f2e243] [cursor=pointer]
  - button "Open Next.js Dev Tools" [ref=f2e251] [cursor=pointer]
  - alert [ref=f2e255]
```

# Test source

```ts
  1  | import { expect, test, type Page } from "@playwright/test";
  2  | 
  3  | function collectConsoleErrors(page: Page): string[] {
  4  |   const errors: string[] = [];
  5  |   page.on("console", (message) => {
  6  |     if (message.type() === "error") errors.push(message.text());
  7  |   });
  8  |   page.on("pageerror", (error) => errors.push(error.message));
  9  |   return errors;
  10 | }
  11 | 
  12 | async function waitForHydration(page: Page) {
  13 |   await page.waitForFunction(() => document.documentElement.dataset.storeHydrated === "true");
  14 | }
  15 | 
  16 | test("POS order lifecycle: lock, PIN unlock, customers, kitchen, payment and receipts report", async ({ page }) => {
  17 |   const errors = collectConsoleErrors(page);
  18 | 
  19 |   // The demo register starts restricted; allow kitchen tickets from this register.
  20 |   await page.goto("/manage/settings/security");
  21 |   await waitForHydration(page);
  22 |   const ticketSection = page.locator("section").filter({ hasText: "Tickets for kitchen" });
  23 |   await ticketSection.locator("select").nth(1).selectOption("Always");
  24 |   await page.getByRole("button", { name: "Save", exact: true }).click();
  25 | 
  26 |   await page.goto("/pos");
  27 |   await waitForHydration(page);
  28 |   await page.getByRole("button", { name: "Lock" }).click();
  29 |   await expect(page.getByText("Point of Sale")).toBeVisible();
  30 | 
  31 |   for (const digit of ["0", "0", "0", "0"]) {
  32 |     await page.getByRole("button", { name: digit, exact: true }).click();
  33 |   }
  34 |   await expect(page.getByRole("button", { name: "Receipt #1" })).toBeVisible();
  35 | 
  36 |   // Receipt #2 opens as an independent tab without duplicating Receipt #1.
  37 |   await page.getByRole("button", { name: "+ New", exact: true }).click();
  38 |   await expect(page.getByRole("button", { name: "Receipt #2" })).toBeVisible();
  39 |   await expect(page.getByRole("button", { name: /^Receipt #\d+$/ })).toHaveCount(2);
  40 |   await page.getByRole("button", { name: "Receipt #1" }).click();
  41 | 
  42 |   // Create a customer from the Customer tab and apply it to the check.
  43 |   await page.getByRole("button", { name: "Customer", exact: true }).click();
  44 |   await page.getByRole("button", { name: "New customer" }).click();
  45 |   await page.getByPlaceholder("Full name").fill("E2E Customer");
  46 |   await page.getByPlaceholder("Phone", { exact: true }).fill("09990001111");
  47 |   await page.getByRole("button", { name: "Save customer" }).click();
  48 |   await expect(page.getByRole("option", { name: /E2E Customer/ })).toBeAttached();
  49 |   await expect(page.getByRole("button", { name: "Customer card" })).toBeVisible();
  50 | 
  51 |   // Add a product, then route the check to the Kitchen Kit.
  52 |   await page.getByRole("button", { name: /Capucino 250ml/ }).click();
  53 |   await page.getByRole("button", { name: "To Kitchen" }).click();
  54 |   await expect(page.getByRole("button", { name: /Kitchen Kit \(2\)/ })).toBeVisible();
  55 |   await page.getByRole("button", { name: /Kitchen Kit/ }).click();
  56 |   await expect(page.getByText("2 × Capucino 250ml")).toBeVisible();
  57 |   await expect(page.getByText("1 × Croissant with chocolate")).toBeVisible();
  58 |   await page.getByRole("button", { name: "Register", exact: true }).click();
  59 | 
  60 |   // Pay the check in cash.
  61 |   await page.getByRole("button", { name: /^Pay / }).click();
  62 |   await expect(page.getByLabel("Amount tendered")).toBeVisible();
  63 |   await page.getByRole("button", { name: "Cash", exact: true }).click();
  64 |   await expect(page.getByText("Powered by Poster POS")).toBeVisible();
  65 |   await page.getByRole("button", { name: "Done" }).click();
  66 | 
  67 |   // The sale is visible in the POS order history.
  68 |   await page.getByRole("button", { name: "Orders" }).click();
  69 |   await expect(page.getByRole("heading", { name: "Order history" })).toBeVisible();
  70 |   await expect(page.getByText("#1", { exact: false }).first()).toBeVisible();
  71 |   await expect(page.getByText("Receipt #1 •", { exact: false })).toBeVisible();
  72 |   await page.locator("aside").getByRole("button", { name: "Close" }).click();
  73 | 
  74 |   // And in the Management Console receipts report.
  75 |   await page.goto("/manage/reports/receipts");
  76 |   await expect(page.getByRole("heading", { name: "Receipts" })).toBeVisible();
  77 |   await expect(page.getByRole("cell", { name: "1", exact: true }).first()).toBeVisible();
  78 |   await expect(page.getByText(/375\.20/).first()).toBeVisible();
  79 | 
> 80 |   expect(errors).toEqual([]);
     |                  ^ Error: expect(received).toEqual(expected) // deep equality
  81 | });
  82 | 
```