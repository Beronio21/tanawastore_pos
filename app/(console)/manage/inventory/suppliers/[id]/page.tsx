import { ManagementModuleView } from "@/components/console/views/ManagementModuleView";

export default async function SupplierFormPage({ params }: { params: Promise<{ id: string }> }) {
  return <ManagementModuleView section="calculations" slug="suppliers" supplierId={(await params).id} />;
}
