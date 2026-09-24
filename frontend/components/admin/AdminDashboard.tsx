"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight, BarChart3, Building2, CalendarDays, ChevronRight, CircleHelp,
  IndianRupee, TrendingUp, Users,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { destination, restoreSession, type AuthUser } from "@/lib/auth";
import { Empty, ErrorState, Loading } from "@/components/common/States";
import { lastSevenDays } from "@/components/common/DatePicker";
import { useDashboardToolbar } from "@/components/dashboard/DashboardShell";
import TMTable from "@/components/common/TMTable";

type Month = { month: string; bookings: number; revenue: number };
type Booking = {
  _id: string;
  invoiceNumber?: string;
  bookingStatus: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  hotel?: { name: string; city: string };
  user?: { name: string };
};
type DashboardData = {
  summary: { bookings: number; properties: number; users: number; revenue: number; pendingOwners: number; pendingProperties: number; confirmedBookings: number };
  months: Month[];
  statuses: { status: string; count: number }[];
  recentBookings: Booking[];
  topCities: { city: string; count: number }[];
};

const money = (value: number) => `₹${Math.round(value || 0).toLocaleString("en-IN")}`;
const number = (value: number) => (value || 0).toLocaleString("en-IN");
const monthLabel = (value: string) => new Date(`${value}-01T00:00:00Z`).toLocaleDateString("en-IN", { month: "short", timeZone: "UTC" });
const statusLabel = (value: string) => value.replaceAll("_", " ");
const statusColors: Record<string, string> = {
  confirmed: "#1d9a78", completed: "#2563eb", checked_in: "#0d9488", checked_out: "#38bdf8",
  pending: "#f59e0b", payment_processing: "#f97316", cancelled: "#ef4444", refunded: "#a855f7",
};

export default function AdminDashboard() {
  const router = useRouter();
  const toolbar = useDashboardToolbar();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const dateFilter = toolbar?.dateFilter ?? lastSevenDays();
  const refreshVersion = toolbar?.refreshVersion ?? 0;
  const defaultRange = lastSevenDays();
  const isLastSevenDays = dateFilter.from === defaultRange.from && dateFilter.to === defaultRange.to;
  const periodLabel = isLastSevenDays ? "for the last 7 days" : dateFilter.from === dateFilter.to ? `on ${dateFilter.from}` : `from ${dateFilter.from} to ${dateFilter.to}`;
  const chartPeriod = isLastSevenDays ? "last 7 days" : "selected period";

  const load = useCallback(async () => {
    setError("");
    setData(null);
    try {
      let cached: AuthUser | null = null;
      try { cached = JSON.parse(localStorage.getItem("travelmagnet-user") || "null") as AuthUser | null; } catch { /* Rebuild from refresh cookie. */ }
      const account = cached || await restoreSession();
      if (!account) { router.replace("/login"); return; }
      if (account.role !== "admin") { router.replace(destination(account.role)); return; }
      setUser(account);
      const query = new URLSearchParams();
      if (dateFilter.from) query.set("from", dateFilter.from);
      if (dateFilter.to) query.set("to", dateFilter.to);
      setData(await apiRequest<DashboardData>(`/admin/dashboard${query.size ? `?${query}` : ""}`));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Dashboard could not be loaded");
    }
  }, [router, dateFilter.from, dateFilter.to, refreshVersion]);

  useEffect(() => { void load(); }, [load]);

  return (
    <main className="mx-auto max-w-[1600px] space-y-7 p-5 pb-12 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-sky-600">Platform performance</p><h2 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Good to see you, {user?.name?.split(" ")[0] || "Admin"}.</h2><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Showing dashboard data {periodLabel} · dates use India time</p></div><Link href="/admin/reports" className="inline-flex items-center gap-2 rounded-xl bg-[#0c1930] px-4 py-3 text-sm font-bold text-white hover:bg-[#18375e] dark:bg-sky-600">View reports <ArrowRight size={16} /></Link></div>
          {!data && !error ? <Loading /> : error ? <ErrorState message={error} retry={() => void load()} /> : data && <>
            <section aria-label="Platform metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric title="Paid revenue" value={money(data.summary.revenue)} detail="Payments received" icon={IndianRupee} color="sky" />
              <Metric title="Total bookings" value={number(data.summary.bookings)} detail={`${number(data.summary.confirmedBookings)} confirmed`} icon={CalendarDays} color="violet" />
              <Metric title="Properties" value={number(data.summary.properties)} detail={`${number(data.summary.pendingProperties)} awaiting review`} icon={Building2} color="amber" />
              <Metric title="Registered users" value={number(data.summary.users)} detail={`${number(data.summary.pendingOwners)} owners awaiting review`} icon={Users} color="emerald" />
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
              <Panel title="Revenue trend" subtitle={`Paid booking revenue ${chartPeriod}`} icon={TrendingUp}><RevenueChart months={data.months} period={chartPeriod} /></Panel>
              <Panel title="Booking volume" subtitle={`New bookings ${chartPeriod}`} icon={BarChart3}><BookingsChart months={data.months} period={chartPeriod} /></Panel>
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.1fr_1fr]">
              <Panel title="Booking status" subtitle={`Distribution ${periodLabel}`} icon={CalendarDays}><StatusChart statuses={data.statuses} /></Panel>
              <Panel title="Needs your attention" subtitle="Items waiting for an administrator" icon={CircleHelp}>
                <div className="mt-5 space-y-3"><Action href="/admin/verifications" title="Property verification" description="Review submitted hotels" count={data.summary.pendingProperties} color="amber" /><Action href="/admin/owners" title="Hotel owner approvals" description="Review owner applications" count={data.summary.pendingOwners} color="sky" /></div>
                <div className="mt-6 border-t border-slate-100 pt-5 dark:border-white/10"><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Top published destinations</p>{data.topCities.length ? <div className="mt-4 space-y-3">{data.topCities.map((row, index) => <div key={row.city} className="flex items-center gap-3 text-sm"><span className="w-5 font-bold text-slate-400">{String(index + 1).padStart(2, "0")}</span><span className="min-w-0 flex-1 truncate font-semibold">{row.city}</span><span className="font-bold text-sky-600">{number(row.count)}</span></div>)}</div> : <p className="mt-3 text-sm text-slate-500">No published properties yet.</p>}</div>
              </Panel>
            </section>

            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0f1d30]"><div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5"><div><h3 className="text-lg font-extrabold">Recent bookings</h3><p className="mt-1 text-sm text-slate-500">Latest booking activity across the platform</p></div><Link href="/admin/bookings" className="inline-flex items-center gap-1 text-sm font-bold text-sky-600 hover:text-sky-700">View all <ArrowRight size={16} /></Link></div>{data.recentBookings.length ? <div className="p-4"><TMTable title="Recent bookings" rows={data.recentBookings} columns={[{key:"invoiceNumber",label:"Booking"},{key:"user",label:"Guest",value:booking=>booking.user?.name||"Guest"},{key:"hotel",label:"Property",value:booking=>booking.hotel?.name||"Property unavailable"},{key:"totalAmount",label:"Amount",value:booking=>money(booking.totalAmount)},{key:"bookingStatus",label:"Status",value:booking=>statusLabel(booking.bookingStatus)}]} /></div> : <div className="p-6"><Empty title="No bookings yet" text="New bookings will appear here." /></div>}</section>
          </>}
        </main>
  );
}

