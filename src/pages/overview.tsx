import { useEffect, useState } from "react";
import { Link, go } from "../lib";
import { CLUSTER_MIN, REPORT_FLOOR, analysisInfo, caseId, clusterMap, pairs, sub, submissions, type Pair, type Submission } from "../data/mock";
import { Bar, Button, DataTable, FilterBar, LangTag, Loading, MetricStrip, Notice, PageHeader, Panel, Search, Select, Severity, StatusText, reviewLabel, useToast, type Col } from "../components/ui";

export const NA = ({ v }: { v: number | null }) => (v === null ? <span className="text-xs italic text-muted-foreground">Not available</span> : <span className="font-mono tabular-nums">{v}%</span>);
const pairOf = (s: Submission) => pairs.find((p) => p.a === s.id || p.b === s.id);

export const pairCols: Col<Pair>[] = [
  { key: "c", header: "Case", sort: (p) => caseId(p.id), render: (p) => <span className="font-mono text-xs">{caseId(p.id)}</span> },
  { key: "a", header: "Student A", sort: (p) => sub(p.a).student, render: (p) => sub(p.a).student },
  { key: "b", header: "Student B", sort: (p) => sub(p.b).student, render: (p) => sub(p.b).student },
  { key: "l", header: "Language", render: (p) => <LangTag lang={sub(p.a).lang} /> },
  { key: "o", header: "Similarity", sort: (p) => p.overall, render: (p) => <Severity value={p.overall} /> },
  { key: "t", header: "AST/TED", sort: (p) => p.ast ?? -1, render: (p) => <NA v={p.ast} /> },
  { key: "w", header: "Winnowing", sort: (p) => p.fp ?? -1, render: (p) => <NA v={p.fp} /> },
  { key: "s", header: "Status", render: (p) => <StatusText status={p.status} /> },
  { key: "x", header: "Action", render: (p) => <Link to={"/compare/" + p.id} className="font-medium text-primary hover:underline">{p.status === "Reviewed" ? "Open reviewed case" : "Review comparison"}</Link> },
];

export function Dashboard() {
  const attention = submissions.filter((s) => s.analysis !== "Completed");
  const cols: Col<Submission>[] = [
    { key: "s", header: "Student", render: (s) => <span className="font-medium">{s.student}</span> },
    { key: "l", header: "Language", render: (s) => <LangTag lang={s.lang} /> },
    { key: "d", header: "Submitted", render: (s) => <span className="whitespace-nowrap text-muted-foreground">{s.submitted}</span> },
    { key: "p", header: "Processing status", render: (s) => <StatusText status={s.analysis} /> },
    { key: "x", header: "Action", render: (s) => <Link to={"/submissions/" + s.id} className="font-medium text-primary hover:underline">Open submission</Link> },
  ];
  const toReview = pairs.filter((p) => p.status !== "Low Concern");
  return (
    <>
      <PageHeader title="Dashboard" meta={<>CS Programming Laboratory &nbsp;·&nbsp; Laboratory 4</>} actions={<Button variant="primary" icon="import" onClick={() => go("/import")}>Import submissions</Button>} />
      <p className="mb-3 flex flex-wrap gap-x-5 gap-y-0.5 text-[13px]">
        <span><b className="font-semibold tabular-nums">{analysisInfo.total}</b> submissions</span>
        <span><b className="font-semibold tabular-nums">12</b> pending processing</span>
        <span><b className="font-semibold tabular-nums">{toReview.length}</b> cases requiring review</span>
      </p>
      <div className="space-y-4">
        <Panel flush title="Cases requiring review" note="Sorted by similarity. High similarity is a reason to look, not a finding." actions={<Link to="/analysis" className="text-xs font-medium text-primary hover:underline">All comparisons</Link>}>
          <DataTable caption="Cases requiring review" cols={pairCols} rows={toReview} rowKey={(p) => p.id} onRow={(p) => go("/compare/" + p.id)} pageSize={8} />
        </Panel>
        <Panel title="Import and analysis" note="Updated 10:41 AM" actions={<Link to="/import" className="text-xs font-medium text-primary hover:underline">Open import</Link>}>
          <div className="mb-1 flex justify-between"><span className="font-medium">Laboratory 4 from Google Classroom</span><span className="font-mono text-xs">93% analyzed</span></div>
          <Bar value={93} label="Analysis progress" />
          <p className="mt-1 text-xs text-muted-foreground">No files failed to import. Stylometry is still running; results appear as they finish.</p>
        </Panel>
        {attention.length > 0 && (
          <Panel flush title="Submissions needing attention" note="Not yet processed">
            <DataTable caption="Submissions needing attention" cols={cols} rows={attention} rowKey={(s) => s.id} onRow={(s) => go("/submissions/" + s.id)} />
          </Panel>
        )}
        <details className="rounded-md border border-border bg-card">
          <summary className="cursor-pointer px-4 py-2 text-[13px] font-semibold">Recent activity</summary>
          <ul className="divide-y divide-border border-t border-border px-4 text-[13px]">
            {[["10:41 AM", "Stylometry completed for 2 submissions"], ["10:33 AM", "4 high-similarity cases detected in Lab 4"], ["10:32 AM", "Python Lab 4 analysis completed (12.4 s)"], ["10:12 AM", "24 submissions imported from Google Classroom"]].map(([t, m]) => (
              <li key={t} className="flex gap-4 py-1.5"><span className="w-20 shrink-0 font-mono text-xs text-muted-foreground">{t}</span>{m}</li>
            ))}
          </ul>
        </details>
      </div>
    </>
  );
}

