import { FinancesView } from "@/components/console/views/FinancesView";

export default async function FinancePage({ params }: { params: Promise<{ slug: string }> }) {
  return <FinancesView slug={(await params).slug} />;
}
