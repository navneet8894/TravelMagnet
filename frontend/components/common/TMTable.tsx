"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Download, Ellipsis, Filter, Plus, Search, Settings2, X } from "lucide-react";

export type TMColumn<T> = {
  key: string;
  label: string;
  value?: (row: T) => unknown;
  defaultVisible?: boolean;
  sortable?: boolean;
  order?: number;
  width?: number;
};

export type TMAction<T> = {
  label: string;
  onClick: (row: T) => void;
  danger?: boolean;
};

type Props<T extends object> = {
  rows: T[];
  columns?: TMColumn<T>[];
  title?: string;
  emptyMessage?: string;
  actionColumn?: boolean;
  actions?: TMAction<T>[];
  onAdd?: () => void;
  addLabel?: string;
  pageSize?: number;
  tableKey?: string;
};

const hiddenFields = /^(?:_id|__v|password|.*token.*|.*secret.*|loginHistory)$/i;
const labelFor = (key: string) => key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]/g, " ").replace(/^./, letter => letter.toUpperCase());

function valueFor<T extends object>(row: T, column: TMColumn<T>): unknown {
  return column.value ? column.value(row) : (row as Record<string, unknown>)[column.key];
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toLocaleString("en-IN");
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) return date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    }
    return value;
  }
  if (Array.isArray(value)) return value.map(displayValue).join(", ");
  if (typeof value === "object") {
    const item = value as Record<string, unknown>;
    return displayValue(item.name ?? item.title ?? item.email ?? item.code ?? item.city ?? JSON.stringify(value));
  }
  return String(value);
}

const xml = (value: string) => value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

