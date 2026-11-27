# CodeGuard Frontend (Figma Make Prototype)

CodeGuard: A Feasibility Study of a Structural Plagiarism Detection System Using Abstract Syntax Tree and Code Stylometry for Java and Python Programming Exercise Submissions.

This is the frontend design prototype for the Human-Computer Interaction (HCI) midterm project. It uses mock data. The analysis backend and the Google Classroom connection are not implemented here.

- **Team:** John Christian D.C. Alvarez, Jay-ar Alejandre, Rica Marie Maderazo, Francheska Hernandez
- **Course:** Human-Computer Interaction
- **Instructor:** Danny Boy M. Casimero
- **Design source / Prototype:** https://www.figma.com/design/UOD7U0R7bq3gMVUqJLD6j7/CodeGuard-Figma-Prototype-Real?node-id=0-1&p=f&t=mh6EghKZarRgqilF-0

---

## Screens

| Screen | Purpose |
|---|---|
| Landing Page | Introduces CodeGuard, with Log in and Connect to Google Classroom entry points |
| Login pop-up | Email and password, remember me, Forgot Password, Google sign-in |
| Forgot Password | Sends a password reset link by email |
| Dashboard / Import from Google Classroom | Four-step flow: select course, select assignment, retrieve submissions, start analysis |
| Submissions | Search, filters, similarity score, review status, pagination |
| Similarity Analysis | Attention banner, score distribution, ranked comparisons |
| Reports | Summary metrics, charts, generated reports (View / PDF / CSV) |
| Settings | Review thresholds, Winnowing parameters, display preferences |

---

## AI Build Process & Prompts

This frontend was built iteratively using **Figma Make**. Each screen was prompted separately, then refined with follow-up prompts and manual edits.

### 1. Initial Scaffolding & Layout
**Goal:** Establish the shared app layout (header, sidebar, content area) and the visual style used by every screen.

<details>
<summary>View Prompt</summary>

> "Build a desktop web app layout for CodeGuard, a plagiarism detection tool for programming instructors. Use a periwinkle top bar with the CodeGuard logo, a user profile (Elena Castillo, Professor) and a notification bell. Add a light-blue sidebar with Dashboard, Submissions, Similarity Analysis, Reports, and Settings. Use navy buttons, monospace headings, a clean sans-serif body font, rounded cards, and light borders."
</details>

**Result & Adjustments:** Generated the shared layout cleanly. Manually adjusted the sidebar active-item color, header spacing, and breadcrumb text so all screens matched.

### 2. Landing Page & Authentication
**Goal:** Introduce the system and let users log in or recover their password.

<details>
<summary>View Prompt</summary>

> "Create a landing page for CodeGuard with a navigation bar (Features, How it works, About, Log in), a large CodeGuard title, a short description, a 'Connect to Google Classroom' button, a 'Learn more' button and a two-panel code similarity illustration (Student A vs Student B). Then add a login pop-up with email, password, remember me, Forgot password link, Log in button, Sign in with Google, and a Register link. Add a Forgot Password page with an email field, a Send reset link button and a Back to log in link."
</details>

**Result & Adjustments:** Layout and copy were generated as requested. Manually added the "Incorrect email or password." error state to the login pop-up.

### 3. Complex Component / State Logic (Submissions)
**Goal:** Handle searching, filtering and sorting of submissions.

<details>
<summary>View Prompt</summary>

> "Create a Submissions screen with a search field (student or ID), filters for course, assignment, language, review status, and date range, and a Clear filters link. Below it, add a table with student, course, assignment, language, submitted date, similarity score badge, review status badge, and an action link. Sort by similarity score, show 'Showing 1-5 of 12 submissions', and add pagination. Use mock data for 12 submissions."
</details>

**Result & Adjustments:** Table and filters were generated cleanly. Manually fixed the badge colors (red for high, amber for moderate, green for low) and added text labels like "High" and "Mod." so status is not shown by color alone.

### 4. Similarity Analysis & Reports
**Goal:** Show ranked comparisons, score distribution, and generated reports.

<details>
<summary>View Prompt</summary>

> "Create a Similarity Analysis screen with a yellow attention banner ('3 submissions need attention'), filters for score band, language, and course, a bar chart of similarity score distribution (0-20% to 81-100%) and a ranked comparisons table (student pair, score, language, review status, Compare/View report action). Then create a Reports screen with filters, four metric cards (total submissions, cases reviewed, requiring investigation, average similarity), an average similarity by laboratory chart, a score distribution chart, and a generated reports table with View, PDF, and CSV links."
</details>

**Result & Adjustments:** Charts and tables were generated with the mock data. Manually changed the chart values and report names so they match across both screens.

### 5. Settings & Styling Polish
**Goal:** Let instructors configure review thresholds and display preferences, then polish the overall look.

<details>
<summary>View Prompt</summary>

> "Create a Settings screen with an active course selector, review thresholds (High 70% and above, Moderate 40-69%, Low below 40%), analysis parameters (Winnowing k-gram, window size, minimum prior submissions), display preferences (table row density: Comfortable, Standard, Compact, and a toggle for similarity score badges), and Discard changes / Save changes buttons with a note that changes affect future analyses only."
</details>

**Result & Adjustments:**
* **Prompt Focus:** Asked Figma Make to keep spacing, fonts, and button styles consistent across all screens.
* **Manual Fixes:** Added the "Saved" confirmation badge and checked text contrast on the colored badges.

### 6. Connecting the Prototype
**Goal:** Link screens into the user flows from the handoff document.

**Result & Adjustments:** Linked Login → Dashboard, Forgot Password → Back to log in, and sidebar navigation between the main sections. Row actions (Review, Compare, View report) are not fully functional in the prototype.

---

## Design Tokens (summary)

| Token | Value |
|---|---|
| Primary | Periwinkle blue `#5479F7` |
| Navy | `#0B1F5C` |
| Typography | JetBrains Mono (headings, nav), DM Sans (body) |
| Spacing | 4 px base scale |
| Radius | 6 px (inputs, badges), 12 px (cards, modal) |
| Shadow | 1 px border on cards, soft shadow on the modal |

---

## Running the Project

1. Open the CodeGuard repository
2. Type git clone [GitHub link].
3. To run locally, open VS Code, then:

```bash
npm install
npm run dev
```

---

## Known Limitations

- Desktop/laptop layout only. Responsive behavior has not been verified.
- All data is mock data. There is no real Google Classroom connection, authentication, or analysis engine.
- Python and Java only.
- The similarity score is a review indicator, not proof of plagiarism. Instructors make the final decision.
- Report View / PDF / CSV actions and Settings save behavior are not fully functional.

---



