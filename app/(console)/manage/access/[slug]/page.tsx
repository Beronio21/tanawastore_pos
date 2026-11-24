import { ManagementModuleView } from "@/components/console/views/ManagementModuleView";
export default async function AccessPage({ params }: { params: Promise<{ slug: string }> }) {
  return <ManagementModuleView section="access" slug={(await params).slug} />;
}