function downloadExcel<T extends object>(rows: T[], columns: TMColumn<T>[], title: string) {
  const cell = (value: unknown) => typeof value === "number" && Number.isFinite(value)
    ? `<Cell><Data ss:Type="Number">${value}</Data></Cell>`
    : `<Cell><Data ss:Type="String">${xml(displayValue(value))}</Data></Cell>`;
  const body = [columns.map(column => cell(column.label)), ...rows.map(row => columns.map(column => cell(valueFor(row, column))))].map(cells => `<Row>${cells.join("")}</Row>`).join("");
  const workbook = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Data"><Table>${body}</Table></Worksheet></Workbook>`;
  const url = URL.createObjectURL(new Blob([workbook], { type: "application/vnd.ms-excel;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${(title || "travelmagnet-data").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "travelmagnet-data"}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function TMTable<T extends object>({ rows, columns, title = "Records", emptyMessage = "No records found.", actionColumn = true, actions = [], onAdd, addLabel = "Add", pageSize = 10, tableKey }: Props<T>) {
  const availableColumns = useMemo<TMColumn<T>[]>(() => (columns?.length ? [...columns].sort((a,b)=>(a.order??0)-(b.order??0)) : Array.from(new Set(rows.slice(0, 20).flatMap(row => Object.keys(row)))).filter(key => !hiddenFields.test(key)).map(key => ({ key, label: labelFor(key) }))), [columns, rows]);
  const presetVersion = availableColumns.filter(column => column.defaultVisible !== false).map(column => column.key).join("|");
  const storageKey = tableKey ? `travelmagnet:table-columns:${tableKey}:${presetVersion}` : "";
  const [chosenColumns, setChosenColumns] = useState<string[] | null>(() => { if (!storageKey || typeof window === "undefined") return null; try { const saved=localStorage.getItem(storageKey); return saved?JSON.parse(saved):null; } catch { return null; } });
  const visibleKeys = chosenColumns ?? availableColumns.filter(column => column.defaultVisible !== false).map(column => column.key);
  const visibleColumns = availableColumns.filter(column => visibleKeys.includes(column.key));
  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [filterKey, setFilterKey] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [toolbarMenu, setToolbarMenu] = useState<"columns" | "export" | null>(null);
  const [exportKeys, setExportKeys] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [actionMenu, setActionMenu] = useState<{ row: T; top: number; left: number } | null>(null);
  const [details, setDetails] = useState<T | null>(null);

  const filteredRows = useMemo(() => rows.filter(row => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || availableColumns.some(column => displayValue(valueFor(row, column)).toLowerCase().includes(query));
    const selected = availableColumns.find(column => column.key === filterKey);
    const matchesFilter = !selected || !filterValue.trim() || displayValue(valueFor(row, selected)).toLowerCase().includes(filterValue.trim().toLowerCase());
    return matchesSearch && matchesFilter;
  }), [rows, availableColumns, search, filterKey, filterValue]);
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / safePageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((currentPage - 1) * safePageSize, currentPage * safePageSize);

  function toggleColumn(key: string) {
    setChosenColumns(current => {
      const selected = current ?? availableColumns.filter(column => column.defaultVisible !== false).map(column => column.key);
      const next=selected.includes(key) ? selected.filter(item => item !== key) : [...selected, key];
      if(storageKey)localStorage.setItem(storageKey,JSON.stringify(next));
      return next;
    });
  }

  function resetColumns(){if(storageKey)localStorage.removeItem(storageKey);setChosenColumns(null)}

  function openExport() {
    setExportKeys(visibleKeys);
    setToolbarMenu(current => current === "export" ? null : "export");
  }

  return <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
    <div className="flex flex-wrap items-center justify-end gap-2 border-b border-slate-100 p-4 dark:border-white/10">
      <div className="relative ml-auto w-full sm:w-64"><Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" aria-label={`Search ${title}`} placeholder="Search records..." value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} className="h-10 w-full rounded-xl border border-slate-200 bg-transparent pl-9 pr-3 text-sm outline-none focus:border-sky-500 dark:border-white/10" /></div>
      <button type="button" aria-expanded={showFilter} onClick={() => setShowFilter(current => !current)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"><Filter size={16} /> Filter</button>
      <div className="relative"><button type="button" aria-expanded={toolbarMenu === "columns"} onClick={() => setToolbarMenu(current => current === "columns" ? null : "columns")} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"><Settings2 size={16} /> Columns <ChevronDown size={14} /></button>{toolbarMenu === "columns" && <div className="absolute right-0 top-12 z-20 max-h-72 min-w-52 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-slate-800"><p className="px-2 pb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Visible columns</p>{availableColumns.map(column => <label key={column.key} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-slate-50 dark:hover:bg-white/5"><input type="checkbox" checked={visibleKeys.includes(column.key)} onChange={() => toggleColumn(column.key)} className="accent-sky-600" />{column.label}</label>)}<button type="button" onClick={resetColumns} className="mt-1 w-full border-t border-slate-100 px-2 pt-2 text-left text-sm font-semibold text-sky-600 dark:border-white/10">Reset default</button></div>}</div>
      {onAdd && <button type="button" onClick={onAdd} className="inline-flex h-10 items-center gap-2 rounded-xl bg-sky-600 px-3 text-sm font-bold text-white hover:bg-sky-700"><Plus size={16} /> {addLabel}</button>}
      <div className="relative"><button type="button" aria-expanded={toolbarMenu === "export"} onClick={openExport} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"><Download size={16} /> Export <ChevronDown size={14} /></button>{toolbarMenu === "export" && <div className="absolute right-0 top-12 z-20 min-w-56 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-slate-800"><p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Select Excel columns</p><div className="max-h-48 overflow-y-auto">{availableColumns.map(column => <label key={column.key} className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-2 text-sm"><input type="checkbox" checked={exportKeys.includes(column.key)} onChange={() => setExportKeys(current => current.includes(column.key) ? current.filter(key => key !== column.key) : [...current, column.key])} className="accent-sky-600" />{column.label}</label>)}</div><button type="button" disabled={!exportKeys.length} onClick={() => { downloadExcel(filteredRows, availableColumns.filter(column => exportKeys.includes(column.key)), title); setToolbarMenu(null); }} className="mt-3 w-full rounded-lg bg-sky-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">Download Excel</button><p className="mt-2 text-xs text-slate-500">Exports {filteredRows.length} matching records.</p></div>}</div>
    </div>
    {showFilter && <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-white/10"><select aria-label="Filter column" value={filterKey} onChange={event => { setFilterKey(event.target.value); setPage(1); }} className="h-10 rounded-xl border border-slate-200 bg-transparent px-3 text-sm dark:border-white/10"><option value="">Choose column</option>{availableColumns.map(column => <option key={column.key} value={column.key}>{column.label}</option>)}</select><input aria-label="Filter value" value={filterValue} onChange={event => { setFilterValue(event.target.value); setPage(1); }} placeholder="Contains..." className="h-10 min-w-44 rounded-xl border border-slate-200 bg-transparent px-3 text-sm outline-none focus:border-sky-500 dark:border-white/10" /><button type="button" aria-label="Clear filter" title="Clear filter" onClick={() => { setFilterKey(""); setFilterValue(""); setPage(1); }} className="grid size-10 place-items-center rounded-xl border border-slate-200 dark:border-white/10"><X size={16} /></button></div>}
    <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500 dark:bg-white/5"><tr>{visibleColumns.map(column => <th key={column.key} scope="col" style={column.width?{width:column.width}:undefined} className="whitespace-nowrap px-4 py-3">{column.label}</th>)}{actionColumn && <th scope="col" className="w-16 px-4 py-3 text-right">Action</th>}</tr></thead><tbody>{pageRows.length ? pageRows.map((row, index) => <tr key={String((row as Record<string, unknown>)._id ?? `${currentPage}-${index}`)} className="border-t border-slate-100 dark:border-white/10">{visibleColumns.map(column => <td key={column.key} className="max-w-64 truncate px-4 py-3" title={displayValue(valueFor(row, column))}>{displayValue(valueFor(row, column))}</td>)}{actionColumn && <td className="px-4 py-3 text-right"><button type="button" aria-label="Row actions" aria-expanded={actionMenu?.row === row} onClick={event => { const box = event.currentTarget.getBoundingClientRect(); setActionMenu(current => current?.row === row ? null : { row, top: Math.min(box.bottom + 4, window.innerHeight - 150), left: Math.max(8, box.right - 176) }); }} className="inline-grid size-8 place-items-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"><Ellipsis size={20} /></button></td>}</tr>) : <tr><td colSpan={Math.max(1, visibleColumns.length + (actionColumn ? 1 : 0))} className="px-4 py-12 text-center text-slate-500">{emptyMessage}</td></tr>}</tbody></table></div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 dark:border-white/10"><span>{filteredRows.length ? `${(currentPage - 1) * safePageSize + 1}–${Math.min(currentPage * safePageSize, filteredRows.length)} of ${filteredRows.length}` : "0 records"}</span><div className="flex items-center gap-2"><button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40 dark:border-white/10">Previous</button><span>Page {currentPage} of {totalPages}</span><button type="button" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40 dark:border-white/10">Next</button></div></div>
    {actionMenu && <><button type="button" aria-label="Close actions" onClick={() => setActionMenu(null)} className="fixed inset-0 z-40 cursor-default" /><div className="fixed z-50 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-white/10 dark:bg-slate-800" style={{ top: actionMenu.top, left: actionMenu.left }}><button type="button" onClick={() => { setDetails(actionMenu.row); setActionMenu(null); }} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-white/5">View details</button>{actions.map(action => <button key={action.label} type="button" onClick={() => { action.onClick(actionMenu.row); setActionMenu(null); }} className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-white/5 ${action.danger ? "text-red-600" : ""}`}>{action.label}</button>)}</div></>}
    {details && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"><div role="dialog" aria-modal="true" aria-label="Record details" className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900"><div className="flex items-center justify-between"><h3 className="text-lg font-bold">Record details</h3><button type="button" aria-label="Close details" onClick={() => setDetails(null)}><X size={20} /></button></div><dl className="mt-4 divide-y divide-slate-100 dark:divide-white/10">{availableColumns.map(column => <div key={column.key} className="grid grid-cols-3 gap-3 py-2 text-sm"><dt className="font-semibold text-slate-500">{column.label}</dt><dd className="col-span-2 break-words">{displayValue(valueFor(details, column))}</dd></div>)}</dl></div></div>}
  </section>;
}
