"use client";

import { Bot, ExternalLink, Sparkles } from "lucide-react";
import { usePosStore } from "@/lib/pos-store";
import { Card, PageHeader } from "../ui";

const apps = [
  ["Postie AI", "Parse supplier invoices and bank statements.", "postie-ai"],
  ["QR Menu", "Let guests browse and leave feedback.", "qr-menu"],
  ["Kitchen Kit", "Route orders to Bar and Kitchen.", "kitchen-kit"],
  ["Website for Orders", "Accept orders from your own website.", "website"],
  ["P&L Report", "Share a clear profit and loss summary.", "pnl"],
  ["Analytics for Owner", "Keep a pulse on sales performance.", "analytics"],
];

export function ApplicationsView({ slug }: { slug: string }) {
  const { actions } = usePosStore();
  if (slug === "postie-ai") {
    return <div className="space-y-4"><PageHeader title="Postie AI Assistant" /><Card className="max-w-2xl space-y-4 p-6"><div className="flex items-center gap-3"><span className="rounded-xl bg-indigo-100 p-3 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300"><Bot /></span><div><h2 className="font-bold">Your back-office assistant</h2><p className="text-xs text-slate-500 dark:text-slate-400">Import a supplier invoice or bank statement into the shared demo state.</p></div></div><button type="button" className="rounded-md bg-[#4A5BD6] px-4 py-2 text-xs font-bold text-white" onClick={() => actions.runPostieAiImport()}><Sparkles className="mr-1 inline h-3.5 w-3.5" />Run demo import</button></Card></div>;
  }
  return <div><PageHeader title="Applications" count={apps.length} /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{apps.map(([name, description, id]) => <Card className="flex min-h-40 flex-col justify-between p-5" key={id}><div><h2 className="font-bold">{name}</h2><p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{description}</p></div><a className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#1A73E8] dark:text-[#7EB3F5]" href={id === "qr-menu" ? "/qr/table-1" : `/manage/applications/${id}`}>Open <ExternalLink className="h-3.5 w-3.5" /></a></Card>)}</div></div>;
}
