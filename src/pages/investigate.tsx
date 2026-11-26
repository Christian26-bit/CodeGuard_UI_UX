import { useRef, useState } from "react";
import { Link, go } from "../lib";
import { AnalysisViews, NA } from "./overview";
import { caseId, clusterMap, edges, matches, nodes, pair, pairs, pct, pyA, pyB, sub, type Match, type Pair } from "../data/mock";
import { Bar, Button, CodePanel, DataTable, FilterBar, LINE_H, Notice, PageHeader, Panel, Select, Severity, Stat, StatusText, Tabs, type Col } from "../components/ui";

const testA = `import unittest
from grades import compute_average

class TestAverage(unittest.TestCase):
    def test_simple(self):
        self.assertEqual(compute_average([80, 90]), 85)

    def test_single(self):
        self.assertEqual(compute_average([70]), 70)`;
const testB = `import unittest
from grades import average

class AverageTests(unittest.TestCase):
    def test_two_values(self):
        self.assertEqual(average([60, 100]), 80)

    def test_empty_guard(self):
        with self.assertRaises(ZeroDivisionError):
            average([])`;

const Limits = ({ children }: { children: React.ReactNode }) => <Notice tone="warn"><b className="font-semibold">Limitations.</b> {children}</Notice>;
function Explain({ children }: { children: React.ReactNode }) {
  return <p className="border-l-2 border-primary/40 bg-card py-1 pl-3 text-xs text-muted-foreground"><span className="font-semibold text-foreground">In plain terms: </span>{children}</p>;
}

/* ================= shared stylometry table ================= */
const STYLE: [string, string, string, string, string, string, number][] = [
  ["Variable naming", "snake_case, 6.8", "snake_case, 7.1", "snake_case, 7.0", "snake_case, 7.3", "snake_case, 7.4", 94],
  ["Function naming", "snake_case", "snake_case", "snake_case", "snake_case", "snake_case", 100],
  ["Indentation", "4 spaces", "4 spaces", "4 spaces", "4 spaces", "4 spaces", 100],
  ["Comment style", "# inline, 0.3/10 ln", "# inline, 0.2/10 ln", "# header, 0.2/10 ln", "# inline, 0.1/10 ln", "none", 42],
  ["Code organization", "helpers + main()", "helpers + main()", "helpers + main()", "helpers + main()", "helpers + main()", 88],
  ["Whitespace patterns", "spaced operators", "spaced operators", "spaced operators", "spaced operators", "spaced operators", 96],
  ["Statement structure", "early return", "early return", "if/elif", "early return", "if/elif ladder", 58],
];

