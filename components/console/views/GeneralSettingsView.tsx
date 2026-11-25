"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Upload, X } from "lucide-react";
import { usePosStore } from "@/lib/pos-store";
import type { LocationSettings, LowStockAlert, ServiceChargeFee } from "@/lib/console-data";

const TIMEZONES = [
  "(+08:00) — Asia/Manila",
  "(+00:00) — UTC",
  "(+01:00) — Europe/Berlin",
  "(+09:00) — Asia/Tokyo",
  "(-05:00) — America/New_York",
];

const SHIFT_END_TIMES = ["12:00 am", "01:00 am", "02:00 am", "03:00 am", "04:00 am", "05:00 am", "06:00 am"];

const CURRENCIES: { label: string; symbol: string }[] = [
  { label: "Philippine peso, ₱", symbol: "₱" },
  { label: "US dollar, $", symbol: "$" },
  { label: "Euro, €", symbol: "€" },
];

const LANGUAGES = ["English", "Filipino"];
const SERVICE_CHARGE_FEES: ServiceChargeFee[] = ["Don't use", "5%", "10%"];
const LOW_STOCK_ALERTS: LowStockAlert[] = ["Do not notify", "Daily digest", "Immediate"];
const MAX_LOGO_BYTES = 5 * 1024 * 1024;

const INPUT =
  "w-full rounded-md border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1A73E8] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white dark:disabled:bg-[#24272C] dark:disabled:text-slate-500";

function Row({ label, children, helper }: { label: string; children: ReactNode; helper?: ReactNode }) {
  return (
    <div className="grid gap-1.5 py-3.5 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-6">
      <div className="pt-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</div>
      <div className="min-w-0">
        {children}
        {helper && <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{helper}</p>}
      </div>
    </div>
  );
}

function CheckRow({
  label,
  checked,
  onChange,
  subtext,
  linkLabel,
  onLink,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  subtext?: string;
  linkLabel?: string;
  onLink?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <label className="flex min-w-0 cursor-pointer items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-0.5 h-3.5 w-3.5 accent-[#1DB954]" />
        <span>
          <span className="font-medium">{label}</span>
          {subtext && <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{subtext}</span>}
        </span>
      </label>
      {linkLabel && (
        <button type="button" onClick={onLink} className="shrink-0 cursor-pointer text-xs font-medium text-[#1A73E8] hover:underline dark:text-[#7EB3F5]">
          {linkLabel}
        </button>
      )}
    </div>
  );
}

