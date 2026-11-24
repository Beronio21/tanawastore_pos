import { ManagementModuleView } from "@/components/console/views/ManagementModuleView";

export default function TabletsPage() {
  return <ManagementModuleView section="access" slug="tablets" registerBasePath="/manage/access/tablets" />;
}
