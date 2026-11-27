"use client";

import { useMemo } from "react";
import { usePosStore } from "@/lib/pos-store";
import type { Receipt } from "@/lib/console-data";
import { formatMoney } from "@/lib/format";
import { splitVat } from "@/lib/vat";

/**
 * Dynamic thermal receipt driven by Settings → Receipt and Settings → General.
 * Rendered inside `#printable-receipt-area` so the @media print rules isolate it.
 */
export function ThermalReceiptPrint({ receipt }: { receipt: Receipt }) {
  const { state } = usePosStore();
  const settings = state.receiptSettings;
  const symbol = state.settings.currencySymbol;
  const money = (value: number) => formatMoney(value, symbol);
  const paperWidth = settings.paperWidth ?? "80mm";
  const narrow = paperWidth === "58mm";

  const headerName =
    settings.printOnReceipt === "Business name"
      ? state.locations[0]?.name ?? state.settings.companyName
      : state.settings.companyName;

  const prediction = useMemo(() => {
    const predictions = (settings.predictions ?? []).filter((entry) => entry.trim());
    if (!predictions.length) return "";
    // Stable per receipt rather than Math.random() during render.
    return predictions[receipt.receiptNum % predictions.length];
  }, [settings.predictions, receipt.receiptNum]);

  const vat = splitVat(receipt.total, state.settings.vatRate, receipt.deliveryFee ?? 0);
  const logo = state.settings.logoUrl || state.settings.logo;
  const tin = state.settings.tin?.trim();

  return (
    <div
      className={`thermal-receipt mx-auto font-mono text-[11px] leading-snug ${narrow ? "receipt-58" : "receipt-80"}`}
      data-paper-width={paperWidth}
      style={{ maxWidth: narrow ? "58mm" : "80mm" }}
    >
      <header className="space-y-0.5 border-b border-dashed border-slate-300 pb-2 text-center">
        {logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="mx-auto mb-1 h-9 w-auto max-w-[150px] object-contain" />
        )}
        <div className="text-sm font-extrabold uppercase tracking-wide">{headerName}</div>
        {settings.printAddress && <div className="text-[10px] text-slate-500">{state.settings.address}</div>}
        {tin && <div className="text-[10px] text-slate-500">TIN: {tin}</div>}
        {settings.printReceiptNumber && (
          <div className="text-[10px] font-bold">Receipt #{receipt.receiptNum}</div>
        )}
      </header>

      <section className="space-y-0.5 border-b border-dashed border-slate-300 py-2 text-[10px]">
        <div className="flex justify-between gap-2">
          <span className="text-slate-500">Date</span>
          <span>{receipt.closedAt}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-slate-500">Cashier</span>
          <span>{receipt.staffName}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-slate-500">Order</span>
          <span>{receipt.tableName}</span>
        </div>
        {settings.printComments && receipt.comment && (
          <div className="rounded border border-dashed border-slate-300 px-1.5 py-1 text-[10px] italic">
            Comment: {receipt.comment}
          </div>
        )}
      </section>

      <section className="space-y-1 border-b border-dashed border-slate-300 py-2">
        {receipt.items.map((item, index) => (
          <div key={`${item.menuId}-${index}`} className="text-[11px]">
            <div className="flex justify-between gap-2 font-semibold">
              <span>
                {item.qty} × {item.name}
              </span>
              <span className="whitespace-nowrap">{money(item.qty * item.unitPrice)}</span>
            </div>
            <div className="flex justify-between gap-2 text-[10px] text-slate-500">
              <span>@ {money(item.unitPrice)}</span>
              <span>{money(item.qty * item.unitPrice)}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-0.5 py-2 text-[10px]">
        <Line label="VATable Sales" value={money(vat.vatableSales)} />
        <Line label={`VAT Amount (${Math.round(state.settings.vatRate * 100)}%)`} value={money(vat.vatAmount)} />
        <Line label="VAT-Exempt Sales" value={money(vat.vatExemptSales)} />
        {receipt.discountAmt > 0 && <Line label="Discounts" value={`-${money(receipt.discountAmt)}`} />}
        {(receipt.serviceCharge ?? 0) > 0 && <Line label="Service Charge" value={money(receipt.serviceCharge ?? 0)} />}
        {(receipt.deliveryFee ?? 0) > 0 && (
          <Line label={`Delivery${receipt.deliveryArea ? ` · ${receipt.deliveryArea}` : ""}`} value={money(receipt.deliveryFee ?? 0)} />
        )}
        <div className="mt-1 flex justify-between border-t border-slate-300 pt-1 text-sm font-extrabold">
          <span>TOTAL ({symbol})</span>
          <span>{money(receipt.total)}</span>
        </div>
        <Line label="Payment Method" value={receipt.paymentMethod} />
        {receipt.paymentMethod === "Cash" && receipt.tendered !== undefined && (
          <>
            <Line label="Amount Tendered" value={money(receipt.tendered)} />
            <Line label="Change" value={money(receipt.change ?? 0)} />
          </>
        )}
      </section>

      <footer className="space-y-1 border-t border-dashed border-slate-300 pt-2 text-center text-[10px] text-slate-500">
        {settings.printCustomerContact && receipt.customerName && (
          <div>
            <div className="font-semibold text-slate-700">{receipt.customerName}</div>
            {receipt.customerPhone && <div>{receipt.customerPhone}</div>}
            {receipt.customerAddress && <div>{receipt.customerAddress}</div>}
          </div>
        )}
        {settings.printWifi && settings.wifiName && (
          <div className="mx-auto rounded border border-dashed border-slate-400 px-2 py-1">
            <div className="font-semibold text-slate-700">Wi-Fi</div>
            <div>SSID: {settings.wifiName}</div>
            {settings.wifiPassword && <div>Password: {settings.wifiPassword}</div>}
          </div>
        )}
        {settings.printPredictions && prediction && <div className="italic">{prediction}</div>}
        <div className="pt-1 text-[9px] text-slate-400">Thank you! Powered by Poster POS</div>
      </footer>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
