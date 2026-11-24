import { ReportsView } from "@/components/console/views/ReportsView";

export default async function ReportsPage({ params }: { params: Promise<{ slug: string }> }) {
  return <ReportsView slug={(await params).slug} />;
}
