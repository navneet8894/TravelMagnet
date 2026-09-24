"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiRequest } from "@/lib/api";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword !== confirmPassword) { setError("New passwords do not match."); return; }
    setSaving(true); setError("");
    try {
      await apiRequest("/auth/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) });
      localStorage.removeItem("travelmagnet-token");
      localStorage.removeItem("travelmagnet-user");
      router.replace("/login");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to change password."); setSaving(false); }
  }
  return <main className="min-h-screen bg-slate-50 p-5 dark:bg-slate-950 sm:p-8"><div className="mx-auto max-w-xl"><h1 className="text-3xl font-black">Change password</h1><p className="mt-2 text-slate-500">Use a password with at least 10 characters, uppercase and lowercase letters, and a number.</p><form onSubmit={submit} className="mt-7 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}<label className="block text-sm font-semibold">Current password<input type="password" autoComplete="current-password" required value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} className="mt-2 block w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 dark:border-white/20" /></label><label className="block text-sm font-semibold">New password<input type="password" autoComplete="new-password" required minLength={10} value={newPassword} onChange={event => setNewPassword(event.target.value)} className="mt-2 block w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 dark:border-white/20" /></label><label className="block text-sm font-semibold">Confirm new password<input type="password" autoComplete="new-password" required value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} className="mt-2 block w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 dark:border-white/20" /></label><button type="submit" disabled={saving} className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-50">{saving ? "Saving..." : "Update password"}</button></form></div></main>;
}
