"use client";

import { useState } from "react";

export type DateFilterValue = { from?: string; to?: string };
type Mode = "last7" | "single" | "range";

export function lastSevenDays(): DateFilterValue {
  const today = new Date(Date.now() + 330 * 60000);
  const to = today.toISOString().slice(0, 10);
  today.setUTCDate(today.getUTCDate() - 6);
  return { from: today.toISOString().slice(0, 10), to };
}

const fieldClass = "h-10 rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-800 outline-none focus:border-sky-500 dark:border-white/15 dark:bg-slate-800 dark:text-slate-100";

export default function DatePicker({ onChange }: { onChange: (value: DateFilterValue) => void }) {
  const [mode, setMode] = useState<Mode>("last7");
  const [date, setDate] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  function selectMode(value: Mode) {
    setMode(value);
    if (value === "last7") onChange(lastSevenDays());
    if (value === "single" && date) onChange({ from: date, to: date });
    if (value === "range" && from && to && from <= to) onChange({ from, to });
  }

  return <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Date filter">
    <label className="sr-only" htmlFor="dashboard-date-mode">Date filter</label>
    <select id="dashboard-date-mode" value={mode} onChange={event => selectMode(event.target.value as Mode)} className={fieldClass}>
      <option value="last7">Last 7 days</option>
      <option value="single">Specific date</option>
      <option value="range">Date range</option>
    </select>
    {mode === "single" && <input aria-label="Specific date" type="date" value={date} onChange={event => { setDate(event.target.value); if (event.target.value) onChange({ from: event.target.value, to: event.target.value }); }} className={fieldClass} />}
    {mode === "range" && <><input aria-label="From date" type="date" value={from} max={to || undefined} onChange={event => { const next = event.target.value; setFrom(next); if (next && to && next <= to) onChange({ from: next, to }); }} className={fieldClass} /><span className="text-xs text-slate-400">to</span><input aria-label="To date" type="date" value={to} min={from || undefined} onChange={event => { const next = event.target.value; setTo(next); if (from && next && from <= next) onChange({ from, to: next }); }} className={fieldClass} /></>}
  </div>;
}
