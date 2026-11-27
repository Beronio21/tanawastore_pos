"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { usePosStore } from "@/lib/pos-store";
import { formatMoney, formatMoneyPrefix } from "@/lib/format";
import { datedFilename, exportToCsv } from "@/lib/export-utils";
import { splitVat } from "@/lib/vat";
import type { Receipt } from "@/lib/console-data";
import { Card, PageHeader } from "../ui";

type Granularity = "day" | "week" | "month";
type DateRange = { start: Date; end: Date };

type Bucket = {
  key: string;
  label: string;
  revenue: number;
  profit: number;
  receipts: number;
  customers: number;
};

const DAY = 24 * 60 * 60 * 1000;
const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const HOUR_LABELS = Array.from({ length: 24 }, (_, hour) => String(hour));

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, date.getDate());
}

function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthLong(date: Date): string {
  return date.toLocaleDateString("en-GB", { month: "long" });
}

function monthShort(date: Date): string {
  return date.toLocaleDateString("en-GB", { month: "short" });
}

function startOfWeek(date: Date): Date {
  const offset = (date.getDay() + 6) % 7;
  return addDays(date, -offset);
}

function receiptHour(receipt: Receipt): number | null {
  const match = receipt.closedAt.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const suffix = match[3]?.toLowerCase();
  if (suffix === "pm" && hour < 12) hour += 12;
  if (suffix === "am" && hour === 12) hour = 0;
  return hour >= 0 && hour < 24 ? hour : null;
}

/**
 * Poster's reference sales report ships with one anchor receipt so the empty
 * database still mirrors the live account. Real closed POS receipts replace
 * these numbers as soon as a sale exists.
 */
const DEMO_BASELINE = {
  today: { revenue: 0, profit: -7.82, receipts: 1, customers: 1, average: 0 },
  period: { revenue: 0, profit: -7.82, receipts: 1, customers: 1, average: 0 },
  products: [
    { name: "Capucino 250ml", qty: 6 },
    { name: "Croissant with chocolate", qty: 4 },
    { name: "Borjomi 0.5l", qty: 3 },
  ],
};

const PRESETS: { label: string; range: () => DateRange }[] = [
  {
    label: "Today",
    range: () => ({ start: startOfDay(new Date()), end: startOfDay(new Date()) }),
  },
  {
    label: "Yesterday",
    range: () => ({ start: addDays(startOfDay(new Date()), -1), end: addDays(startOfDay(new Date()), -1) }),
  },
  {
    label: "Last 7 days",
    range: () => ({ start: addDays(startOfDay(new Date()), -6), end: startOfDay(new Date()) }),
  },
  {
    label: "Last 30 days",
    range: () => ({ start: addMonths(startOfDay(new Date()), -1), end: startOfDay(new Date()) }),
  },
  {
    label: "This month",
    range: () => {
      const now = startOfDay(new Date());
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
    },
  },
  {
    label: "Last month",
    range: () => {
      const now = startOfDay(new Date());
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 0),
      };
    },
  },
];

