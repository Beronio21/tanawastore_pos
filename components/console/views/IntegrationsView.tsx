"use client";

import { useState } from "react";
import { Check, Copy, Eye, EyeOff, KeyRound, MoreVertical } from "lucide-react";
import { usePosStore } from "@/lib/pos-store";
import type { Integration } from "@/lib/console-data";
import { Card, ROW, TD, TH } from "../ui";

export function IntegrationsView() {
  const { state, actions } = usePosStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState("");
  const integrations = state.integrations ?? [];

  const copyToken = async (integration: Integration) => {
    try {
      await navigator.clipboard.writeText(integration.token);
    } catch {
      // Clipboard can be unavailable; the toast still confirms the action.
    }
    setCopiedId(integration.id);
    window.setTimeout(() => setCopiedId(""), 1600);
    actions.showToast("Access token copied.", "success");
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E8EC] pb-3.5 dark:border-[#33373E]">
        <h1 className="text-xl font-bold tracking-tight">Integrations</h1>
        <div className="relative">
          <button
            type="button"
            aria-label="Integration actions"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
            className="cursor-pointer rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#33373E]"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 min-w-60 rounded-md border border-[#E5E8EC] bg-white p-1 text-left shadow-lg dark:border-[#33373E] dark:bg-[#24272C]">
                <button
                  type="button"
                  onClick={() => {
                    actions.createIntegrationToken();
                    setMenuOpen(false);
                  }}
                  className="w-full cursor-pointer rounded px-2 py-1.5 text-left text-xs hover:bg-slate-100 dark:hover:bg-[#33373E]"
                >
                  Generate personal integration token
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <Card className="mt-4 flex items-start gap-4 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E8EFF7] text-[#1A73E8] dark:bg-[#33373E] dark:text-[#7EB3F5]">
          <KeyRound className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold">Integration of third-party applications</h2>
          <p className="mt-1.5 max-w-3xl text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Access token is the key that allows third-party applications work with your account via the API. The token is issued to the user, who has connected the application, and the application works with Poster on his behalf.
          </p>
        </div>
      </Card>

      <Card className="mt-4">
        <div className="flex flex-wrap items-center gap-2.5 px-4 pt-3.5">
          <button
            type="button"
            onClick={() => actions.showToast("Choose a filter to refine integrations", "blue")}
            className="cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-medium text-[#1A73E8] hover:bg-sky-500/10 dark:text-[#7EB3F5]"
          >
            + Filter ▾
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr>
                <th className={TH}>Employee</th>
                <th className={TH}>Application</th>
                <th className={TH}>Access token</th>
                <th className={`${TH} text-right`}>Date of creation</th>
              </tr>
            </thead>
            <tbody>
              {integrations.map((integration) => {
                const isRevealed = !integration.masked || Boolean(revealed[integration.id]);
                return (
                  <tr key={integration.id} className={ROW}>
                    <td className={`${TD} font-medium`}>
                      <span className={`mr-2 inline-block h-2 w-2 rounded-full align-middle ${integration.active ? "bg-[#1DB954]" : "bg-slate-300 dark:bg-slate-600"}`} />
                      {integration.employeeName}
                    </td>
                    <td className={TD}>{integration.application}</td>
                    <td className={`${TD} font-mono`}>
                      <span className="inline-flex items-center gap-2">
                        <span className="break-all">{isRevealed ? integration.token : "*".repeat(integration.token.length)}</span>
                        {integration.masked && (
                          <button
                            type="button"
                            aria-label={isRevealed ? `Hide ${integration.application} token` : `Reveal ${integration.application} token`}
                            onClick={() => setRevealed((current) => ({ ...current, [integration.id]: !current[integration.id] }))}
                            className="cursor-pointer text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          >
                            {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        )}
                        <button
                          type="button"
                          aria-label={`Copy ${integration.application} token`}
                          onClick={() => void copyToken(integration)}
                          className="cursor-pointer text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        >
                          {copiedId === integration.id ? <Check className="h-3.5 w-3.5 text-[#1DB954]" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </span>
                    </td>
                    <td className={`${TD} text-right font-mono text-slate-500 dark:text-slate-400`}>{integration.createdAt}</td>
                  </tr>
                );
              })}
              {integrations.length === 0 && (
                <tr>
                  <td colSpan={4} className={`${TD} py-10 text-center text-slate-500 dark:text-slate-400`}>No integrations found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E8EC] py-3 text-xs text-slate-500 dark:border-[#33373E] dark:text-slate-400">
          <div className="flex items-center gap-2">
            <button type="button" disabled className="cursor-not-allowed">|&lt;</button>
            <button type="button" disabled className="cursor-not-allowed">&lt;</button>
            <span>Page {integrations.length > 0 ? 1 : 0} of {integrations.length > 0 ? 1 : 0}</span>
            <button type="button" disabled className="cursor-not-allowed">&gt;</button>
            <button type="button" disabled className="cursor-not-allowed">&gt;|</button>
          </div>
          <span>{integrations.length > 0 ? 1 : 0} to {integrations.length} of {integrations.length}</span>
        </div>
      </Card>
    </div>
  );
}
