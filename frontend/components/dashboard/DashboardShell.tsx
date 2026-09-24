"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  BarChart3, Bell, BookOpen, Building2, CalendarDays, Compass, CreditCard,
  Heart, Hotel, LayoutDashboard, LogOut, Menu, MessageSquare, ShieldCheck, ChevronRight, UserRound, KeyRound,
  Sparkles, Star, Users, Wallet, X, RefreshCw, Settings,
} from "lucide-react";
import { apiRequest, logout } from "@/lib/api";
import DatePicker, { lastSevenDays, type DateFilterValue } from "@/components/common/DatePicker";
import { destination, restoreSession, type AuthUser, type Role } from "@/lib/auth";
import { Loading } from "@/components/common/States";

type NavItem = { label: string; href: string; icon: typeof LayoutDashboard };
type ToolbarState = { dateFilter: DateFilterValue; setDateFilter: (value: DateFilterValue) => void; refreshVersion: number };
const ToolbarContext = createContext<ToolbarState | null>(null);
export function useDashboardToolbar() { return useContext(ToolbarContext); }

const navigation: Record<Role, NavItem[]> = {
  admin: [
    { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Bookings", href: "/admin/bookings", icon: CalendarDays },
    { label: "Properties", href: "/admin/hotels", icon: Hotel },
    { label: "Customers", href: "/admin/customers", icon: Users },
    { label: "Hotel owners", href: "/admin/owners", icon: Building2 },
    { label: "Verifications", href: "/admin/verifications", icon: ShieldCheck },
    { label: "Payments", href: "/admin/payments", icon: CreditCard },
    { label: "Refunds", href: "/admin/refunds", icon: Wallet },
    { label: "Payouts", href: "/admin/payouts", icon: Wallet },
    { label: "Complaints", href: "/admin/complaints", icon: MessageSquare },
    { label: "Content & experiences", href: "/admin/content", icon: Sparkles },
    { label: "Reviews", href: "/admin/reviews", icon: Star },
    { label: "Coupons", href: "/admin/coupons", icon: CreditCard },
    { label: "Reports", href: "/admin/reports", icon: BarChart3 },
    { label: "Audit logs", href: "/admin/audit-logs", icon: BookOpen },
    { label: "AI monitoring", href: "/admin/ai-monitoring", icon: Sparkles },
    { label: "Fraud alerts", href: "/admin/fraud-alerts", icon: ShieldCheck },
  ],
  vendor: [
    { label: "Overview", href: "/owner/dashboard", icon: LayoutDashboard },
    { label: "Properties", href: "/owner/hotels", icon: Hotel },
    { label: "Bookings", href: "/owner/bookings", icon: CalendarDays },
    { label: "Invoices", href: "/owner/invoices", icon: BookOpen },
    { label: "Revenue", href: "/owner/revenue", icon: BarChart3 },
    { label: "Payouts", href: "/owner/payouts", icon: Wallet },
    { label: "Reviews", href: "/owner/reviews", icon: Star },
    { label: "Complaints", href: "/owner/complaints", icon: MessageSquare },
    { label: "Notifications", href: "/owner/notifications", icon: Bell },
    { label: "AI tools", href: "/owner/ai-tools", icon: Sparkles },
  ],
  user: [
    { label: "Overview", href: "/customer/dashboard", icon: LayoutDashboard },
    { label: "Bookings", href: "/customer/bookings", icon: CalendarDays },
    { label: "Invoices", href: "/customer/invoices", icon: BookOpen },
    { label: "Wishlist", href: "/customer/wishlist", icon: Heart },
    { label: "Saved trips", href: "/customer/trips", icon: Compass },
    { label: "Reviews", href: "/customer/reviews", icon: Star },
    { label: "Complaints", href: "/customer/complaints", icon: MessageSquare },
    { label: "Loyalty", href: "/customer/loyalty", icon: Star },
    { label: "Referrals", href: "/customer/referrals", icon: Users },
    { label: "Notifications", href: "/customer/notifications", icon: Bell },
    { label: "AI assistant", href: "/customer/ai-assistant", icon: Sparkles },
    { label: "Security", href: "/customer/security", icon: ShieldCheck },
  ],
};

export default function DashboardShell({ role, children }: { role: Role; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [systemOpen, setSystemOpen] = useState(pathname.startsWith("/admin/roles") || pathname.startsWith("/admin/settings"));
  const [access, setAccess] = useState<{ permissions: string[]; restricted: boolean } | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(lastSevenDays);
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    let active = true;
    async function checkSession() {
      let account: AuthUser | null = null;
      try { account = JSON.parse(localStorage.getItem("travelmagnet-user") || "null") as AuthUser | null; } catch { /* Try refresh cookie. */ }
      account = account || await restoreSession();
      if (!active) return;
      if (!account) { router.replace("/login"); return; }
      if (account.role !== role) { router.replace(destination(account.role)); return; }
      setUser(account);
      try { setAccess(await apiRequest<{ permissions: string[]; restricted: boolean }>("/access")); } catch { setAccess({ permissions: [], restricted: false }); }
    }
    void checkSession();
    return () => { active = false; };
  }, [role, router]);

  useEffect(()=>{if(!access?.restricted||pathname.endsWith("/profile")||pathname.endsWith("/change-password"))return;const section=pathname.split("/")[2]||"dashboard",permission=`pages.${role}.${section}`;if(!access.permissions.includes("*")&&!access.permissions.includes(permission)){const fallback=navigation[role].find(item=>access.permissions.includes(`pages.${role}.${item.href.split("/")[2]||"dashboard"}`))?.href;router.replace(fallback||`/${role==="admin"?"admin":role==="vendor"?"owner":"customer"}/profile`)}},[access,pathname,role,router]);

  async function signOut() {
    await logout();
    router.replace("/login");
  }

  const current = navigation[role].find(item => pathname === item.href || pathname.startsWith(`${item.href}/`));
  const canSee=(href:string)=>!access?.restricted||access.permissions.includes("*")||access.permissions.includes(`pages.${role}.${href.split("/")[2]||"dashboard"}`);
  const visibleNavigation=navigation[role].filter(item=>canSee(item.href));
  const systemItems=[{label:"Roles & permissions",href:"/admin/roles",icon:Users},{label:"Settings",href:"/admin/settings",icon:Settings}].filter(item=>canSee(item.href));
  const prefix = role === "admin" ? "admin" : role === "vendor" ? "owner" : "customer";
  const pageTitle = pathname.endsWith("/profile") ? "My profile" : pathname.endsWith("/change-password") ? "Change password" : pathname.endsWith("/roles") ? "Roles & permissions" : pathname.endsWith("/settings") ? "Settings" : current?.label || "Workspace";
  if (!user) return <div className="min-h-screen bg-slate-50 dark:bg-[#08111f]"><Loading /></div>;

  return <div className="min-h-screen bg-[#f5f7fb] text-slate-900 dark:bg-[#08111f] dark:text-slate-100">
    {menuOpen && <button type="button" aria-label="Close navigation" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#0c1930] px-4 pb-2 pt-6 text-white shadow-xl transition-transform lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex items-center justify-between px-3"><Link href={destination(role)} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 text-lg font-extrabold tracking-tight"><span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-sky-600"><Compass size={21} /></span>TravelMagnet</Link><button type="button" className="lg:hidden" aria-label="Close menu" onClick={() => setMenuOpen(false)}><X size={20} /></button></div>
      <p className="mx-3 mt-9 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Workspace</p>
      <nav className="mt-3 space-y-1 overflow-y-auto" aria-label={`${role} navigation`}>{visibleNavigation.map(({ label, href, icon: Icon }) => { const selected = pathname === href || pathname.startsWith(`${href}/`); return <Link key={href} href={href} onClick={() => setMenuOpen(false)} aria-current={selected ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${selected ? "bg-sky-500/20 text-sky-200 ring-1 ring-sky-400/25" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}><Icon size={18} strokeWidth={1.8} />{label}</Link>; })}{role==="admin"&&systemItems.length>0&&<div><button type="button" aria-expanded={systemOpen} onClick={()=>setSystemOpen(open=>!open)} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${pathname.startsWith("/admin/roles")||pathname.startsWith("/admin/settings")?"bg-sky-500/20 text-sky-200":"text-slate-300 hover:bg-white/10 hover:text-white"}`}><Settings size={18}/><span className="flex-1 text-left">System</span><ChevronRight size={16} className={`transition-transform ${systemOpen?"rotate-90":""}`}/></button>{systemOpen&&<div className="ml-5 mt-1 space-y-1 border-l border-white/10 pl-3">{systemItems.map(({label,href,icon:Icon})=>{const selected=pathname===href;return <Link key={href} href={href} onClick={()=>setMenuOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${selected?"text-sky-200":"text-slate-400 hover:bg-white/10 hover:text-white"}`}><Icon size={16}/>{label}</Link>})}</div>}</div>}</nav>
      <div className="mt-auto border-t border-white/10 pt-1"><button type="button" aria-expanded={profileOpen} aria-label="Open profile menu" onClick={() => setProfileOpen(open => !open)} className="flex w-full items-center gap-3 rounded-xl px-2 py-1 text-left hover:bg-white/10"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-sky-500 text-base font-bold text-white">{user.name?.[0]?.toUpperCase() || "A"}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{role === "admin" ? "Admin" : user.name}</span></span><ChevronRight size={18} className={`shrink-0 text-slate-400 transition-transform ${profileOpen ? "rotate-90" : ""}`} /></button>{profileOpen && <div className="mt-1 space-y-1 rounded-xl border border-white/10 bg-white/5 p-1"><Link href={`/${prefix}/profile`} onClick={() => { setProfileOpen(false); setMenuOpen(false); }} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/10"><UserRound size={17} />My profile</Link><Link href={`/${prefix}/change-password`} onClick={() => { setProfileOpen(false); setMenuOpen(false); }} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-white/10"><KeyRound size={17} />Change password</Link><button type="button" onClick={signOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/10"><LogOut size={17} />Logout</button></div>}</div>
    </aside>
    <ToolbarContext.Provider value={{ dateFilter, setDateFilter, refreshVersion }}><div className="min-w-0 lg:pl-64"><header className="sticky top-0 z-30 flex min-h-20 flex-wrap items-center gap-4 border-b border-slate-200/80 bg-white/90 px-5 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-[#0e1a2c]/90 sm:px-8"><button type="button" aria-label="Open menu" onClick={() => setMenuOpen(true)} className="rounded-xl border border-slate-200 p-2 lg:hidden dark:border-white/10"><Menu size={20} /></button><div className="mr-auto"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">{role === "admin" ? "Admin" : role === "vendor" ? "Owner" : "Customer"} workspace</p><h1 className="text-lg font-extrabold sm:text-xl">{pageTitle}</h1></div><div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => setRefreshVersion(version => version + 1)} aria-label="Refresh page data" title="Refresh page data" className="grid size-10 place-items-center rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"><RefreshCw size={18} /></button><DatePicker onChange={setDateFilter} /></div></header><div className="min-w-0">{children}</div></div></ToolbarContext.Provider>
  </div>;
}