export function GeneralSettingsView() {
  const { state, actions } = usePosStore();
  const [form, setForm] = useState<LocationSettings | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dirtyRef = useRef(false);

  // Re-seed the draft from persisted settings after hydration or external resets,
  // but never clobber edits the user hasn't saved yet.
  useEffect(() => {
    if (!dirtyRef.current) setForm(structuredClone(state.settings));
  }, [state.settings]);

  const settings = form ?? state.settings;
  const patch = (value: Partial<LocationSettings>) => {
    dirtyRef.current = true;
    setForm((current) => (current ? { ...current, ...value } : current));
  };

  const onLogoFile = (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
      actions.showToast("Logo must be a JPEG, PNG or GIF image.", "info");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      actions.showToast("Logo file is larger than 5 MB.", "info");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => patch({ logo: String(reader.result ?? "") });
    reader.readAsDataURL(file);
  };

  const save = () => {
    if (!form) return;
    actions.updateSettings({
      companyName: form.companyName.trim() || form.companyName,
      timezone: form.timezone,
      shiftEndTime: form.shiftEndTime,
      currencySymbol: form.currencySymbol,
      currencyLabel: form.currencyLabel,
      language: form.language,
      showFloorPlan: form.showFloorPlan,
      quickWaitersChange: form.quickWaitersChange,
      enablePartialServing: form.enablePartialServing,
      roundOrderPrice: form.roundOrderPrice,
      serviceChargeFee: form.serviceChargeFee,
      useManufacturing: form.useManufacturing,
      cashRegisterShifts: form.cashRegisterShifts,
      useTaxes: form.useTaxes,
      payrollTracking: form.payrollTracking,
      lowStockAlert: form.lowStockAlert,
      logo: form.logo,
    });
    dirtyRef.current = false;
  };

  return (
    <div className="max-w-4xl">
      <div className="border-b border-[#E5E8EC] pb-3.5 dark:border-[#33373E]">
        <h1 className="text-xl font-bold tracking-tight">General</h1>
      </div>

      <section className="pt-5">
        <h2 className="text-sm font-bold">Company settings</h2>
        <div className="mt-1 divide-y divide-[#EEF1F4] dark:divide-[#2C3036]">
          <Row
            label="Company name"
            helper={
              <>
                It will be printed on the receipt. If all locations in your account are given different names, enable printing the location&apos;s name on a receipt at{" "}
                <Link href="/manage/settings/receipt" className="font-medium text-[#1A73E8] hover:underline dark:text-[#7EB3F5]">receipt settings</Link>.
              </>
            }
          >
            <input value={settings.companyName} onChange={(event) => patch({ companyName: event.target.value })} className={INPUT} />
          </Row>
          <Row label="Address in Poster">
            <input value={settings.address} disabled readOnly className={INPUT} />
          </Row>
          <Row
            label="Logo"
            helper="It will be printed in the receipt header. Supported formats include JPEG, PNG or GIF. File size is up to 5 MB."
          >
            <div className="flex items-center gap-3">
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif" className="hidden" onChange={(event) => { onLogoFile(event.target.files?.[0]); event.target.value = ""; }} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-[#D1D5DB] px-3 py-1.5 text-xs font-semibold text-[#1A73E8] hover:bg-sky-500/10 dark:border-[#3E434C] dark:text-[#7EB3F5]"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload...
              </button>
              {settings.logo && (
                <span className="relative inline-flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={settings.logo} alt="Logo preview" className="h-9 w-auto max-w-32 rounded border border-[#E5E8EC] bg-white object-contain p-0.5 dark:border-[#3E434C]" />
                  <button type="button" aria-label="Remove logo" onClick={() => patch({ logo: "" })} className="cursor-pointer text-slate-400 hover:text-rose-500"><X className="h-3.5 w-3.5" /></button>
                </span>
              )}
            </div>
          </Row>
        </div>
      </section>

      <section className="mt-6 border-t border-[#E5E8EC] pt-5 dark:border-[#33373E]">
        <h2 className="text-sm font-bold">General settings</h2>
        <div className="mt-1 divide-y divide-[#EEF1F4] dark:divide-[#2C3036]">
          <Row label="Timezone">
            <select value={settings.timezone} onChange={(event) => patch({ timezone: event.target.value })} className={`${INPUT} cursor-pointer`}>
              {!TIMEZONES.includes(settings.timezone) && <option value={settings.timezone}>{settings.timezone}</option>}
              {TIMEZONES.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
            </select>
          </Row>
          <Row
            label="Shift end time"
            helper="If your venue is open after midnight, specify the latest possible time of the business day ending. For example, select 05:00 and all sales and payroll reports will be made according to the specified time — from 05:00 to 05:00 the next day — instead of calendar days."
          >
            <select value={settings.shiftEndTime} onChange={(event) => patch({ shiftEndTime: event.target.value })} className={`${INPUT} cursor-pointer`}>
              {!SHIFT_END_TIMES.includes(settings.shiftEndTime) && <option value={settings.shiftEndTime}>{settings.shiftEndTime}</option>}
              {SHIFT_END_TIMES.map((time) => <option key={time} value={time}>{time}</option>)}
            </select>
          </Row>
          <Row label="Currency">
            <select
              value={settings.currencyLabel}
              onChange={(event) => {
                const currency = CURRENCIES.find((entry) => entry.label === event.target.value);
                if (currency) patch({ currencyLabel: currency.label, currencySymbol: currency.symbol });
              }}
              className={`${INPUT} cursor-pointer`}
            >
              {CURRENCIES.map((currency) => <option key={currency.label} value={currency.label}>{currency.label}</option>)}
            </select>
          </Row>
          <Row label="Language">
            <select value={settings.language} onChange={(event) => patch({ language: event.target.value })} className={`${INPUT} cursor-pointer`}>
              {LANGUAGES.map((language) => <option key={language} value={language}>{language}</option>)}
            </select>
          </Row>
        </div>
      </section>

      <section className="mt-6 border-t border-[#E5E8EC] pt-5 dark:border-[#33373E]">
        <h2 className="text-sm font-bold">Point of Sale settings</h2>
        <div className="mt-1 divide-y divide-[#EEF1F4] dark:divide-[#2C3036]">
          <CheckRow
            label="Show floor plan"
            checked={settings.showFloorPlan}
            onChange={(value) => patch({ showFloorPlan: value })}
            subtext="Turn off this setting if you provide a counter service. Once the order has been paid, a new one will open automatically."
          />
          <CheckRow
            label="Use a quick waiters change on the Point of Sale"
            checked={settings.quickWaitersChange}
            onChange={(value) => patch({ quickWaitersChange: value })}
            subtext="Employees will be able to switch between orders without re-entering the PIN code"
          />
          <CheckRow
            label="Enable partial serving"
            checked={settings.enablePartialServing !== false}
            onChange={(value) => patch({ enablePartialServing: value })}
            subtext="Waiters can add 0.5 pizza or 1.25 cocktails to an order. Poster will automatically adjust the price and cost for these portion sizes."
          />
          <CheckRow
            label="Round the order price"
            checked={settings.roundOrderPrice === true}
            onChange={(value) => patch({ roundOrderPrice: value })}
            subtext="The price will be rounded down to integer (eg: 10.60 → 10)"
          />
          <Row label="Service charge fee">
            <select value={settings.serviceChargeFee ?? "Don't use"} onChange={(event) => patch({ serviceChargeFee: event.target.value as ServiceChargeFee })} className={`${INPUT} max-w-xs cursor-pointer`}>
              {SERVICE_CHARGE_FEES.map((fee) => <option key={fee} value={fee}>{fee}</option>)}
            </select>
          </Row>
        </div>
      </section>

      <section className="mt-6 border-t border-[#E5E8EC] pt-5 dark:border-[#33373E]">
        <h2 className="text-sm font-bold">Management settings</h2>
        <div className="mt-1 divide-y divide-[#EEF1F4] dark:divide-[#2C3036]">
          <CheckRow
            label="Use manufacturing of dishes and preparations"
            checked={settings.useManufacturing}
            onChange={(value) => patch({ useManufacturing: value })}
            linkLabel="What are manufactures?"
            onLink={() => actions.showToast("Manufacturing turns raw ingredients into dishes and preparations before they are sold.", "blue")}
          />
          <CheckRow
            label="Use cash shifts"
            checked={settings.cashRegisterShifts}
            onChange={(value) => patch({ cashRegisterShifts: value })}
            linkLabel="What are cash shifts?"
            onLink={() => actions.showToast("Cash shifts track cash drawer openings, sales and safe drops per shift.", "blue")}
          />
          <CheckRow
            label="Use taxes"
            checked={settings.useTaxes}
            onChange={(value) => patch({ useTaxes: value })}
          />
          <CheckRow
            label="Staff time tracking"
            checked={settings.payrollTracking}
            onChange={(value) => patch({ payrollTracking: value })}
          />
          <Row
            label="Low stock alert"
            helper={
              <>
                You&apos;ll receive an email with the information about inventory in the storage, for which the Limit in the{" "}
                <Link href="/manage/inventory/stock" className="font-medium text-[#1A73E8] hover:underline dark:text-[#7EB3F5]">Storage → Inventory</Link> tab is indicated
              </>
            }
          >
            <select value={settings.lowStockAlert ?? "Do not notify"} onChange={(event) => patch({ lowStockAlert: event.target.value as LowStockAlert })} className={`${INPUT} max-w-xs cursor-pointer`}>
              {LOW_STOCK_ALERTS.map((alert) => <option key={alert} value={alert}>{alert}</option>)}
            </select>
          </Row>
        </div>
      </section>

      <div className="mt-6 grid gap-1.5 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-6">
        <div />
        <div>
          <button type="button" onClick={save} className="cursor-pointer rounded-md bg-[#1DB954] px-6 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#18A348]">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
