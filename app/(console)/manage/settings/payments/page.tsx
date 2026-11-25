import { redirect } from "next/navigation";

export default function BillingPaymentsIndexPage() {
  redirect("/manage/settings/payments/overview");
}
