# Tool Skill Index

All `tool-*` / `tools-*` skills are listed here. Update this index when adding a new tool skill.
For naming, metadata, and classification rules, see `.claude/skills/tools-standard.md`.

---

## tool-process-audit

- **Invocation name:** `tool-process-audit`
- **Directory:** `.claude/skills/tool-process-audit/`
- **Description:** Diagnose a named or described business/engineering process for bottlenecks, risks, and optimization opportunities.
- **operating_mode:** `ANALYSIS + RECOMMENDATIONS`
- **trigger_conditions:** process review, workflow audit, bottleneck diagnosis, operational improvement, process mapping
- **related_skills:** `lp-do-critique`, `lp-do-fact-find`
- **Note:** Legacy `tool-` singular prefix; directory and invocation name are both `tool-process-audit`. No rename required.

---

## tools-bos-design-page

- **Invocation name:** `tools-bos-design-page`
- **Directory:** `.claude/skills/tools-bos-design-page/`
- **Description:** Generate or enhance HTML documentation with polished visual diagrams (Mermaid flowcharts, state machines, sequence diagrams, Chart.js dashboards).
- **operating_mode:** `GENERATE`
- **trigger_conditions:** add diagrams, visualise system, build KPI dashboard, improve documentation readability, HTML docs, Mermaid charts
- **related_skills:** `lp-design-system`, `tools-ui-frontend-design`

---

## tools-ui-contrast-sweep

- **Invocation name:** `tools-ui-contrast-sweep`
- **Directory:** `.claude/skills/tools-ui-contrast-sweep/`
- **Description:** Audit UI color contrast and visual-uniformity drift across breakpoints and theme modes; produces screenshot-backed accessibility findings.
- **operating_mode:** `AUDIT`
- **trigger_conditions:** accessibility, color contrast, WCAG, pre-launch QA, visual uniformity, dark mode audit
- **related_skills:** `tools-ui-breakpoint-sweep`, `lp-design-qa`, `lp-do-build`

---

## tools-ui-breakpoint-sweep

- **Invocation name:** `tools-ui-breakpoint-sweep`
- **Directory:** `.claude/skills/tools-web-breakpoint/`
- **Note:** Directory name (`tools-web-breakpoint`) differs from invocation name — legacy exception.
- **Description:** Systematically detect responsive layout failures (overflow, clipping, misalignment, broken reflow) across specified viewport widths with screenshot-backed evidence.
- **operating_mode:** `AUDIT`
- **trigger_conditions:** responsive layout, breakpoint QA, overflow, reflow failures, mobile layout, viewport testing
- **related_skills:** `tools-ui-contrast-sweep`, `lp-design-qa`, `lp-launch-qa`, `lp-do-build`

---

## tools-ui-frontend-design

- **Invocation name:** `tools-ui-frontend-design`
- **Directory:** `.claude/skills/frontend-design/`
- **Note:** Directory name (`frontend-design`) differs from invocation name — legacy exception.
- **Description:** Create distinctive, production-grade frontend interfaces grounded in this repo's design system.
- **operating_mode:** `GENERATE`
- **trigger_conditions:** build UI, web components, pages, frontend interface, design system implementation, production UI
- **related_skills:** `tools-design-system`, `lp-design-spec`, `lp-design-qa`, `tools-bos-design-page`

---

## tools-design-system

- **Invocation name:** `tools-design-system`
- **Directory:** `.claude/skills/tools-design-system/`
- **Description:** Apply design tokens and system patterns correctly. Reference for semantic colors, spacing, typography, borders, and shadows. Never use arbitrary values.
- **operating_mode:** `GENERATE`
- **trigger_conditions:** design tokens, semantic colors, spacing, typography, borders, shadows, Tailwind tokens, arbitrary values
- **related_skills:** `tools-refactor`, `lp-design-spec`, `lp-design-qa`, `tools-ui-contrast-sweep`

---

## tools-refactor

- **Invocation name:** `tools-refactor`
- **Directory:** `.claude/skills/tools-refactor/`
- **Description:** Refactor React components for better maintainability, performance, or patterns. Covers hook extraction, component splitting, type safety, memoization, and composition.
- **operating_mode:** `GENERATE`
- **trigger_conditions:** refactor, extract hook, split component, memoization, type safety, design tokens, component composition
- **related_skills:** `lp-do-build`, `tools-design-system`, `lp-design-qa`

---

## tools-meta-reflect

- **Invocation name:** `tools-meta-reflect`
- **Directory:** `.claude/skills/tools-meta-reflect/`
- **Description:** Capture session learnings and propose targeted improvements to docs, skills, or core agent instructions. Evidence-based only — closes the feedback loop directly by updating existing files.
- **operating_mode:** `ANALYSIS + RECOMMENDATIONS`
- **trigger_conditions:** session review, capture learnings, improve skill, update instructions, post-build reflection, close feedback loop
- **related_skills:** `lp-do-build`, `lp-do-fact-find`, `lp-do-plan`

---

## tools-review-plan-status

- **Invocation name:** `tools-review-plan-status`
- **Directory:** `.claude/skills/tools-review-plan-status/`
- **Description:** Report on the status of incomplete plans — how many tasks remain in each. Optionally run lp-do-factcheck on plans before reporting.
- **operating_mode:** `ANALYSIS + RECOMMENDATIONS`
- **trigger_conditions:** plan status, incomplete plans, tasks remaining, progress report, how many tasks left
- **related_skills:** `lp-do-factcheck`, `lp-do-build`
