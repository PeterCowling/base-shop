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
- **related_skills:** `lp-design-system`, `lp-design-spec`, `lp-design-qa`, `tools-bos-design-page`
