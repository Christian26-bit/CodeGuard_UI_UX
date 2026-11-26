import { usePath } from "./lib";
import { AppShell } from "./components/layout";
import { ToastProvider } from "./components/ui";
import { Analysis, Dashboard, SubmissionDetail, Submissions } from "./pages/overview";
import { Clusters, Comparison } from "./pages/investigate";
import { Authorship, ClassroomImport, Reports, ReviewCase, Settings } from "./pages/workflow";

function Routes() {
  const path = usePath();
  const p = path.split("/").filter(Boolean);
  if (!p.length) return <Dashboard />;
  switch (p[0]) {
    case "submissions": return p[1] ? <SubmissionDetail id={p[1]} /> : <Submissions />;
    case "analysis": return <Analysis />;
    case "clusters": return <Clusters />;
    case "compare": return <Comparison key={path} id={p[1] ?? "p1"} initialTab={TAB_SLUG[p[2] ?? ""]} />;
    case "authorship": return <Authorship />;
    case "review": return <ReviewCase id={p[1] ?? "p1"} />;
    case "reports": return <Reports />;
    case "import": return <ClassroomImport />;
    case "settings": return <Settings />;
    default: return <Dashboard />;
  }
}

const TAB_SLUG: Record<string, string> = { evidence: "AST / TED", code: "Code Comparison", ast: "AST / TED", winnowing: "Winnowing", stylometry: "Code Stylometry (supporting)", llm: "LLM-assisted Interpretation (supporting)" };

export default function App() {
  return (
    <ToastProvider>
      <AppShell>
        <Routes />
      </AppShell>
    </ToastProvider>
  );
}
