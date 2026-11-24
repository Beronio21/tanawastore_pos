"use client";

import { useState } from "react";
import { usePosStore } from "@/lib/pos-store";

export function QrMenuClient({ tableId }: { tableId: string }) {
  const { actions, state } = usePosStore();
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  return <main className="min-h-screen bg-slate-50 p-5 dark:bg-[#1D2024]"><div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm dark:bg-[#2C3036]"><div className="text-center"><div className="text-3xl">🍽️</div><h1 className="mt-2 text-xl font-bold">{state.settings.companyName}</h1><p className="text-xs text-slate-500">Poster QR Menu · {tableId}</p></div><div className="mt-8 border-t pt-5 dark:border-slate-700"><h2 className="font-bold">How was your visit?</h2><div className="mt-3 flex gap-1">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" className={`text-2xl ${value <= stars ? "text-amber-400" : "text-slate-300"}`} onClick={() => setStars(value)}>★</button>)}</div><textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Tell us more (optional)" className="mt-4 h-24 w-full rounded-lg border bg-transparent p-3 text-sm dark:border-slate-600" /><button type="button" className="mt-3 w-full rounded-lg bg-[#1A73E8] py-2.5 text-sm font-bold text-white" onClick={() => { actions.submitGuestFeedback(stars, comment); setSent(true); }}>Send feedback</button>{sent && <p className="mt-3 text-center text-sm font-semibold text-emerald-600">Thank you for your feedback!</p>}</div></div></main>;
}
