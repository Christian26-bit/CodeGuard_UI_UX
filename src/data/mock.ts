export type Lang = "Python" | "Java";
export type Status = "Review Recommended" | "Needs Investigation" | "Reviewed" | "Low Concern";

export interface Submission {
  id: string;
  student: string;
  file: string;
  lang: Lang;
  lab: string;
  submitted: string;
  analysis: "Completed" | "Processing" | "Queued";
  sim: number;
  ast: number;
  fp: number;
  authorship: "Strong" | "Moderate" | "Low" | "No history";
  status: Status;
  analyzed: string;
}

const S = (
  id: string, student: string, file: string, lang: Lang, submitted: string,
  sim: number, ast: number, fp: number, authorship: Submission["authorship"],
  status: Status, analysis: Submission["analysis"] = "Completed", analyzed = "Today, 08:42",
): Submission => ({ id, student, file, lang, lab: "Laboratory 03", submitted, analysis, sim, ast, fp, authorship, status, analyzed });

export const submissions: Submission[] = [
  S("s01", "Maria Santos", "maria_santos.py", "Python", "Today, 10:32 AM", 82, 78, 86, "Moderate", "Review Recommended"),
  S("s02", "Juan Dela Cruz", "juan_delacruz.py", "Python", "Today, 9:47 AM", 82, 78, 86, "Moderate", "Review Recommended"),
  S("s03", "Priya Nair", "BankAccount.java", "Java", "Oct 7, 09:31", 79, 76, 83, "Low", "Needs Investigation"),
  S("s04", "Jonas Weber", "BankAccount.java", "Java", "Oct 7, 10:05", 79, 76, 83, "Strong", "Needs Investigation"),
  S("s05", "Aisha Rahman", "aisha_lab03.py", "Python", "Oct 5, 18:20", 64, 61, 68, "Strong", "Reviewed"),
  S("s06", "Lucas Ferreira", "inventory.py", "Python", "Oct 6, 14:48", 58, 54, 62, "Moderate", "Review Recommended"),
  S("s07", "Hannah Kim", "InventoryManager.java", "Java", "Oct 7, 08:12", 41, 38, 44, "Strong", "Low Concern"),
  S("s08", "Omar Haddad", "omar_h.py", "Python", "Oct 7, 11:40", 33, 30, 35, "No history", "Low Concern"),
  S("s09", "Sofia Marino", "StackQueue.java", "Java", "Oct 6, 16:25", 29, 27, 31, "Strong", "Low Concern"),
  S("s10", "Ethan Brooks", "ethan_brooks.py", "Python", "Oct 7, 13:09", 22, 20, 24, "Strong", "Low Concern", "Processing", "—"),
  S("s11", "Yuki Tanaka", "Grades.java", "Java", "Oct 7, 15:55", 18, 16, 20, "Moderate", "Low Concern", "Queued", "—"),
  S("s12", "Camila Ortiz", "camila_o.py", "Python", "Oct 7, 17:32", 15, 13, 17, "Strong", "Low Concern"),
];

export const sub = (id: string) => submissions.find((s) => s.id === id) ?? submissions[0];

