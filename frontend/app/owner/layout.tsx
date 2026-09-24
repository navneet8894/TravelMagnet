import DashboardShell from "@/components/dashboard/DashboardShell";

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role="vendor">{children}</DashboardShell>;
}
