import { ManagementModuleView } from "@/components/console/views/ManagementModuleView";
export default async function SettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  return <ManagementModuleView section="settings" slug={(await params).slug} />;
}
