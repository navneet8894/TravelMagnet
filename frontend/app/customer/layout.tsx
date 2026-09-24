import DashboardShell from "@/components/dashboard/DashboardShell";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role="user">{children}</DashboardShell>;
}