export function StyleTable({ student }: { student: string }) {
  const labs = ["Lab 1", "Lab 2", "Lab 3", "Lab 4", "Current"];
  return (
    <Panel flush title="Supporting authorship evidence" actions={<Link to="/authorship" className="text-xs font-medium text-primary hover:underline">Open full authorship history</Link>} note={`${student} · baseline of 4 prior Python submissions (minimum 3 needed, met)`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <caption className="sr-only">Coding style characteristics across historical and current submissions</caption>
          <thead className="bg-muted/60"><tr className="border-b border-border">
            <th scope="col" className="px-3 py-2 text-xs font-medium text-muted-foreground">Characteristic</th>
            {labs.map((l) => <th key={l} scope="col" className={`px-3 py-2 text-xs font-medium ${l === "Current" ? "text-primary" : "text-muted-foreground"}`}>{l}</th>)}
            <th scope="col" className="w-40 px-3 py-2 text-xs font-medium text-muted-foreground">Consistency</th>
          </tr></thead>
          <tbody>
            {STYLE.map((r) => (
              <tr key={r[0]} className="border-b border-border last:border-0">
                <th scope="row" className="px-3 py-1.5 text-[13px] font-medium">{r[0]}</th>
                {r.slice(1, 6).map((c, i) => <td key={i} className={`px-3 py-1.5 font-mono text-xs ${i === 4 ? "bg-primary-soft/40" : ""}`}>{c as string}</td>)}
                <td className="px-3 py-1.5"><div className="flex items-center gap-2"><Bar value={r[6] as number} label={r[0] + " consistency"} /><span className="w-9 text-right font-mono text-xs tabular-nums">{r[6]}%</span></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-4 border-t border-border p-4 md:grid-cols-[1fr_2fr]">
        <div>
          <div className="text-xs text-muted-foreground">Overall consistency with history</div>
          <div className="font-mono text-lg font-medium">Moderate · 69%</div>
        </div>
        <Notice>Stylometric results are supporting evidence only. They vary by language, assignment type and student experience, and short programs carry few stylistic signals. They do not establish authorship.</Notice>
      </div>
      <div className="border-t border-border p-4">
        <div className="mb-2 text-xs font-medium">Consistency of each submission with the baseline</div>
        <div role="img" aria-label="Bar chart: Lab 1 91%, Lab 2 88%, Lab 3 84%, Lab 4 90%, Current 69%" className="flex h-24 items-end gap-6">
          {[["Lab 1", 91], ["Lab 2", 88], ["Lab 3", 84], ["Lab 4", 90], ["Current", 69]].map(([l, v]) => (
            <div key={l as string} className="flex flex-1 flex-col items-center gap-1">
              <span className="font-mono text-[11px]">{v}%</span>
              <div className={`w-full max-w-12 ${l === "Current" ? "bg-primary" : "bg-border"}`} style={{ height: (v as number) * 0.6 }} />
              <span className="text-[11px] text-muted-foreground">{l}</span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

/* ================= pair comparison ================= */
type FileRow = { name: string; n: number; tokens: number; a: number; b: number };
const TABS = ["Overview", "Code Comparison", "AST / TED", "Winnowing", "Code Stylometry (supporting)", "LLM-assisted Interpretation (supporting)"];

const AST_ROWS: [number, string, string, string][] = [
  [0, "Module", "Module", "match"],
  [1, "Import csv", "Import csv", "match"],
  [1, "ImportFrom typing", "ImportFrom typing", "match"],
  [1, "FunctionDef load_scores(path)", "FunctionDef read_grades(filename)", "rename"],
  [2, "With open(path)", "With open(filename)", "rename"],
  [3, "For row in reader", "For line in rows", "rename"],
  [3, "Call scores.append(float(...))", "Call result.append(float(...))", "rename"],
  [2, "Return scores", "Return result", "rename"],
  [1, "FunctionDef compute_average(values)", "FunctionDef average(nums)", "rename"],
  [2, "For v in values", "For n in nums", "rename"],
  [2, "—", "Expr (comment)", "insert"],
  [1, "FunctionDef letter_grade(avg)", "FunctionDef to_letter(score)", "rename"],
  [2, "If / Elif / Elif / Return", "If / Elif / Elif / Return", "match"],
  [1, "FunctionDef main()", "FunctionDef main()", "match"],
  [1, "If __name__ == '__main__'", "If __name__ == '__main__'", "match"],
];
const OP: Record<string, string> = { match: "text-low", rename: "text-info", insert: "text-mod", delete: "text-high" };

const FP = Array.from({ length: 58 }, (_, i) => i);
const UNMATCHED = new Set([0, 3, 9, 10, 15, 22, 27, 28, 34, 41, 46, 47, 52, 55, 56, 57]);
const HASHES = ["a41f9c02", "07be33d1", "c92a5e60", "5d18f7ab", "e3340b9c", "19cc72f4"];

export function Comparison({ id, initialTab }: { id: string; initialTab?: string }) {
  const p = pair(id);
  const A = sub(p.a), B = sub(p.b);
  const [tab, setTab] = useState(initialTab ?? "Overview");
  const [m, setM] = useState(1);
  const [pane, setPane] = useState<"A" | "B">("A");
  const [file, setFile] = useState(0);
  const ra = useRef<HTMLDivElement>(null);
  const rb = useRef<HTMLDivElement>(null);
  const jump = (n: number) => {
    const k = ((n - 1 + matches.length) % matches.length) + 1;
    setM(k);
    setFile(0);
    const mm = matches[k - 1];
    setTimeout(() => {
      ra.current?.scrollTo({ top: (mm.a[0] - 2) * LINE_H, behavior: "smooth" });
      rb.current?.scrollTo({ top: (mm.b[0] - 2) * LINE_H, behavior: "smooth" });
    }, 30);
  };
  const full = p.id === "p1";
  const cl = clusterMap()[p.a];
  const inCluster = cl && cl === clusterMap()[p.b];
  const covered = (r: [number, number][]) => r.reduce((n, x) => n + x[1] - x[0] + 1, 0);
  const totA = pyA.split("\n").length, totB = pyB.split("\n").length;
  const fileRows: FileRow[] = [
    { name: "grades.py", n: matches.length, tokens: matches.reduce((n, x) => n + x.tokens, 0), a: Math.round((covered(matches.map((x) => x.a)) / totA) * 100), b: Math.round((covered(matches.map((x) => x.b)) / totB) * 100) },
    { name: "test_grades.py", n: 0, tokens: 0, a: 0, b: 0 },
  ];
  const fileCols: Col<FileRow>[] = [
    { key: "f", header: "File", sort: (r) => r.name, render: (r) => <span className="font-mono text-xs">{r.name}</span> },
    { key: "n", header: "Matches", sort: (r) => r.n, render: (r) => <span className="font-mono tabular-nums">{r.n}</span> },
    { key: "t", header: "Tokens", sort: (r) => r.tokens, render: (r) => <span className="font-mono tabular-nums">{r.tokens}</span> },
    { key: "a", header: "Coverage A", sort: (r) => r.a, render: (r) => <span className="font-mono tabular-nums">{r.a}%</span> },
    { key: "b", header: "Coverage B", sort: (r) => r.b, render: (r) => <span className="font-mono tabular-nums">{r.b}%</span> },
  ];
  const matchCols: Col<Match>[] = [
    { key: "i", header: "#", sort: (x) => x.id, render: (x) => <span className={`font-mono ${x.id === m && !file ? "font-semibold" : ""}`}>{x.id === m && !file ? "▸ " : ""}{x.id}</span> },
    { key: "l", header: "Region", sort: (x) => x.label, render: (x) => x.label },
    { key: "a", header: "Student A lines", sort: (x) => x.a[0], render: (x) => <span className="font-mono text-xs">{x.a[0]}–{x.a[1]}</span> },
    { key: "b", header: "Student B lines", sort: (x) => x.b[0], render: (x) => <span className="font-mono text-xs">{x.b[0]}–{x.b[1]}</span> },
    { key: "n", header: "Lines", sort: (x) => x.a[1] - x.a[0] + 1, render: (x) => <span className="font-mono tabular-nums">{x.a[1] - x.a[0] + 1}</span> },
    { key: "t", header: "Tokens", sort: (x) => x.tokens, render: (x) => <span className="font-mono tabular-nums">{x.tokens}</span> },
  ];
  let longest = 0, run = 0;
  FP.forEach((i) => { run = UNMATCHED.has(i) ? 0 : run + 1; longest = Math.max(longest, run); });

  const summary = (
    <div className="mb-4 grid divide-border rounded-md border border-border bg-card md:grid-cols-4 md:divide-x [&>div]:p-3 max-md:[&>div]:border-t first:[&>div]:border-t-0">
      {[
        ["Structural similarity", "AST / Tree Edit Distance", pct(p.ast), "AST / TED"],
        ["Fingerprint similarity", "Winnowing", pct(p.fp), "Winnowing"],
        ["Authorship support", "Code stylometry · supporting evidence", "Moderate", "Code Stylometry (supporting)"],
        ["LLM interpretation", "AI-assisted · supporting evidence", full ? "Available" : "Not generated", "LLM-assisted Interpretation (supporting)"],
      ].map(([k, s, v, t]) => (
        <div key={k}>
          <div className="text-xs font-medium">{k}</div>
          <div className="text-xs text-muted-foreground">{s}</div>
          <div className="mt-1 flex items-center justify-between"><span className={`font-mono font-medium ${v === "Not available" || v === "Not generated" ? "text-xs italic text-muted-foreground" : "text-base"}`}>{v}</span><button onClick={() => setTab(t)} className="text-xs font-medium text-primary hover:underline">Details</button></div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div className="sticky top-11 z-20 -mx-4 mb-4 flex flex-wrap items-center gap-x-4 gap-y-0.5 border-b border-border bg-card/95 px-4 py-1.5 text-xs md:-mx-6 md:px-6" aria-label="Case context" role="region">
        <Link to="/analysis" className="font-medium text-primary hover:underline">← Back to Similarity Analysis</Link>
        <span className="text-muted-foreground">CS Programming Laboratory · Laboratory 4</span>
        <span className="font-mono">{caseId(p.id)}</span>
        <span>{A.student} ↔ {B.student}</span>
        <StatusText status={p.status} />
      </div>
      <PageHeader title={`Similarity Case #${caseId(p.id)}`} meta={<>Student A: <b className="font-medium text-foreground">{A.student}</b> &nbsp;·&nbsp; Student B: <b className="font-medium text-foreground">{B.student}</b> &nbsp;·&nbsp; Laboratory 4 · {A.lang}{inCluster ? <> &nbsp;·&nbsp; <Link to="/clusters" className="font-medium text-primary hover:underline">{cl.label} ({cl.size} submissions)</Link></> : <> &nbsp;·&nbsp; Not in a cluster</>}</>}
        actions={<><div className="mr-3 text-right"><div className="text-xs text-muted-foreground">Overall similarity</div><Severity value={p.overall} /></div><Button variant="primary" onClick={() => go("/review/" + p.id)}>Instructor review</Button></>} />
      {summary}
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      <div className="mt-4 space-y-4">
        {tab === "Overview" && (
          <>
            <Panel flush title="Evidence summary" actions={full ? <button onClick={() => setTab("Code Comparison")} className="text-xs font-medium text-primary hover:underline">View matched regions</button> : undefined}>
              <table className="w-full text-left">
                <caption className="sr-only">Evidence summary</caption>
                <thead className="bg-muted/60"><tr className="border-b border-border">{["Method", "Kind", "Result", "Reading", "Where to look"].map((h) => <th key={h} scope="col" className="px-3 py-2 text-xs font-medium text-muted-foreground">{h}</th>)}</tr></thead>
                <tbody>
                  {[["AST / Tree Edit Distance", full ? `${p.ast}% (distance 14)` : pct(p.ast), p.ast === null ? "No syntax tree could be built for one file, so there is no score. This is not 0%." : "How closely the program structure matches."], ["Winnowing", full ? `${p.fp}% (42 / 58 fingerprints)` : pct(p.fp), full ? "Eight shared code regions." : "Share of sampled code fingerprints found in both files."], ["Code stylometry (supporting evidence)", "Moderate support", "Current style partly consistent with history."], ["Assisted interpretation (supporting evidence)", full ? "AI-assisted analysis" : "Not generated", "Supporting explanation only, never a finding."]].map((r) => (
                    <tr key={r[0]} className="border-b border-border last:border-0"><th scope="row" className="px-3 py-1.5 font-medium">{r[0]}</th><td className="px-3 py-1.5 text-xs">{r[0].includes("supporting") ? "Supporting evidence" : "Algorithmic measurement"}</td><td className="px-3 py-1.5 font-mono text-xs">{r[1]}</td><td className="px-3 py-1.5 text-muted-foreground">{r[2]}</td><td className="px-3 py-1.5"><button onClick={() => setTab(r[0].startsWith("AST") ? "AST / TED" : r[0] === "Winnowing" ? "Winnowing" : r[0].startsWith("Code") ? "Code Stylometry (supporting)" : "LLM-assisted Interpretation (supporting)")} className="text-xs font-medium text-primary hover:underline">Open {r[0].startsWith("AST") ? "AST / TED" : r[0] === "Winnowing" ? "Winnowing" : r[0].startsWith("Code") ? "stylometry" : "interpretation"}</button></td></tr>
                  ))}
                </tbody>
              </table>
            </Panel>
            {!full && <Notice>Matched regions are not stored for this sample pair, so none are listed. Scores above were measured.</Notice>}
            {full && <Panel flush title="Matched regions" note="8 regions">
              <ul className="divide-y divide-border">
                {matches.map((x) => (
                  <li key={x.id}><button onClick={() => { setTab("Code Comparison"); setTimeout(() => jump(x.id), 50); }} className="flex w-full items-center gap-4 px-4 py-1.5 text-left hover:bg-muted">
                    <span className="w-16 text-xs text-muted-foreground">Match {x.id}</span><span className="flex-1">{x.label}</span>
                    <span className="font-mono text-xs text-muted-foreground">A {x.a[0]}–{x.a[1]} · B {x.b[0]}–{x.b[1]}</span>
                  </button></li>
                ))}
              </ul>
            </Panel>}
          </>
        )}

        {tab === "Code Comparison" && (!full ? (
          <Notice tone="warn"><b className="font-semibold">Line-level match data is not available for this pair.</b> The scores above were measured, but matched regions and source listings are not stored for this sample case. Open {caseId("p1")} to see the full code comparison.</Notice>
        ) : (
          <>
            <Explain>Shaded lines are stretches of code the two files share, even if variable names differ. A match is a prompt to read both versions side by side, not a conclusion. Coverage is the share of a file's lines that sit inside a match.</Explain>
            <div className="sticky top-[76px] z-10 -mx-1 flex flex-wrap items-center gap-2 bg-background px-1 py-1.5">
              <Button onClick={() => jump(m - 1)}>Previous match</Button>
              <span className="px-1 text-[13px] font-medium" aria-live="polite">Match {m} of {matches.length}</span>
              <Button onClick={() => jump(m + 1)}>Next match</Button>
              <label className="ml-2 flex items-center gap-1.5 text-xs text-muted-foreground">Jump to
                <select value={m} onChange={(e) => jump(+e.target.value)} className="h-8 rounded border border-border bg-card px-1.5 text-[13px] text-foreground">{matches.map((x) => <option key={x.id} value={x.id}>{x.id}. {x.label}</option>)}</select></label>
              <span className="text-xs text-muted-foreground">Selected: {matches[m - 1].label} · A lines {matches[m - 1].a[0]}–{matches[m - 1].a[1]} · B lines {matches[m - 1].b[0]}–{matches[m - 1].b[1]} · {matches[m - 1].tokens} tokens</span>
            </div>
            <div role="group" aria-label="Choose which submission to show" className="inline-flex overflow-hidden rounded border border-border xl:hidden">
              {(["A", "B"] as const).map((k) => <button key={k} aria-pressed={pane === k} onClick={() => { setPane(k); jump(m); }} className={`px-3 py-1 text-[13px] font-medium ${pane === k ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}>Student {k}: {(k === "A" ? A : B).student}</button>)}
            </div>
            <div className="grid gap-3 xl:grid-cols-2 [&>*:nth-child(1)]:data-[pane=B]:max-xl:hidden [&>*:nth-child(2)]:data-[pane=A]:max-xl:hidden" data-pane={pane}>
              <CodePanel title="Student A" file={file ? "test_grades.py" : A.file} lang={A.lang} code={file ? testA : pyA} ranges={file ? [] : matches.map((x) => ({ id: x.id, range: x.a }))} active={m} onPick={jump} panelRef={ra} />
              <CodePanel title="Student B" file={file ? "test_grades.py" : B.file} lang={B.lang} code={file ? testB : pyB} ranges={file ? [] : matches.map((x) => ({ id: x.id, range: x.b }))} active={m} onPick={jump} panelRef={rb} />
            </div>
            <p className="text-xs text-muted-foreground">{file ? "This file has no matched regions. Choose grades.py, or use Previous or Next match, to return." : "The selected match has the stronger shade and a ▸ marker in the list. Click any shaded region to select it."}</p>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
              <span className="text-xs text-muted-foreground">Finished reading the code? Record what you found, any uncertainty, and your own outcome.</span>
              <Button variant="primary" onClick={() => go("/review/" + p.id)}>Continue to instructor review</Button>
            </div>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <Panel flush title="Files" note="Select a file. Sort by name, matches or coverage.">
                <DataTable caption="Files in this comparison" cols={fileCols} rows={fileRows} rowKey={(r) => r.name} minW={380} selected={(r) => fileRows.indexOf(r) === file} onRow={(r) => { const i = fileRows.indexOf(r); setFile(i); if (i === 0) jump(m); }} />
              </Panel>
              <Panel flush title={`Matching regions · ${file ? "test_grades.py" : "grades.py"}`} note={file ? "No regions in this file" : "Select a row to scroll both panes"}>
                <div className="max-h-56 overflow-y-auto">
                  <DataTable caption="Matching regions in the selected file" cols={matchCols} rows={file ? [] : matches} rowKey={(x) => String(x.id)} minW={480} selected={(x) => x.id === m} onRow={(x) => jump(x.id)} empty="Measured: 0 matching regions in this file." />
                </div>
              </Panel>
            </div>
          </>
        ))}

        {tab === "AST / TED" && (
          <>
            <Explain>The program is turned into a tree of its building blocks (functions, loops, conditions). Tree Edit Distance counts the smallest number of changes needed to turn one tree into the other. Fewer changes means more similar structure, even when names were changed.</Explain>
            <div className="grid grid-cols-2 gap-4 rounded-md border border-border bg-card p-4 md:grid-cols-4">
              <Stat k="AST structural similarity" v={pct(p.ast)} /><Stat k="Tree edit distance" v={full ? "14" : "Not available"} /><Stat k="Nodes (A / B)" v={full ? "64 / 66" : "Not available"} /><Stat k="Normalized similarity" v={full ? "1 − 14/64 = 78%" : "Not available"} />
            </div>
            <Limits>Short or tightly specified labs often produce similar structure without any shared work. Two correct solutions can also look different. The score shows how alike the structure is, not why.</Limits>
            {p.ast === null && <Notice tone="warn"><b className="font-semibold">No AST/TED score for this pair.</b> A syntax tree could not be built for one file (parsing failed). This is missing data, not 0% similarity. Winnowing still compares the raw text.</Notice>}
            {!full && p.ast !== null && <Notice>The node alignment is not stored for this sample pair. Only the measured score is shown.</Notice>}
            {full && <Panel flush title="AST alignment" note="Identifier names are ignored for structure; renames are shown as relabel operations.">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left font-mono text-xs">
                  <caption className="sr-only">AST node alignment between submission A and B</caption>
                  <thead className="bg-muted/60 font-sans"><tr className="border-b border-border"><th scope="col" className="px-3 py-2 font-medium text-muted-foreground">Student A node</th><th scope="col" className="px-3 py-2 font-medium text-muted-foreground">Student B node</th><th scope="col" className="px-3 py-2 font-medium text-muted-foreground">Edit operation</th></tr></thead>
                  <tbody>
                    {AST_ROWS.map(([d, a, b, op], i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="whitespace-pre px-3 py-1" style={{ paddingLeft: 12 + d * 18 }}>{d ? "└ " : ""}{a}</td>
                        <td className="whitespace-pre px-3 py-1">{b}</td>
                        <td className={`px-3 py-1 font-sans font-medium ${OP[op]}`}>{op === "match" ? "= unchanged" : op === "rename" ? "~ relabel" : op === "insert" ? "+ insert" : "− delete"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>}
          </>
        )}

        {tab === "Winnowing" && (
          <>
            <Explain>Each file is split into short overlapping pieces of code, and a representative sample of them (fingerprints) is kept. Coverage is the share of one file's fingerprints that also appear in the other. Common boilerplate can inflate this number.</Explain>
            <div className="grid grid-cols-2 gap-4 rounded-md border border-border bg-card p-4 md:grid-cols-4">
              <Stat k="Winnowing similarity" v={pct(p.fp)} /><Stat k="Matched fingerprints" v={full ? "42 / 58" : "Not available"} /><Stat k="Fingerprint coverage" v={full ? "72%" : "Not available"} /><Stat k="Longest matching sequence" v={full ? longest + " fingerprints" : "Not available"} />
            </div>
            <Limits>Starter code, required boilerplate and common idioms can raise this score. Sampling means very short shared passages may be missed.</Limits>
            {!full && <Notice>Fingerprint details are not stored for this sample pair. Only the measured Winnowing score is shown.</Notice>}
            {full && <Panel title="Fingerprint sequence (Student A, in file order)" note="k-gram 5 · window 4">
              <div role="img" aria-label="42 of 58 fingerprints matched" className="flex flex-wrap gap-[3px]">
                {FP.map((i) => <span key={i} title={`#${i + 1} ${UNMATCHED.has(i) ? "unmatched" : "matched"}`} className={`h-4 w-3 ${UNMATCHED.has(i) ? "border border-border bg-card" : "bg-primary"}`} />)}
              </div>
              <div className="mt-2 flex gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><span className="h-3 w-2 bg-primary" />Matched</span><span className="flex items-center gap-1.5"><span className="h-3 w-2 border border-border" />Not in Student B</span></div>
            </Panel>}
            {full && <Panel flush title="Sample matched fingerprints">
              <table className="w-full text-left"><caption className="sr-only">Matched fingerprints</caption>
                <thead className="bg-muted/60"><tr className="border-b border-border">{["Hash", "Student A lines", "Student B lines"].map((h) => <th key={h} scope="col" className="px-3 py-2 text-xs font-medium text-muted-foreground">{h}</th>)}</tr></thead>
                <tbody>{HASHES.map((h, i) => <tr key={h} className="border-b border-border last:border-0 font-mono text-xs"><td className="px-3 py-1.5">0x{h}</td><td className="px-3 py-1.5">{matches[i].a[0]}–{matches[i].a[1]}</td><td className="px-3 py-1.5">{matches[i].b[0]}–{matches[i].b[1]}</td></tr>)}</tbody>
              </table>
            </Panel>}
          </>
        )}

        {tab === "Code Stylometry (supporting)" && (
          <>
            <Explain>This compares how the student usually writes code (naming, spacing, structure) with this submission. A mismatch can have ordinary causes such as a new technique or a different tool.</Explain>
            <Limits>Stylometry needs several earlier submissions and short programs give few signals. It supports a review; it cannot show who wrote the code.</Limits>
            <StyleTable student={B.student} />
          </>
        )}

        {tab === "LLM-assisted Interpretation (supporting)" && !full && <Panel title="Assisted interpretation" note="Supporting evidence"><p className="text-muted-foreground">No assisted interpretation has been generated for this pair. Use the measured scores and the instructor's own reading of the code.</p></Panel>}
        {tab === "LLM-assisted Interpretation (supporting)" && full && (
          <Panel title="Assisted interpretation" note="AI-assisted · supporting evidence" actions={<Button onClick={() => setTab("Code Comparison")}>View underlying evidence</Button>}>
            <p className="max-w-3xl text-[13px] leading-6">The detected similarities are concentrated in the CSV loading function, the accumulator loop and the grade threshold ladder. Both submissions share the same function decomposition and call order, with differences limited mostly to identifier names.</p>
            <div className="mt-4 grid gap-6 md:grid-cols-3">
              {[["Observed evidence", ["8 matched regions covering 72% of fingerprints.", "AST edit distance of 14 on trees of about 65 nodes.", "Same function order and control flow in both files."]], ["Possible interpretation", ["Shared work or a shared source is one possibility.", "A tightly specified lab can also lead to similar solutions.", "Possible shared starter code or a tutorial."]], ["Limitations", ["Stylometry used only four prior labs.", "Short programs give few stylistic signals.", "This summary is generated and may be incomplete."]]].map(([h, items]) => (
                <div key={h as string}><h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{h as string}</h3><ul className="mt-1.5 list-disc space-y-1 pl-4">{(items as string[]).map((i) => <li key={i}>{i}</li>)}</ul></div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">This explanation supports your review. It is not a finding, and the academic decision rests with the instructor.</p>
          </Panel>
        )}
      </div>
    </>
  );
}

/* ================= clusters ================= */
const sevColor = (n: number) => (n >= 70 ? "var(--high)" : n >= 40 ? "var(--mod)" : "#9aa0a6");

type Sel = { k: "n" | "e"; id: string } | null;
const LEGEND = [20, 40, 70, 90];

export function Clusters() {
  const [thr, setThr] = useState(40);
  const [lang, setLang] = useState("All languages");
  const [asg, setAsg] = useState("Laboratory 4");
  const [graph, setGraph] = useState(true);
  const [sel, setSel] = useState<Sel>({ k: "e", id: "p1" });
  const cm = clusterMap(thr);
  const vis = (id: string) => lang === "All languages" || sub(id).lang === lang;
  const shown = asg !== "Laboratory 4" ? [] : edges.filter((e) => e.w >= thr && vis(e.a) && vis(e.b));
  const pos = (id: string) => nodes.find((n) => n.id === id)!;
  const deg = (id: string) => shown.filter((e) => e.a === id || e.b === id).length;
  const top = (id: string) => { const w = shown.filter((e) => e.a === id || e.b === id).map((e) => e.w); return w.length ? Math.max(...w) : null; };
  const selEdge = sel?.k === "e" ? edges.find((e) => e.pair === sel.id) ?? null : null;
  const selNode = sel?.k === "n" ? sub(sel.id) : null;
  const selCluster = selNode ? cm[selNode.id] : selEdge ? cm[selEdge.a] : undefined;
  const outside = selCluster ? pairs.filter((p) => selCluster.members.includes(p.a) !== selCluster.members.includes(p.b)) : [];
  const members = asg !== "Laboratory 4" ? [] : nodes.filter((n) => vis(n.id)).map((n) => n.id).sort((a, b) => (cm[b]?.size ?? 0) - (cm[a]?.size ?? 0) || (cm[a]?.label ?? "~").localeCompare(cm[b]?.label ?? "~"));
  const edgeCols: Col<(typeof edges)[number]>[] = [
    { key: "c", header: "Case", sort: (e) => caseId(e.pair), render: (e) => <span className="font-mono text-xs">{caseId(e.pair)}</span> },
    { key: "a", header: "Submission A", sort: (e) => sub(e.a).student, render: (e) => sub(e.a).student },
    { key: "b", header: "Submission B", sort: (e) => sub(e.b).student, render: (e) => sub(e.b).student },
    { key: "k", header: "Cluster", render: (e) => (cm[e.a] && cm[e.a] === cm[e.b] ? `${cm[e.a].label} · ${cm[e.a].size}` : <span className="text-muted-foreground">None</span>) },
    { key: "w", header: "Overall", sort: (e) => e.w, render: (e) => <Severity value={e.w} /> },
    { key: "t", header: "AST / TED", sort: (e) => e.ast ?? -1, render: (e) => <NA v={e.ast} /> },
    { key: "f", header: "Winnowing", sort: (e) => e.fp ?? -1, render: (e) => <NA v={e.fp} /> },
    { key: "x", header: "Action", render: (e) => <Link to={"/compare/" + e.pair} className="font-medium text-primary hover:underline">Open comparison</Link> },
  ];
  const memberCols: Col<string>[] = [
    { key: "s", header: "Submission", sort: (id) => sub(id).student, render: (id) => <div><div className="font-medium">{sub(id).student}</div><div className="font-mono text-[11px] text-muted-foreground">{sub(id).lang}</div></div> },
    { key: "c", header: "Cluster", sort: (id) => cm[id]?.size ?? 0, render: (id) => (cm[id] ? `${cm[id].label} · ${cm[id].size}` : <span className="text-muted-foreground">Unclustered</span>) },
    { key: "l", header: "Links", sort: (id) => deg(id), render: (id) => <span className="font-mono tabular-nums">{deg(id)}</span> },
    { key: "h", header: "Highest", sort: (id) => top(id) ?? -1, render: (id) => (top(id) === null ? <span className="text-muted-foreground">—</span> : <span className="font-mono tabular-nums">{top(id)}%</span>) },
  ];
  return (
    <>
      <AnalysisViews current="clusters" />
      <PageHeader title="Clusters" meta={`Submissions are linked when overall similarity is ${thr}% or higher. Linked groups form a cluster.`} />
      <FilterBar>
        <label className="flex flex-col gap-0.5 text-xs text-muted-foreground">Similarity threshold: <span className="font-medium text-foreground">{thr}%</span>
          <input type="range" min={10} max={90} step={5} value={thr} onChange={(e) => setThr(+e.target.value)} aria-label="Similarity threshold percent" className="h-8 w-44 accent-[var(--primary)]" /></label>
        <Select label="Assignment" value={asg} onChange={setAsg} options={["Laboratory 4", "Laboratory 3"]} />
        <Select label="Language" value={lang} onChange={setLang} options={["All languages", "Python", "Java"]} />
        <label className="flex h-8 items-center gap-2 text-[13px]"><input type="checkbox" checked={graph} onChange={(e) => setGraph(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />Show graph</label>
      </FilterBar>
      <p className="mb-3 text-xs text-muted-foreground" role="status" aria-live="polite">{shown.length} links and {new Set(Object.values(cm).filter((c) => c.members.some(vis)).map((c) => c.label)).size} clusters at {thr}% or higher. The tables below hold the same information as the graph.</p>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        {graph ? (
          <Panel flush title="Relationship graph" note="Select a line or circle. Lines can also be chosen from the table.">
            {shown.length === 0 && <div className="border-b border-border px-4 py-2 text-xs text-muted-foreground">{asg !== "Laboratory 4" ? "No analysis has been run for this assignment." : "No links at this threshold. Lower the threshold to see more."}</div>}
            <svg viewBox="0 0 860 470" className="h-auto w-full" role="group" aria-label="Submission relationship graph. The tables below list the same links.">
              {shown.map((e) => {
                const a = pos(e.a), b = pos(e.b);
                const on = sel?.k === "e" && sel.id === e.pair;
                return (
                  <g key={e.pair} className="cursor-pointer" tabIndex={0} role="button" aria-pressed={on} aria-label={`${sub(e.a).student} and ${sub(e.b).student}, ${e.w}% similarity`} onClick={() => setSel({ k: "e", id: e.pair })} onKeyDown={(ev) => (ev.key === "Enter" || ev.key === " ") && setSel({ k: "e", id: e.pair })}>
                    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth={14} />
                    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={on ? "var(--primary)" : sevColor(e.w)} strokeWidth={on ? 0.75 + e.w / 25 + 2 : 0.75 + e.w / 25} strokeDasharray={e.w < 40 ? "3 4" : undefined} opacity={on ? 1 : 0.35 + e.w / 150} />
                    {(e.w >= 70 || on) && <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 6} textAnchor="middle" fontSize={11} fill="var(--foreground)" fontFamily="JetBrains Mono, monospace">{e.w}%</text>}
                  </g>
                );
              })}
              {nodes.filter((n) => vis(n.id)).map((n) => {
                const s = sub(n.id);
                const on = sel?.k === "n" && sel.id === n.id;
                const inSel = !!selCluster && selCluster.members.includes(n.id);
                const r = 9 + deg(n.id) * 3;
                return (
                  <g key={n.id} transform={`translate(${n.x},${n.y})`} className="cursor-pointer" tabIndex={0} role="button" aria-pressed={on} aria-label={`${s.student}, ${s.lang}, ${cm[n.id] ? cm[n.id].label + ", " + cm[n.id].size + " submissions" : "not in a cluster"}, ${reviewLabelOf(s.status)}`} onClick={() => setSel({ k: "n", id: n.id })} onKeyDown={(ev) => (ev.key === "Enter" || ev.key === " ") && setSel({ k: "n", id: n.id })}>
                    <circle r={r} fill={s.lang === "Python" ? "var(--info-soft)" : "var(--mod-soft)"} stroke={on || inSel ? "var(--primary)" : "var(--foreground)"} strokeWidth={on ? 3 : inSel ? 2 : 1.25} />
                    {s.status === "Review Recommended" && <text textAnchor="middle" dy={4} fontSize={11} fontWeight={700} fill="var(--high)">!</text>}
                    <text y={r + 14} textAnchor="middle" fontSize={11} fill="var(--foreground)">{s.student}</text>
                    <text y={r + 26} textAnchor="middle" fontSize={10} fill="var(--muted-foreground)">{cm[n.id] ? cm[n.id].label : "No cluster"} · {s.lang === "Python" ? "Py" : "Java"}</text>
                  </g>
                );
              })}
            </svg>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-border px-4 py-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-2 font-medium text-foreground">Line weight and darkness = overall similarity:
                <svg width={170} height={20} aria-hidden>{LEGEND.map((w, i) => <g key={w} transform={`translate(${i * 44},0)`}><line x1={0} y1={8} x2={26} y2={8} stroke={sevColor(w)} strokeWidth={0.75 + w / 25} opacity={0.35 + w / 150} strokeDasharray={w < 40 ? "3 4" : undefined} /><text x={0} y={19} fontSize={9} fill="currentColor">{w}%</text></g>)}</svg>
              </span>
              <span>Red 70%+, amber 40–69%, gray dotted below 40%</span><span>Fill: blue Python, tan Java</span><span>Circle size = links · “!” = pending review · outline = selected cluster</span>
            </div>
          </Panel>
        ) : (
          <Panel title="Relationship graph"><p className="text-muted-foreground">The graph is hidden. Use the tables to browse clusters and links, or turn on “Show graph”.</p></Panel>
        )}
        <div className="space-y-4">
          <Panel title="Selection" note={sel ? undefined : "Nothing selected"}>
            {!sel && <p className="text-muted-foreground">Select a link or submission to see details.</p>}
            {selNode && (
              <div className="space-y-2">
                <div className="font-medium">{selNode.student}</div><div className="font-mono text-xs text-muted-foreground">{selNode.file}</div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Cluster</span><span>{cm[selNode.id] ? `${cm[selNode.id].label} · ${cm[selNode.id].size} submissions` : "Not in a cluster"}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Highest link</span>{top(selNode.id) === null ? <span>None at this threshold</span> : <Severity value={top(selNode.id)!} />}</div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Review</span><StatusText status={selNode.status} /></div>
                <Link to={"/submissions/" + selNode.id} className="inline-block font-medium text-primary hover:underline">Open submission</Link>
              </div>
            )}
            {selEdge && (
              <div className="space-y-2">
                <div className="font-medium">{sub(selEdge.a).student} ↔ {sub(selEdge.b).student}</div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Overall similarity</span><Severity value={selEdge.w} /></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">AST / TED</span><NA v={selEdge.ast} /></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Winnowing</span><NA v={selEdge.fp} /></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Cluster</span><span>{cm[selEdge.a] && cm[selEdge.a] === cm[selEdge.b] ? `${cm[selEdge.a].label} · ${cm[selEdge.a].size}` : "None at this threshold"}</span></div>
                <Button variant="primary" onClick={() => go("/compare/" + selEdge.pair)}>Open pair comparison</Button>
              </div>
            )}
          </Panel>
          <Panel flush title="Cluster members" note="Select a row to highlight it in the graph">
            <DataTable caption="Cluster members" cols={memberCols} rows={members} rowKey={(id) => id} minW={360} selected={(id) => sel?.k === "n" && sel.id === id || (!!selCluster && selCluster.members.includes(id) && sel?.k === "e")} onRow={(id) => setSel({ k: "n", id })} empty="No submissions to show." />
          </Panel>
        </div>
      </div>
      <div className="mt-4 space-y-4">
        <Panel flush title="Comparisons in this graph" note={`${shown.length} links at ${thr}% or higher. The selected link is highlighted in the graph and here.`}>
          <DataTable caption="Comparisons shown in the graph" cols={edgeCols} rows={shown} rowKey={(e) => e.pair} minW={820} selected={(e) => sel?.k === "e" && sel.id === e.pair} onRow={(e) => setSel({ k: "e", id: e.pair })} empty="No links at this threshold. Lower the threshold to see more." />
        </Panel>
        <Panel flush title="Related comparisons outside the cluster" note={selCluster ? `${selCluster.label}: links between its members and other submissions, including those below ${thr}%` : "Select a clustered submission or link"}>
          <DataTable caption="Related comparisons outside the selected cluster" cols={[
            { key: "c", header: "Case", render: (p: Pair) => <span className="font-mono text-xs">{caseId(p.id)}</span> },
            { key: "i", header: "Cluster member", render: (p: Pair) => sub(selCluster!.members.includes(p.a) ? p.a : p.b).student },
            { key: "o", header: "Other submission", render: (p: Pair) => sub(selCluster!.members.includes(p.a) ? p.b : p.a).student },
            { key: "w", header: "Overall", sort: (p: Pair) => p.overall, render: (p: Pair) => <Severity value={p.overall} /> },
            { key: "x", header: "Action", render: (p: Pair) => <Link to={"/compare/" + p.id} className="font-medium text-primary hover:underline">Open comparison</Link> },
          ]} rows={outside} rowKey={(p) => p.id} minW={620} onRow={(p) => go("/compare/" + p.id)} empty={selCluster ? "No related comparisons outside this cluster." : "Select a clustered submission or link to see related comparisons."} />
        </Panel>
      </div>
    </>
  );
}
const reviewLabelOf = (s: string) => ({ "Review Recommended": "Pending review", "Needs Investigation": "Investigating", Reviewed: "Reviewed", "Low Concern": "No concern" } as Record<string, string>)[s] ?? s;
