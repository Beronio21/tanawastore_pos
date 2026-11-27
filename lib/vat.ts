/**
 * Philippine VAT (BIR) helpers.
 *
 * POS prices are VAT-inclusive, so `VATable Sales = total / 1.12` and
 * `VAT Amount = total - VATable Sales`. Values are rounded to centavos.
 */

export const PH_VAT_RATE = 0.12;

export type VatBreakdown = {
  /** Net sales subject to 12% VAT. */
  vatableSales: number;
  /** Output VAT component already included in the total. */
  vatAmount: number;
  /** Sales explicitly exempt/zero-rated (delivery charges, exempt items). */
  vatExemptSales: number;
  /** Gross amount the breakdown explains. */
  total: number;
};

function round2(value: number): number {
  return Math.round((Number(value) || 0) * 100) / 100;
}

/** Split a VAT-inclusive gross amount into net sales + 12% VAT. */
export function splitVat(total: number, rate: number = PH_VAT_RATE, vatExemptSales = 0): VatBreakdown {
  const gross = Math.max(0, round2(total));
  const exempt = Math.min(gross, Math.max(0, round2(vatExemptSales)));
  const vatableGross = Math.max(0, round2(gross - exempt));
  const vatableSales = round2(vatableGross / (1 + rate));
  const vatAmount = round2(vatableGross - vatableSales);
  return { vatableSales, vatAmount, vatExemptSales: exempt, total: gross };
}

/** Serveral receipts merged into one BIR summary (Reports → Sales export). */
export function summarizeVat(totals: number[], rate: number = PH_VAT_RATE): VatBreakdown {
  return splitVat(totals.reduce((sum, total) => sum + (Number(total) || 0), 0), rate);
}
