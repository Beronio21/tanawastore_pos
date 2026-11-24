import { ManagementModuleView } from "@/components/console/views/ManagementModuleView";

export default async function PositionFormAliasPage({ params }: { params: Promise<{ id: string }> }) {
  return <ManagementModuleView section="access" slug="role_listing" positionId={(await params).id} />;
}
