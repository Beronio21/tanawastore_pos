import { ConsoleShell } from "@/components/console/ConsoleShell";

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  return <ConsoleShell>{children}</ConsoleShell>;
}