export interface Pair {
  id: string; a: string; b: string; overall: number; ast: number | null; fp: number | null; status: Status;
}
const P = (id: string, a: string, b: string, overall: number, ast: number | null, fp: number | null, status: Status = "Low Concern"): Pair => ({ id, a, b, overall, ast, fp, status });
export const pairs: Pair[] = [
  P("p1", "s01", "s02", 82, 78, 86, "Review Recommended"),
  P("p2", "s03", "s04", 79, 76, 83, "Needs Investigation"),
  P("p3", "s05", "s06", 64, 61, 68, "Reviewed"),
  P("p4", "s06", "s02", 58, 54, 62, "Review Recommended"),
  P("p5", "s07", "s09", 41, 38, 44),
  P("p6", "s08", "s12", 33, 30, 35),
  P("p7", "s11", "s07", 27, 24, 30),
  P("p8", "s01", "s06", 46, 43, 49, "Review Recommended"),
  P("p9", "s01", "s05", 38, 35, 41),
  P("p10", "s03", "s07", 35, 32, 38),
  P("p11", "s02", "s05", 31, 28, 34),
  P("p12", "s04", "s07", 31, 29, 33),
  P("p13", "s03", "s09", 28, 25, 31),
  P("p14", "s04", "s09", 26, null, 26),
  P("p15", "s02", "s12", 24, 21, 27),
  P("p16", "s06", "s08", 21, 19, 23),
  P("p17", "s05", "s12", 19, 17, 21),
  P("p18", "s06", "s12", 17, 15, 19),
  P("p19", "s01", "s08", 14, 12, 16),
  P("p20", "s02", "s08", 12, 10, 14),
  P("p21", "s05", "s08", 11, 9, 13),
];
export const CLUSTER_MIN = 40;
export const REPORT_FLOOR = 10;
export function clusterMap(thr: number = CLUSTER_MIN) {
  const parent: Record<string, string> = {};
  const find = (x: string): string => (parent[x] === undefined || parent[x] === x ? (parent[x] = x) : (parent[x] = find(parent[x])));
  pairs.filter((p) => p.overall >= thr).forEach((p) => { parent[find(p.a)] = find(p.b); });
  const groups: Record<string, string[]> = {};
  submissions.forEach((x) => { if (pairs.some((p) => p.overall >= thr && (p.a === x.id || p.b === x.id))) (groups[find(x.id)] ??= []).push(x.id); });
  const peak = (g: string[]) => Math.max(...pairs.filter((p) => g.includes(p.a) && g.includes(p.b)).map((p) => p.overall));
  const ordered = Object.values(groups).sort((x, y) => peak(y) - peak(x));
  const out: Record<string, { label: string; size: number; members: string[] }> = {};
  ordered.forEach((g, i) => g.forEach((id) => { out[id] = { label: "Cluster " + "ABCDEFGH"[i], size: g.length, members: g }; }));
  return out;
}
export const analysisInfo = {
  when: "Today, 08:44 AM", duration: "12.4 s", total: 184, processed: 182, failed: 2, comparisons: 16836,
  config: [["Structural method", "AST with Tree Edit Distance, normalized by the larger tree"], ["Fingerprint method", "Winnowing, k-gram 5, window 4"], ["Reporting floor", REPORT_FLOOR + "% overall similarity"], ["Cluster threshold", CLUSTER_MIN + "% overall similarity"], ["Severity bands", "High 70%+, Moderate 40–69%, Low below 40%"]],
  issues: [
    { who: "Noah Patel", file: "lab4_notebook.ipynb", kind: "Language detection", text: "The file type was not recognised as Python or Java. It was left out of every comparison." },
    { who: "Ravi Shah", file: "Ledger.java", kind: "Parsing", text: "Syntax tree could not be built (unmatched brace near line 41). No AST/TED score exists for this file." },
    { who: "Ethan Brooks", file: "ethan_brooks.py", kind: "Analysis", text: "Analysis is still running. Comparisons will appear when it finishes." },
    { who: "Yuki Tanaka", file: "Grades.java", kind: "Analysis", text: "Analysis is queued. Only comparisons that already exist are shown." },
  ],
};
export const pair = (id: string) => pairs.find((p) => p.id === id) ?? pairs[0];

export const pct = (v: number | null) => (v === null ? "Not available" : v + "%");

export const activity = [
  { icon: "import", text: "184 submissions imported from Google Classroom", sub: "CS101 · Laboratory 03", time: "08:12" },
  { icon: "check", text: "Python Lab 03 analysis completed", sub: "112 submissions · 12.4 s", time: "08:31" },
  { icon: "alert", text: "4 high-similarity cases detected", sub: "Requires instructor review", time: "08:32" },
  { icon: "style", text: "Stylometry analysis completed for 2 submissions", sub: "Historical Labs 01–02 used", time: "08:44" },
  { icon: "review", text: "Case CG-2026-0139 recorded as reviewed", sub: "Aisha Rahman / Lucas Ferreira", time: "Yesterday" },
];

export interface CNode { id: string; x: number; y: number; cluster: number }
export const nodes: CNode[] = [
  { id: "s01", x: 190, y: 150, cluster: 1 }, { id: "s02", x: 330, y: 110, cluster: 1 },
  { id: "s06", x: 300, y: 250, cluster: 1 }, { id: "s05", x: 160, y: 290, cluster: 1 },
  { id: "s03", x: 640, y: 130, cluster: 2 }, { id: "s04", x: 770, y: 210, cluster: 2 },
  { id: "s07", x: 600, y: 320, cluster: 3 }, { id: "s09", x: 740, y: 370, cluster: 3 },
  { id: "s08", x: 470, y: 400, cluster: 4 }, { id: "s12", x: 350, y: 420, cluster: 4 },
  { id: "s11", x: 500, y: 190, cluster: 0 }, { id: "s10", x: 60, y: 130, cluster: 0 },
];
export const edges = pairs.map((p) => ({ a: p.a, b: p.b, w: p.overall, pair: p.id, ast: p.ast, fp: p.fp }));

