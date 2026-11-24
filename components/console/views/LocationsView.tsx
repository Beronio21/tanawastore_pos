"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, Clock, MoreVertical, Plus } from "lucide-react";
import { accountDisplayName, type BusinessLocation, type FinanceAccount } from "@/lib/console-data";
import { usePosStore } from "@/lib/pos-store";

const FIELD =
  "w-full rounded-md border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1A73E8] focus:outline-none dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white dark:placeholder:text-slate-500";
const LABEL = "mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200";
const HELP = "mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400";

type Props = { id?: string; basePath: string };
type LocationFields = Omit<BusinessLocation, "id" | "number">;

const DEFAULT_FIELDS: LocationFields = {
  name: "tanawa",
  address: "",
  login: "tanawa",
  bankAccountId: "acc-bank",
  cashAccountId: "acc-cash",
  safeAccountId: "acc-safe",
  storageLocations: ["Storage 1"],
  workingStart: "10:00",
  workingEnd: "11:00",
  is24_7: false,
};

function isNewLocation(id?: string) {
  return !id || id === "new";
}

export function LocationsView({ id, basePath }: Props) {
  const { state, actions } = usePosStore();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [storageMenuOpen, setStorageMenuOpen] = useState(false);
  const [editedFields, setEditedFields] = useState<LocationFields | null>(null);
  const creating = isNewLocation(id);
  const location = creating ? undefined : state.locations.find((entry) => entry.id === id);
  const fields: LocationFields = editedFields ?? (location ? {
    name: location.name,
    address: location.address,
    login: location.login,
    bankAccountId: location.bankAccountId,
    cashAccountId: location.cashAccountId,
    safeAccountId: location.safeAccountId,
    storageLocations: location.storageLocations,
    workingStart: location.workingStart,
    workingEnd: location.workingEnd,
    is24_7: location.is24_7,
  } : {
    ...DEFAULT_FIELDS,
    bankAccountId: state.accounts.find((account) => account.type === "Bank account")?.id ?? "",
    cashAccountId: state.accounts.find((account) => account.isCashDrawer)?.id ?? "",
    safeAccountId: state.accounts.find((account) => account.name === "Safe deposit")?.id ?? "",
  });

  const updateField = <K extends keyof LocationFields>(key: K, value: LocationFields[K]) => {
    setEditedFields((current) => ({ ...(current ?? fields), [key]: value }));
  };

  if (id !== undefined) {
    if (!creating && !location) {
      return (
        <div className="space-y-4">
          <button type="button" onClick={() => router.push(basePath)} className="inline-flex items-center gap-1 text-sm font-semibold text-[#1A73E8] dark:text-[#7EB3F5]">
            <ChevronLeft className="h-4 w-4" /> Locations
          </button>
          <p className="text-sm text-slate-500 dark:text-slate-400">This location could not be found.</p>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={() => router.push(basePath)}
          className="mb-5 inline-flex items-center gap-1 text-sm font-semibold text-[#1A73E8] hover:text-[#155DBB] dark:text-[#7EB3F5]"
        >
          <ChevronLeft className="h-4 w-4" />
          &lt; {creating ? "Adding a location" : "Editing a location"}
        </button>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            const savedId = actions.saveBusinessLocation(creating ? null : id ?? null, fields);
            if (savedId) router.push(basePath);
          }}
          className="space-y-7"
        >
          <section className="space-y-4">
            <h1 className="border-b border-[#E5E8EC] pb-2 text-base font-bold dark:border-[#33373E]">General</h1>
            <div className="grid gap-x-8 gap-y-4 md:grid-cols-[190px_minmax(0,1fr)]">
              <label htmlFor="business-name" className={`${LABEL} md:pt-2`}>Business name</label>
              <input
                id="business-name"
                className={FIELD}
                value={fields.name}
                onChange={(event) => updateField("name", event.target.value)}
                required
              />

              <label htmlFor="location-address" className={`${LABEL} md:pt-2`}>Address</label>
              <input
                id="location-address"
                className={FIELD}
                value={fields.address}
                onChange={(event) => updateField("address", event.target.value)}
                placeholder="Enter a location"
              />

              <label htmlFor="register-login" className={`${LABEL} md:pt-2`}>Registers login</label>
              <input
                id="register-login"
                className={`${FIELD} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:disabled:bg-[#24272C]`}
                value={fields.login}
                onChange={(event) => updateField("login", event.target.value)}
                readOnly={!creating}
                required
              />

              <label className={`${LABEL} md:pt-2`}>Working time</label>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-36">
                    <Clock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="time"
                      aria-label="Working time start"
                      className={`${FIELD} pr-9`}
                      value={fields.workingStart}
                      disabled={fields.is24_7}
                      onChange={(event) => updateField("workingStart", event.target.value)}
                    />
                  </div>
                  <span className="text-sm text-slate-500">–</span>
                  <div className="relative w-36">
                    <Clock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="time"
                      aria-label="Working time end"
                      className={`${FIELD} pr-9`}
                      value={fields.workingEnd}
                      disabled={fields.is24_7}
                      onChange={(event) => updateField("workingEnd", event.target.value)}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={fields.is24_7}
                      onChange={(event) => updateField("is24_7", event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 accent-[#1A73E8]"
                    />
                    24/7
                  </label>
                </div>
                <p className={HELP}>Visitors to your Poster QR website will be informed that we will prepare their orders only within this time frame</p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="border-b border-[#E5E8EC] pb-2 text-base font-bold dark:border-[#33373E]">Finance</h2>
            <div className="grid gap-x-8 gap-y-4 md:grid-cols-[190px_minmax(0,1fr)]">
              <label htmlFor="bank-account" className={`${LABEL} md:pt-2`}>Bank account</label>
              <AccountField
                id="bank-account"
                accounts={state.accounts}
                companyName={state.settings.companyName}
                currencySymbol={state.settings.currencySymbol}
                value={fields.bankAccountId}
                onChange={(value) => updateField("bankAccountId", value)}
                help="A bank account of the location. It receives the proceeds from orders paid by credit cards."
              />
              <label htmlFor="cash-account" className={`${LABEL} md:pt-2`}>Cash account</label>
              <AccountField
                id="cash-account"
                accounts={state.accounts}
                companyName={state.settings.companyName}
                currencySymbol={state.settings.currencySymbol}
                value={fields.cashAccountId}
                onChange={(value) => updateField("cashAccountId", value)}
                help="A cash account is a cashdrawer at your location. It automatically receives the proceeds from orders paid for in cash."
              />
              <label htmlFor="safe-account" className={`${LABEL} md:pt-2`}>Account for safe drops</label>
              <AccountField
                id="safe-account"
                accounts={state.accounts}
                companyName={state.settings.companyName}
                currencySymbol={state.settings.currencySymbol}
                value={fields.safeAccountId}
                onChange={(value) => updateField("safeAccountId", value)}
                help="A safe is an account for safe drops. It receives funds regularly collected at the end of the shift from a cashdrawer at the location."
              />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="border-b border-[#E5E8EC] pb-2 text-base font-bold dark:border-[#33373E]">Inventory</h2>
            <div className="grid gap-x-8 gap-y-4 md:grid-cols-[190px_minmax(0,1fr)]">
              <span className={`${LABEL} md:pt-2`}>Storage locations</span>
              <div>
                <div className="relative">
                  <button
                    type="button"
                    aria-expanded={storageMenuOpen}
                    onClick={() => setStorageMenuOpen((open) => !open)}
                    className={`${FIELD} flex min-h-10 items-center justify-between gap-2 text-left`}
                  >
                    <span className="flex flex-wrap gap-1.5">
                      {fields.storageLocations.length ? fields.storageLocations.map((storage) => (
                        <span key={storage} className="inline-flex items-center gap-1 rounded bg-[#E8EFF7] px-2 py-1 text-xs text-[#1A73E8] dark:bg-[#33373E] dark:text-[#7EB3F5]">
                          {storage}
                        </span>
                      )) : <span className="text-slate-400">Select storage locations</span>}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                  </button>
                  {storageMenuOpen && (
                    <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-[#D1D5DB] bg-white p-1 shadow-lg dark:border-[#3E434C] dark:bg-[#24272C]">
                      {state.storageLocations.map((storage) => (
                        <label key={storage} className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm hover:bg-slate-50 dark:hover:bg-[#33373E]">
                          <input
                            type="checkbox"
                            checked={fields.storageLocations.includes(storage)}
                            onChange={(event) => {
                              const selected = fields.storageLocations.filter((name) => name !== storage);
                              if (event.target.checked) selected.push(storage);
                              updateField("storageLocations", selected);
                            }}
                            className="h-4 w-4 rounded border-slate-300 accent-[#1A73E8]"
                          />
                          {storage}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <p className={HELP}>If you select multiple storage locations, ingredients and products will be deducted from the last storage location where changes were registered.</p>
              </div>
            </div>
          </section>

          <div className="grid gap-x-8 md:grid-cols-[190px_minmax(0,1fr)]">
            <span />
            <div>
              <button type="submit" className="rounded-md bg-[#1DB954] px-6 py-2 text-sm font-bold text-white hover:bg-[#18A348]">
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  const query = search.trim().toLowerCase();
  const locations = state.locations.filter((entry) =>
    !query || [String(entry.number), entry.name, entry.address, entry.login].some((value) => value.toLowerCase().includes(query)),
  );
  const pageDescription = locations.length ? `1 to ${locations.length} of ${locations.length}` : "0 to 0 of 0";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E8EC] pb-3.5 dark:border-[#33373E]">
        <h1 className="text-xl font-bold tracking-tight">Locations</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="More location actions"
            title="More actions"
            onClick={() => actions.showToast("No additional location actions available.")}
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#33373E]"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => router.push(`${basePath}/new`)}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#0077FF] px-4 py-2 text-xs font-bold text-white hover:bg-[#0068E0]"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 py-3.5 text-xs">
        <input
          type="search"
          aria-label="Search locations"
          placeholder="Search..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-52 rounded-md border border-[#D1D5DB] bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#1A73E8] focus:outline-none dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white"
        />
        <button type="button" className="rounded-md border border-[#E5E8EC] px-2.5 py-1.5 font-medium text-[#1A73E8] dark:border-[#33373E] dark:text-[#7EB3F5]">
          + Filter <ChevronDown className="ml-1 inline h-3 w-3" />
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#E5E8EC] bg-white dark:border-[#33373E] dark:bg-[#2C3036]">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-[#E5E8EC] text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:border-[#33373E] dark:text-slate-400">
              <th className="w-16 px-4 py-3 text-right">↓ #</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Login</th>
              <th className="w-16 px-4 py-3 text-right">→</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((entry) => (
              <tr
                key={entry.id}
                onClick={() => router.push(`${basePath}/${entry.id}`)}
                className="cursor-pointer border-b border-[#E5E8EC] last:border-0 hover:bg-slate-50 dark:border-[#33373E] dark:hover:bg-[#24272C]"
              >
                <td className="px-4 py-3 text-right font-mono text-slate-500 dark:text-slate-400">{entry.number}</td>
                <td className="px-4 py-3 font-semibold">{entry.name}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{entry.address}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{entry.login}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    aria-label={`Edit ${entry.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      router.push(`${basePath}/${entry.id}`);
                    }}
                    className="font-bold text-[#1A73E8] hover:underline dark:text-[#7EB3F5]"
                  >
                    →
                  </button>
                </td>
              </tr>
            ))}
            {!locations.length && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">No locations found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3 font-mono">
          <button type="button" aria-label="First page" disabled className="disabled:opacity-40">|&lt;</button>
          <button type="button" aria-label="Previous page" disabled className="disabled:opacity-40">&lt;</button>
          <span className="font-sans">Page 1 of 1</span>
          <button type="button" aria-label="Next page" disabled className="disabled:opacity-40">&gt;</button>
          <button type="button" aria-label="Last page" disabled className="disabled:opacity-40">&gt;|</button>
        </div>
        <span>{pageDescription}</span>
      </div>
    </div>
  );
}

function AccountField({
  id,
  accounts,
  companyName,
  currencySymbol,
  value,
  onChange,
  help,
}: {
  id: string;
  accounts: FinanceAccount[];
  companyName: string;
  currencySymbol: string;
  value: string;
  onChange: (value: string) => void;
  help: string;
}) {
  return (
    <div>
      <select id={id} className={FIELD} value={value} onChange={(event) => onChange(event.target.value)}>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {accountDisplayName(account, companyName)}, {currencySymbol}
          </option>
        ))}
      </select>
      <p className={HELP}>{help}</p>
    </div>
  );
}
