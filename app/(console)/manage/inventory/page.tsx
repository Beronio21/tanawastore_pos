import { redirect } from "next/navigation";

export default function InventoryIndexPage() {
  redirect("/manage/inventory/stock");
}
