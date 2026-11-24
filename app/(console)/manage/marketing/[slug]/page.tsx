import { ManagementModuleView } from "@/components/console/views/ManagementModuleView";
export default async function MarketingPage({ params }: { params: Promise<{ slug: string }> }) {
  return <ManagementModuleView section="marketing" slug={(await params).slug} />;
}