function Metric({ title, value, detail, icon: Icon, color }: { title: string; value: string; detail: string; icon: typeof IndianRupee; color: "sky" | "violet" | "amber" | "emerald" }) {
  const tones = { sky: "bg-sky-50 text-sky-600 dark:bg-sky-500/15", violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/15", amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/15", emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15" };
  return <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0f1d30]"><div className="flex items-start justify-between"><p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</p><span className={`grid size-11 place-items-center rounded-2xl ${tones[color]}`}><Icon size={21} /></span></div><p className="mt-3 text-3xl font-black tracking-tight">{value}</p><p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">{detail}</p></article>;
}

function Panel({ title, subtitle, icon: Icon, children }: { title: string; subtitle: string; icon: typeof TrendingUp; children: React.ReactNode }) {
  return <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0f1d30] sm:p-6"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/15"><Icon size={19} /></span><div><h3 className="text-lg font-extrabold">{title}</h3><p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p></div></div>{children}</section>;
}

function RevenueChart({ months, period }: { months: Month[]; period: string }) {
  const max = Math.max(...months.map(row => row.revenue), 1);
  const points = months.map((row, index) => ({ x: months.length === 1 ? 251 : 24 + index * 455 / (months.length - 1), y: 194 - row.revenue / max * 160 }));
  const line = points.map((point, index) => `${index ? "L" : "M"}${point.x} ${point.y}`).join(" ");
  const area = `${line} L${points.at(-1)?.x ?? 24} 194 L24 194 Z`;
  const labels = months.filter((_, index) => months.length <= 6 || index === 0 || index === months.length - 1 || index % Math.ceil(months.length / 6) === 0);
  return <div className="mt-5"><div className="flex items-baseline gap-2"><strong className="text-2xl font-black">{money(months.reduce((sum, row) => sum + row.revenue, 0))}</strong><span className="text-xs font-semibold text-slate-500">{period}</span></div><div className="mt-4 overflow-hidden"><svg viewBox="0 0 505 215" role="img" aria-label={`Revenue trend: ${months.map(row => `${monthLabel(row.month)} ${money(row.revenue)}`).join(", ")}`} className="h-52 w-full"><defs><linearGradient id="revenue-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" /><stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.01" /></linearGradient></defs>{[34, 87, 140, 194].map(y => <line key={y} x1="24" x2="479" y1={y} y2={y} stroke="#cbd5e1" strokeDasharray="4 6" opacity="0.65" />)}<path d={area} fill="url(#revenue-fill)" /><path d={line} fill="none" stroke="#0284c7" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />{points.map((point, index) => <circle key={months[index].month} cx={point.x} cy={point.y} r="5" fill="#fff" stroke="#0284c7" strokeWidth="3" />)}</svg></div><div className="flex justify-between pl-1 text-xs font-semibold text-slate-500">{labels.map(row => <span key={row.month}>{monthLabel(row.month)}</span>)}</div></div>;
}

