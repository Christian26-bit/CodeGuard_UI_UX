# CodeGuard: implementation plan

## Context
The project is an empty Vite + React 19 + Tailwind v4 scaffold. `src/App.tsx` renders an empty div and `src/index.css` only has `@import 'tailwindcss'`. There is no router, no design system and no Make Kit. The goal is a high-fidelity, interactive CodeGuard app with 10 screens, a reusable component set, and realistic Python/Java sample data. It is an investigation workspace for instructors: decision support, never a verdict.

## Stance
- Neutral light UI, deep indigo primary (#3B3FBF range), with restrained semantic colors.
  - High: red-orange. Moderate: amber. Low: green. Info: blue.
  - Every status pairs color with an icon and a label.
- Fonts via Google Fonts `@import` at the top of `src/index.css`:
  - Inter for UI.
  - JetBrains Mono for code and IDs.
- 8px spacing, 10px card radius, hairline borders, minimal shadows.
- Dark mode: a `.dark` token block with a toggle in Settings and the top bar.

## Dependencies
- Install `react-router` (hash or browser router) for the screen hierarchy.
- Install `lucide-react` for icons.
- Install `recharts` for the bar and distribution charts.
- The cluster network will be hand-built SVG, with no extra library.

## File structure (`src/`)
- `index.css`: font imports, tokens (`--background`, `--card`, `--primary`, `--border`, `--ring`, semantic `--high/--mod/--low/--info`), `@theme inline` mappings, dark block, focus-visible ring, hidden scrollbars.
- `main.tsx`: wraps the app in the router. It keeps the existing CSS import.
- `App.tsx`: routes inside the `AppShell` layout.
- `data/mock.ts`: all sample data.
  - ~12 submissions with students, languages and statuses.
  - Ranked pairs, including Maria Santos 87% (82 AST, 91 Winnowing).
  - Cluster nodes and edges.
  - Python and Java code snippets with match ranges.
  - Stylometry features, historical labs 01-04, reports, and activity items.
- `components/ui/`, the design system:
  - `StatusBadge`, `LangBadge`, `SimilarityScore`, `SimilarityBar`.
  - `MetricCard`, `EvidenceCard`, `ChartCard`, `DataTable` (semantic `<table>`, clickable rows with keyboard support), `FilterSelect`, `SearchField`.
  - `Timeline`, `Modal`, `Toast` (provider), `EmptyState`, `LoadingState`, `ErrorState`.
  - `CodePanel`, whose match highlights use a left bar plus a tinted background and a match number so they don't rely on color alone.
  - `ClusterNode`, `ClusterEdge`.
- `components/layout/`:
  - `Sidebar`: logo and "Source Code Intelligence", 7 nav items, bottom profile, help and system status.
  - `TopBar`: breadcrumb, course selector, search, notifications, profile, and a hamburger on small screens.
  - `AppShell`: at 1024px and above the sidebar is persistent. Below that it becomes a drawer with an overlay and Esc to close.
- `pages/`, one file per screen:
  - `Dashboard`
  - `Submissions`
  - `SimilarityAnalysis`
  - `Clusters`
  - `Comparison`
  - `Evidence`
  - `Authorship`
  - `ReviewCase`
  - `Reports`
  - `ClassroomImport`
  - `Settings` (a light stub)

## Routes and the investigation flow
- Routes: `/`, `/submissions`, `/submissions/:id`, `/analysis`, `/clusters`, `/compare/:pairId`, `/compare/:pairId/evidence`, `/authorship`, `/review/:caseId`, `/reports`, `/import`, `/settings`.
- A shared stepper strip at the top of the comparison, evidence and review pages shows the flow: Case, Similarity, Comparison, Structural, Winnowing, Authorship, LLM, Review, Decision. This keeps the hierarchy visible.
- Dashboard row click goes to the Comparison page. Cluster node click goes to the submission detail page. Cluster edge click goes to the pair comparison.

## Key screen behaviors
- **Dashboard:** greeting, an "Import from Google Classroom" button, 4 summary cards, 4 secondary metrics, a Recharts similarity overview, the review table and an activity feed.
- **Submissions:** 6 filter dropdowns, search, and a table that filters live.
- **Analysis:** summary panel, 4 metrics, a distribution chart, and a ranked table with horizontal bars.
- **Clusters:**
  - SVG network. Edge stroke width scales with similarity, and nodes show a language glyph and a status icon.
  - Threshold slider plus Python/Java/review filters.
  - A "Cluster Summary" side panel.
  - Selected nodes and edges are focusable with the keyboard.
- **Comparison:**
  - Large 87% score and 3 evidence cards.
  - Two syntax-highlighted code panels, using a tiny tokenizer.
  - A match list (1-4); clicking one scrolls both panels to the matching lines via refs.
- **Evidence:**
  - Four sections.
  - AST tree rendered with box-drawing connectors, with TED 14 and 82%.
  - A Winnowing fingerprint block timeline, with 42/58 matched and 72% coverage.
  - A stylometry historical-vs-current table with bars, labeled "Supporting evidence".
  - An "Evidence Summary" card with Supporting and Limitations lists, and a "View Raw Evidence" modal.
- **Authorship:** student selector, a timeline of Lab 01-04 plus Current, 5 profile cards, a comparison visualization, and a disclaimer banner.
- **Review:** case ID CG-2026-0142, the evidence summary, a 5-item checklist, notes, and the actions "Mark as Reviewed", "Request Further Investigation", "Dismiss Case" and "Record Academic Review Decision".
  - The decision button stays disabled until the checklist is complete, and the actions fire toasts.
- **Reports:** 4 report types with metadata and View, Export PDF and Export CSV actions. Export fires a toast.
- **Import:** a 5-step stepper. "Retrieve Submissions" simulates loading, then shows the language detection result (Python 112, Java 72), then "Begin Analysis".
- **Language:** all copy follows "High similarity detected / Requires review / Supporting evidence". The strings "guilty", "plagiarism confirmed" and "Confirm Plagiarism" are never used.

## Responsive and accessibility
- Check at 1440, 1280, 1024, 768 and 390px. Grids collapse, tables get a horizontal scroll wrapper, and the code panels stack below 1024px.
- Skip link, visible focus rings, ARIA labels, `<th scope>`, and `aria-current` on the nav.

## Verification
- Run `pnpm build` once to catch type and build errors.
- Preview each route in the running dev server at 1440px and 390px.
  - Check the match-scroll behavior and the drawer.
  - Check the review checklist gating.
  - Confirm that no forbidden wording appears (grep).
