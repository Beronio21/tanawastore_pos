import { redirect } from "next/navigation";
export default function SettingsIndexPage() {
  redirect("/manage/settings/general");
}
