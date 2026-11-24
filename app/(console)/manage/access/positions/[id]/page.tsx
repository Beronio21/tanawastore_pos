import { ManagementModuleView } from "@/components/console/views/ManagementModuleView";

export default async function PositionFormPage({ params }: { params: Promise<{ id: string }> }) {
  return <ManagementModuleView section="access" slug="positions" positionId={(await params).id} />;
}
