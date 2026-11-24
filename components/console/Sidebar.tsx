"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  Lock,
  Monitor,
  Moon,
  RotateCcw,
  Sun,
  X,
} from "lucide-react";
import { usePosStore } from "@/lib/pos-store";
import { NAV_SECTIONS } from "./nav";

function remainingSteps(onboarding: { createdItem: boolean; madeSale: boolean; viewedReports: boolean }) {
  return 3 - Number(onboarding.createdItem) - Number(onboarding.madeSale) - Number(onboarding.viewedReports);
}

function SidebarBody({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, actions } = usePosStore();
  const remaining = remainingSteps(state.onboarding);
  const dark = state.theme === "dark";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#E5E8EC] px-2.5 dark:border-[#33373E]">
        <button
          type="button"
          onClick={actions.toggleSidebar}
          title="Collapse / Expand Sidebar"
          aria-label="Collapse / Expand Sidebar"
          className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-white"
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>

        {!collapsed && (
          <Link
            href="/manage/welcome"
            onClick={onNavigate}
            title="Go to Get started"
            className="flex items-center gap-2 overflow-hidden"
          >
            {dark ? (
              <>
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-xs font-bold uppercase text-white">
                  {state.settings.companyName.charAt(0)}
                </span>
                <span className="max-w-[95px] truncate text-xs font-semibold text-white">
                  {state.settings.companyName}
                </span>
              </>
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-md border border-[#B89365]/40 bg-gradient-to-br from-[#DFC39D] to-[#C8A679] shadow-2xs">
                <span className="text-[10px] font-extrabold tracking-tight text-white drop-shadow-2xs">
                  Poster
                </span>
              </span>
            )}
          </Link>
        )}

        {!collapsed && (
          <Link
            href="/pos"
            title="Open POS Terminal"
            aria-label="Open POS Terminal"
            className="rounded-lg p-1.5 text-[#1A73E8] transition-colors hover:bg-[#E8EFF7] dark:hover:bg-white/10"
          >
            <Monitor className="h-4 w-4" />
          </Link>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-1.5 py-2">
        {NAV_SECTIONS.map((section) => {
          const isSectionActive = section.href
            ? pathname === section.href
            : section.children.some((entry) => pathname === entry.href);
          const isExpanded = !!state.expandedAccordions[section.id] && !collapsed;
          const Icon = section.icon;

          const parentClass = isSectionActive && !isExpanded
            ? dark
              ? "bg-white/10 text-white font-semibold"
              : "bg-[#E8EFF7] text-[#1A73E8] font-semibold"
            : isSectionActive
              ? dark
                ? "text-white font-semibold"
                : "text-[#1F2328] font-semibold"
              : dark
                ? "text-[#A0A6B1] hover:bg-white/5 hover:text-white"
                : "text-[#4B5563] hover:bg-slate-200/60 hover:text-slate-900";

          const openSection = () => {
            if (section.href) {
              router.push(section.href);
              onNavigate?.();
              return;
            }
            const opening = !state.expandedAccordions[section.id];
            actions.toggleAccordion(section.id);
            if (opening) {
              router.push(section.children[0]?.href ?? "/manage/welcome");
            }
            onNavigate?.();
          };

          return (
            <div key={section.id}>
              <button
                type="button"
                onClick={openSection}
                title={section.label}
                className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-2 text-[13px] transition-colors ${parentClass} ${
                  collapsed ? "justify-center" : ""
                }`}
              >
                <span className={`flex min-w-0 items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}>
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isSectionActive ? (dark ? "text-white" : "text-[#1F2328]") : "opacity-75"
                    }`}
                  />
                  {!collapsed && <span className="truncate">{section.label}</span>}
                  {!collapsed && section.children.length > 0 && isExpanded && (
                    <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
                  )}
                </span>
                {!collapsed && section.badgeType === "onboarding" && remaining > 0 && (
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                      dark ? "bg-[#1DB954]" : "bg-[#E5484D]"
                    }`}
                  >
                    {remaining}
                  </span>
                )}
              </button>

              {isExpanded && section.children.length > 0 && (
                <div className="mb-1.5 mt-0.5 space-y-0.5">
                  {section.children.map((entry) => {
                    const active = pathname === entry.href;
                    return (
                      <Link
                        key={entry.id}
                        href={entry.href}
                        onClick={onNavigate}
                        className={`flex items-center justify-between gap-1 rounded-md py-1.5 pl-9 pr-2.5 text-[13px] leading-snug transition-colors ${
                          active
                            ? dark
                              ? "bg-white/10 font-semibold text-white"
                              : "bg-[#E8EFF7] font-semibold text-[#1F2328]"
                            : dark
                              ? "text-[#3B82F6] hover:bg-white/5 hover:text-sky-300"
                              : "text-[#1A73E8] hover:bg-slate-200/50"
                        }`}
                      >
                        <span className="truncate">{entry.label}</span>
                        {entry.badge && (
                          <span className="shrink-0 rounded-sm bg-[#1A73E8] px-1.5 py-0.5 text-[9px] font-bold text-white">
                            {entry.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <div className="mt-1 border-t border-[#E5E8EC] pt-1 dark:border-[#33373E]">
          <Link
            href="/pos"
            onClick={onNavigate}
            title="Open POS"
            className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-[13px] transition-colors ${
              dark
                ? "text-[#A0A6B1] hover:bg-white/5 hover:text-white"
                : "text-[#4B5563] hover:bg-slate-200/60 hover:text-slate-900"
            } ${collapsed ? "justify-center" : ""}`}
          >
            <span className="flex items-center gap-2.5">
              <Monitor className="h-4 w-4 shrink-0 opacity-80" />
              {!collapsed && <span>Open POS</span>}
            </span>
            {!collapsed && <ExternalLink className="h-3.5 w-3.5 opacity-60" />}
          </Link>
        </div>
      </nav>
    </div>
  );
}

export function Sidebar({
  mobileOpen,
  onCloseMobile,
}: {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const { state, actions } = usePosStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const collapsed = state.sidebarCollapsed;
  const dark = state.theme === "dark";
  const employee = state.employees.find((entry) => entry.id === state.currentStaffId) ?? state.employees[0];

  const footer = (
    <div className="relative shrink-0 border-t border-[#E5E8EC] p-2 dark:border-[#33373E]">
      {profileOpen && (
        <div className="absolute bottom-12 left-2 right-2 z-50 space-y-1 rounded-xl border border-slate-200 bg-white p-1.5 text-xs text-slate-800 shadow-xl dark:border-[#33373E] dark:bg-[#2C3036] dark:text-white">
          <button
            type="button"
            onClick={() => {
              actions.toggleTheme();
              setProfileOpen(false);
            }}
            className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 hover:bg-sky-500/10"
          >
            <span className="flex items-center gap-2">
              {dark ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-[#1A73E8]" />}
              <span>Console Theme</span>
            </span>
            <span className="text-[10px] font-bold uppercase opacity-75">{dark ? "Light" : "Dark"}</span>
          </button>
          <Link
            href="/pos"
            onClick={() => setProfileOpen(false)}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-sky-500/10"
          >
            <ExternalLink className="h-3.5 w-3.5 text-[#1DB954]" />
            <span>Open POS Terminal</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              actions.openModal("pin-lock");
              setProfileOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-sky-500/10"
          >
            <Lock className="h-3.5 w-3.5 text-amber-500" />
            <span>Switch Staff / PIN</span>
          </button>
          <button
            type="button"
            onClick={() => {
              actions.resetDemoData();
              setProfileOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-sky-500/10"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={() => setProfileOpen((open) => !open)}
          className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
              dark ? "bg-white/15" : "bg-pink-500"
            }`}
          >
            {employee?.initials ?? "PV"}
          </span>
          {!collapsed && (
            <>
              <span className="flex-1 truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                {employee?.name ?? "Staff"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
            </>
          )}
        </button>

        {!collapsed && (
          <button
            type="button"
            onClick={actions.toggleTheme}
            title="Toggle Light / Dark Console Theme"
            aria-label="Toggle Light / Dark Console Theme"
            className="shrink-0 cursor-pointer rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-200/70 dark:text-amber-400 dark:hover:bg-white/10"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={`sticky top-8 z-40 hidden h-[calc(100vh-32px)] shrink-0 flex-col justify-between border-r border-[#E5E8EC] bg-[#F7F8FA] text-[#4B5563] transition-all duration-200 lg:flex dark:border-[#33373E] dark:bg-[#1D2024] dark:text-[#A0A6B1] ${
          collapsed ? "w-[56px]" : "w-[220px]"
        }`}
      >
        <SidebarBody collapsed={collapsed} />
        {footer}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={onCloseMobile} aria-hidden="true" />
          <aside className="relative flex h-full w-[220px] flex-col border-r border-[#E5E8EC] bg-[#F7F8FA] text-[#4B5563] dark:border-[#33373E] dark:bg-[#1D2024] dark:text-[#A0A6B1]">
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close menu"
              className="absolute right-2 top-2 z-10 rounded-md p-1.5 text-slate-500 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarBody collapsed={false} onNavigate={onCloseMobile} />
            {footer}
          </aside>
        </div>
      )}
    </>
  );
}
