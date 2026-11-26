import { useEffect, useState } from "react";
import { Link, go } from "../lib";
import { analysisInfo, caseId, pair, pairs, reports, sub, submissions } from "../data/mock";
import { Bar, Button, ErrorBox, FilterBar, LangTag, Loading, MetricStrip, Modal, Notice, PageHeader, Panel, Select, Severity, StatusText, DataTable, useToast, type Col } from "../components/ui";
import { StyleTable } from "./investigate";

/* ================= authorship ================= */
export function Authorship() {
  const names = submissions.filter((s) => s.lang === "Python" && s.authorship !== "No history").map((s) => s.student);
  const [student, setStudent] = useState("Juan Dela Cruz");
  return (
    <>
      <PageHeader title="Authorship" meta="Compare a current submission with the student's earlier coding style." />
      <FilterBar><Select label="Student" value={student} onChange={setStudent} options={names} className="w-52" /></FilterBar>
      <StyleTable student={student} />
    </>
  );
}

/* ================= instructor review ================= */
const EVIDENCE = [["Code comparison", "code"], ["Structural evidence (AST / TED)", "ast"], ["Winnowing fingerprints", "winnowing"], ["Stylometry (supporting evidence)", "stylometry"], ["LLM interpretation (supporting evidence)", "llm"]] as const;
const DECISIONS = ["No further action: similarity is explained by the assignment context", "Further investigation needed: gather more context before deciding", "Inconclusive: the evidence does not support a decision, and the uncertainty is documented in my notes", "Refer through the academic integrity process, at the instructor's discretion"];
type Confirm = { title: string; body: string; label: string; danger?: boolean; ok: () => void } | null;

