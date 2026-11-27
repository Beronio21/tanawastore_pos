"use client";

import { Suspense, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Menu, Monitor } from "lucide-react";
import { TopTrialBanner } from "./TopTrialBanner";
import { Sidebar } from "./Sidebar";
import { SupportWidget } from "./SupportWidget";
import { ConsoleModals } from "./Modals";
import { SyncStatusPill } from "./SyncStatusPill";
import { pageTitleForPath } from "./nav";

/** Poster management console shell: banner, sidebar, mobile header, content. */
export function ConsoleShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#1F2328] dark:bg-[#24272C] dark:text-[#E6E8EC]">
      <TopTrialBanner />
      <div className="relative flex min-h-[calc(100vh-32px)] items-start">
        <Suspense fallback={<aside className="hidden w-14 shrink-0 lg:block" />}>
          <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
        </Suspense>
        <main className="flex min-w-0 flex-1 flex-col">
          <Suspense fallback={<div className="h-11 lg:hidden" />}>
            <MobileHeader onOpen={() => setMobileOpen(true)} />
          </Suspense>

          <div className="mx-auto flex w-full max-w-[1520px] justify-end px-4 pt-1.5 sm:px-6 lg:px-8">
            <SyncStatusPill />
          </div>
          <div className="mx-auto w-full max-w-[1520px] flex-1 p-4 sm:p-6 lg:px-8 lg:py-5">
            <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-slate-100 dark:bg-[#2C3036]" />}>
              {children}
            </Suspense>
          </div>
        </main>
      </div>
      <SupportWidget />
      <ConsoleModals />
    </div>
  );
}

function MobileHeader({ onOpen }: { onOpen: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex items-center justify-between border-b border-[#E5E8EC] bg-[#F7F8FA] px-4 py-2.5 text-slate-800 lg:hidden dark:border-[#33373E] dark:bg-[#1D2024] dark:text-white">
      <button type="button" onClick={onOpen} className="flex cursor-pointer items-center gap-2 text-xs font-bold">
        <Menu className="h-5 w-5" />
        <span>Menu</span>
      </button>
      <span className="text-xs font-bold">{pageTitleForPath(pathname)}</span>
      <span className="flex items-center gap-2">
        <UserButton />
        <Link href="/pos" className="flex items-center gap-1 rounded-lg bg-[#1A73E8] px-2.5 py-1 text-xs font-bold text-white">
          <Monitor className="h-3.5 w-3.5" />
          Open POS
        </Link>
      </span>
    </div>
  );
}
