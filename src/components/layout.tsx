import { useEffect, useState, type ReactNode } from "react";
import { Icon, Link, usePath } from "../lib";
import { caseId, courses } from "../data/mock";

const NAV = [
  { to: "/", label: "Dashboard", icon: "dashboard" },
  { to: "/submissions", label: "Submissions", icon: "files" },
  { to: "/analysis", label: "Similarity Analysis", icon: "compare" },
  { to: "/reports", label: "Reports", icon: "report" },
  { to: "/settings", label: "Settings", icon: "settings" },
];
const isActive = (path: string, to: string) =>
  to === "/" ? path === "/" || path === "/import" : path === to || path.startsWith(to + "/") || (to === "/analysis" && ["/compare", "/review", "/clusters", "/authorship"].some((x) => path.startsWith(x)));

function Sidebar({ path, onNavigate }: { path: string; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col border-r border-border bg-sidebar">
      <div className="flex h-14 items-center gap-2.5 border-b border-primary-hover bg-primary px-5">
        <Icon n="shield" size={19} sw={1.9} />
        <span className="text-base font-bold tracking-tight">CodeGuard</span>
      </div>
      <nav aria-label="Primary" className="flex-1 px-3 py-4">
        {NAV.map((n) => {
          const a = isActive(path, n.to);
          return (
            <Link key={n.to} to={n.to} onClick={onNavigate} aria-current={a ? "page" : undefined} className={`mb-1 flex h-10 items-center gap-2.5 rounded-md border-l-[3px] px-3 font-mono text-[11px] font-semibold uppercase tracking-wide ${a ? "border-primary bg-primary-soft text-foreground" : "border-transparent hover:bg-primary-soft/60"}`}>
              <Icon n={n.icon} size={15} sw={1.6} />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border px-4 py-3 font-mono text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-low" aria-hidden />Services online</div>
        <button className="mt-1 text-primary hover:underline">Help and guidance</button>
      </div>
    </div>
  );
}

const LABEL: Record<string, string> = { submissions: "Submissions", analysis: "Similarity Analysis", clusters: "Clusters", authorship: "Authorship", reports: "Reports", settings: "Settings", import: "Import from Google Classroom", compare: "Similarity Analysis", review: "Similarity Analysis" };

function TopBar({ path, course, setCourse, onMenu }: { path: string; course: string; setCourse: (c: string) => void; onMenu: () => void }) {
  const p = path.split("/").filter(Boolean);
  const crumbs: { label: string; to?: string }[] = [{ label: "Dashboard", to: "/" }];
  if (p.length) {
    if (p[0] === "clusters" || p[0] === "authorship") crumbs.push({ label: "Similarity Analysis", to: "/analysis" }, { label: p[0] === "clusters" ? "Clusters" : "Authorship" });
    else crumbs.push({ label: LABEL[p[0]] ?? p[0], to: p.length > 1 || p[0] === "compare" || p[0] === "review" ? (p[0] === "compare" || p[0] === "review" ? "/analysis" : "/" + p[0]) : undefined });
    if (p[0] === "compare") crumbs.push({ label: `Case ${caseId(p[1] ?? "p1")}`, to: p[2] ? `/compare/${p[1]}` : undefined });
    if (p[0] === "review") crumbs.push({ label: `Case ${caseId(p[1] ?? "p1")}`, to: `/compare/${p[1]}` }, { label: "Instructor Review" });
    if (p[0] === "submissions" && p[1]) crumbs.push({ label: "Submission" });
    if (p[0] === "compare" && p[2]) crumbs.push({ label: "Evidence" });
  }
  return (
    <div className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-primary-hover bg-primary px-3 sm:gap-3 sm:px-4">
      <button onClick={onMenu} aria-label="Open navigation menu" className="-ml-1 flex h-8 w-8 items-center justify-center rounded hover:bg-muted lg:hidden"><Icon n="menu" size={18} /></button>
      <nav aria-label="Breadcrumb" className="min-w-0">
        <ol className="flex items-center gap-1.5 whitespace-nowrap font-mono text-[11px] text-foreground/70">
          {crumbs.map((c, i) => (
            <li key={i} className={`flex items-center gap-1.5 ${i < crumbs.length - 2 ? "max-sm:hidden" : ""}`}>
              {i > 0 && <span aria-hidden>/</span>}
              {i === crumbs.length - 1 ? <span aria-current="page" className="font-medium text-foreground">{c.label}</span> : <Link to={c.to!} className="text-foreground underline-offset-2 hover:underline">{c.label}</Link>}
            </li>
          ))}
        </ol>
      </nav>
      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-3">
        <label className="hidden items-center gap-2 text-xs text-foreground/70 md:flex">Course
          <select value={course} onChange={(e) => setCourse(e.target.value)} className="h-8 max-w-56 rounded border border-foreground/20 bg-primary px-2 text-[13px] text-foreground">{courses.map((c) => <option key={c}>{c}</option>)}</select>
        </label>
        <button className="flex h-8 w-8 items-center justify-center rounded hover:bg-white/20" aria-label="Notifications, 4 unread"><Icon n="bell" size={16} /></button>
        <span className="flex items-center gap-2 text-xs"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground font-semibold text-white" aria-hidden>EC</span><span className="hidden xl:inline">Elena Castillo, Instructor</span></span>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePath();
  const [open, setOpen] = useState(false);
  const [course, setCourse] = useState(courses[0]);
  useEffect(() => setOpen(false), [path]);
  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[70] focus:rounded focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">Skip to main content</a>
      <aside className="fixed inset-y-0 left-0 hidden w-[224px] lg:block"><Sidebar path={path} /></aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="cg-backdrop absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={() => setOpen(false)} aria-hidden />
          <aside className="cg-drawer relative h-full w-[min(86vw,280px)] shadow-2xl" role="dialog" aria-modal="true" aria-label="Navigation"><Sidebar path={path} onNavigate={() => setOpen(false)} /></aside>
        </div>
      )}
      <div className="min-w-0 lg:pl-[224px]">
        <TopBar path={path} course={course} setCourse={setCourse} onMenu={() => setOpen(true)} />
        <main id="main" className="mx-auto min-w-0 max-w-[1280px] px-3 py-4 sm:px-4 sm:py-5 md:px-6">
          <div key={path} className="cg-page-enter min-w-0">{children}</div>
        </main>
      </div>
    </div>
  );
}