export const pyA = `import csv
from typing import List

def load_scores(path: str) -> List[float]:
    scores = []
    with open(path) as f:
        reader = csv.reader(f)
        next(reader)
        for row in reader:
            scores.append(float(row[2]))
    return scores

def compute_average(values):
    total = 0
    for v in values:
        total += v
    return total / len(values)

def letter_grade(avg):
    if avg >= 90:
        return "A"
    elif avg >= 80:
        return "B"
    elif avg >= 70:
        return "C"
    return "F"

def main():
    data = load_scores("grades.csv")
    avg = compute_average(data)
    print("Average:", round(avg, 2))
    print("Grade:", letter_grade(avg))

if __name__ == "__main__":
    main()`;

export const pyB = `import csv
from typing import List

# read the grade file
def read_grades(filename: str) -> List[float]:
    result = []
    with open(filename) as file:
        rows = csv.reader(file)
        next(rows)
        for line in rows:
            result.append(float(line[2]))
    return result

def average(nums):
    s = 0
    for n in nums:
        s += n
    return s / len(nums)

def to_letter(score):
    if score >= 90:
        return "A"
    elif score >= 80:
        return "B"
    elif score >= 70:
        return "C"
    return "F"

def main():
    grades = read_grades("grades.csv")
    mean = average(grades)
    print("Average:", round(mean, 2))
    print("Grade:", to_letter(mean))

if __name__ == "__main__":
    main()`;

export interface Match { id: number; label: string; a: [number, number]; b: [number, number]; tokens: number }
export const matches: Match[] = [
  { id: 1, label: "Imports", a: [1, 2], b: [1, 2], tokens: 8 },
  { id: 2, label: "CSV loading function", a: [4, 11], b: [5, 12], tokens: 46 },
  { id: 3, label: "Accumulator loop", a: [13, 17], b: [14, 18], tokens: 28 },
  { id: 4, label: "Grade ladder (A, B)", a: [19, 23], b: [20, 24], tokens: 30 },
  { id: 5, label: "Grade ladder (C, F)", a: [24, 26], b: [25, 27], tokens: 18 },
  { id: 6, label: "main(): load and average", a: [28, 30], b: [29, 31], tokens: 22 },
  { id: 7, label: "main(): output", a: [31, 32], b: [32, 33], tokens: 20 },
  { id: 8, label: "Entry point guard", a: [34, 35], b: [35, 36], tokens: 10 },
];
export const caseId = (pid: string) => "CG-" + String(41 + Number(pid.replace("p", ""))).padStart(4, "0");

export const features = [
  { name: "Average identifier length", hist: "7.2 chars", cur: "7.4 chars", match: 94 },
  { name: "Indentation pattern", hist: "4 spaces", cur: "4 spaces", match: 100 },
  { name: "Function naming style", hist: "snake_case", cur: "snake_case", match: 96 },
  { name: "Comment frequency", hist: "0.2 / 10 lines", cur: "0.0 / 10 lines", match: 48 },
  { name: "Operator spacing", hist: "Spaced (a + b)", cur: "Spaced (a + b)", match: 91 },
  { name: "Control-flow tendencies", hist: "for-loops, early return", cur: "for-loops, if/elif", match: 62 },
];

export const historyLabs = [
  { lab: "Lab 01", date: "Aug 29", note: "Python · 118 lines" },
  { lab: "Lab 02", date: "Sep 12", note: "Python · 94 lines" },
  { lab: "Lab 03", date: "Sep 26", note: "Python · 141 lines" },
  { lab: "Lab 04", date: "Oct 3", note: "Python · 77 lines" },
  { lab: "Current", date: "Oct 6", note: "Python · 36 lines" },
];

export const reports = [
  { id: "r1", type: "Analysis Summary", title: "Laboratory 03 — Analysis Summary", date: "Oct 8, 2026", course: "CS101", subs: 184, cases: 11, time: "12.4 s" },
  { id: "r2", type: "Similarity Report", title: "Laboratory 03 — Pairwise Similarity", date: "Oct 8, 2026", course: "CS101", subs: 184, cases: 11, time: "12.4 s" },
  { id: "r3", type: "Case Evidence Report", title: "CG-2026-0142 — Evidence Report", date: "Oct 8, 2026", course: "CS101", subs: 2, cases: 1, time: "1.8 s" },
  { id: "r4", type: "Course Summary", title: "CS101 — Term Summary (Labs 01–03)", date: "Oct 1, 2026", course: "CS101", subs: 521, cases: 23, time: "36.9 s" },
];

export const courses = ["CS101 Programming Fundamentals", "CS201 Data Structures", "CS230 Object-Oriented Programming"];