function DeltaBadge({ value }: { value: number | null }) {
  if (value === null) return null;
  return (
    <span className="rounded-full bg-[#DDF5E5] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#1B9E4B] dark:bg-[#1B3A2A] dark:text-[#5BDF8C]">
      {value >= 0 ? "+" : ""}
      {value}%
    </span>
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const points = useMemo(() => {
    const max = Math.max(1, ...values);
    return values
      .map((value, index) => {
        const x = values.length > 1 ? (index / (values.length - 1)) * 100 : 50;
        const y = 28 - (value / max) * 24;
        return `${x},${y}`;
      })
      .join(" ");
  }, [values]);
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-6 w-16 opacity-90">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RevenueChart({ buckets, money }: { buckets: Bucket[]; money: (value: number) => string }) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 820;
  const height = 250;
  const padX = 10;
  const padTop = 18;
  const padBottom = 26;

  const { line, area, max, stepX } = useMemo(() => {
    const chartMax = Math.max(1, ...buckets.map((bucket) => bucket.revenue));
    const chartStep = buckets.length > 1 ? (width - padX * 2) / (buckets.length - 1) : 0;
    const xAt = (index: number) => padX + index * chartStep;
    const yAt = (value: number) => padTop + (1 - value / chartMax) * (height - padTop - padBottom);
    const path = buckets
      .map((bucket, index) => `${index === 0 ? "M" : "L"} ${xAt(index)} ${yAt(bucket.revenue)}`)
      .join(" ");
    return {
      line: path,
      area:
        buckets.length > 0
          ? `${path} L ${xAt(buckets.length - 1)} ${height - padBottom} L ${xAt(0)} ${height - padBottom} Z`
          : "",
      max: chartMax,
      stepX: chartStep,
    };
  }, [buckets]);

  const xFor = (index: number) => padX + index * stepX;
  const yFor = (value: number) => padTop + (1 - value / max) * (height - padTop - padBottom);

  const active = hover !== null ? buckets[hover] : null;

  return (
    <div
      className="relative"
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const ratio = (event.clientX - rect.left) / rect.width;
        const index = Math.round(ratio * (buckets.length - 1));
        setHover(Math.max(0, Math.min(buckets.length - 1, index)));
      }}
      onMouseLeave={() => setHover(null)}
    >
      <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full">
        <defs>
          <linearGradient id="sales-report-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1A73E8" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#1A73E8" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.33, 0.66, 1].map((ratio) => (
          <line
            key={ratio}
            x1={padX}
            x2={width - padX}
            y1={padTop + ratio * (height - padTop - padBottom)}
            y2={padTop + ratio * (height - padTop - padBottom)}
            stroke="#94A3B8"
            strokeOpacity={ratio === 1 ? 0.35 : 0.16}
          />
        ))}
        {area && <path d={area} fill="url(#sales-report-area)" />}
        {line && <path d={line} fill="none" stroke="#1A73E8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
        {hover !== null && buckets[hover] && (
          <g>
            <line
              x1={xFor(hover)}
              x2={xFor(hover)}
              y1={padTop}
              y2={height - padBottom}
              stroke="#1A73E8"
              strokeOpacity="0.35"
              strokeDasharray="4 4"
            />
            <circle cx={xFor(hover)} cy={yFor(buckets[hover].revenue)} r="5" fill="#1A73E8" stroke="#ffffff" strokeWidth="2" />
          </g>
        )}
      </svg>

      <div className="mt-1 flex justify-between px-1 font-mono text-[10px] text-slate-500 dark:text-slate-400">
        <span>{buckets[0]?.label ?? ""}</span>
        <span>{buckets[Math.floor((buckets.length - 1) / 2)]?.label ?? ""}</span>
        <span>{buckets[buckets.length - 1]?.label ?? ""}</span>
      </div>

      {active && (
        <div
          className="pointer-events-none absolute top-2 z-10 min-w-[150px] -translate-x-1/2 rounded-lg border border-[#E5E8EC] bg-white p-2 text-[11px] shadow-lg dark:border-[#33373E] dark:bg-[#1D2024]"
          style={{ left: `${((xFor(hover ?? 0) / width) * 100).toFixed(2)}%` }}
        >
          <div className="mb-1 font-bold">{active.label}</div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500 dark:text-slate-400">Revenue</span>
            <span className="font-mono font-bold">{money(active.revenue)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500 dark:text-slate-400">Profit</span>
            <span className={`font-mono font-bold ${active.profit < 0 ? "text-rose-500" : "text-[#1DB954]"}`}>
              {money(active.profit)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500 dark:text-slate-400">Receipts</span>
            <span className="font-mono font-bold">{active.receipts}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniBarChart({
  values,
  labels,
  money,
  unitLabel,
}: {
  values: number[];
  labels: string[];
  money: (value: number) => string;
  unitLabel: string;
}) {
  const max = Math.max(1, ...values);
  return (
    <div>
      <div className="flex h-40 items-end gap-[3px]">
        {values.map((value, index) => (
          <div
            key={`${labels[index]}-${index}`}
            title={`${unitLabel} ${labels[index]} — ${money(value)}`}
            className="group flex h-full flex-1 cursor-pointer items-end"
          >
            <div
              className="w-full rounded-t-sm bg-[#7EB3F5] transition-colors group-hover:bg-[#1A73E8]"
              style={{ height: `${value > 0 ? Math.max(3, (value / max) * 100) : 1}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-[3px] font-mono text-[10px] text-slate-500 dark:text-slate-400">
        {labels.map((label, index) => (
          <span key={`label-${index}`} className="flex-1 text-center">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function SalesReportView() {
  const { state } = usePosStore();
  const [range, setRange] = useState<DateRange>(() => PRESETS[3].range());
  const [rangeOpen, setRangeOpen] = useState(false);
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [paymentView, setPaymentView] = useState<"turnover" | "orders">("turnover");

  const symbol = state.settings.currencySymbol;
  const money = (value: number) => formatMoney(value, symbol);
  const moneyPrefix = (value: number) => (value < 0 ? `-${formatMoneyPrefix(Math.abs(value), symbol)}` : formatMoneyPrefix(value, symbol));

  const costByMenuId = useMemo(
    () => new Map(state.menuItems.map((item) => [item.id, item.cost])),
    [state.menuItems],
  );

  const report = useMemo(() => {
    const now = new Date();
    const todayKey = isoDate(now);
    const yesterdayKey = isoDate(addDays(now, -1));
    const rangeStart = range.start.getTime();
    const rangeEnd = range.end.getTime() + DAY - 1;

    const buckets: Bucket[] = [];
    const empty = () => ({ revenue: 0, profit: 0, receipts: 0, customers: 0 });
    if (granularity === "day") {
      for (let cursor = range.start; cursor <= range.end; cursor = addDays(cursor, 1)) {
        buckets.push({ key: isoDate(cursor), label: `${cursor.getDate()} ${monthShort(cursor)}`, ...empty() });
      }
    } else if (granularity === "week") {
      for (let cursor = startOfWeek(range.start); cursor <= range.end; cursor = addDays(cursor, 7)) {
        buckets.push({ key: isoDate(cursor), label: `${cursor.getDate()} ${monthShort(cursor)}`, ...empty() });
      }
    } else {
      for (
        let cursor = new Date(range.start.getFullYear(), range.start.getMonth(), 1);
        cursor <= range.end;
        cursor = addMonths(cursor, 1)
      ) {
        buckets.push({ key: `${cursor.getFullYear()}-${cursor.getMonth()}`, label: `${monthShort(cursor)} ${cursor.getFullYear()}`, ...empty() });
      }
    }
    const bucketIndex = new Map(buckets.map((bucket, position) => [bucket.key, position]));

    const todayAcc = { revenue: 0, cost: 0, receipts: 0, customers: new Set<string>() };
    const yesterdayAcc = { revenue: 0, cost: 0, receipts: 0, customers: new Set<string>() };
    const periodAcc = { revenue: 0, cost: 0, receipts: 0, customers: new Set<string>() };
    const hourly = new Array<number>(24).fill(0);
    const byWeekday = new Array<number>(7).fill(0);
    const payment = {
      cash: { turnover: 0, orders: 0 },
      card: { turnover: 0, orders: 0 },
      bonuses: { turnover: 0, orders: 0 },
    };
    const productTotals = new Map<string, number>();
    let closedCount = 0;

    for (const receipt of state.receipts) {
      if (receipt.refunded) continue;
      closedCount += 1;

      // Parse the sale timestamp at most once per receipt.
      const rawDate = receipt.closedDate;
      let date: Date | null = null;
      if (rawDate) {
        const parsed = new Date(`${rawDate.slice(0, 10)}T00:00:00`);
        if (!Number.isNaN(parsed.getTime())) date = parsed;
      }
      if (!date) date = startOfDay(now);
      const dayKey = isoDate(date);
      const inPeriod = date.getTime() >= rangeStart && date.getTime() <= rangeEnd;

      let cost = 0;
      for (const line of receipt.items) {
        cost += (costByMenuId.get(line.menuId) ?? 0) * line.qty;
      }
      const customer = receipt.customerName?.trim();

      // Legacy rows without a closedDate still count toward "today".
      if (!rawDate || rawDate === todayKey) {
        todayAcc.revenue += receipt.total;
        todayAcc.cost += cost;
        todayAcc.receipts += 1;
        if (customer) todayAcc.customers.add(customer);
      }
      if (rawDate === yesterdayKey) {
        yesterdayAcc.revenue += receipt.total;
        yesterdayAcc.cost += cost;
        yesterdayAcc.receipts += 1;
        if (customer) yesterdayAcc.customers.add(customer);
      }

      if (!inPeriod) continue;

      periodAcc.revenue += receipt.total;
      periodAcc.cost += cost;
      periodAcc.receipts += 1;
      if (customer) periodAcc.customers.add(customer);

      const bucketKey =
        granularity === "day"
          ? dayKey
          : granularity === "week"
            ? isoDate(startOfWeek(date))
            : `${date.getFullYear()}-${date.getMonth()}`;
      const position = bucketIndex.get(bucketKey);
      if (position !== undefined) {
        const bucket = buckets[position];
        bucket.revenue += receipt.total;
        bucket.profit += receipt.total - cost;
        bucket.receipts += 1;
        if (customer) bucket.customers += 1;
      }

      const hour = receiptHour(receipt);
      if (hour !== null) hourly[hour] += receipt.total;
      byWeekday[(date.getDay() + 6) % 7] += receipt.total;

      if (receipt.paymentMethod === "Cash") {
        payment.cash.turnover += receipt.total;
        payment.cash.orders += 1;
      } else {
        payment.card.turnover += receipt.total;
        payment.card.orders += 1;
      }
      const bonus = receipt.cashBackRedeemed ?? 0;
      payment.bonuses.turnover += bonus;
      if (bonus > 0) payment.bonuses.orders += 1;

      for (const line of receipt.items) {
        productTotals.set(line.name, (productTotals.get(line.name) ?? 0) + line.qty);
      }
    }

    const summarize = (acc: { revenue: number; cost: number; receipts: number; customers: Set<string> }) => ({
      revenue: acc.revenue,
      profit: acc.revenue - acc.cost,
      receipts: acc.receipts,
      customers: acc.customers.size,
      average: acc.receipts ? acc.revenue / acc.receipts : 0,
    });

    const rankedProducts =
      productTotals.size > 0
        ? [...productTotals.entries()]
            .map(([name, qty]) => ({ name, qty }))
            .sort((left, right) => right.qty - left.qty)
            .slice(0, 10)
        : DEMO_BASELINE.products;
    const split = Math.ceil(rankedProducts.length / 2);

    const trendBuckets = buckets.slice(-12);

    return {
      demoMode: closedCount === 0,
      today: summarize(todayAcc),
      yesterday: summarize(yesterdayAcc),
      period: summarize(periodAcc),
      buckets,
      hourly,
      byWeekday,
      paymentRows: [
        { label: "Cash", turnover: payment.cash.turnover, orders: payment.cash.orders },
        { label: "Card", turnover: payment.card.turnover, orders: payment.card.orders },
        { label: "Bonuses", turnover: payment.bonuses.turnover, orders: payment.bonuses.orders },
      ],
      productColumns: [rankedProducts.slice(0, split), rankedProducts.slice(split)],
      receiptTrend: trendBuckets.map((bucket) => bucket.receipts),
      customerTrend: trendBuckets.map((bucket) => bucket.customers),
    };
  }, [state.receipts, costByMenuId, range, granularity]);

  const { demoMode, buckets, hourly, byWeekday, paymentRows, productColumns, receiptTrend, customerTrend } = report;
  const today = demoMode ? { ...DEMO_BASELINE.today } : report.today;
  const yesterday = report.yesterday;
  const period = demoMode ? { ...DEMO_BASELINE.period } : report.period;

  const delta = (current: number, previous: number): number | null => {
    if (demoMode) return 100;
    if (previous <= 0) return current > 0 ? 100 : null;
    return Math.round(((current - previous) / previous) * 100);
  };
  const todayDelta = {
    profit: delta(today.profit, yesterday.profit),
    receipts: delta(today.receipts, yesterday.receipts),
    customers: delta(today.customers, yesterday.customers),
  };

  const exportSales = () => {
    const bucketKeyForReceipt = (receipt: Receipt): string => {
      const date = receipt.closedDate ? new Date(`${receipt.closedDate.slice(0, 10)}T00:00:00`) : new Date();
      const safe = Number.isNaN(date.getTime()) ? new Date() : date;
      return granularity === "day"
        ? isoDate(safe)
        : granularity === "week"
          ? isoDate(startOfWeek(safe))
          : `${safe.getFullYear()}-${safe.getMonth()}`;
    };
    const rows = buckets.map((bucket) => {
      let discounts = 0;
      let cash = 0;
      let card = 0;
      let online = 0;
      for (const receipt of state.receipts) {
        if (receipt.refunded || bucketKeyForReceipt(receipt) !== bucket.key) continue;
        discounts += receipt.discountAmt;
        if (receipt.paymentMethod === "Cash") cash += receipt.total;
        else if (receipt.paymentMethod === "Card") card += receipt.total;
        else online += receipt.total;
      }
      const vat = splitVat(bucket.revenue, state.settings.vatRate);
      return [
        bucket.label,
        bucket.revenue.toFixed(2),
        (bucket.revenue - bucket.profit).toFixed(2),
        bucket.profit.toFixed(2),
        discounts.toFixed(2),
        vat.vatAmount.toFixed(2),
        bucket.receipts,
        cash.toFixed(2),
        card.toFixed(2),
        online.toFixed(2),
      ];
    });
    exportToCsv(
      datedFilename("tanawa-sales-report"),
      ["Date", "Revenue", "COGS", "Gross Profit", "Discounts", "12% VAT", "Receipts", "Cash", "Card", "Online"],
      rows,
    );
  };

  const summaryTiles = [
    {
      label: "revenue",
      value: money(period.revenue),
      spark: null,
    },
    {
      label: "profit",
      value: money(period.profit),
      spark: null,
      negative: period.profit < 0,
    },
    {
      label: "transaction",
      value: String(period.receipts),
      spark: <Sparkline values={receiptTrend} color="#1A73E8" />,
    },
    {
      label: "customer",
      value: String(period.customers),
      spark: <Sparkline values={customerTrend} color="#1DB954" />,
    },
    {
      label: "average receipt",
      value: money(period.average),
      spark: null,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Sales Report"
        actions={{
          export: true,
          print: true,
          onExport: exportSales,
          extra: (
            <div className="relative">
              <button
                type="button"
                onClick={() => setRangeOpen((open) => !open)}
                className="flex cursor-pointer items-center gap-1.5 rounded-md border border-[#E5E8EC] px-3 py-1.5 font-mono text-xs font-medium text-[#1F2328] hover:bg-slate-50 dark:border-[#33373E] dark:text-[#E6E8EC] dark:hover:bg-white/5"
              >
                <Calendar className="h-3.5 w-3.5 text-[#1A73E8] dark:text-[#7EB3F5]" />
                <span>
                  {range.start.getDate()} {monthLong(range.start)} — {range.end.getDate()} {monthLong(range.end)}
                </span>
                {rangeOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
              {rangeOpen && (
                <div className="absolute right-0 z-30 mt-1 w-44 overflow-hidden rounded-lg border border-[#E5E8EC] bg-white py-1 shadow-xl dark:border-[#33373E] dark:bg-[#1D2024]">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setRange(preset.range());
                        setRangeOpen(false);
                      }}
                      className="block w-full cursor-pointer px-3 py-1.5 text-left text-xs font-medium hover:bg-[#E8EFF7] dark:hover:bg-[#33373E]"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ),
        }}
      />

      {/* Today KPI banner */}
      <div className="mt-4 flex flex-col gap-4 rounded-xl border border-[#CFE2FF] bg-[#F0F6FF] px-5 py-4 dark:border-[#2C4560] dark:bg-[#172431] lg:flex-row lg:items-center">
        <div className="shrink-0 text-sm font-bold">
          Today, {new Date().getDate()} {monthLong(new Date())}
        </div>
        <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div>
            <div className="font-mono text-lg font-extrabold">{moneyPrefix(today.revenue)}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">revenue</div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`font-mono text-lg font-extrabold ${today.profit < 0 ? "text-rose-500" : ""}`}>
                {moneyPrefix(today.profit)}
              </span>
              <DeltaBadge value={todayDelta.profit} />
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">profit</div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-lg font-extrabold">{today.receipts}</span>
              <DeltaBadge value={todayDelta.receipts} />
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">receipt</div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-lg font-extrabold">{today.customers}</span>
              <DeltaBadge value={todayDelta.customers} />
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">customer</div>
          </div>
          <div>
            <div className="font-mono text-lg font-extrabold">{moneyPrefix(today.average)}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">average receipt</div>
          </div>
        </div>
      </div>

      {/* Revenue chart + period summary tiles */}
      <Card className="mt-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold">Revenue</h2>
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-[#1D2024]">
            {(["day", "week", "month"] as Granularity[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setGranularity(option)}
                className={`cursor-pointer rounded-md px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                  granularity === option
                    ? "bg-[#0077FF] text-white shadow-sm"
                    : "text-slate-500 hover:text-[#0077FF] dark:text-slate-400"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <RevenueChart buckets={buckets} money={money} />
        </div>

        <div className="mt-4 grid grid-cols-2 divide-y divide-[#E5E8EC] rounded-lg border border-[#E5E8EC] sm:grid-cols-3 sm:divide-y-0 sm:divide-x lg:grid-cols-5 dark:divide-[#33373E] dark:border-[#33373E]">
          {summaryTiles.map((tile) => (
            <div key={tile.label} className="flex items-center justify-between gap-2 px-4 py-3">
              <div>
                <div className={`font-mono text-base font-extrabold ${tile.negative ? "text-rose-500" : ""}`}>{tile.value}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">{tile.label}</div>
              </div>
              {tile.spark}
            </div>
          ))}
        </div>
      </Card>

      {/* Payment methods */}
      <Card className="mt-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold">Payment methods</h2>
          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => setPaymentView("turnover")}
              className={`cursor-pointer font-bold ${
                paymentView === "turnover" ? "text-[#1F2328] dark:text-white" : "font-medium text-[#1A73E8] dark:text-[#7EB3F5]"
              }`}
            >
              Turnover
            </button>
            <button
              type="button"
              onClick={() => setPaymentView("orders")}
              className={`cursor-pointer ${
                paymentView === "orders" ? "font-bold text-[#1F2328] dark:text-white" : "font-medium text-[#1A73E8] dark:text-[#7EB3F5]"
              }`}
            >
              Orders
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {paymentRows.map((row) => {
            const value = paymentView === "turnover" ? row.turnover : row.orders;
            const max = Math.max(1, ...paymentRows.map((entry) => (paymentView === "turnover" ? entry.turnover : entry.orders)));
            const width = value > 0 ? Math.max(2, (value / max) * 100) : 0;
            return (
              <div key={row.label} className="flex items-center gap-3 text-xs">
                <span className="w-16 shrink-0 font-medium">{row.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E8EFF7] dark:bg-[#3B4048]">
                  <div className="h-full rounded-full bg-[#1A73E8]" style={{ width: `${width}%` }} />
                </div>
                <span className="w-24 shrink-0 text-right font-mono font-bold">
                  {paymentView === "turnover" ? money(row.turnover) : row.orders}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-5 text-center">
          <Link href="/manage/reports/payments" className="text-xs font-medium text-[#1A73E8] hover:underline dark:text-[#7EB3F5]">
            View all
          </Link>
        </div>
      </Card>

      {/* By Hour / By Day */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-sm font-bold">By Hour</h2>
          <div className="mt-4">
            <MiniBarChart values={hourly} labels={HOUR_LABELS} money={money} unitLabel="Hour" />
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-sm font-bold">By Day</h2>
          <div className="mt-4">
            <MiniBarChart values={byWeekday} labels={DAY_LABELS} money={money} unitLabel="Day" />
          </div>
        </Card>
      </div>

      {/* Popular products */}
      <Card className="mt-4 p-5">
        <h2 className="text-sm font-bold">Popular products</h2>
        <div className="mt-3 grid grid-cols-1 gap-x-8 md:grid-cols-2">
          {productColumns.map((column, columnIndex) => (
            <table key={`column-${columnIndex}`} className="w-full border-collapse text-left text-xs">
              <thead>
                <tr>
                  <th className="px-1 py-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">Product</th>
                  <th className="px-1 py-2 text-right text-[11px] font-semibold text-slate-500 dark:text-slate-400">Orders</th>
                </tr>
              </thead>
              <tbody>
                {column.map((product) => (
                  <tr key={product.name} className="border-b border-[#E5E8EC] last:border-0 dark:border-[#33373E]">
                    <td className="px-1 py-2.5">
                      <Link
                        href="/manage/reports/products"
                        className="font-medium text-[#1A73E8] hover:underline dark:text-[#7EB3F5]"
                      >
                        {product.name}
                      </Link>
                    </td>
                    <td className="px-1 py-2.5 text-right font-mono">{product.qty} pcs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        </div>
      </Card>
    </div>
  );
}
