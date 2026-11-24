import { ManagementModuleView } from "@/components/console/views/ManagementModuleView";
export default async function MenuSectionPage({ params }: { params: Promise<{ slug: string }> }) {
  return <ManagementModuleView section="menu" slug={(await params).slug} />;
}
