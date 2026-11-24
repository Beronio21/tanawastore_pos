import { ManagementModuleView } from "@/components/console/views/ManagementModuleView";
export default async function CalculationsPage({ params }: { params: Promise<{ slug: string }> }) {
  return <ManagementModuleView section="calculations" slug={(await params).slug} />;
}
