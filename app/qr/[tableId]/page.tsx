import { Suspense } from "react";
import { QrMenuClient } from "@/components/qr/QrMenuClient";

export default async function QrMenuPage({ params }: { params: Promise<{ tableId: string }> }) {
  return <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-[#1D2024]" />}><QrMenuClient tableId={(await params).tableId} /></Suspense>;
}
