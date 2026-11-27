import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { splitVat, summarizeVat } from "@/lib/vat";
import { buildR2Key, r2PublicUrl, sanitizeFilename } from "@/lib/r2";
import { csvString, datedFilename } from "@/lib/export-utils";
import { planForAmount, toCentavos } from "@/lib/paymongo";
import { PosStoreProvider, usePosStore } from "@/lib/pos-store";
import { ThermalReceiptPrint } from "@/components/pos/ThermalReceiptPrint";
import type { Receipt } from "@/lib/console-data";

describe("Philippine 12% VAT", () => {
  it("splits a VAT-inclusive total into net sales and VAT", () => {
    expect(splitVat(112)).toEqual({ vatableSales: 100, vatAmount: 12, vatExemptSales: 0, total: 112 });
    const receipt = splitVat(240.8);
    expect(receipt.vatableSales).toBeCloseTo(215, 2);
    expect(receipt.vatAmount).toBeCloseTo(25.8, 2);
    expect(receipt.total).toBe(240.8);
  });

  it("removes VAT-exempt delivery charges before applying 12%", () => {
    const breakdown = splitVat(120, 0.12, 20);
    expect(breakdown.vatExemptSales).toBe(20);
    expect(breakdown.vatableSales).toBeCloseTo(89.29, 2);
    expect(breakdown.vatAmount).toBeCloseTo(10.71, 2);
  });

  it("summarizes receipt totals for BIR exports", () => {
    const totals = summarizeVat([112, 112, 56]);
    expect(totals.vatableSales).toBeCloseTo(250, 2);
    expect(totals.vatAmount).toBeCloseTo(30, 2);
    expect(totals.total).toBeCloseTo(280, 2);
  });
});

describe("Cloudflare R2 tenant isolation", () => {
  it("prefixes every object with the tenant id and folder", () => {
    expect(buildR2Key("org_tanawa", "products", "Hero Image.png", "id-1")).toBe(
      "pos/org_tanawa/products/id-1-hero-image.png",
    );
    expect(buildR2Key("personal_abc", "logos", "Logo (2026).webp", "id-2")).toBe(
      "pos/personal_abc/logos/id-2-logo-2026-.webp",
    );
  });

  it("strips path traversal and unsafe filename characters", () => {
    expect(sanitizeFilename("../../evil name.JPG")).toBe("evil-name.jpg");
    expect(sanitizeFilename("")).toBe("file");
  });

  it("builds public URLs from NEXT_PUBLIC_R2_PUBLIC_URL", () => {
    const previous = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL = "https://cdn.tanawa.ph/";
    try {
      expect(r2PublicUrl("pos/org/products/a.png")).toBe("https://cdn.tanawa.ph/pos/org/products/a.png");
    } finally {
      if (previous === undefined) delete process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
      else process.env.NEXT_PUBLIC_R2_PUBLIC_URL = previous;
    }
  });
});

describe("UTF-8 BOM CSV exports", () => {
  it("starts with a BOM so Excel reads the peso sign", () => {
    const csv = csvString(["Name", "Total"], [["Borjomi", "₱10.00"]]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain("₱10.00");
    expect(csv).toBe("\uFEFFName,Total\r\nBorjomi,₱10.00");
  });

  it("escapes commas, quotes and line breaks", () => {
    const csv = csvString(["Comment"], [['He said "hi", twice'], ["line\r\nbreak"]]);
    expect(csv).toContain('"He said ""hi"", twice"');
    expect(csv).toContain('"line\r\nbreak"');
  });

  it("names sales exports by date", () => {
    expect(datedFilename("tanawa-sales-report", new Date(2026, 10, 27))).toBe(
      "tanawa-sales-report-2026-11-27.csv",
    );
  });
});

describe("PayMongo helpers", () => {
  it("converts pesos to integer centavos", () => {
    expect(toCentavos(14.9)).toBe(1490);
    expect(toCentavos(1490)).toBe(149000);
    expect(toCentavos(0.1 + 0.2)).toBe(30);
  });

  it("maps plan amounts back to tiers", () => {
    expect(planForAmount(149000)).toBe("starter");
    expect(planForAmount(379500)).toBe("pro");
    expect(planForAmount(799000)).toBe("enterprise");
    expect(planForAmount(123)).toBeNull();
  });
});

const receipt: Receipt = {
  receiptNum: 12,
  staffId: "emp-1",
  staffName: "Philip Venje Beronio",
  tableName: "Table 3",
  openedAt: "8:10 pm",
  closedAt: "8:42 pm",
  paymentMethod: "Cash",
  subtotal: 100,
  discountAmt: 0,
  tax: 12,
  profit: 40,
  total: 112,
  customerName: "Maria Santos",
  customerPhone: "09991234567",
  customerAddress: "1234 Street",
  comment: "Extra hot",
  tendered: 200,
  change: 88,
  items: [{ menuId: "prod-2", name: "Capucino 250ml", qty: 2, unitPrice: 50 }],
};

function ReceiptHarness() {
  const { state, actions } = usePosStore();
  return createElement(
    "div",
    null,
    createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          actions.updateSettings({ tin: "123-456-789-000", address: "Fortich Street, Malaybalay City" });
          const settings = state.receiptSettings;
          actions.saveReceiptSettings({
            ...settings,
            printAddress: true,
            printComments: true,
            printCustomerContact: true,
            printWifi: true,
            wifiName: "TanawaGuest",
            wifiPassword: "brew123",
            printPredictions: false,
            paperWidth: "58mm",
          });
        },
      },
      "Configure receipt",
    ),
    createElement(ThermalReceiptPrint, { receipt }),
  );
}

describe("Thermal receipt conditional sections", () => {
  it("renders settings-driven header, VAT breakdown, WiFi and customer blocks", async () => {
    const user = userEvent.setup();
    const { container } = render(createElement(PosStoreProvider, null, createElement(ReceiptHarness)));

    // Defaults: 80mm, no address/TIN/WiFi.
    expect(container.querySelector('[data-paper-width="80mm"]')).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "Configure receipt" }));

    expect(await screen.findByText("TIN: 123-456-789-000")).toBeInTheDocument();
    expect(screen.getByText("Fortich Street, Malaybalay City")).toBeInTheDocument();
    expect(screen.getByText("SSID: TanawaGuest")).toBeInTheDocument();
    expect(screen.getByText("Password: brew123")).toBeInTheDocument();
    expect(screen.getByText("Comment: Extra hot")).toBeInTheDocument();
    expect(screen.getByText("1234 Street")).toBeInTheDocument();
    expect(screen.getByText("VATable Sales")).toBeInTheDocument();
    expect(screen.getAllByText("100.00 ₱").length).toBeGreaterThan(0);
    expect(screen.getByText("VAT Amount (12%)")).toBeInTheDocument();
    expect(screen.getByText("Amount Tendered")).toBeInTheDocument();
    // Predictions are disabled by Settings → Receipt.
    expect(screen.queryByText("Reach for joy and all else will follow")).not.toBeInTheDocument();
    expect(container.querySelector('[data-paper-width="58mm"]')).not.toBeNull();
  });
});
