import { notFound } from "next/navigation";
import ResourcePage from "@/components/dashboard/ResourcePage";

const sections: Record<string, { title: string; endpoint?: string }> = {
  customers: { title: "Customers", endpoint: "/admin/users?role=user" },
  owners: { title: "Hotel Owners", endpoint: "/admin/users?role=vendor" },
  hotels: { title: "Hotels", endpoint: "/hotels/owner/me" },
  bookings: { title: "Bookings", endpoint: "/bookings/owner" },
  payments: { title: "Payments", endpoint: "/admin/resources/payments" },
  refunds: { title: "Refunds", endpoint: "/refunds" },
  payouts: { title: "Payouts", endpoint: "/payouts" },
  complaints: { title: "Complaints", endpoint: "/complaints" },
  reports: { title: "Reports", endpoint: "/admin/reports" },
  content: { title: "Content & Experiences", endpoint: "/growth/experiences" },
  "audit-logs": { title: "Audit Logs", endpoint: "/admin/audit-logs" },
  "ai-monitoring": { title: "AI Monitoring", endpoint: "/admin/resources/ai-monitoring" },
  reviews: { title: "Review Moderation", endpoint: "/admin/resources/reviews" },
  coupons: { title: "Coupons", endpoint: "/growth/coupons" },
  settings: { title: "Platform Settings" },
  roles: { title: "Roles & Permissions", endpoint: "/admin/resources/roles" },
  "fraud-alerts": { title: "Fraud Alerts", endpoint: "/admin/resources/fraud-alerts" },
};

export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const config = sections[section];
  if (!config) notFound();
  return <ResourcePage title={config.title} endpoint={config.endpoint} role="admin" />;
}
