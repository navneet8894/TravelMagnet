"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { AuthUser } from "@/lib/auth";
import { ErrorState, Loading } from "@/components/common/States";

export default function ProfilePage({ prefix }: { prefix: "admin" | "owner" | "customer" }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { let active = true; apiRequest<AuthUser>("/auth/me").then(data => { if (active) setUser(data); }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : "Unable to load profile"); }); return () => { active = false; }; }, []);
  return <main className="min-h-screen bg-slate-50 p-5 dark:bg-slate-950 sm:p-8"><div className="mx-auto max-w-3xl"><h1 className="text-3xl font-black">My profile</h1><p className="mt-2 text-slate-500">Your TravelMagnet account details</p>{error ? <div className="mt-7"><ErrorState message={error} /></div> : !user ? <Loading /> : <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900"><div className="flex items-center gap-4"><div className="grid size-16 place-items-center rounded-full bg-sky-500 text-2xl font-bold text-white">{user.name?.[0]?.toUpperCase() || "A"}</div><div><h2 className="text-xl font-bold">{user.name}</h2><p className="text-sm text-slate-500">{user.email}</p></div></div><dl className="mt-7 grid gap-4 border-t border-slate-200 pt-6 dark:border-white/10 sm:grid-cols-2"><div><dt className="text-sm text-slate-500">Role</dt><dd className="mt-1 font-semibold capitalize">{user.role === "vendor" ? "Owner" : user.role}</dd></div><div><dt className="text-sm text-slate-500">Account status</dt><dd className="mt-1 font-semibold capitalize">{user.status}</dd></div>{user.phone && <div><dt className="text-sm text-slate-500">Phone</dt><dd className="mt-1 font-semibold">{user.phone}</dd></div>}<div><dt className="text-sm text-slate-500">Email verification</dt><dd className="mt-1 font-semibold">{user.emailVerified ? "Verified" : "Pending"}</dd></div></dl><Link href={`/${prefix}/change-password`} className="mt-7 inline-flex rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white hover:bg-sky-700">Change password</Link></div>}</div></main>;
}
