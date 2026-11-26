import Link from "next/link";
import { type ReactNode } from "react";
import { Monitor, Receipt, ShieldCheck, WifiOff } from "lucide-react";

const HIGHLIGHTS = [
  { icon: Receipt, label: "Front-of-house register, floor plan and kitchen kit" },
  { icon: WifiOff, label: "Offline-first checks that sync when the line comes back" },
  { icon: ShieldCheck, label: "Owner and manager access with staff PIN switching" },
];

/** Branded TanAwa POS sign-in frame shared by `/`, `/sign-in` and `/sign-up`. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-[#1F2328] lg:flex-row dark:bg-[#24272C] dark:text-[#E6E8EC]">
      <aside className="relative hidden w-[46%] shrink-0 flex-col justify-between overflow-hidden bg-[#0077FF] p-10 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-[#1DB954]/30 blur-2xl" />
        <Link href="/" className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5A623] text-lg font-black text-white shadow-lg shadow-black/20">
            T
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-wide">TanAwa POS</span>
            <span className="text-[11px] text-white/75">Management Console &amp; POS</span>
          </span>
        </Link>

        <div className="relative max-w-md">
          <h1 className="text-3xl font-bold leading-tight">Run the store, not the paperwork.</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/80">
            Sign in to the management console to review sales, stock, staff and finances — then open the POS
            terminal on any register in the shop.
          </p>
          <ul className="mt-8 space-y-3 text-[13px] text-white/90">
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="pt-1">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative flex items-center gap-2 text-[11px] text-white/60">
          <Monitor className="h-3.5 w-3.5" />
          Philippine Peso (₱) · Asia/Manila (+08:00)
        </p>
      </aside>

      <main className="flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-[#E5E8EC] bg-[#F7F8FA] px-5 py-3 lg:hidden dark:border-[#33373E] dark:bg-[#1D2024]">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F5A623] text-sm font-black text-white">
              T
            </span>
            <span className="text-xs font-bold">TanAwa POS</span>
          </Link>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Management console
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-[400px]">{children}</div>
          <p className="mt-6 max-w-[400px] text-center text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            Staff on a register do not sign in here — they unlock the POS terminal with their 4-digit PIN.
          </p>
        </div>
      </main>
    </div>
  );
}
