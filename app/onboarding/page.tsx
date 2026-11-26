"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Copy, RefreshCw, Rocket, Store } from "lucide-react";
import { usePosStore } from "@/lib/pos-store";
import { BUSINESS_PRESETS, type BusinessType } from "@/lib/onboarding-presets";
import { formatMoney } from "@/lib/format";

const FIELD =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1A73E8] dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white";
const LABEL = "mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24) || "tanawa";
}

function randomPassword(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

export default function OnboardingPage() {
  const router = useRouter();
  const { state, actions } = usePosStore();
  const [step, setStep] = useState(1);
  const [businessName, setBusinessName] = useState("tanawa");
  const [businessType, setBusinessType] = useState<BusinessType>("cafe");
  const [currency, setCurrency] = useState("Philippine peso, ₱");
  const [timezone, setTimezone] = useState("(+08:00) — Asia/Manila");
  const [locationName, setLocationName] = useState("");
  const [address, setAddress] = useState("");
  const [openingFloat, setOpeningFloat] = useState("0");
  const [registerName, setRegisterName] = useState("Register 1");
  const [registerLogin, setRegisterLogin] = useState(() => slugify("tanawa"));
  const [registerPassword, setRegisterPassword] = useState(() => randomPassword());
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const preset = useMemo(
    () => BUSINESS_PRESETS.find((entry) => entry.id === businessType) ?? BUSINESS_PRESETS[0],
    [businessType],
  );

  useEffect(() => {
    // Keep middleware sending unfinished workspaces back here until launch.
    document.cookie = "tanawa_onboarding=incomplete; path=/; max-age=31536000; SameSite=Lax";
  }, []);

  const changeBusinessName = (value: string) => {
    setBusinessName(value);
    setRegisterLogin(slugify(value));
  };

  const canContinue = businessName.trim().length > 1;
  const canLaunch = canContinue && Boolean(registerLogin.trim()) && Boolean(registerPassword);

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(registerPassword);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const launch = async () => {
    if (!canLaunch || saving) return;
    setSaving(true);
    const profile = {
      name: businessName.trim(),
      businessType: preset.id,
      currency,
      timezone,
      registerLogin,
      registerTitle: registerName,
      locationName: locationName.trim() || businessName.trim(),
      address,
      openingFloat: Number(openingFloat) || 0,
      completedAt: new Date().toISOString(),
    };

    try {
      await fetch("/api/v1/onboarding/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          businessName: profile.name,
          businessType: preset.id,
          currency,
          timezone,
          locationName: profile.locationName,
          address,
          openingFloat: profile.openingFloat,
          registerName,
          registerLogin,
          registerPassword,
        }),
      });
    } catch {
      // Offline-first: the local workspace is still launched.
    }

    actions.completeOnboarding(profile, preset);
    router.push("/manage/dash/stat");
  };

  const symbol = currency.includes("₱") ? "₱" : state.settings.currencySymbol;

  return (
    <div className="min-h-screen bg-[#F3F5F7] px-4 py-8 text-[#1F2328] dark:bg-[#17191C] dark:text-white">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F5A623] text-sm font-black text-white">T</span>
          <div>
            <h1 className="text-lg font-bold">Set up your workspace</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Step {step} of 3 · Launch a tenant-ready TanAwa POS store.</p>
          </div>
        </div>

        <ol className="mb-5 grid grid-cols-3 gap-2 text-[11px] font-bold">
          {["Business profile", "Location & register", "Launch store"].map((label, index) => {
            const number = index + 1;
            const active = step === number;
            const done = step > number;
            return (
              <li
                key={label}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                  active
                    ? "border-[#1A73E8] bg-[#E8EFF7] text-[#1A73E8] dark:border-[#1A73E8] dark:bg-[#1A73E8]/15 dark:text-[#7EB3F5]"
                    : done
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : "border-slate-200 bg-white text-slate-500 dark:border-[#33373E] dark:bg-[#24272C] dark:text-slate-400"
                }`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${done ? "bg-emerald-600 text-white" : active ? "bg-[#1A73E8] text-white" : "bg-slate-200 dark:bg-[#33373E]"}`}>
                  {done ? <Check className="h-3 w-3" /> : number}
                </span>
                <span className="truncate">{label}</span>
              </li>
            );
          })}
        </ol>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#33373E] dark:bg-[#24272C]">
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="sm:col-span-3">
                  <span className={LABEL}>Business / store name</span>
                  <input className={FIELD} value={businessName} onChange={(event) => changeBusinessName(event.target.value)} placeholder="tanawa" />
                </label>
                <label>
                  <span className={LABEL}>Currency</span>
                  <select className={FIELD} value={currency} onChange={(event) => setCurrency(event.target.value)}>
                    <option>Philippine peso, ₱</option>
                    <option>US dollar, $</option>
                    <option>Euro, €</option>
                  </select>
                </label>
                <label className="sm:col-span-2">
                  <span className={LABEL}>Timezone</span>
                  <select className={FIELD} value={timezone} onChange={(event) => setTimezone(event.target.value)}>
                    <option>(+08:00) — Asia/Manila</option>
                    <option>(+07:00) — Asia/Bangkok</option>
                    <option>(+09:00) — Asia/Tokyo</option>
                  </select>
                </label>
              </div>

              <div>
                <p className={LABEL}>Business type</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {BUSINESS_PRESETS.map((entry) => {
                    const selected = entry.id === businessType;
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => setBusinessType(entry.id)}
                        className={`cursor-pointer rounded-xl border p-3 text-left transition-colors ${
                          selected
                            ? "border-[#1A73E8] bg-[#E8EFF7] dark:border-[#1A73E8] dark:bg-[#1A73E8]/15"
                            : "border-slate-200 hover:border-slate-300 dark:border-[#33373E] dark:hover:border-[#3E434C]"
                        }`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold">{entry.title}</span>
                          {selected && <Check className="h-4 w-4 shrink-0 text-[#1A73E8]" />}
                        </span>
                        <span className="mt-1 block text-[11px] text-slate-500 dark:text-slate-400">{entry.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-[11px] dark:border-[#3E434C] dark:bg-[#1D2024]">
                <span className="font-bold">{preset.title} preset</span>
                <ul className="mt-1 space-y-0.5 text-slate-600 dark:text-slate-300">
                  <li>Floor plan: {preset.showFloorPlan ? "enabled" : "counter mode"}</li>
                  <li>Stations: {preset.stations.join(", ")}</li>
                  <li>Categories: {preset.categories.join(", ")}</li>
                  {preset.serviceCharge && <li>Service charge: {preset.serviceCharge}</li>}
                  {preset.orderingUnits && <li>Ordering units: {preset.orderingUnits.map((unit) => unit.title).join(", ")}</li>}
                </ul>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className={LABEL}>Location name</span>
                <input className={FIELD} value={locationName} onChange={(event) => setLocationName(event.target.value)} placeholder={businessName} />
              </label>
              <label>
                <span className={LABEL}>Register name</span>
                <input className={FIELD} value={registerName} onChange={(event) => setRegisterName(event.target.value)} />
              </label>
              <label className="sm:col-span-2">
                <span className={LABEL}>Address</span>
                <input className={FIELD} value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Store address" />
              </label>
              <label>
                <span className={LABEL}>Opening cash float ({symbol})</span>
                <input className={`${FIELD} font-mono`} type="number" min="0" step="0.01" value={openingFloat} onChange={(event) => setOpeningFloat(event.target.value)} />
              </label>
              <label>
                <span className={LABEL}>Register login</span>
                <input className={`${FIELD} font-mono`} value={registerLogin} onChange={(event) => setRegisterLogin(slugify(event.target.value))} />
              </label>
              <div className="sm:col-span-2">
                <span className={LABEL}>Pairing password</span>
                <div className="flex gap-2">
                  <input readOnly className={`${FIELD} font-mono`} value={registerPassword} aria-label="Register password" />
                  <button
                    type="button"
                    onClick={copyPassword}
                    className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-bold text-[#1A73E8] dark:border-[#3E434C] dark:text-[#7EB3F5]"
                  >
                    <Copy className="h-3.5 w-3.5" /> {copied ? "Copied" : "Copy"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegisterPassword(randomPassword())}
                    title="Generate a new password"
                    className="inline-flex shrink-0 cursor-pointer items-center rounded-lg border border-slate-300 px-3 text-slate-500 dark:border-[#3E434C] dark:text-slate-400"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Use this login and password on tablets at <span className="font-mono">/pos/pair</span>.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl bg-[#E8EFF7] p-4 dark:bg-[#1A73E8]/15">
                <Store className="h-8 w-8 text-[#1A73E8]" />
                <div>
                  <div className="text-sm font-bold">{businessName}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">{preset.title}</div>
                </div>
              </div>
              <dl className="grid gap-3 text-xs sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-3 dark:border-[#33373E]">
                  <dt className="font-bold text-slate-500 dark:text-slate-400">Location</dt>
                  <dd>{locationName || businessName}</dd>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 dark:border-[#33373E]">
                  <dt className="font-bold text-slate-500 dark:text-slate-400">Register</dt>
                  <dd className="font-mono">{registerName} · {registerLogin}</dd>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 dark:border-[#33373E]">
                  <dt className="font-bold text-slate-500 dark:text-slate-400">Opening float</dt>
                  <dd className="font-mono">{formatMoney(Number(openingFloat) || 0, symbol)}</dd>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 dark:border-[#33373E]">
                  <dt className="font-bold text-slate-500 dark:text-slate-400">Trial plan</dt>
                  <dd>Pro · 14 days</dd>
                </div>
              </dl>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Launching creates the cash drawer, bank and safe accounts, Storage 1, preset stations/categories, and the owner employee with PIN 0000.
              </p>
            </div>
          )}

          <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-[#33373E]">
            <button
              type="button"
              onClick={() => setStep((current) => Math.max(1, current - 1))}
              disabled={step === 1}
              className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#3E434C]"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((current) => Math.min(3, current + 1))}
                disabled={!canContinue}
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-[#1A73E8] px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={launch}
                disabled={!canLaunch || saving}
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-[#1DB954] px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Rocket className="h-3.5 w-3.5" /> {saving ? "Launching…" : "Launch store"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
