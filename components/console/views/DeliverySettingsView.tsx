"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CircleHelp, Plus, X } from "lucide-react";
import { usePosStore } from "@/lib/pos-store";
import type { DeliveryArea, DeliverySettings, FiscalReceiptMode } from "@/lib/console-data";
import { Toggle } from "../ui";

const FISCAL_RECEIPT_MODES: FiscalReceiptMode[] = ["During payment", "Upon delivery", "When creating an order", "Don't print"];

const INPUT =
  "w-full rounded-md border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1A73E8] dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white";

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

function Tooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <CircleHelp className="h-3.5 w-3.5 cursor-help text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
      <span className="pointer-events-none absolute left-5 top-1/2 z-20 hidden w-56 -translate-y-1/2 rounded-md bg-slate-800 px-2.5 py-1.5 text-[11px] leading-snug text-white shadow-lg group-hover:block dark:bg-slate-200 dark:text-slate-900">
        {text}
      </span>
    </span>
  );
}

export function DeliverySettingsView() {
  const { state, actions } = usePosStore();
  const [form, setForm] = useState<DeliverySettings | null>(null);
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (!dirtyRef.current) setForm(structuredClone(state.deliverySettings));
  }, [state.deliverySettings]);

  const settings = form ?? state.deliverySettings;
  const patch = (value: Partial<DeliverySettings>) => {
    dirtyRef.current = true;
    setForm((current) => (current ? { ...current, ...value } : current));
  };

  const patchArea = (id: string, value: Partial<DeliveryArea>) => {
    dirtyRef.current = true;
    setForm((current) =>
      current ? { ...current, areas: current.areas.map((area) => (area.id === id ? { ...area, ...value } : area)) } : current,
    );
  };

  const addArea = () => {
    dirtyRef.current = true;
    setForm((current) =>
      current
        ? {
            ...current,
            areas: [
              ...current.areas,
              { id: `da-${Date.now().toString(36)}`, name: "", cost: 0, serviceTimeMin: 60 },
            ],
          }
        : current,
    );
  };

  const removeArea = (id: string) => {
    dirtyRef.current = true;
    setForm((current) =>
      current ? { ...current, areas: current.areas.filter((area) => area.id !== id) } : current,
    );
  };

  const save = () => {
    if (!form) return;
    const areas = form.areas
      .map((area) => ({
        ...area,
        name: area.name.trim() || "Delivery area",
        cost: Math.max(0, area.cost || 0),
        serviceTimeMin: Math.max(0, area.serviceTimeMin || 0),
      }))
      .filter((area) => area.name.trim().length > 0 || form.areas.length > 1);
    actions.saveDeliverySettings({ ...form, areas: areas.length ? areas : form.areas });
    dirtyRef.current = false;
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between border-b border-[#E5E8EC] pb-3.5 dark:border-[#33373E]">
        <h1 className="text-xl font-bold tracking-tight">Delivery</h1>
        <button
          type="button"
          onClick={() => actions.showToast("Delivery orders let couriers pick up checks and mark them ready or delivered.", "blue")}
          className="cursor-pointer text-xs font-medium text-[#1A73E8] hover:underline dark:text-[#7EB3F5]"
        >
          How do I work with delivery orders?
        </button>
      </div>

      <div className="mt-1 divide-y divide-[#EEF1F4] dark:divide-[#2C3036]">
        <Row label="Start using delivery">
          <div className="pt-1">
            <Toggle checked={settings.enabled} onChange={() => patch({ enabled: !settings.enabled })} label="Start using delivery" />
          </div>
        </Row>
        <Row label="Use orders statuses">
          <div className="space-y-2 pt-1">
            <label className="flex cursor-pointer items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={settings.orderStatuses.ready}
                onChange={(event) => patch({ orderStatuses: { ...settings.orderStatuses, ready: event.target.checked } })}
                className="h-3.5 w-3.5 accent-[#1DB954]"
              />
              Ready
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={settings.orderStatuses.delivered}
                onChange={(event) => patch({ orderStatuses: { ...settings.orderStatuses, delivered: event.target.checked } })}
                className="h-3.5 w-3.5 accent-[#1DB954]"
              />
              Delivered
              <Tooltip text="Track delivery orders through Ready and Delivered statuses on the POS and kitchen screens." />
            </label>
          </div>
        </Row>
        <Row label="Print fiscal receipt">
          <select
            value={settings.fiscalReceipt}
            onChange={(event) => patch({ fiscalReceipt: event.target.value as FiscalReceiptMode })}
            className={`${INPUT} max-w-xs cursor-pointer`}
          >
            {FISCAL_RECEIPT_MODES.map((mode) => (
              <option key={mode} value={mode}>{mode}</option>
            ))}
          </select>
        </Row>
      </div>

      <section className="mt-6 border-t border-[#E5E8EC] pt-5 dark:border-[#33373E]">
        <h2 className="text-sm font-bold">Delivery areas and rates</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] border-separate border-spacing-0 text-left">
            <thead>
              <tr className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <th className="w-[38%] px-0 pb-2">Name</th>
                <th className="w-[26%] px-3 pb-2">
                  <span className="inline-flex items-center gap-1.5">
                    Cost
                    <Tooltip text="Flat delivery fee added to the order total when this area is selected on the POS." />
                  </span>
                </th>
                <th className="w-[26%] px-3 pb-2">
                  <span className="inline-flex items-center gap-1.5">
                    Standard service time
                    <Tooltip text="Estimated minutes shown to staff and customers for deliveries in this area." />
                  </span>
                </th>
                <th className="w-10 pb-2" />
              </tr>
            </thead>
            <tbody>
              {settings.areas.map((area) => (
                <tr key={area.id} className="align-middle">
                  <td className="px-0 py-1.5">
                    <input
                      value={area.name}
                      onChange={(event) => patchArea(area.id, { name: event.target.value })}
                      placeholder="Area name"
                      className={INPUT}
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-stretch">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={area.cost}
                        onChange={(event) => patchArea(area.id, { cost: Number(event.target.value) })}
                        className={`${INPUT} rounded-r-none border-r-0`}
                      />
                      <span className="flex items-center rounded-r-md border border-l-0 border-[#D1D5DB] bg-slate-50 px-2.5 text-xs font-semibold text-slate-500 dark:border-[#3E434C] dark:bg-[#24272C] dark:text-slate-400">
                        ₱
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-stretch">
                      <input
                        type="number"
                        min={0}
                        step="1"
                        value={area.serviceTimeMin}
                        onChange={(event) => patchArea(area.id, { serviceTimeMin: Number(event.target.value) })}
                        className={`${INPUT} rounded-r-none border-r-0`}
                      />
                      <span className="flex items-center rounded-r-md border border-l-0 border-[#D1D5DB] bg-slate-50 px-2.5 text-xs font-semibold text-slate-500 dark:border-[#3E434C] dark:bg-[#24272C] dark:text-slate-400">
                        min.
                      </span>
                    </div>
                  </td>
                  <td className="py-1.5 pl-2">
                    {settings.areas.length > 1 && (
                      <button
                        type="button"
                        aria-label="Remove area"
                        onClick={() => removeArea(area.id)}
                        className="cursor-pointer rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={addArea}
          className="mt-3 inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-[#1A73E8] hover:underline dark:text-[#7EB3F5]"
        >
          <Plus className="h-3.5 w-3.5" />
          New area
        </button>
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
