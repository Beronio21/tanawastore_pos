import { ManagementModuleView } from "@/components/console/views/ManagementModuleView";

export default async function RegisterAliasFormPage({ params }: { params: Promise<{ id: string }> }) {
  return <ManagementModuleView section="access" slug="pos" registerId={(await params).id} registerBasePath="/manage/access/pos" />;
}
