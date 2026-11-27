"use client";

import type { ReactNode } from "react";
import { Columns3, Printer, Search, Sparkles, Trash2, Upload } from "lucide-react";
import { usePosStore } from "@/lib/pos-store";

const GHOST =
  "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-[#1A73E8] hover:bg-sky-500/10 dark:text-[#7EB3F5]";

type PageActions = {
  trash?: boolean;
  columns?: boolean;
  export?: boolean;
  print?: boolean;
  dateRange?: string;
  aiImport?: boolean;
  importLabel?: string;
  addLabel?: string;
  addOnClick?: () => void;
  addClass?: string;
  onExport?: () => void;
  onPrint?: () => void;
  extra?: ReactNode;
};

/** Poster view header: title, record count and the right-hand action row. */
export function PageHeader({
  title,
  count,
  actions = {},
}: {
  title: string;
  count?: number | string;
  actions?: PageActions;
}) {
  const { actions: storeActions } = usePosStore();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E8EC] pb-3.5 dark:border-[#33373E]">
      <div className="flex items-baseline gap-2.5">
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        {count !== undefined && count !== "" && (
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{count}</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {actions.trash && (
          <button type="button" className={GHOST} onClick={() => storeActions.showToast("Trash is empty")}>
            <Trash2 className="h-3.5 w-3.5" />
            <span>Trash</span>
          </button>
        )}
        {actions.columns && (
          <button type="button" className={GHOST} onClick={() => storeActions.showToast("All table columns displayed")}>
            <Columns3 className="h-3.5 w-3.5" />
            <span>Columns ▾</span>
          </button>
        )}
        {actions.export && (
          <button
            type="button"
            className={GHOST}
            onClick={() => {
              if (actions.onExport) actions.onExport();
              else storeActions.showToast(`Exported ${title} report to CSV`, "success");
            }}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Export</span>
          </button>
        )}
        {actions.print && (
          <button type="button" className={GHOST} onClick={() => (actions.onPrint ? actions.onPrint() : window.print())}>
            <Printer className="h-3.5 w-3.5" />
            <span>Print</span>
          </button>
        )}
        {actions.dateRange && (
          <button
            type="button"
            className="rounded-md border border-[#E5E8EC] px-3 py-1.5 text-xs font-medium text-[#1A73E8] dark:border-[#33373E] dark:text-[#7EB3F5]"
          >
            {actions.dateRange}
          </button>
        )}
        {actions.aiImport && (
          <button type="button" className={GHOST} onClick={() => storeActions.openModal("postie-ai")}>
            <span>Import with AI</span>
            <Sparkles className="h-3.5 w-3.5" />
          </button>
        )}
        {actions.importLabel && (
          <button
            type="button"
            className={GHOST}
            onClick={() => storeActions.showToast(`${actions.importLabel} started`, "blue")}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>{actions.importLabel}</span>
          </button>
        )}
        {actions.addLabel && (
          <button
            type="button"
            onClick={actions.addOnClick}
            className={`ml-1 cursor-pointer rounded-md px-4 py-1.5 text-xs font-bold text-white shadow-2xs ${
              actions.addClass ?? "bg-[#1DB954] hover:bg-[#18A348]"
            }`}
          >
            {actions.addLabel}
          </button>
        )}
        {actions.extra}
      </div>
    </div>
  );
}

/** Search box plus the Category / Station / Location filter pills. */
export function FilterToolbar({
  search,
  onSearchChange,
  placeholder = "Quick search",
  pills = [],
  showSearch = true,
}: {
  search?: string;
  onSearchChange?: (value: string) => void;
  placeholder?: string;
  pills?: { label: string; variant?: "boxed" | "highlight" | "plain" }[];
  showSearch?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 py-3.5 text-xs">
      {showSearch && (
        <div className="relative w-52">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search ?? ""}
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder={placeholder}
            className="w-full rounded-md border border-[#D1D5DB] bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#1A73E8] focus:outline-none dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white dark:placeholder:text-slate-500"
          />
        </div>
      )}

      {pills.map((pill) => (
        <span
          key={pill.label}
          className={`cursor-pointer rounded-md px-2.5 py-1.5 font-medium ${
            pill.variant === "boxed"
              ? "border border-[#E5E8EC] text-[#1A73E8] dark:border-[#33373E] dark:text-[#7EB3F5]"
              : pill.variant === "highlight"
                ? "bg-[#E8EFF7] text-[#1A73E8] dark:bg-[#33373E] dark:text-[#60A5FA]"
                : "text-[#1A73E8] hover:bg-sky-500/10 dark:text-[#7EB3F5]"
          }`}
        >
          {pill.label}
        </span>
      ))}
    </div>
  );
}

/** Card container using the console light/dark surface tokens. */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-[#E5E8EC] bg-white text-[#1F2328] dark:border-[#33373E] dark:bg-[#2C3036] dark:text-[#E6E8EC] ${className}`}
    >
      {children}
    </div>
  );
}

/** Poster-style iOS switch used by finance category/P&L flags. */
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`inline-flex h-5 w-9 cursor-pointer items-center rounded-full p-0.5 transition-colors ${
        checked ? "justify-end bg-[#34C759]" : "justify-start bg-[#D1D5DB] dark:bg-slate-600"
      }`}
    >
      <span className="block h-4 w-4 rounded-full bg-white shadow-2xs" />
    </button>
  );
}

/** Empty state used by inbox-style views (transactions, payroll, feedback). */
export function EmptyState({
  emoji,
  title,
  description,
  action,
}: {
  emoji: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md space-y-3 py-20 text-center">
      <div className="text-5xl">{emoji}</div>
      <h2 className="text-lg font-bold">{title}</h2>
      {description && (
        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
      )}
      {action}
    </div>
  );
}

export const TH =
  "whitespace-nowrap px-3 py-3 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-400";
export const TD = "whitespace-nowrap px-3 py-3 text-xs";
export const ROW =
  "border-b border-[#E5E8EC] last:border-0 hover:bg-slate-50/90 dark:border-[#33373E] dark:hover:bg-white/[0.03]";
