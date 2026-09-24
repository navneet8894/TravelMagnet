"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest, downloadApiFile } from "@/lib/api";
import TMTable, { type TMColumn } from "@/components/common/TMTable";
import { useDashboardToolbar } from "@/components/dashboard/DashboardShell";
import { Empty, ErrorState, Loading } from "@/components/common/States";

type Item = Record<string, unknown>;

function tableFromResponse(response: unknown): { rows: Item[]; columns?: TMColumn<Item>[] } {
  if (Array.isArray(response)) return { rows: response as Item[] };
  if (!response || typeof response !== "object") return { rows: [] };
  const data = response as { rows?: Item[]; columns?: TMColumn<Item>[]; items?: Item[]; bookings?: Item[]; summary?: Record<string, unknown> };
  if (Array.isArray(data.rows)) return { rows: data.rows, columns: data.columns };
  if (Array.isArray(data.items)) return { rows: data.items };
  if (data.summary) {
    const summary = Object.entries(data.summary).map(([name, value]) => ({ name: name.replaceAll("_", " "), value }));
    return { rows: [...summary, ...(Array.isArray(data.bookings) ? data.bookings : [])] };
  }
  return { rows: Array.isArray(data.bookings) ? data.bookings : Object.keys(data).length ? [data as Item] : [] };
}

export default function ResourcePage({ title, endpoint, role = "user" }: { title: string; endpoint?: string; role?: "user" | "vendor" | "admin" }) {
  const refreshVersion = useDashboardToolbar()?.refreshVersion ?? 0;
  const [items, setItems] = useState<Item[] | null>(endpoint ? null : []);
  const [columns, setColumns] = useState<TMColumn<Item>[] | undefined>();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    if (!endpoint) { setItems([]); return; }
    setError("");
    try { const table=tableFromResponse(await apiRequest<unknown>(endpoint)); setItems(table.rows); setColumns(table.columns); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load records"); }
  }, [endpoint, refreshVersion]);
  useEffect(() => { void load(); }, [load]);

  const invoiceActions = title.toLowerCase().includes("invoice") ? [{ label: "Download invoice", onClick: (row: Item) => { const id=String(row._id||""); if(id) void downloadApiFile(`/invoices/${id}/download`,"invoice.html").catch(cause=>setError(cause instanceof Error?cause.message:"Download failed")); } }] : [];
  const bookingActions = role !== "user" && title.toLowerCase().includes("booking") ? [{ label: "Create invoice", onClick: (row: Item) => { const id=String(row._id||""); if(id) void apiRequest(`/invoices/booking/${id}`,{method:"POST"}).then(()=>setNotice("Invoice created successfully.")).catch(cause=>setError(cause instanceof Error?cause.message:"Invoice could not be created")); } }] : [];
  const actions=[...invoiceActions,...bookingActions];

  return <main className="min-h-screen bg-slate-50 p-5 dark:bg-slate-950 sm:p-8"><div className="mx-auto max-w-6xl">
    <h1 className="text-4xl font-black capitalize">{title}</h1>
    <p className="mt-2 text-slate-500">Live TravelMagnet records with role-based access.</p>
    {notice && <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">{notice}</p>}
    {error ? <div className="mt-6"><ErrorState message={error} retry={() => void load()} /></div> : items === null ? <Loading /> : items.length || columns?.length ? <div className="mt-7"><TMTable title={title} tableKey={`${role}:${title.toLowerCase().replaceAll(" ","-")}`} rows={items} columns={columns} actionColumn={role === "admin" || actions.length > 0} actions={actions} /></div> : <div className="mt-7"><Empty title={endpoint ? `No ${title.toLowerCase()} yet` : `${title} page is ready`} text={endpoint ? "New records will appear here automatically." : "There are no configurable records for this section yet."} /></div>}
  </div></main>;
}