export function ReviewCase({ id }: { id: string }) {
  const p = pair(id);
  const A = sub(p.a), B = sub(p.b);
  const toast = useToast();
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState("");
  const [status, setStatus] = useState(p.status as string);
  const [seen, setSeen] = useState<boolean[]>(EVIDENCE.map(() => false));
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [dlg, setDlg] = useState(false);
  const [dec, setDec] = useState("");
  const [err, setErr] = useState<string[]>([]);
  const [decided, setDecided] = useState("");
  const [decidedAt, setDecidedAt] = useState("");
  const [leave, setLeave] = useState(false);
  const dirty = notes !== saved;
  const missing = EVIDENCE.filter((_, i) => !seen[i]).map((e) => e[0]);
  const needNotes = (what: string) => {
    if (notes.trim().length >= 10) return true;
    setErr([`Enter a short note explaining why before you ${what}. Your notes so far have been kept.`]);
    setConfirm(null); setDlg(false);
    setTimeout(() => document.getElementById("notes")?.focus(), 30);
    return false;
  };
  const ask = (c: Confirm) => { setErr([]); setConfirm(c); };
  const rows: [string, React.ReactNode][] = [
    ["Course", "CS Programming Laboratory"], ["Assignment", "Laboratory 4"], ["Students", `${A.student} and ${B.student}`], ["Language", <LangTag key="l" lang={A.lang} />],
    ["Overall similarity", <Severity key="o" value={p.overall} />], ["AST / TED", <span key="t" className="font-mono">{p.ast === null ? "Not available" : p.ast + "%"}</span>],
    ["Winnowing", <span key="w" className="font-mono">{p.fp === null ? "Not available" : p.fp + "%"}{p.id === "p1" ? " · 42 of 58 fingerprints" : ""}</span>], ["Stylometry", "Moderate · supporting evidence only"], ["LLM interpretation", p.id === "p1" ? "Available · AI-assisted, supporting evidence only" : "Not generated"],
  ];
  return (
    <>
      <div className="sticky top-11 z-20 -mx-4 mb-4 flex flex-wrap items-center gap-x-4 gap-y-0.5 border-b border-border bg-card/95 px-4 py-1.5 text-xs md:-mx-6 md:px-6" role="region" aria-label="Case context">
        <button onClick={() => (dirty ? setLeave(true) : go("/compare/" + p.id))} className="font-medium text-primary hover:underline">← Back to case evidence</button>
        <span className="text-muted-foreground">CS Programming Laboratory · Laboratory 4</span>
        <span className="font-mono">{caseId(p.id)}</span><span>{A.student} ↔ {B.student}</span><StatusText status={status} />
      </div>
      <PageHeader title="Instructor Review" meta={<>Case #{caseId(p.id)}</>} />
      {err.length > 0 && (
        <div role="alert" tabIndex={-1} className="mb-4 border-l-4 border-high bg-high-soft px-4 py-2">
          <h2 className="text-[13px] font-semibold text-high">There is a problem</h2>
          <ul className="mt-1">{err.map((e) => <li key={e}><a href="#notes" onClick={(ev) => { ev.preventDefault(); document.getElementById("notes")?.focus(); }} className="font-medium text-high underline">{e}</a></li>)}</ul>
        </div>
      )}
      {decided && <div role="status" className="mb-4 border-l-4 border-low bg-low-soft px-4 py-2"><b className="font-semibold text-low">Decision recorded on {decidedAt}.</b> {decided} <span className="text-muted-foreground">Evidence marked as reviewed: {seen.filter(Boolean).length} of {EVIDENCE.length}.</span></div>}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Panel flush title="Case summary">
            <dl className="divide-y divide-border">{rows.map(([k, v]) => <div key={k} className="grid grid-cols-[140px_1fr] gap-3 px-4 py-1.5"><dt className="text-muted-foreground">{k}</dt><dd>{v}</dd></div>)}</dl>
          </Panel>
          <Panel title="Evidence reviewed" note={`${seen.filter(Boolean).length} of ${EVIDENCE.length} marked`}>
            <ul className="space-y-1">
              {EVIDENCE.map(([l, slug], i) => (
                <li key={l} className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-[var(--primary)]" checked={seen[i]} onChange={() => setSeen(seen.map((x, j) => (j === i ? !x : x)))} />{l}</label>
                  <Link to={`/compare/${p.id}/${slug}`} className="text-xs font-medium text-primary hover:underline">Open evidence</Link>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">Tick what you have looked at. This is a reminder for you, not a requirement.</p>
          </Panel>
        </div>
        <div className="space-y-4">
          <Panel title="Instructor notes" note="Optional unless you dismiss or record a decision">
            <label htmlFor="notes" className="mb-1 block text-xs font-medium">Notes about this case</label>
            <p id="notes-hint" className="mb-1 text-xs text-muted-foreground">For example: shared starter code, group-work policy, a conversation with the student.</p>
            <textarea id="notes" rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} aria-describedby="notes-hint" aria-invalid={err.length > 0} className={`w-full resize-y rounded border bg-card p-2 text-[13px] ${err.length ? "border-high border-2" : "border-border"}`} />
            <div className="mt-2 flex items-center gap-3">
              <Button onClick={() => { setSaved(notes); setErr([]); toast("Notes saved. No decision has been recorded."); }} disabled={!dirty}>Save notes</Button>
              <span className="text-xs text-muted-foreground">{dirty ? "Unsaved changes" : saved ? "Notes saved" : "Nothing saved yet"}</span>
            </div>
          </Panel>
          <Panel title="Review actions" note="Each action asks you to confirm">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => ask({ title: "Mark case as reviewed?", body: "The case will be marked Reviewed. You can change this later.", label: "Mark as Reviewed", ok: () => { setStatus("Reviewed"); setConfirm(null); toast("Case marked as reviewed"); } })}>Mark as Reviewed</Button>
              <Button onClick={() => ask({ title: "Request further investigation?", body: "The case will move to Under investigation and stay in your review list.", label: "Request Further Investigation", ok: () => { setStatus("Needs Investigation"); setConfirm(null); toast("Further investigation requested"); } })}>Request Further Investigation</Button>
              <Button variant="danger" onClick={() => { if (needNotes("dismiss this case")) ask({ title: "Dismiss this case?", body: "The case is removed from your review list. Your note is kept with it.", label: "Dismiss Case", danger: true, ok: () => { setSaved(notes); setStatus("Low Concern"); setConfirm(null); toast("Case dismissed"); } }); }}>Dismiss Case</Button>
            </div>
            <div className="mt-3 border-t border-border pt-3">
              <Button variant="primary" onClick={() => { setErr([]); setDlg(true); }}>Record Academic Review Decision</Button>
              <p className="mt-1.5 text-xs text-muted-foreground">CodeGuard provides evidence only. The academic decision is yours, and recording it is separate from saving notes.</p>
            </div>
          </Panel>
        </div>
      </div>

      <Modal open={leave} onClose={() => setLeave(false)} title="Leave with unsaved notes?">
        <p>Your notes have not been saved and will be lost if you leave this page.</p>
        <div className="mt-4 flex justify-end gap-2"><Button onClick={() => setLeave(false)}>Stay and keep editing</Button><Button onClick={() => { setSaved(notes); toast("Notes saved"); go("/compare/" + p.id); }}>Save notes and leave</Button><Button variant="danger" onClick={() => go("/compare/" + p.id)}>Leave without saving</Button></div>
      </Modal>
      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={confirm?.title ?? ""}>
        <p>{confirm?.body}</p>
        {missing.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Not yet marked as reviewed: {missing.join(", ")}.</p>}
        <div className="mt-4 flex justify-end gap-2"><Button onClick={() => setConfirm(null)}>Cancel</Button><Button variant={confirm?.danger ? "danger" : "primary"} onClick={() => confirm?.ok()}>{confirm?.label}</Button></div>
      </Modal>
      <Modal open={dlg} onClose={() => setDlg(false)} title="Record Academic Review Decision">
        <p className="text-xs text-muted-foreground">This is your decision, recorded with your notes and a snapshot of the evidence. Nothing is recorded until you confirm.</p>
        <fieldset className="mt-3 space-y-2">
          <legend className="mb-1 text-xs font-medium">Select one decision</legend>
          {DECISIONS.map((d) => <label key={d} className="flex cursor-pointer items-start gap-2 rounded border border-border p-2 hover:bg-muted"><input type="radio" name="d" className="mt-1" checked={dec === d} onChange={() => setDec(d)} />{d}</label>)}
        </fieldset>
        <div className="mt-3 rounded bg-muted p-2 text-xs"><div className="font-medium">Your notes ({notes.trim().length} characters)</div><div className="mt-0.5 text-muted-foreground">{notes.trim() || "No notes entered yet. A note is required."}</div></div>
        {missing.length > 0 && <p className="mt-2 text-xs text-mod">Evidence not yet marked as reviewed: {missing.join(", ")}.</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={() => setDlg(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => {
            if (!dec) { setErr(["Select a decision before recording."]); setDlg(false); return; }
            if (!needNotes("record a decision")) return;
            setSaved(notes); setStatus("Reviewed"); setDecided(dec); setDecidedAt(new Date().toLocaleDateString(undefined, { dateStyle: "long" })); setDlg(false); toast("Academic review decision recorded");
          }}>Record decision</Button>
        </div>
      </Modal>
    </>
  );
}

/* ================= reports ================= */
export function Reports() {
  const toast = useToast();
  const init = { asg: "All assignments", lang: "All languages", range: "This term", thr: 40 };
  const [f, setF] = useState(init);
  const labs = [["Lab 1", 24], ["Lab 2", 27], ["Lab 3", 29], ["Lab 4", 31]] as const;
  const dist = [["0–20", 61], ["20–40", 52], ["40–60", 38], ["60–80", 22], ["80–100", 11]] as const;
  const max = 61;
  const cols: Col<(typeof reports)[number]>[] = [
    { key: "t", header: "Report", render: (r) => <div><div className="font-medium">{r.title}</div><div className="text-xs text-muted-foreground">{r.type}</div></div> },
    { key: "d", header: "Date", render: (r) => r.date },
    { key: "c", header: "Course", render: (r) => r.course },
    { key: "s", header: "Submissions", render: (r) => <span className="font-mono">{r.subs}</span> },
    { key: "k", header: "Cases", render: (r) => <span className="font-mono">{r.cases}</span> },
    { key: "p", header: "Processing", render: (r) => <span className="font-mono">{r.time}</span> },
    { key: "x", header: "Actions", render: (r) => (
      <div className="flex gap-3 text-xs font-medium text-primary">
        <button className="hover:underline" onClick={() => go(r.id === "r3" ? "/review/p1" : "/analysis")}>View</button>
        <button className="hover:underline" onClick={() => toast("Exporting PDF…")}>PDF</button>
        <button className="hover:underline" onClick={() => toast("Exporting CSV…")}>CSV</button>
      </div>) },
  ];
  return (
    <>
      <PageHeader title="Reports" meta="Summaries for the selected assignment and period." />
      <FilterBar onClear={() => setF(init)}>
        <Select label="Assignment" value={f.asg} onChange={(v) => setF({ ...f, asg: v })} options={["All assignments", "Laboratory 4", "Laboratory 3"]} />
        <Select label="Date range" value={f.range} onChange={(v) => setF({ ...f, range: v })} options={["This term", "Last 30 days", "Last 7 days"]} />
        <Select label="Language" value={f.lang} onChange={(v) => setF({ ...f, lang: v })} options={["All languages", "Python", "Java"]} />
        <label className="flex flex-col gap-0.5 text-xs text-muted-foreground">Similarity threshold: <span className="font-medium text-foreground">{f.thr}%</span>
          <input type="range" min={10} max={90} step={5} value={f.thr} onChange={(e) => setF({ ...f, thr: +e.target.value })} className="h-8 w-36 accent-[var(--primary)]" /></label>
      </FilterBar>
      <div className="grid grid-cols-2 divide-border rounded-md border border-border bg-card md:grid-cols-5 md:divide-x">
        {[["Total submissions", "521"], ["Cases reviewed", "14"], ["Requiring investigation", "9"], ["Average similarity", "29%"], ["Processing time", "36.9 s"]].map(([k, v]) => <div key={k} className="px-4 py-2.5"><div className="text-xs text-muted-foreground">{k}</div><div className="text-lg font-semibold tabular-nums">{v}</div></div>)}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Panel title="Average similarity by laboratory">
          <div role="img" aria-label="Average similarity: Lab 1 24%, Lab 2 27%, Lab 3 29%, Lab 4 31%" className="flex h-32 items-end gap-6 border-b border-border">
            {labs.map(([l, v]) => <div key={l} className="flex flex-1 flex-col items-center gap-1"><span className="font-mono text-[11px]">{v}%</span><div className="w-full max-w-14 bg-primary" style={{ height: v * 2.6 }} /></div>)}
          </div>
          <div className="mt-1 flex gap-6">{labs.map(([l]) => <span key={l} className="flex-1 text-center text-xs text-muted-foreground">{l}</span>)}</div>
        </Panel>
        <Panel title="Pairs by similarity band">
          <div role="img" aria-label="Pairs by similarity band" className="flex h-32 items-end gap-4 border-b border-border">
            {dist.map(([l, v], i) => <div key={l} className="flex flex-1 flex-col items-center gap-1"><span className="font-mono text-[11px]">{v}</span><div className={`w-full max-w-14 ${i >= 3 ? "bg-high" : i === 2 ? "bg-mod" : "bg-border"}`} style={{ height: (v / max) * 100 }} /></div>)}
          </div>
          <div className="mt-1 flex gap-4">{dist.map(([l]) => <span key={l} className="flex-1 text-center text-xs text-muted-foreground">{l}%</span>)}</div>
        </Panel>
      </div>
      <div className="mt-4"><Panel flush title="Generated reports"><DataTable caption="Generated reports" cols={cols} rows={reports} rowKey={(r) => r.id} /></Panel></div>
    </>
  );
}

/* ================= google classroom import ================= */
const STEPS = ["Select course", "Select assignment", "Retrieve submissions", "Detect language", "Review errors", "Start analysis"];

export function ClassroomImport() {
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState(false);
  const [tries, setTries] = useState(0);
  const [course, setCourse] = useState("CS Programming Laboratory");
  const [asg, setAsg] = useState("Laboratory 4");
  useEffect(() => {
    if (step === 3) { const t = setTimeout(() => setStep(4), 1000); return () => clearTimeout(t); }
  }, [step]);
  const retrieve = () => { setBusy(true); setFail(false); const n = tries + 1; setTries(n); setTimeout(() => { setBusy(false); if (n === 1) { setFail(true); return; } setStep(3); }, 1400); };
  return (
    <>
      <PageHeader title="Import from Google Classroom" meta="Submission files are read only and are never changed." />
      <ol aria-label="Import progress" className="mb-4 flex overflow-x-auto rounded-md border border-border bg-card">
        {STEPS.map((s, i) => (
          <li key={s} aria-current={i === step ? "step" : undefined} className={`flex-1 border-r border-border last:border-r-0 ${i === step ? "bg-primary-soft font-medium text-primary" : i < step ? "" : "text-muted-foreground"}`}>
            <button disabled={!(i < step && !busy && step !== 3)} onClick={() => { setStep(i); setFail(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-left enabled:hover:bg-muted disabled:cursor-default">
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${i < step ? "border-primary bg-primary text-primary-foreground" : i === step ? "border-primary" : "border-border"}`}>{i < step ? "✓" : i + 1}</span>
              <span className="whitespace-nowrap">{s}<span className="sr-only">{i < step ? " (completed)" : i === step ? " (current step)" : " (not started)"}</span></span>
            </button>
          </li>
        ))}
      </ol>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Connection" actions={<span className="flex items-center gap-1.5 text-xs text-low"><span className="h-2 w-2 rounded-full bg-low" aria-hidden />Connected as e.castillo@university.edu</span>}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select label="Course" value={course} onChange={setCourse} options={["CS Programming Laboratory", "CS201 Data Structures"]} />
            <Select label="Assignment" value={asg} onChange={setAsg} options={["Laboratory 4", "Laboratory 3", "Laboratory 2"]} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Laboratory 4 has 184 submissions in Google Classroom.</p>
          <div className="mt-4 space-y-2">
            {fail && <ErrorBox title="Could not reach Google Classroom" text="The connection timed out. Your course and assignment choices have been kept. Nothing was imported." onRetry={retrieve} />}
            {busy ? <Loading text="Retrieving 184 submissions…" /> : step < 2 ? <Button variant="primary" onClick={() => setStep(step + 1)}>{step === 0 ? "Continue to assignment" : "Continue to retrieval"}</Button> : step === 2 ? <Button variant="primary" onClick={retrieve}>Retrieve submissions</Button> : step === 3 ? <Loading text="Detecting languages…" /> : step === 4 ? <Button variant="primary" onClick={() => setStep(5)}>Continue to start analysis</Button> : <Button variant="primary" onClick={() => { toast("Analysis started for 182 submissions"); go("/analysis"); }}>Start analysis</Button>}
            {step === 5 && <p className="text-xs text-muted-foreground">2 files with errors will be left out of comparison. You can go back to review them.</p>}
          </div>
        </Panel>
        <Panel title="Language detection">
          {step >= 4 ? (
            <ul className="space-y-3">{[["Python", 112, 61], ["Java", 72, 39]].map(([l, n, pc]) => <li key={l as string}><div className="mb-1 flex justify-between"><LangTag lang={l as "Python"} /><span className="font-mono text-xs">{n} files · {pc}%</span></div><Bar value={pc as number} label={l + " share"} /></li>)}</ul>
          ) : <p className="text-muted-foreground">Languages are detected from file extensions and syntax after submissions are retrieved.</p>}
          {step >= 4 && (
            <div className="mt-4">
              <h3 className="mb-1 text-[13px] font-semibold">Files with errors</h3>
              <ul className="divide-y divide-border rounded-md border border-border">
                {analysisInfo.issues.filter((i) => i.kind !== "Analysis").map((i) => (
                  <li key={i.file} className="px-3 py-2"><div className="flex justify-between gap-2"><span className="font-medium">{i.who} · <span className="font-mono text-xs">{i.file}</span></span><span className="text-xs text-high">{i.kind} error</span></div><p className="text-xs text-muted-foreground">{i.text}</p></li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-4"><Notice>Unrecognized or empty files are listed here and excluded from comparison. Original files are never changed.</Notice></div>
        </Panel>
      </div>
    </>
  );
}

/* ================= settings ================= */
export function Settings() {
  const toast = useToast();
  const [density, setDensity] = useState(localStorage.getItem("cg-density") ?? "Standard");
  return (
    <>
      <PageHeader title="Settings" meta="Analysis thresholds and display preferences for this course." />
      <div className="space-y-4">
        <Panel flush title="Review thresholds" note="Read only. Thresholds are set when an analysis is run.">
          <dl className="divide-y divide-border">
            {[["High similarity", "70% and above"], ["Moderate similarity", "40% to 69%"], ["Winnowing k-gram / window", "5 / 4"], ["Minimum prior submissions for stylometry", "3"]].map(([k, v]) => <div key={k} className="flex justify-between px-4 py-2"><dt className="text-muted-foreground">{k}</dt><dd className="font-mono text-xs">{v}</dd></div>)}
          </dl>
        </Panel>
        <Panel title="Display preferences" note="These change how tables look. They never change analysis results.">
          <Select label="Table row density" value={density} onChange={(v) => { setDensity(v); localStorage.setItem("cg-density", v); toast("Row density set to " + v.toLowerCase()); }} options={["Compact", "Standard", "Comfortable"]} className="w-48" />
        </Panel>
      </div>
    </>
  );
}

export { pairs };
