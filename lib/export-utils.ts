/**
 * CSV export helpers.
 *
 * Excel (Windows) and Google Sheets mis-decode ₱ (U+20B1) unless the file
 * starts with a UTF-8 BOM, so every export is prefixed with `\uFEFF`.
 */

export type CsvCell = string | number | null | undefined;

const BOM = "\uFEFF";

function escapeCell(value: CsvCell): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

/** Serialize rows to a BOM-prefixed CSV string (no DOM required). */
export function csvString(headers: string[], rows: CsvCell[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(","));
  return `${BOM}${lines.join("\r\n")}`;
}

/** Trigger a browser download for a CSV file and return its contents. */
export function exportToCsv(filename: string, headers: string[], rows: CsvCell[][]): string {
  const contents = csvString(headers, rows);
  if (typeof document !== "undefined" && typeof URL !== "undefined") {
    const blob = new Blob([contents], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }
  return contents;
}

/** `tanawa-sales-report-2026-11-27.csv` */
export function datedFilename(prefix: string, date: Date = new Date()): string {
  const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return `${prefix}-${iso}.csv`;
}

/** Print the current page with the console print stylesheet. */
export function printPage(): void {
  if (typeof window !== "undefined") window.print();
}
