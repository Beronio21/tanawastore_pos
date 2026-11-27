"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronUp,
  CreditCard,
  Inbox,
  X,
} from "lucide-react";
import { usePosStore } from "@/lib/pos-store";
import type { AttachedCard, BillingDetails } from "@/lib/console-data";
import { BILLING_PLANS, type PlanId } from "@/lib/billing-plans";
import { Card, TH, TD, ROW } from "../ui";

export type BillingTab = "overview" | "subscriptions" | "invoices" | "settings";

const TABS: { id: BillingTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "subscriptions", label: "Subscriptions" },
  { id: "invoices", label: "Paid invoices" },
  { id: "settings", label: "Settings" },
];

const PLAN_PRICE = 3795;
const PLAN_UNTIL = "December 7, 2026";

function php(value: number): string {
  return `₱${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function TrialPill({ status }: { status: "Trial" | "Paid" }) {
  return status === "Trial" ? (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">Trial</span>
  ) : (
    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Paid</span>
  );
}

function AwaitingPill() {
  return (
    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
      Awaiting payment
    </span>
  );
}

function PlanSummary() {
  const { state } = usePosStore();
  const status = state.subscriptionStatus;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold">Poster</span>
        <TrialPill status={status} />
      </div>
      <div className="font-mono text-lg font-extrabold text-[#1A73E8] dark:text-[#7EB3F5]">
        {php(PLAN_PRICE)}
        <span className="text-xs font-normal text-slate-500">/mo</span>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400">Until {PLAN_UNTIL}</div>
      <div className="flex items-center justify-between border-t border-[#EEF1F4] pt-2 text-xs dark:border-[#33373E]">
        <span>
          Plan <strong>Pro</strong>
          <span className="ml-2 text-slate-500 dark:text-slate-400">1 location</span>
        </span>
        <span className="font-mono font-semibold">{php(PLAN_PRICE)}</span>
      </div>
    </div>
  );
}

export function BillingView({ initialTab = "overview" }: { initialTab?: BillingTab }) {
  const { state } = usePosStore();
  const [tab, setTab] = useState<BillingTab>(initialTab);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [payOpen, setPayOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const invoice = state.pendingInvoice;
  const status = state.subscriptionStatus;

  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight">Billing</h1>
      <nav className="mt-1 flex gap-1 border-b-2 border-[#4EA1FF]">
        {TABS.map((entry) => {
          const active = tab === entry.id;
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => setTab(entry.id)}
              className={`relative cursor-pointer px-4 pb-2.5 pt-1 text-xs font-semibold ${
                active
                  ? "-bottom-0.5 border-b-2 border-white bg-white font-bold text-[#4EA1FF]"
                  : "text-[#4EA1FF] hover:bg-sky-50 dark:hover:bg-white/5"
              }`}
            >
              {entry.label}
            </button>
          );
        })}
      </nav>

      {tab === "overview" && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold">Invoice {invoice?.number ?? "305637"}</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Pay by {invoice?.payBy ?? PLAN_UNTIL}</p>
              </div>
              {status === "Trial" && invoice && <AwaitingPill />}
            </div>

            {invoice && (
              <>
                <button
                  type="button"
                  onClick={() => setDetailsOpen((current) => !current)}
                  className="mt-4 flex cursor-pointer items-center gap-1 text-xs font-semibold text-[#1A73E8] dark:text-[#7EB3F5]"
                >
                  Invoice details
                  {detailsOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
                {detailsOpen && (
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr>
                          <th className={TH}>Item</th>
                          <th className={`${TH} text-right`}>Qty</th>
                          <th className={`${TH} text-right`}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className={ROW}>
                          <td className={TD}>{invoice.item}</td>
                          <td className={`${TD} text-right font-mono`}>{invoice.qty}</td>
                          <td className={`${TD} text-right font-mono`}>{php(invoice.amount)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="my-4 border-t border-[#E5E8EC] dark:border-[#33373E]" />
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">Amount due</span>
                  <span className="font-mono text-base font-extrabold">{php(invoice.amount)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPayOpen(true)}
                  className="mt-4 w-full cursor-pointer rounded-md bg-[#0077FF] py-2.5 text-xs font-bold text-white hover:bg-[#0067DF]"
                >
                  Pay
                </button>
              </>
            )}
            {!invoice && (
              <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">All invoices are paid. Your subscription is active.</p>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">Subscriptions</h2>
              <button type="button" onClick={() => setTab("subscriptions")} className="cursor-pointer text-xs font-semibold text-[#4EA1FF] hover:underline">
                Details
              </button>
            </div>
            <div className="mt-4">
              <PlanSummary />
            </div>
          </Card>
        </div>
      )}

      {tab === "subscriptions" && (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">Active</h2>
              <ManageMenu open={manageOpen} onToggle={() => setManageOpen((current) => !current)} onClose={() => setManageOpen(false)} />
            </div>
            <div className="mt-4">
              <PlanSummary />
            </div>
          </Card>
          <PlanCards />
        </div>
      )}

      {tab === "invoices" && (
        <Card className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr>
                <th className={TH}>Invoice ↓</th>
                <th className={TH}>Created</th>
                <th className={TH}>Paid</th>
                <th className={`${TH} text-right`}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {state.paidInvoices.map((entry) => (
                <tr key={entry.id} className={ROW}>
                  <td className={`${TD} font-mono font-semibold`}>#{entry.number}</td>
                  <td className={TD}>{entry.created}</td>
                  <td className={TD}>{entry.paid}</td>
                  <td className={`${TD} text-right font-mono`}>{php(entry.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {state.paidInvoices.length === 0 && (
            <div className="px-5 py-14 text-center">
              <Inbox className="mx-auto h-9 w-9 text-slate-300 dark:text-slate-600" />
              <div className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-100">No paid invoices yet</div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Paid invoices and accounting acts will appear here</p>
            </div>
          )}
        </Card>
      )}

      {tab === "settings" && <BillingSettingsTab />}

      {payOpen && invoice && (
        <PayInvoiceModal invoice={invoice} onClose={() => setPayOpen(false)} onPaid={() => setPayOpen(false)} />
      )}
      {cardModalOpen && <AttachCardModal onClose={() => setCardModalOpen(false)} />}
    </div>
  );
}

/** Starter / Pro / Enterprise cards wired to PayMongo checkout or sandbox confirmation. */
function PlanCards() {
  const { state, actions } = usePosStore();
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const subscribe = async (plan: PlanId) => {
    setBusy(plan);
    setError("");
    setNote("");
    try {
      const confirmation = await fetch("/api/v1/payments/paymongo/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (confirmation.ok) {
        const payload = (await confirmation.json()) as { invoiceNumber?: string };
        actions.setPlan(plan, payload.invoiceNumber);
        return;
      }

      // Live PayMongo: open the hosted checkout for the plan amount.
      if (confirmation.status === 409) {
        const intent = await fetch("/api/v1/payments/paymongo/intent", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ amount: BILLING_PLANS[plan].price, method: "Card", description: `TanAwa ${BILLING_PLANS[plan].name} plan`, reference: state.settings.subdomain }),
        });
        const payload = (await intent.json()) as { checkoutUrl?: string | null; error?: string };
        if (!intent.ok) throw new Error(payload.error ?? "PayMongo checkout failed");
        if (payload.checkoutUrl) {
          window.open(payload.checkoutUrl, "_blank", "noopener");
          setNote("Complete the PayMongo checkout — the plan activates when the webhook confirms payment.");
        } else {
          setNote("PayMongo checkout created. Complete the payment to activate the plan.");
        }
        return;
      }

      const payload = (await confirmation.json()) as { error?: string };
      throw new Error(payload.error ?? "Unable to change plan");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to change plan");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="p-5">
      <h2 className="text-sm font-bold">Plans</h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">PayMongo checkout in PHP. Sandbox mode activates instantly.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {Object.values(BILLING_PLANS).map((plan) => {
          const active = state.plan === plan.id;
          return (
            <div key={plan.id} className={`flex flex-col justify-between rounded-xl border p-4 ${active ? "border-2 border-[#1DB954] bg-emerald-50/30 dark:bg-emerald-950/20" : "border-[#E5E8EC] dark:border-[#33373E]"}`}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">{plan.name}</span>
                  {active && <span className="rounded-full bg-[#1DB954] px-2 py-0.5 text-[9px] font-bold text-white">ACTIVE</span>}
                </div>
                <div className="mt-1 font-mono text-lg font-extrabold text-[#1A73E8] dark:text-[#7EB3F5]">
                  {php(plan.price)}<span className="text-[10px] font-normal text-slate-400">/mo</span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{plan.description}</p>
              </div>
              <button
                type="button"
                disabled={busy !== null || active}
                onClick={() => void subscribe(plan.id)}
                className="mt-3 w-full rounded-lg bg-[#0077FF] py-2 text-xs font-bold text-white hover:bg-[#0067DF] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {active ? "Current plan" : busy === plan.id ? "Starting…" : `Subscribe · ${php(plan.price)}`}
              </button>
            </div>
          );
        })}
      </div>
      {note && <p className="mt-3 text-[11px] text-[#1A73E8] dark:text-[#7EB3F5]">{note}</p>}
      {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[11px] text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}
    </Card>
  );
}

function ManageMenu({ open, onToggle, onClose }: { open: boolean; onToggle: () => void; onClose: () => void }) {
  const { actions } = usePosStore();
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-[#D1D5DB] px-3 py-1.5 text-xs font-semibold text-[#1A73E8] hover:bg-sky-500/10 dark:border-[#3E434C] dark:text-[#7EB3F5]"
      >
        Manage <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={onClose} />
          <div className="absolute right-0 top-9 z-20 min-w-44 rounded-md border border-[#E5E8EC] bg-white p-1 text-left shadow-lg dark:border-[#33373E] dark:bg-[#24272C]">
            <button
              type="button"
              onClick={() => { actions.openModal("subscription"); onClose(); }}
              className="w-full cursor-pointer rounded px-2 py-1.5 text-left text-xs hover:bg-slate-100 dark:hover:bg-[#33373E]"
            >
              Change plan
            </button>
            <button
              type="button"
              onClick={() => { actions.showToast("Trial cancellation scheduled — contact support to confirm.", "info"); onClose(); }}
              className="w-full cursor-pointer rounded px-2 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              Cancel trial
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-[#33373E] dark:bg-[#2C3036]">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-[#33373E]">
          <h3 className="text-sm font-bold">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function PayInvoiceModal({ invoice, onClose, onPaid }: { invoice: { number: string; item: string; amount: number }; onClose: () => void; onPaid: () => void }) {
  const { actions } = usePosStore();
  const [processing, setProcessing] = useState(false);
  const confirm = () => {
    setProcessing(true);
    window.setTimeout(() => {
      actions.payPendingInvoice();
      setProcessing(false);
      onPaid();
    }, 600);
  };
  return (
    <ModalShell title={`Pay invoice #${invoice.number}`} onClose={onClose}>
      <div className="space-y-3 text-xs">
        <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-[#24272C]"><span className="text-slate-500 dark:text-slate-400">{invoice.item}</span><span className="font-mono font-bold">{php(invoice.amount)}</span></div>
        <p className="text-slate-500 dark:text-slate-400">Confirm the payment to activate your Poster Pro subscription and dismiss the trial banner.</p>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 dark:border-[#3E434C] dark:text-slate-300">Cancel</button>
          <button type="button" disabled={processing} onClick={confirm} className="flex-1 cursor-pointer rounded-lg bg-[#0077FF] px-4 py-2 text-xs font-bold text-white hover:bg-[#0067DF] disabled:opacity-50">
            {processing ? "Processing…" : `Pay ${php(invoice.amount)}`}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function detectCardBrand(number: string): string {
  const digits = number.replace(/\D/g, "");
  if (/^4/.test(digits)) return "Visa";
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  return "Card";
}

function AttachCardModal({ onClose }: { onClose: () => void }) {
  const { actions } = usePosStore();
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const digits = number.replace(/\D/g, "");
  const valid = digits.length >= 15 && /^\d{2}\/\d{2}$/.test(expiry) && cvc.length >= 3;

  const submit = () => {
    if (!valid) return;
    const card: AttachedCard = { brand: detectCardBrand(digits), last4: digits.slice(-4), name: name.trim() };
    actions.attachPaymentCard(card);
    onClose();
  };

  const inputClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#1A73E8] focus:outline-none dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white";
  return (
    <ModalShell title="Attach payment card" onClose={onClose}>
      <div className="space-y-3 text-xs">
        <label className="block"><span className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">Name on card</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="PHILIP BERONIO" className={inputClass} /></label>
        <label className="block"><span className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">Card number</span><input value={number} onChange={(event) => setNumber(event.target.value.replace(/[^\d ]/g, "").slice(0, 19))} inputMode="numeric" placeholder="4242 4242 4242 4242" className={`${inputClass} font-mono`} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">Expiry</span><input value={expiry} onChange={(event) => setExpiry(event.target.value)} placeholder="MM/YY" maxLength={5} className={`${inputClass} font-mono`} /></label>
          <label className="block"><span className="mb-1 block font-semibold text-slate-700 dark:text-slate-300">CVC</span><input value={cvc} onChange={(event) => setCvc(event.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" placeholder="123" className={`${inputClass} font-mono`} /></label>
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 dark:border-[#3E434C] dark:text-slate-300">Cancel</button>
          <button type="button" disabled={!valid} onClick={submit} className="flex-1 cursor-pointer rounded-lg bg-[#0077FF] px-4 py-2 text-xs font-bold text-white hover:bg-[#0067DF] disabled:opacity-50">Attach card</button>
        </div>
      </div>
    </ModalShell>
  );
}

const BILLING_INPUT =
  "w-full rounded-md border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1A73E8] dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white";

function BillingField({ label, helper, children }: { label: string; helper?: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5 py-3 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-6">
      <div className="pt-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</div>
      <div className="min-w-0">
        {children}
        {helper && <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{helper}</p>}
      </div>
    </div>
  );
}

function BillingSettingsTab() {
  const { state, actions } = usePosStore();
  const [details, setDetails] = useState<BillingDetails | null>(null);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (!dirtyRef.current) setDetails(structuredClone(state.billingDetails));
  }, [state.billingDetails]);

  const form = details ?? state.billingDetails;
  const patch = (value: Partial<BillingDetails>) => {
    dirtyRef.current = true;
    setDetails((current) => (current ? { ...current, ...value } : current));
  };

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <Card className="p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold"><CreditCard className="h-4 w-4 text-[#4EA1FF]" /> Payment card</h2>
        <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">
          {state.attachedCard ? (
            <div className="flex items-center justify-between rounded-lg border border-[#E5E8EC] px-3 py-2.5 dark:border-[#33373E]">
              <span className="font-mono font-semibold">{state.attachedCard.brand} •••• {state.attachedCard.last4}</span>
              <span className="text-[10px] font-bold uppercase text-emerald-600">Attached</span>
            </div>
          ) : (
            <p>No card is attached. You can attach one by paying the first invoice.</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setCardModalOpen(true)}
          className="mt-4 cursor-pointer rounded-md bg-[#0077FF] px-4 py-2 text-xs font-bold text-white hover:bg-[#0067DF]"
        >
          {state.attachedCard ? "Replace card" : "Attach card"}
        </button>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-bold">Billing details</h2>
        <div className="mt-1 divide-y divide-[#EEF1F4] dark:divide-[#2C3036]">
          <BillingField label="Tax ID"><input value={form.taxId} onChange={(event) => patch({ taxId: event.target.value })} className={BILLING_INPUT} /></BillingField>
          <BillingField label="Company name" helper="Shown on invoices"><input value={form.companyName} onChange={(event) => patch({ companyName: event.target.value })} className={BILLING_INPUT} /></BillingField>
          <BillingField label="Registered address"><input value={form.registeredAddress} onChange={(event) => patch({ registeredAddress: event.target.value })} className={BILLING_INPUT} /></BillingField>
          <BillingField label="Postal code"><input value={form.postalCode} onChange={(event) => patch({ postalCode: event.target.value })} className={BILLING_INPUT} /></BillingField>
          <BillingField label="Phone number"><input value={form.phone} onChange={(event) => patch({ phone: event.target.value })} className={BILLING_INPUT} /></BillingField>
          <BillingField label="Email" helper="We send invoices and payment reminders to this address"><input type="email" value={form.email} onChange={(event) => patch({ email: event.target.value })} className={BILLING_INPUT} /></BillingField>
        </div>
        <button
          type="button"
          onClick={() => { if (details) { actions.saveBillingDetails(details); dirtyRef.current = false; } }}
          className="mt-4 cursor-pointer rounded-md bg-[#0077FF] px-5 py-2 text-xs font-bold text-white hover:bg-[#0067DF]"
        >
          Save changes
        </button>
      </Card>

      {cardModalOpen && <AttachCardModal onClose={() => setCardModalOpen(false)} />}
    </div>
  );
}
