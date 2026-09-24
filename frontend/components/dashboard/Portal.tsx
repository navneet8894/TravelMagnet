"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, CalendarDays, Hotel, IndianRupee, Sparkles, Users } from "lucide-react";
import { apiRequest } from "@/lib/api";
import type { AuthUser, Role } from "@/lib/auth";
import { Empty, ErrorState, Loading } from "@/components/common/States";
import TMTable from "@/components/common/TMTable";

type Booking = {
  _id: string;
  invoiceNumber: string;
  bookingStatus: string;
  totalAmount: number;
  hotel?: { name: string; city: string };
  user?: { name: string; email: string };
};
type Data = {
  bookings: Booking[];
  hotels: Array<{ _id: string; name: string; city: string; publicationStatus: string }>;
  totalBookings: number;
  totalHotels: number;
  totalUsers: number;
  totalRevenue: number;
};

export default function Portal({ role }: { role: Role }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setError("");
    try {
      setUser(JSON.parse(localStorage.getItem("travelmagnet-user") || "null") as AuthUser | null);
      setData(await apiRequest<Data>("/dashboard"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Dashboard unavailable");
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const accent = role === "admin" ? "from-violet-600 to-indigo-600" : role === "vendor" ? "from-amber-500 to-orange-600" : "from-sky-600 to-teal-500";
  return <div className="mx-auto max-w-[1600px] p-5 sm:p-8">
    {!data && !error ? <Loading /> : error ? <ErrorState message={error} retry={() => void load()} /> : data && <>
      <section className={`rounded-3xl bg-gradient-to-r ${accent} p-8 text-white`}><Sparkles /><h2 className="mt-5 text-3xl font-black">Everything you need, in one place.</h2><p className="mt-2 text-white/80">Welcome, {user?.name || "traveller"}. Your live activity is below.</p></section>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={<CalendarDays />} label="Bookings" value={data.totalBookings} />
        <Stat icon={<Hotel />} label="Properties" value={data.totalHotels} />
        <Stat icon={role === "admin" ? <Users /> : <Building2 />} label={role === "admin" ? "Users" : "Active stays"} value={role === "admin" ? data.totalUsers : data.bookings.filter(booking => booking.bookingStatus === "confirmed").length} />
        <Stat icon={<IndianRupee />} label="Revenue / Spend" value={String.fromCharCode(8377) + data.totalRevenue.toLocaleString("en-IN")} />
      </div>
      <section className="tm-card mt-6 p-6"><h2 className="text-xl font-black">Recent bookings</h2>{data.bookings.length ? <div className="mt-4"><TMTable title="Recent bookings" rows={data.bookings.slice(0, 10)} actionColumn={false} columns={[
        { key: "invoiceNumber", label: "Reference" },
        { key: "hotel", label: "Hotel", value: booking => booking.hotel?.name || "-" },
        { key: "user", label: "Guest", value: booking => booking.user?.name || user?.name || "-" },
        { key: "totalAmount", label: "Amount", value: booking => String.fromCharCode(8377) + booking.totalAmount.toLocaleString("en-IN") },
        { key: "bookingStatus", label: "Status", value: booking => booking.bookingStatus.replaceAll("_", " ") },
      ]} /></div> : <Empty title="No bookings yet" text="Booking activity will appear here." />}</section>
    </>}
  </div>;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return <article className="tm-card p-5"><span className="text-sky-600">{icon}</span><b className="mt-4 block text-2xl">{value}</b><p className="text-sm text-slate-500">{label}</p></article>;
}
