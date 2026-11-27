import { KitchenBoard } from "@/components/pos/KitchenBoard";

export const metadata = { title: "Kitchen Kit — TanAwa POS" };

/** Dedicated kitchen/bar tablet screen (shares the POS Kitchen Kit board). */
export default function KitchenPage() {
  return <KitchenBoard fullScreen />;
}
