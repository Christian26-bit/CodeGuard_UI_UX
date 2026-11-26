import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Icon } from "../lib";
import type { Lang, Status } from "../data/mock";

export const tier = (n: number) => (n >= 70 ? "high" : n >= 40 ? "mod" : "low");

/* ---------- layout primitives ---------- */
export function Panel({ title, note, actions, children, flush }: { title?: string; note?: string; actions?: ReactNode; children: ReactNode; flush?: boolean }) {
  return (
    <section className="cg-panel min-w-0 rounded-md border border-border bg-card">
      {title && (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-b border-border px-3 py-2.5 sm:px-4">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <h2 className="text-[13px] font-semibold">{title}</h2>
            {note && <span className="text-xs text-muted-foreground">{note}</span>}
          </div>
          {actions}
        </div>
      )}
      <div className={flush ? "min-w-0" : "min-w-0 p-3 sm:p-4"}>{children}</div>
    </section>
  );
}

export function PageHeader({ title, meta, actions }: { title: string; meta?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-4 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:flex-wrap sm:items-start">
      <div className="min-w-0">
        <h1 className="w-fit border-b border-primary/40 pb-1 font-mono text-xl font-semibold leading-7 text-primary">{title}</h1>
        {meta && <div className="mt-1 font-mono text-[11px] text-muted-foreground">{meta}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 max-sm:[&>button]:flex-1">{actions}</div>}
    </header>
  );
}

export function Button({ children, variant = "secondary", icon, className = "", ...p }: { children: ReactNode; variant?: "primary" | "secondary" | "danger"; icon?: string; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const v = {
    primary: "border-primary bg-primary text-primary-foreground hover:bg-primary-hover",
    secondary: "border-border bg-card text-foreground hover:bg-muted",
    danger: "border-high/40 bg-card text-high hover:bg-high-soft",
  }[variant];
  return (
    <button {...p} className={`inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded border px-3 text-[13px] font-medium shadow-sm hover:shadow disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:h-8 ${v} ${className}`}>
      {icon && <Icon n={icon} size={14} />}
      {children}
    </button>
  );
}

export function Tabs({ tabs, value, onChange }: { tabs: string[]; value: string; onChange: (t: string) => void }) {
  const key = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (i + d + tabs.length) % tabs.length;
    onChange(tabs[n]);
    (e.currentTarget.parentElement?.children[n] as HTMLElement)?.focus();
  };
  return (
    <div role="tablist" className="flex gap-0 overflow-x-auto scroll-smooth border-b border-border">
      {tabs.map((t, i) => (
        <button key={t} role="tab" tabIndex={value === t ? 0 : -1} aria-selected={value === t} onKeyDown={(e) => key(e, i)} onClick={() => onChange(t)} className={`-mb-px min-h-10 whitespace-nowrap border-b-2 px-4 py-2 text-[13px] font-medium ${value === t ? "border-primary bg-primary-soft/40 text-primary" : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"}`}>{t}</button>
      ))}
    </div>
  );
}

/* ---------- status / severity ---------- */
export function Severity({ value, label = true }: { value: number; label?: boolean }) {
  const t = tier(value);
  const m = { high: ["text-high", "bg-high", "High"], mod: ["text-mod", "bg-mod", "Moderate"], low: ["text-low", "bg-low", "Low"] }[t];
  const shape = t === "high" ? "rotate-45 rounded-[1px]" : t === "mod" ? "rounded-[1px]" : "rounded-full";
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className={`h-2 w-2 ${m[1]} ${shape}`} aria-hidden />
      <span className="font-mono text-[13px] font-medium tabular-nums">{value}%</span>
      {label && <span className={`text-xs ${m[0]}`}>{m[2]}</span>}
    </span>
  );
}

export const reviewLabel = (s: Status | string) => ({ "Review Recommended": "Pending review", "Needs Investigation": "Under investigation", Reviewed: "Reviewed", "Low Concern": "No concern" } as Record<string, string>)[s] ?? s;

