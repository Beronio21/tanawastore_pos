"use client";

import { useState } from "react";
import { MessageSquare, Send, X } from "lucide-react";

type ChatMessage = { from: "agent" | "user"; text: string };

/** Floating Poster Support & Postie AI chat drawer. */
export function SupportWidget() {
  const [bubbleVisible, setBubbleVisible] = useState(true);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: "agent", text: "Hello Philip! How can we help with tanawastore.pos today?" },
  ]);

  function send(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMessages((current) => [...current, { from: "user", text }]);
    setDraft("");
    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          from: "agent",
          text: "Thanks! You can test orders live via Open POS in the left sidebar or import invoices with Postie AI.",
        },
      ]);
    }, 300);
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {bubbleVisible && !open && (
        <div className="relative w-64 rounded-xl border border-slate-200 bg-white p-3.5 text-xs leading-relaxed text-slate-700 shadow-xl dark:border-[#33373E] dark:bg-[#2C3036] dark:text-slate-200">
          <button
            type="button"
            onClick={() => setBubbleVisible(false)}
            title="Dismiss"
            aria-label="Dismiss support bubble"
            className="absolute right-2 top-2 cursor-pointer text-slate-400 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <div className="-mt-7 mb-2 flex items-center justify-center">
            <div className="-mr-1.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-amber-700 text-[10px] font-bold text-white shadow-xs">
              AK
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-700 text-[10px] font-bold text-white shadow-xs">
              ML
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-300">
            Got any questions? Please tell us more about what you need help with. Describe your question in a
            single message, providing as much detail as possible.
          </p>
        </div>
      )}

      {open && (
        <div className="w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#33373E] dark:bg-[#2C3036]">
          <div className="flex items-center justify-between bg-[#4A5BD6] px-4 py-3 text-xs font-bold text-white">
            <span>Poster Live Support &amp; Postie AI</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close support chat" className="text-white/80 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="h-44 space-y-2 overflow-y-auto bg-slate-50 p-3 text-xs dark:bg-[#24272C]">
            {messages.map((message, index) => (
              <div
                key={`${message.from}-${index}`}
                className={
                  message.from === "user"
                    ? "ml-6 rounded-xl bg-[#4A5BD6] p-2 text-white"
                    : "mr-4 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 dark:border-[#33373E] dark:bg-[#2C3036] dark:text-slate-200"
                }
              >
                {message.text}
              </div>
            ))}
          </div>
          <form onSubmit={send} className="flex gap-1.5 border-t border-slate-200 bg-white p-2 dark:border-[#33373E] dark:bg-[#2C3036]">
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Describe your question..."
              className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#4A5BD6] focus:outline-none dark:border-[#3E434C] dark:bg-[#1D2024] dark:text-white"
            />
            <button
              type="submit"
              aria-label="Send message"
              className="cursor-pointer rounded-lg bg-[#4A5BD6] px-3 py-1.5 text-xs font-bold text-white"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setBubbleVisible(false);
          setOpen((value) => !value);
        }}
        title="Poster Support Chat"
        aria-label="Poster Support Chat"
        className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-[#4A5BD6] text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#3B4BC2]"
      >
        <MessageSquare className="h-5 w-5" />
      </button>
    </div>
  );
}
