import { redirect } from "next/navigation";
export default function FinanceIndexPage() {
  redirect("/manage/finance/transactions");
}