export function StatusText({ status }: { status: Status | string }) {
  const m: Record<string, string> = {
    "Review Recommended": "text-high bg-high-soft",
    "Needs Investigation": "text-mod bg-mod-soft",
    Reviewed: "text-info bg-info-soft",
    "Low Concern": "text-low bg-low-soft",
    Completed: "text-low bg-low-soft",
    Processing: "text-info bg-info-soft",
    Queued: "text-muted-foreground bg-muted",
  };
  const label = reviewLabel(status);
  return <span className={`inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium ${m[status] ?? m.Queued}`}>{label === "Completed" ? "Analyzed" : label}</span>;
}

export function LangTag({ lang }: { lang: Lang }) {
  return <span className="inline-block rounded border border-border bg-muted px-1.5 font-mono text-[11px] leading-[18px]">{lang}</span>;
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn"; children: ReactNode }) {
  const c = tone === "warn" ? "border-mod/30 bg-mod-soft" : "border-info/30 bg-info-soft";
  return (
    <div role="note" className={`flex gap-2 rounded border px-3 py-2 text-xs ${c}`}>
      <Icon n="info" size={14} className={`mt-0.5 ${tone === "warn" ? "text-mod" : "text-info"}`} />
      <div>{children}</div>
    </div>
  );
}

/* ---------- metrics (single strip) ---------- */
export function MetricStrip({ items }: { items: { label: string; value: string; hint?: string }[] }) {
  return (
    <dl className="cg-panel grid grid-cols-2 divide-border rounded-md border border-border bg-card sm:grid-cols-4 sm:divide-x [&>div:nth-child(n+3)]:border-t sm:[&>div:nth-child(n+3)]:border-t-0 [&>div]:border-border">
      {items.map((i) => (
        <div key={i.label} className="px-4 py-2.5">
          <dt className="text-xs text-muted-foreground">{i.label}</dt>
          <dd className="flex items-baseline gap-2"><span className="text-lg font-semibold tabular-nums">{i.value}</span>{i.hint && <span className="text-xs text-muted-foreground">{i.hint}</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Stat({ k, v }: { k: string; v: string }) {
  return <div className="border-l-2 border-border pl-3"><div className="text-xs text-muted-foreground">{k}</div><div className="font-mono text-base font-medium tabular-nums">{v}</div></div>;
}

/* ---------- filters ---------- */
export function Select({ label, value, onChange, options, className = "" }: { label: string; value: string; onChange: (v: string) => void; options: string[]; className?: string }) {
  return (
    <label className={`flex flex-col gap-0.5 text-xs text-muted-foreground ${className}`}>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-8 rounded border border-border bg-card px-2 text-[13px] text-foreground hover:bg-muted">
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </label>
  );
}

export function Search({ value, onChange, placeholder, className = "" }: { value: string; onChange: (v: string) => void; placeholder: string; className?: string }) {
  return (
    <label className={`relative flex flex-col gap-0.5 text-xs text-muted-foreground ${className}`}>
      Search
      <Icon n="search" size={14} className="pointer-events-none absolute bottom-2 left-2 text-muted-foreground" />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-8 rounded border border-border bg-card pl-7 pr-2 text-[13px] text-foreground placeholder:text-muted-foreground" />
    </label>
  );
}

export function FilterBar({ children, onClear }: { children: ReactNode; onClear?: () => void }) {
  return (
    <div className="cg-panel mb-3 flex flex-wrap items-end gap-3 rounded-md border border-border bg-card px-3 py-3 sm:px-4 max-sm:[&>label]:w-full max-sm:[&>label]:max-w-none max-sm:[&_input]:w-full max-sm:[&_select]:w-full">
      {children}
      {onClear && <button onClick={onClear} className="h-8 px-1 text-[13px] font-medium text-primary hover:underline">Clear filters</button>}
    </div>
  );
}

/* ---------- data table ---------- */
export interface Col<T> { key: string; header: string; render: (r: T) => ReactNode; sort?: (r: T) => string | number; className?: string }
export function DataTable<T>({ cols, rows, rowKey, onRow, caption, pageSize, empty, selected, minW = 720 }: { cols: Col<T>[]; rows: T[]; rowKey: (r: T) => string; onRow?: (r: T) => void; caption: string; pageSize?: number; empty?: string; selected?: (r: T) => boolean; minW?: number }) {
  const [sort, setSort] = useState<{ k: string; dir: 1 | -1 } | null>(null);
  const [page, setPage] = useState(0);
  const pad = ({ Compact: "py-0.5", Comfortable: "py-2.5" } as Record<string, string>)[localStorage.getItem("cg-density") ?? ""] ?? "py-1.5";
  const col = cols.find((c) => c.key === sort?.k);
  const sorted = col?.sort ? [...rows].sort((a, b) => { const x = col.sort!(a), y = col.sort!(b); return (x > y ? 1 : x < y ? -1 : 0) * sort!.dir; }) : rows;
  const pages = pageSize ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const p = Math.min(page, pages - 1);
  const shown = pageSize ? sorted.slice(p * pageSize, p * pageSize + pageSize) : sorted;
  return (
    <div>
      <div className="overflow-x-auto">
        <table style={{ minWidth: minW }} className="w-full border-collapse text-left">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-muted/60">
            <tr className="border-b border-border">
              {cols.map((c) => (
                <th key={c.key} scope="col" aria-sort={sort?.k === c.key ? (sort.dir === 1 ? "ascending" : "descending") : undefined} className={`whitespace-nowrap px-3 py-2 text-xs font-medium text-muted-foreground ${c.className ?? ""}`}>
                  {c.sort ? (
                    <button onClick={() => setSort(sort?.k === c.key ? { k: c.key, dir: (sort.dir * -1) as 1 | -1 } : { k: c.key, dir: 1 })} className="inline-flex items-center gap-1 hover:text-foreground">
                      {c.header}
                      <Icon n="down" size={11} className={sort?.k === c.key ? `text-foreground ${sort.dir === 1 ? "rotate-180" : ""}` : "opacity-40"} />
                    </button>
                  ) : c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={rowKey(r)} aria-selected={selected ? selected(r) : undefined} tabIndex={onRow ? 0 : undefined} onClick={() => onRow?.(r)} onKeyDown={(e) => { if (onRow && e.key === "Enter") onRow(r); }} className={`border-b border-border last:border-0 ${onRow ? "cursor-pointer hover:bg-primary-soft/50" : ""} ${selected?.(r) ? "bg-primary-soft shadow-[inset_3px_0_0_var(--primary)]" : ""}`}>
                {cols.map((c) => <td key={c.key} className={`px-3 ${pad} align-middle ${c.className ?? ""}`}>{c.render(r)}</td>)}
              </tr>
            ))}
            {!shown.length && <tr><td colSpan={cols.length} className="px-3 py-10 text-center text-muted-foreground">{empty ?? "No records match the current filters."}</td></tr>}
          </tbody>
        </table>
      </div>
      {pageSize && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2 text-xs text-muted-foreground">
          <span>{sorted.length ? `${p * pageSize + 1}–${Math.min(sorted.length, (p + 1) * pageSize)} of ${sorted.length}` : "0 results"}</span>
          <div className="flex flex-wrap items-center gap-2">
            <Button className="h-7" disabled={p === 0} onClick={() => setPage(p - 1)}>Previous</Button>
            <span>Page {p + 1} of {pages}</span>
            <Button className="h-7" disabled={p >= pages - 1} onClick={() => setPage(p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- states ---------- */
export function Loading({ text }: { text: string }) {
  return <div role="status" className="flex items-center gap-2 py-3 text-muted-foreground"><Icon n="loader" size={14} className="[animation:cg-spin_.9s_linear_infinite]" />{text}</div>;
}
export function ErrorBox({ title, text, onRetry }: { title: string; text: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded border border-high/30 bg-high-soft px-3 py-2">
      <Icon n="alert" size={14} className="mt-0.5 text-high" />
      <div className="flex-1"><div className="font-medium text-high">{title}</div><div className="text-xs">{text}</div></div>
      {onRetry && <Button className="h-7" onClick={onRetry}>Retry</Button>}
    </div>
  );
}

/* ---------- modal + toast ---------- */
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="cg-backdrop absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label={title} className="cg-modal relative max-h-[92dvh] w-full max-w-xl overflow-auto rounded-t-xl border border-border bg-card shadow-xl sm:max-h-[85vh] sm:rounded-md">
        <div className="flex items-center justify-between border-b border-border px-4 py-3"><h2 className="text-sm font-semibold">{title}</h2><button onClick={onClose} aria-label="Close" className="p-1 text-muted-foreground hover:text-foreground"><Icon n="close" /></button></div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

const ToastCtx = createContext<(m: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<{ id: number; m: string }[]>([]);
  const push = (m: string) => {
    const id = Date.now() + Math.random();
    setList((l) => [...l, { id, m }]);
    setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), 3500);
  };
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div aria-live="polite" className="fixed inset-x-3 bottom-3 z-[60] flex flex-col items-stretch gap-2 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:items-end">
        {list.map((t) => <div key={t.id} className="cg-toast flex items-center gap-2 rounded border border-border bg-foreground px-3 py-2 text-[13px] text-background shadow-md"><Icon n="check" size={14} />{t.m}</div>)}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- simple bar ---------- */
export function Bar({ value, label }: { value: number; label: string }) {
  const c = tier(value) === "high" ? "bg-high" : tier(value) === "mod" ? "bg-mod" : "bg-low";
  return <div role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} className="h-1.5 w-full overflow-hidden rounded-sm bg-muted"><div className={`cg-bar h-full ${c}`} style={{ width: value + "%" }} /></div>;
}

/* ---------- code panel ---------- */
const KW = new Set("import from def return if elif else for while in with as class public private static void int new try except None True False not and or is".split(" "));
function highlight(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(#.*$)|("(?:[^"\\]|\\.)*")|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_]\w*\b)|(\s+|.)/g;
  let m: RegExpExecArray | null, i = 0, prevDef = false;
  while ((m = re.exec(line))) {
    const [t, com, str, num, word] = m;
    if (com) out.push(<span key={i++} className="text-muted-foreground">{t}</span>);
    else if (str) out.push(<span key={i++} className="text-low">{t}</span>);
    else if (num) out.push(<span key={i++} className="text-mod">{t}</span>);
    else if (word) {
      if (KW.has(t)) out.push(<span key={i++} className="text-primary font-medium">{t}</span>);
      else if (prevDef) out.push(<span key={i++} className="text-info">{t}</span>);
      else out.push(t);
      prevDef = t === "def";
    } else out.push(t);
  }
  return out;
}
export const LINE_H = 20;
export function CodePanel({ title, file, lang, code, ranges, active, onPick, panelRef }: { title: string; file: string; lang: Lang; code: string; ranges: { id: number; range: [number, number] }[]; active: number; onPick: (id: number) => void; panelRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-md border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-muted/60 px-3 py-1.5">
        <div className="min-w-0 truncate"><span className="text-xs text-muted-foreground">{title} · </span><span className="font-mono text-xs font-medium">{file}</span></div>
        <LangTag lang={lang} />
      </div>
      <div ref={panelRef} className="h-[min(64vh,680px)] min-h-[380px] overflow-auto py-1 font-mono text-[12px]" style={{ lineHeight: LINE_H + "px" }}>
        {code.split("\n").map((ln, i) => {
          const n = i + 1;
          const r = ranges.find((r) => n >= r.range[0] && n <= r.range[1]);
          const on = r?.id === active;
          return (
            <div key={i} onClick={() => r && onPick(r.id)} className={`flex border-l-[3px] ${r ? `cursor-pointer ${on ? "border-mod bg-mod-soft" : "border-mod/40 bg-mod-soft/40"}` : "border-transparent"}`}>
              <span className="w-10 shrink-0 select-none pr-3 text-right text-muted-foreground/70">{n}</span>
              <span className="whitespace-pre pr-4">{highlight(ln) || " "}</span>
              {r && n === r.range[0] && <span className="ml-auto mr-2 select-none text-[10px] text-mod">#{r.id}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
