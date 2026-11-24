import { ManagementModuleView } from "@/components/console/views/ManagementModuleView";

export default function RegisterAliasPage() {
  return <ManagementModuleView section="access" slug="pos" registerBasePath="/manage/access/pos" />;
}
