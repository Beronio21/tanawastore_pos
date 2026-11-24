import { ManagementModuleView } from "@/components/console/views/ManagementModuleView";

export default async function RegisterFormPage({ params }: { params: Promise<{ id: string }> }) {
  return <ManagementModuleView section="access" slug="tablets" registerId={(await params).id} registerBasePath="/manage/access/tablets" />;
}
