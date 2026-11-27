"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

/** Uploads via `/api/v1/uploads` (R2) and falls back to a local data URL. */
export function ImageUploadButton({
  folder,
  currentUrl,
  onUploaded,
  onRemove,
  label = "Photo",
  compact = false,
}: {
  folder: "products" | "logos" | "attachments";
  currentUrl?: string;
  onUploaded: (url: string) => void;
  onRemove?: () => void;
  label?: string;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    if (!TYPES.includes(file.type)) {
      setError("Use JPEG, PNG or WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Max 5 MB.");
      return;
    }
    setBusy(true);
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("folder", folder);
      const response = await fetch("/api/v1/uploads", { method: "POST", body });
      if (response.ok) {
        const payload = (await response.json()) as { url?: string };
        if (payload.url) {
          onUploaded(payload.url);
          return;
        }
      }
      setError("Upload failed — using local preview.");
      const dataUrl = await readDataUrl(file);
      if (dataUrl) onUploaded(dataUrl);
    } catch {
      const dataUrl = await readDataUrl(file);
      if (dataUrl) onUploaded(dataUrl);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={compact ? "flex items-center gap-1.5" : "flex items-center gap-2"}>
      <input
        ref={inputRef}
        type="file"
        accept={TYPES.join(",")}
        className="hidden"
        onChange={(event) => {
          void upload(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {currentUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={currentUrl} alt="" className="h-8 w-8 rounded border border-[#E5E8EC] object-cover dark:border-[#3E434C]" />
      ) : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-[#D1D5DB] px-2 py-1 text-[11px] font-semibold text-[#1A73E8] hover:bg-sky-500/10 disabled:opacity-50 dark:border-[#3E434C] dark:text-[#7EB3F5]"
      >
        <ImagePlus className="h-3.5 w-3.5" />
        {busy ? "Uploading…" : currentUrl ? "Replace" : label}
      </button>
      {currentUrl && onRemove && (
        <button type="button" aria-label="Remove photo" onClick={onRemove} className="cursor-pointer rounded p-1 text-slate-400 hover:text-rose-500">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
      {error && <span className="text-[10px] text-rose-500">{error}</span>}
    </div>
  );
}
