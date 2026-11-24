import { ManagementModuleView } from "@/components/console/views/ManagementModuleView";

export default async function CalculationsStorageFormPage({ params }: { params: Promise<{ id: string }> }) {
  return <ManagementModuleView section="calculations" slug="storages" storageLocationId={(await params).id} />;
}
