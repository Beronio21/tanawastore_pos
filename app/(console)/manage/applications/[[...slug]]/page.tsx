import { ApplicationsView } from "@/components/console/views/ApplicationsView";

export default async function ApplicationsPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  return <ApplicationsView slug={(await params).slug?.[0] ?? "marketplace"} />;
}