export function AnalysisViews({ current }: { current: "ranked" | "clusters" }) {
  return (
    <nav aria-label="Similarity Analysis views" className="mb-3 inline-flex overflow-hidden rounded border border-border">
      {([["ranked", "Ranked comparisons", "/analysis"], ["clusters", "Clusters", "/clusters"]] as const).map(([k, l, to]) => (
        <Link key={k} to={to} aria-current={current === k ? "page" : undefined} className={`px-3 py-1 text-[13px] font-medium ${current === k ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}>{l}</Link>
      ))}
    </nav>
  );
}

export function Submissions() {
  const init = { q: "", course: "All courses", asg: "All assignments", lang: "All languages", st: "All statuses", date: "Last 7 days" };
  const [f, setF] = useState(init);
  const set = (k: keyof typeof init) => (v: string) => setF({ ...f, [k]: v });
  const rows = submissions.filter((s) => (f.lang === "All languages" || s.lang === f.lang) && (f.st === "All statuses" || reviewLabel(s.status) === f.st) && (s.student + s.file).toLowerCase().includes(f.q.toLowerCase()));
  const cols: Col<Submission>[] = [
    { key: "s", header: "Student", sort: (s) => s.student, render: (s) => <span className="font-medium">{s.student}</span> },
    { key: "a", header: "Assignment", render: () => "Lab 4" },
    { key: "l", header: "Language", sort: (s) => s.lang, render: (s) => <LangTag lang={s.lang} /> },
    { key: "d", header: "Submission date", render: (s) => <span className="whitespace-nowrap text-muted-foreground">{s.submitted}</span> },
    { key: "p", header: "Processing status", render: (s) => <StatusText status={s.analysis} /> },
    { key: "m", header: "Similarity", sort: (s) => s.sim, render: (s) => (s.analysis === "Completed" ? <Severity value={s.sim} /> : <span className="text-muted-foreground">Pending</span>) },
    { key: "r", header: "Review status", render: (s) => reviewLabel(s.status) },
    { key: "x", header: "Action", render: (s) => <Link to={"/submissions/" + s.id} className="font-medium text-primary hover:underline">Open submission</Link> },
  ];
  return (
    <>
      <PageHeader title="Submissions" meta="CS Programming Laboratory · Laboratory 4" />
      <FilterBar onClear={() => setF(init)}>
        <Search className="w-56" value={f.q} onChange={set("q")} placeholder="Search submissions" />
        <Select label="Course" value={f.course} onChange={set("course")} options={["All courses", "CS101", "CS201"]} />
        <Select label="Assignment" value={f.asg} onChange={set("asg")} options={["All assignments", "Laboratory 4", "Laboratory 3"]} />
        <Select label="Language" value={f.lang} onChange={set("lang")} options={["All languages", "Python", "Java"]} />
        <Select label="Status" value={f.st} onChange={set("st")} options={["All statuses", "Pending review", "Under investigation", "Reviewed", "No concern"]} />
        <Select label="Date range" value={f.date} onChange={set("date")} options={["Last 7 days", "Last 30 days", "This term"]} />
      </FilterBar>
      <p className="mb-2 text-xs text-muted-foreground" role="status" aria-live="polite">Showing {rows.length} of {submissions.length} submissions{Object.entries(f).some(([k, v]) => k !== "q" && k !== "date" && !String(v).startsWith("All")) || f.q ? " (filters applied)" : ""}.</p>
      <Panel flush>
        <DataTable caption="Submissions" cols={cols} rows={rows} rowKey={(s) => s.id} onRow={(s) => go("/submissions/" + s.id)} pageSize={8} />
      </Panel>
    </>
  );
}

export function SubmissionDetail({ id }: { id: string }) {
  const s = sub(id);
  const related = pairs.filter((p) => p.a === s.id || p.b === s.id);
  return (
    <>
      <PageHeader title={s.student} meta={<span className="font-mono">{s.file}</span>} actions={<StatusText status={s.status} />} />
      <MetricStrip items={[{ label: "Highest similarity", value: s.sim + "%" }, { label: "AST/TED", value: s.ast + "%" }, { label: "Winnowing", value: s.fp + "%" }, { label: "Submitted", value: s.submitted }]} />
      <div className="mt-4">
        <Panel flush title="Comparisons involving this submission">
          <DataTable caption="Related comparisons" cols={pairCols} rows={related} rowKey={(p) => p.id} onRow={(p) => go("/compare/" + p.id)} empty="No comparison exceeded the review threshold." />
        </Panel>
      </div>
    </>
  );
}

type Metric = "Overall similarity" | "AST / TED" | "Winnowing";
const METRICS: Metric[] = ["Overall similarity", "AST / TED", "Winnowing"];
const METRIC_HELP: Record<Metric, string> = {
  "Overall similarity": "The combined result of AST/TED and Winnowing for each pair.",
  "AST / TED": "How alike the program structure is (functions, loops, conditions), ignoring variable names.",
  Winnowing: "How much of the code, as sampled fingerprints, appears in both files.",
};
const metricOf = (p: Pair, m: Metric) => (m === "Overall similarity" ? p.overall : m === "AST / TED" ? p.ast : p.fp);
const quantile = (v: number[], q: number) => { const i = (v.length - 1) * q, lo = Math.floor(i); return v[lo] + (v[Math.min(lo + 1, v.length - 1)] - v[lo]) * (i - lo); };
const BIN_COLS = Array.from({ length: 10 }, (_, i) => i);

function Distribution({ vals, missing, metric, scale, lo, hi, onBin }: { vals: number[]; missing: number; metric: Metric; scale: string; lo: number; hi: number; onBin: (i: number) => void }) {
  const counts = BIN_COLS.map((i) => vals.filter((v) => v >= i * 10 && v <= (i === 9 ? 100 : i * 10 + 9)).length);
  const max = Math.max(1, ...counts);
  const h = (n: number) => (n === 0 ? 0 : scale === "Logarithmic" ? (Math.log10(n + 1) / Math.log10(max + 1)) * 100 : (n / max) * 100);
  const sorted = [...vals].sort((a, b) => a - b);
  const stats = sorted.length ? { min: sorted[0], q1: quantile(sorted, 0.25), med: quantile(sorted, 0.5), q3: quantile(sorted, 0.75), max: sorted[sorted.length - 1] } : null;
  return (
    <div>
      <div className="flex gap-2">
        <div className="flex h-28 w-8 shrink-0 flex-col justify-between text-right font-mono text-[10px] text-muted-foreground" aria-hidden><span>{max}</span><span>{scale === "Logarithmic" ? "log" : "0"}</span></div>
        <div className="relative min-w-0 flex-1">
          <div className="grid h-28 grid-cols-10 gap-1 border-b border-border">
            {BIN_COLS.map((i) => {
              const on = i * 10 >= lo && (i === 9 ? 100 : i * 10 + 9) <= hi;
              return (
                <button key={i} aria-pressed={on} aria-label={`${i * 10} to ${i === 9 ? 100 : i * 10 + 9} percent: ${counts[i]} pairs. Select this range.`} onClick={() => onBin(i)} className="flex h-full flex-col justify-end hover:bg-muted">
                  <span className="text-center font-mono text-[10px] text-muted-foreground">{counts[i] || ""}</span>
                  <span style={{ height: `${h(counts[i]) * 0.78}%` }} className={`block w-full ${on ? "bg-primary" : "border border-primary/50 bg-primary-soft"} ${counts[i] ? "min-h-[2px]" : ""}`} />
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-10 gap-1 pt-0.5 font-mono text-[10px] text-muted-foreground">{BIN_COLS.map((i) => <span key={i}>{i * 10}%</span>)}</div>
          <div className="relative mt-1 h-3 text-[10px] text-muted-foreground" aria-hidden>
            <span className="absolute left-0">Low</span><span className="absolute left-[40%] border-l border-dashed border-muted-foreground pl-1">Moderate</span><span className="absolute left-[70%] border-l border-dashed border-muted-foreground pl-1">High</span>
          </div>
          <div className="relative mt-2 h-5" role="img" aria-label={stats ? `Boxplot of ${metric}: minimum ${stats.min}, median ${stats.med}, maximum ${stats.max}` : "No data for boxplot"}>
            {stats && (
              <>
                <div className="absolute top-2 h-px bg-foreground" style={{ left: `${stats.min}%`, width: `${stats.max - stats.min}%` }} />
                <div className="absolute top-0.5 h-3.5 border border-foreground bg-card" style={{ left: `${stats.q1}%`, width: `${Math.max(stats.q3 - stats.q1, 0.5)}%` }} />
                <div className="absolute top-0.5 h-3.5 w-0.5 bg-foreground" style={{ left: `${stats.med}%` }} />
              </>
            )}
          </div>
        </div>
      </div>
      <p className="mt-1 pl-10 font-mono text-[11px] text-muted-foreground">{stats ? `Boxplot · min ${stats.min} · Q1 ${stats.q1.toFixed(0)} · median ${stats.med.toFixed(0)} · Q3 ${stats.q3.toFixed(0)} · max ${stats.max}` : "No scores to summarise."}</p>
      {missing > 0 && <p className="mt-1 pl-10 text-xs text-muted-foreground">{missing} pair{missing > 1 ? "s have" : " has"} no {metric} score (not available) and {missing > 1 ? "are" : "is"} left out of the chart. This is not the same as 0%.</p>}
    </div>
  );
}

export function Analysis() {
  const init = { asg: "Laboratory 4", lang: "All languages", st: "All statuses", q: "", cl: "Any cluster" };
  const [f, setF] = useState(init);
  const [metric, setMetric] = useState<Metric>("Overall similarity");
  const [scale, setScale] = useState("Linear");
  const [lo, setLo] = useState(0);
  const [hi, setHi] = useState(100);
  const [info, setInfo] = useState(false);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  useEffect(() => { setLoading(true); const t = setTimeout(() => setLoading(false), 450); return () => clearTimeout(t); }, [f.asg]);
  const cm = clusterMap();
  const clusterNames = [...new Set(Object.values(cm).map((c) => c.label))].sort();
  const base = f.asg !== "Laboratory 4" ? [] : pairs.filter((p) => (f.lang === "All languages" || sub(p.a).lang === f.lang) && (f.st === "All statuses" || reviewLabel(p.status) === f.st) && (f.cl === "Any cluster" || cm[p.a]?.label === f.cl) && [sub(p.a).student, sub(p.b).student, sub(p.a).file, sub(p.b).file, caseId(p.id)].join(" ").toLowerCase().includes(f.q.toLowerCase()));
  const scored = base.filter((p) => metricOf(p, metric) !== null);
  const missing = base.length - scored.length;
  const full = lo === 0 && hi === 100;
  const rows = base.filter((p) => { const v = metricOf(p, metric); return v === null ? full : v >= lo && v <= hi; }).sort((a, b) => (metricOf(b, metric) ?? -1) - (metricOf(a, metric) ?? -1));
  const cols: Col<Pair>[] = [
    { key: "c", header: "Case", render: (p) => <span className="font-mono text-xs">{caseId(p.id)}</span> },
    { key: "a", header: "Submission A", sort: (p) => sub(p.a).student, render: (p) => <div><div className="font-medium">{sub(p.a).student}</div><div className="font-mono text-[11px] text-muted-foreground">{sub(p.a).file}</div></div> },
    { key: "b", header: "Submission B", sort: (p) => sub(p.b).student, render: (p) => <div><div className="font-medium">{sub(p.b).student}</div><div className="font-mono text-[11px] text-muted-foreground">{sub(p.b).file}</div></div> },
    { key: "o", header: "Overall similarity", sort: (p) => p.overall, render: (p) => <Severity value={p.overall} /> },
    { key: "t", header: "AST / TED", sort: (p) => p.ast ?? -1, render: (p) => <NA v={p.ast} /> },
    { key: "w", header: "Winnowing", sort: (p) => p.fp ?? -1, render: (p) => <NA v={p.fp} /> },
    { key: "k", header: "Cluster", sort: (p) => cm[p.a]?.size ?? 0, render: (p) => (cm[p.a] && cm[p.a] === cm[p.b] ? <span>{cm[p.a].label} <span className="text-xs text-muted-foreground">· {cm[p.a].size} submissions</span></span> : <span className="text-muted-foreground">None</span>) },
    { key: "r", header: "Review status", render: (p) => <StatusText status={p.status} /> },
    { key: "x", header: "Action", render: (p) => <Link to={"/compare/" + p.id} className="font-medium text-primary hover:underline">{p.status === "Reviewed" ? "Open reviewed case" : "Review comparison"}</Link> },
  ];
  const filtered = !full || f.q || f.lang !== init.lang || f.st !== init.st || f.cl !== init.cl;
  const reset = () => { setF(init); setLo(0); setHi(100); };
  const A = analysisInfo;
  return (
    <>
      <AnalysisViews current="ranked" />
      <PageHeader title="Similarity Analysis" meta={`${f.asg} · analyzed ${A.when} · ${pairs.length} comparisons at or above the ${REPORT_FLOOR}% reporting floor`} actions={<Button icon="download" onClick={() => toast("CSV export of " + rows.length + " comparisons prepared")}>Export CSV</Button>} />
      <div className="mb-3"><Notice tone="warn"><b className="font-semibold">{A.issues.length} submissions need attention.</b> {A.failed} failed (language detection or parsing) and {A.issues.length - A.failed} are not finished. Their comparisons are missing, not zero. <button onClick={() => setInfo(true)} className="font-medium text-primary underline">See analysis information</button></Notice></div>

      <Panel title="Score distribution" note={`${scored.length} scored pairs`} actions={<span className="text-xs text-muted-foreground">Select a bar to filter the table</span>}>
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <Select label="Metric" value={metric} onChange={(v) => setMetric(v as Metric)} options={METRICS} className="w-44" />
          <Select label="Scale" value={scale} onChange={setScale} options={["Linear", "Logarithmic"]} className="w-32" />
          <label className="flex flex-col gap-0.5 text-xs text-muted-foreground">Range from (%)<input type="number" min={0} max={100} value={lo} onChange={(e) => setLo(Math.min(Math.max(0, +e.target.value || 0), hi))} className="h-8 w-20 rounded border border-border bg-card px-2 font-mono text-[13px] text-foreground" /></label>
          <label className="flex flex-col gap-0.5 text-xs text-muted-foreground">to (%)<input type="number" min={0} max={100} value={hi} onChange={(e) => setHi(Math.max(Math.min(100, +e.target.value || 0), lo))} className="h-8 w-20 rounded border border-border bg-card px-2 font-mono text-[13px] text-foreground" /></label>
          <button onClick={() => { setLo(0); setHi(100); }} disabled={full} className="h-8 px-1 text-[13px] font-medium text-primary hover:underline disabled:text-muted-foreground disabled:no-underline">Reset range</button>
        </div>
        <p className="mb-2 text-xs text-muted-foreground">{METRIC_HELP[metric]} {scale === "Logarithmic" ? "Bar height is on a log scale, so small counts stay visible." : ""}</p>
        {loading ? <Loading text="Loading score distribution…" /> : f.asg !== "Laboratory 4" ? <p className="py-6 text-center text-muted-foreground">No analysis has been run for {f.asg}.</p> : <Distribution vals={scored.map((p) => metricOf(p, metric) as number)} missing={missing} metric={metric} scale={scale} lo={lo} hi={hi} onBin={(i) => { setLo(i * 10); setHi(i === 9 ? 100 : i * 10 + 9); }} />}
      </Panel>

      <div className="mt-4" />
      <FilterBar onClear={reset}>
        <Search className="w-56" value={f.q} onChange={(v) => setF({ ...f, q: v })} placeholder="Student, file or case ID" />
        <Select label="Assignment" value={f.asg} onChange={(v) => setF({ ...f, asg: v })} options={["Laboratory 4", "Laboratory 3"]} />
        <Select label="Language" value={f.lang} onChange={(v) => setF({ ...f, lang: v })} options={["All languages", "Python", "Java"]} />
        <Select label="Review status" value={f.st} onChange={(v) => setF({ ...f, st: v })} options={["All statuses", "Pending review", "Under investigation", "Reviewed", "No concern"]} />
        <Select label="Cluster" value={f.cl} onChange={(v) => setF({ ...f, cl: v })} options={["Any cluster", ...clusterNames]} />
      </FilterBar>
      <p className="sr-only" role="status" aria-live="polite">{rows.length} of {base.length} comparisons shown</p>
      <Panel flush title="Ranked comparisons" note={`${rows.length} of ${base.length} shown · ${metric} ${full ? "any" : lo + "–" + hi + "%"}${filtered ? " · filters applied" : ""}`}>
        {loading ? <div className="p-4"><Loading text="Loading comparisons…" /></div> : <DataTable caption="Ranked pair comparisons. Select a row to open the pair comparison." cols={cols} rows={rows} rowKey={(p) => p.id} onRow={(p) => go("/compare/" + p.id)} pageSize={10} minW={900} empty={f.asg !== "Laboratory 4" ? "No analysis has been run for this assignment." : "No comparisons match these filters. Clear a filter or widen the range."} />}
      </Panel>
      <p className="mt-2 text-xs text-muted-foreground">Bands: High 70%+, Moderate 40–69%, Low below 40%, each shown with a marker and label. Cluster = group linked at {CLUSTER_MIN}% or higher.</p>

      <div className="mt-4">
        <Panel title="Analysis information" actions={<button aria-expanded={info} onClick={() => setInfo(!info)} className="text-xs font-medium text-primary hover:underline">{info ? "Hide details" : "Show details"}</button>}>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-5">
            {[["Analysis run", A.when], ["Processed", `${A.processed} of ${A.total}`], ["Failed", String(A.failed)], ["Duration", A.duration], ["Comparisons evaluated", A.comparisons.toLocaleString()]].map(([k, v]) => <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-mono">{v}</dd></div>)}
          </dl>
          {info && (
            <div className="mt-4 grid gap-6 border-t border-border pt-4 lg:grid-cols-2">
              <div>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Configuration</h3>
                <dl className="divide-y divide-border">{A.config.map(([k, v]) => <div key={k} className="grid grid-cols-[150px_1fr] gap-3 py-1"><dt className="text-muted-foreground">{k}</dt><dd>{v}</dd></div>)}</dl>
                <p className="mt-2 text-xs text-muted-foreground">Similarity comes only from CodeGuard's AST/TED and Winnowing analysis. Stylometry and LLM-assisted interpretation are supporting evidence and do not change these scores.</p>
              </div>
              <div>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Warnings ({A.issues.length})</h3>
                <ul className="space-y-2">{A.issues.map((i) => <li key={i.file + i.who} className="border-l-2 border-mod pl-3"><div><b className="font-medium">{i.kind}</b> · {i.who} · <span className="font-mono text-xs">{i.file}</span></div><div className="text-xs text-muted-foreground">{i.text}</div></li>)}</ul>
                <div className="mt-3"><Notice><b className="font-semibold">Not available is not 0%.</b> A score of 0% was measured. Not available means no score exists, so the pair cannot be judged on that metric.</Notice></div>
              </div>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
