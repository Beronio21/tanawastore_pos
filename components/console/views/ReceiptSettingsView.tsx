"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { usePosStore } from "@/lib/pos-store";
import type { PrintOnReceipt, ReceiptLanguage, ReceiptSettings } from "@/lib/console-data";

const INPUT =
  "w-full rounded-md border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1A73E8] dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white";

const LANGUAGES: ReceiptLanguage[] = ["Account language", "English", "Filipino"];
const PRINT_ON: PrintOnReceipt[] = ["Company name", "Business name"];

function CheckRow({ label, checked, onChange, subtext }: { label: string; checked: boolean; onChange: (value: boolean) => void; subtext?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 py-2.5 text-xs text-slate-700 dark:text-slate-300">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-0.5 h-3.5 w-3.5 accent-[#1DB954]" />
      <span>
        <span className="font-medium">{label}</span>
        {subtext && <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{subtext}</span>}
      </span>
    </label>
  );
}

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

export function ReceiptSettingsView() {
  const { state, actions } = usePosStore();
  const [form, setForm] = useState<ReceiptSettings | null>(null);
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (!dirtyRef.current) setForm(structuredClone(state.receiptSettings));
  }, [state.receiptSettings]);

  const settings = form ?? state.receiptSettings;
  const patch = (value: Partial<ReceiptSettings>) => {
    dirtyRef.current = true;
    setForm((current) => (current ? { ...current, ...value } : current));
  };

  const patchPrediction = (index: number, value: string) => {
    dirtyRef.current = true;
    setForm((current) =>
      current ? { ...current, predictions: current.predictions.map((entry, i) => (i === index ? value : entry)) } : current,
    );
  };

  const addPrediction = () => {
    dirtyRef.current = true;
    setForm((current) => (current ? { ...current, predictions: [...current.predictions, ""] } : current));
  };

  const removePrediction = (index: number) => {
    dirtyRef.current = true;
    setForm((current) =>
      current ? { ...current, predictions: current.predictions.filter((_, i) => i !== index) } : current,
    );
  };

  const save = () => {
    if (!form) return;
    const predictions = form.predictions.map((entry) => entry.trim()).filter(Boolean);
    actions.saveReceiptSettings({
      ...form,
      predictions: predictions.length ? predictions : [""],
      wifiName: form.wifiName.trim(),
      wifiPassword: form.wifiPassword.trim(),
    });
    dirtyRef.current = false;
  };

  return (
    <div className="max-w-4xl">
      <div className="border-b border-[#E5E8EC] pb-3.5 dark:border-[#33373E]">
        <h1 className="text-xl font-bold tracking-tight">Receipt settings</h1>
      </div>

      <div className="mt-1 divide-y divide-[#EEF1F4] dark:divide-[#2C3036]">
        <CheckRow label="Print receipt automatically when closing an order" checked={settings.autoPrint} onChange={(value) => patch({ autoPrint: value })} />
        <CheckRow label="Print receipt number" checked={settings.printReceiptNumber} onChange={(value) => patch({ printReceiptNumber: value })} />
        <CheckRow
          label="Print receipt comments"
          checked={settings.printComments}
          onChange={(value) => patch({ printComments: value })}
          subtext="With the enabled setting, the comment left by the employee will be printed on the receipt"
        />
        <CheckRow
          label="Add phone number and address of the customer in receipt"
          checked={settings.printCustomerContact}
          onChange={(value) => patch({ printCustomerContact: value })}
          subtext="Phone number and address from your client's card are printed on the receipt. This is convenient for delivery personnel."
        />
      </div>

      <section className="mt-6 border-t border-[#E5E8EC] pt-5 dark:border-[#33373E]">
        <CheckRow label="Print predictions" checked={settings.printPredictions} onChange={(value) => patch({ printPredictions: value })} />
        {settings.printPredictions && (
          <div className="mt-2 max-w-md space-y-2">
            {settings.predictions.map((prediction, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  value={prediction}
                  onChange={(event) => patchPrediction(index, event.target.value)}
                  placeholder="Prediction text"
                  className={INPUT}
                />
                {settings.predictions.length > 1 && (
                  <button
                    type="button"
                    aria-label="Remove prediction"
                    onClick={() => removePrediction(index)}
                    className="shrink-0 cursor-pointer rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addPrediction}
              className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-[#0077FF] hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Add another prediction
            </button>
          </div>
        )}
      </section>

      <section className="mt-6 border-t border-[#E5E8EC] pt-5 dark:border-[#33373E]">
        <CheckRow label="Print Wi-Fi" checked={settings.printWifi} onChange={(value) => patch({ printWifi: value })} />
        {settings.printWifi && (
          <div className="mt-2 max-w-md space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Wi-Fi network name</span>
              <input value={settings.wifiName} onChange={(event) => patch({ wifiName: event.target.value })} className={INPUT} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Wi-Fi password</span>
              <input value={settings.wifiPassword} onChange={(event) => patch({ wifiPassword: event.target.value })} className={INPUT} />
            </label>
          </div>
        )}
      </section>

      <section className="mt-6 border-t border-[#E5E8EC] pt-5 dark:border-[#33373E]">
        <CheckRow label="Print address" checked={settings.printAddress} onChange={(value) => patch({ printAddress: value })} />
        <div className="mt-1 divide-y divide-[#EEF1F4] dark:divide-[#2C3036]">
          <Row label="Receipt language">
            <select value={settings.receiptLanguage} onChange={(event) => patch({ receiptLanguage: event.target.value as ReceiptLanguage })} className={`${INPUT} max-w-xs cursor-pointer`}>
              {LANGUAGES.map((language) => <option key={language} value={language}>{language}</option>)}
            </select>
          </Row>
          <Row
            label="Print on receipt"
            helper={
              <>
                Print &ldquo;Company name&rdquo; for receipt header from{" "}
                <Link href="/manage/settings" className="font-medium text-[#1A73E8] hover:underline dark:text-[#7EB3F5]">Settings → General</Link>{" "}
                tab if all locations in your account have the same name. If the names are different, print &ldquo;Business name&rdquo; from{" "}
                <Link href="/manage/access/locations" className="font-medium text-[#1A73E8] hover:underline dark:text-[#7EB3F5]">Access → Locations</Link>.
              </>
            }
          >
            <select value={settings.printOnReceipt} onChange={(event) => patch({ printOnReceipt: event.target.value as PrintOnReceipt })} className={`${INPUT} max-w-xs cursor-pointer`}>
              {PRINT_ON.map((option) => <option key={option} value={option}>{option}</option>)}
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
