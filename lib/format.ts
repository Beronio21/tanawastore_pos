/**
 * Poster POS formatting helpers.
 *
 * Table cells show the amount with a trailing symbol ("10.00 ₱"), while
 * summaries and KPI cards use the peso marker before the amount ("₱215.20").
 * Always format money through this module.
 */

export const CURRENCY_SYMBOL = "₱";

/** "10.00 ₱" — used in tables, receipts and totals rows. */
export function formatMoney(value: number, symbol: string = CURRENCY_SYMBOL): string {
  return `${Number(value || 0).toFixed(2)} ${symbol}`;
}

/** "₱215.20" — used in KPI cards and summary headlines. */
export function formatMoneyPrefix(value: number, symbol: string = CURRENCY_SYMBOL): string {
  return `${symbol}${Number(value || 0).toFixed(2)}`;
}

/** "2.000 kg" / "100.00 pcs" — mono-spaced stock quantities. */
export function formatQty(value: number, unit = ""): string {
  const decimals = unit === "pcs" ? 2 : 3;
  const label = `${Number(value || 0).toFixed(decimals)}`;
  return unit ? `${label} ${unit}` : label;
}

/** "90%" retail margin, or an em dash when the item has no recorded cost. */
export function formatMargin(price: number, cost: number): string {
  if (price <= 0 || cost <= 0) return "—";
  return `${Math.round(((price - cost) / price) * 100)}%`;
}

/** "08:19 PM" — short clock label used by POS checks and KDS tickets. */
export function formatTime(date: Date = new Date()): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** "23 Nov, 8:19 pm" — timestamp used in finance transaction rows. */
export function formatTimestamp(date: Date = new Date()): string {
  const day = date.getDate();
  const month = date.toLocaleDateString("en-GB", { month: "short" });
  return `${day} ${month}, ${formatTime(date)}`;
}

/** "23 November, 7:55 pm" — employee last-login label. */
export function formatLongTimestamp(date: Date = new Date()): string {
  const day = date.getDate();
  const month = date.toLocaleDateString("en-GB", { month: "long" });
  return `${day} ${month}, ${formatTime(date)}`;
}

/** Kept for backwards-compatible imports in older console views. */
export const moneySuffix = formatMoney;
export const moneyPrefix = formatMoneyPrefix;
export const quantity = (value: number, unit: string) => formatQty(value, unit);
export const margin = formatMargin;
