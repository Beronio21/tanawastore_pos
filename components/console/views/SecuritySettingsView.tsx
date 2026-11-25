"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { usePosStore } from "@/lib/pos-store";
import type { AdminPasswordRule, SecuritySettings } from "@/lib/console-data";

const INPUT =
  "w-full rounded-md border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1A73E8] dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white";

const RULE_OPTIONS_BASIC: AdminPasswordRule[] = ["Always", "After a check is printed", "Never"];
const RULE_OPTIONS_DELETE: AdminPasswordRule[] = ["Always", "In cases...", "Never"];

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

function CheckRow({ label, checked, onChange, subtext }: { label: string; checked: boolean; onChange: (value: boolean) => void; subtext?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 py-2 text-xs text-slate-700 dark:text-slate-300">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-0.5 h-3.5 w-3.5 accent-[#1DB954]" />
      <span>
        <span className="font-medium">{label}</span>
        {subtext && <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{subtext}</span>}
      </span>
    </label>
  );
}

const RULE_LABELS: { key: keyof SecuritySettings["adminRules"]; label: string; options?: AdminPasswordRule[] }[] = [
  { key: "deleteItem", label: "when deleting an item", options: RULE_OPTIONS_DELETE },
  { key: "addDiscount", label: "when adding a discount" },
  { key: "cancelPromotion", label: "when cancelling promotion" },
  { key: "runReport", label: "when running a report" },
  { key: "splitOrder", label: "when splitting an order" },
  { key: "closeReceipt", label: "when closing a receipt" },
  { key: "addCustomer", label: "when adding a customer from register" },
  { key: "viewOrdersHistory", label: "View orders history" },
  { key: "addSupplyTablet", label: "when adding a supply on a tablet" },
  { key: "viewDevices", label: "when viewing devices" },
];

export function SecuritySettingsView() {
  const { state, actions } = usePosStore();
  const [form, setForm] = useState<SecuritySettings | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (!dirtyRef.current) setForm(structuredClone(state.securitySettings));
  }, [state.securitySettings]);

  const settings = form ?? state.securitySettings;
  const patch = (value: Partial<SecuritySettings>) => {
    dirtyRef.current = true;
    setForm((current) => (current ? { ...current, ...value } : current));
  };

  const patchRule = (key: keyof SecuritySettings["adminRules"], value: AdminPasswordRule) => {
    dirtyRef.current = true;
    setForm((current) =>
      current ? { ...current, adminRules: { ...current.adminRules, [key]: value } } : current,
    );
  };

  const patchDeleteCase = (key: keyof SecuritySettings["adminRules"]["deleteItemCases"], value: boolean) => {
    dirtyRef.current = true;
    setForm((current) =>
      current
        ? {
            ...current,
            adminRules: {
              ...current.adminRules,
              deleteItemCases: { ...current.adminRules.deleteItemCases, [key]: value },
            },
          }
        : current,
    );
  };

  const save = () => {
    if (!form) return;
    if (!form.adminPassword.trim()) {
      actions.showToast("Admin password cannot be empty.", "info");
      return;
    }
    actions.saveSecuritySettings({ ...form, adminPassword: form.adminPassword });
    dirtyRef.current = false;
  };

  return (
    <div className="max-w-4xl">
      <div className="border-b border-[#E5E8EC] pb-3.5 dark:border-[#33373E]">
        <h1 className="text-xl font-bold tracking-tight">Security settings</h1>
      </div>

      <div className="mt-1 divide-y divide-[#EEF1F4] dark:divide-[#2C3036]">
        <Row
          label="Admin password"
          helper="Poster uses admin password to confirm dangerous actions"
        >
          <div className="relative max-w-xs">
            <input
              type={showPassword ? "text" : "password"}
              value={settings.adminPassword}
              onChange={(event) => patch({ adminPassword: event.target.value })}
              className={`${INPUT} pr-9 font-mono`}
              autoComplete="off"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide admin password" : "Show admin password"}
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Row>
        <div className="py-2">
          <CheckRow
            label="Don't allow to print check before closing order"
            checked={settings.blockPrintBeforeClose}
            onChange={(value) => patch({ blockPrintBeforeClose: value })}
            subtext="Hide the check print button in the application"
          />
          <CheckRow
            label="Print two receipts on closing an order"
            checked={settings.printTwoReceipts}
            onChange={(value) => patch({ printTwoReceipts: value })}
          />
          <CheckRow
            label="Add customer to order only after reading a magnetic card"
            checked={settings.magneticCardCustomer}
            onChange={(value) => patch({ magneticCardCustomer: value })}
          />
        </div>
      </div>

      <section className="mt-6 border-t border-[#E5E8EC] pt-5 dark:border-[#33373E]">
        <h2 className="text-sm font-bold">Tickets for kitchen</h2>
        <div className="mt-1 divide-y divide-[#EEF1F4] dark:divide-[#2C3036]">
          <Row label="Automatically send tickets with orders that need to be prepared">
            <select
              value={settings.autoKitchenTickets}
              onChange={(event) => patch({ autoKitchenTickets: event.target.value as SecuritySettings["autoKitchenTickets"] })}
              className={`${INPUT} max-w-md cursor-pointer`}
            >
              {(["Never", "When printing a check", "When closing an order"] as const).map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </Row>
          <Row label="Allow sending kitchen tickets from any register">
            <select
              value={settings.kitchenTicketsAnyRegister}
              onChange={(event) => patch({ kitchenTicketsAnyRegister: event.target.value as SecuritySettings["kitchenTicketsAnyRegister"] })}
              className={`${INPUT} max-w-xs cursor-pointer`}
            >
              {(["Never", "Always"] as const).map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </Row>
        </div>
      </section>

      <section className="mt-6 border-t border-[#E5E8EC] pt-5 dark:border-[#33373E]">
        <h2 className="text-sm font-bold">Require admin password</h2>
        <div className="mt-1 divide-y divide-[#EEF1F4] dark:divide-[#2C3036]">
          {RULE_LABELS.map(({ key, label, options }) => {
            const ruleValue = settings.adminRules[key] as AdminPasswordRule;
            return (
              <div key={key}>
                <Row label={label}>
                  <select
                    value={ruleValue}
                    onChange={(event) => patchRule(key, event.target.value as AdminPasswordRule)}
                    className={`${INPUT} max-w-xs cursor-pointer`}
                  >
                    {(options ?? RULE_OPTIONS_BASIC).map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </Row>
                {key === "deleteItem" && ruleValue === "In cases..." && (
                  <div className="mb-3 ml-0 space-y-2 pl-0 sm:ml-[248px] sm:pl-0">
                    <label className="flex cursor-pointer items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={settings.adminRules.deleteItemCases.afterCheckPrinted}
                        onChange={(event) => patchDeleteCase("afterCheckPrinted", event.target.checked)}
                        className="h-3.5 w-3.5 accent-[#1DB954]"
                      />
                      After a check is printed
                    </label>
                    <label className="flex cursor-pointer items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={settings.adminRules.deleteItemCases.afterTicketPrinted}
                        onChange={(event) => patchDeleteCase("afterTicketPrinted", event.target.checked)}
                        className="h-3.5 w-3.5 accent-[#1DB954]"
                      />
                      After a ticket is printed
                    </label>
                  </div>
                )}
              </div>
            );
          })}
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