function BookingsChart({ months, period }: { months: Month[]; period: string }) {
  const max = Math.max(...months.map(row => row.bookings), 1);
  const labels = months.filter((_, index) => months.length <= 6 || index === 0 || index === months.length - 1 || index % Math.ceil(months.length / 6) === 0);
  return <div className="mt-5"><div className="flex items-baseline gap-2"><strong className="text-2xl font-black">{number(months.reduce((sum, row) => sum + row.bookings, 0))}</strong><span className="text-xs font-semibold text-slate-500">{period}</span></div><div role="img" aria-label={`Monthly bookings: ${months.map(row => `${monthLabel(row.month)} ${row.bookings}`).join(", ")}`} className="mt-6 flex h-48 items-end justify-between gap-2 border-b border-slate-200 px-1 pb-0 dark:border-white/10">{months.map(row => <div key={row.month} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end"><span className="mb-2 text-xs font-bold text-slate-500">{row.bookings}</span><div className="w-full max-w-10 rounded-t-lg bg-gradient-to-t from-sky-600 to-cyan-400 transition group-hover:from-indigo-600 group-hover:to-sky-400" style={{ height: `${Math.max(row.bookings / max * 78, 3)}%` }} /></div>)}</div><div className="mt-3 flex justify-between text-xs font-semibold text-slate-500">{labels.map(row => <span key={row.month}>{monthLabel(row.month)}</span>)}</div></div>;
}

function StatusChart({ statuses }: { statuses: DashboardData["statuses"] }) {
  const rows = statuses.length > 6 ? [...statuses.slice(0, 5), { status: "other", count: statuses.slice(5).reduce((sum, row) => sum + row.count, 0) }] : statuses;
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  let offset = 0;
  const stops = rows.map(row => { const start = offset; offset += row.count / total * 100; return `${statusColors[row.status] || "#64748b"} ${start}% ${offset}%`; });
  return <div className="mt-6 flex flex-col items-center gap-7 sm:flex-row"><div role="img" aria-label={`Booking statuses: ${rows.map(row => `${statusLabel(row.status)} ${row.count}`).join(", ") || "No bookings"}`} className="grid size-44 shrink-0 place-items-center rounded-full" style={{ background: total ? `conic-gradient(${stops.join(", ")})` : "#e2e8f0" }}><div className="grid size-28 place-items-center rounded-full bg-white text-center dark:bg-[#0f1d30]"><span><strong className="block text-2xl font-black">{number(total)}</strong><small className="text-xs font-semibold text-slate-500">Bookings</small></span></div></div><div className="grid w-full gap-2">{rows.length ? rows.map(row => <div key={row.status} className="flex items-center gap-2 text-sm"><span className="size-2.5 rounded-full" style={{ backgroundColor: statusColors[row.status] || "#64748b" }} /><span className="flex-1 capitalize text-slate-600 dark:text-slate-300">{statusLabel(row.status)}</span><strong>{number(row.count)}</strong></div>) : <p className="text-sm text-slate-500">No booking activity yet.</p>}</div></div>;
}

function Action({ href, title, description, count, color }: { href: string; title: string; description: string; count: number; color: "amber" | "sky" }) {
  return <Link href={href} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:border-sky-200 hover:bg-sky-50 dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/10"><span className={`grid size-11 shrink-0 place-items-center rounded-xl font-black ${color === "amber" ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700"}`}>{count}</span><span className="min-w-0 flex-1"><strong className="block text-sm">{title}</strong><small className="text-slate-500">{description}</small></span><ChevronRight size={18} className="text-slate-400" /></Link>;
}
