# Critique History: lp-responsive-qa-skill

## Round 1 — 2026-02-24

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Major | Suggested Task Seeds → T6; Dependency & Impact Map; Planning Constraints | Skill registration target wrong: `.claude/settings.json` is not the skill registry. Actual mechanism is `scripts/agents/generate-skill-registry --write` → `.agents/registry/skills.json`. |
| 1-02 | Major | Frontmatter | `Execution-Track: business-artifact` misclassifies the deliverable. The deliverable is developer-tool markdown files. Correct track is `code`. Misclassification triggers wrong downstream checks (requires Delivery & Channel Landscape, which is absent). |
| 1-03 | Moderate | Evidence Audit → Key Modules / Files | Ghost script citation: `.claude/skills/meta-user-test/scripts/run-meta-user-test.mjs` does not exist. Actual files: `run-user-testing-audit.mjs`, `run-full-js-off-sitemap-crawl.mjs`, `resolve-brikette-staging-url.mjs`. |
| 1-04 | Moderate | Capture Procedure pseudocode | Missing `fs.mkdir({ recursive: true })` before first `page.screenshot()` call. Script will crash on first run if output directory does not exist. |
| 1-05 | Moderate | Suggested Task Seeds → T2 | Per-app dark mode discovery not explicitly required in T2 scope. Risk: T2 implemented with caryina-only pattern; other apps produce wrong screenshots silently. |
| 1-06 | Moderate | Constraints & Assumptions; Evidence Audit | Breakpoint claim ("no custom breakpoints; Tailwind defaults apply") not fully verified — `tailwind.config.mjs` delegates to `@acme/tailwind-config` preset; that package was not inspected. Secondary evidence (CSS file usage) is valid but primary source is unread. |
| 1-07 | Moderate | Logic / Reasoning | The skill output is called a "fact-find planning brief" but lacks Confidence Inputs, Hypothesis section, and Planning Readiness — it is an audit brief, not a true lp-do-fact-find artifact. May create wrong expectations for lp-do-plan. |
| 1-08 | Minor | Evidence Audit → Key Modules / Files | Screenshot naming convention description slightly imprecise (`<app>-<component>-<variant>[-v<n>][-dark|-light].png` vs observed pattern `<app>-<component>[-<variant>][-<mode>].png`). Not decision-blocking. |
| 1-09 | Minor | Decision frame | Decision owner not named anywhere in document. |

### Issues Confirmed Resolved This Round

None (first round).

### Issues Carried Open (not yet resolved)

| Prior ID | Severity | Rounds Open | Summary |
|---|---|---|---|
| 1-06 | Moderate | 1 | Breakpoint claim partially unverified — `@acme/tailwind-config` preset package not inspected for custom breakpoints. Needs verification before T2 is built. |
| 1-07 | Moderate | 1 | Output labelled "fact-find planning brief" but structurally not a lp-do-fact-find artifact. Report template (T5) should clarify this distinction to avoid downstream confusion. |

### Autofix Applied This Round

| Fix | Section | Change |
|---|---|---|
| AF-1 | Frontmatter | Changed `Execution-Track: business-artifact` → `Execution-Track: code` |
| AF-2 | Evidence Audit → Key Modules / Files | Corrected ghost script path from `run-meta-user-test.mjs` to `run-user-testing-audit.mjs`; noted sibling scripts |
| AF-3 | Capture Procedure pseudocode | Added `const { mkdir } = require('fs/promises')` and `await mkdir(outputDir, { recursive: true })` before screenshot loop; updated hardcoded paths to use `outputDir` variable |
| AF-4 | Suggested Task Seeds → T6 | Replaced `.claude/settings.json` skill registry claim with correct `scripts/agents/generate-skill-registry --write` + `.agents/registry/skills.json` target |
| AF-5 | Suggested Task Seeds → T2 | Expanded T2 to require explicit per-app dark mode discovery step before writing capture module |
| AF-6 | Planning Constraints & Notes → Must-follow patterns | Added correct skill registration pattern |
| AF-7 (consistency scan) | Dependency & Impact Map | Corrected residual `.claude/settings.json` reference found during AF-3 scan |

### Score

**Round 1: 3.5/5.0 — partially credible**

Post-autofix residual open issues: 1-06 (Moderate, needs breakpoint verification), 1-07 (Moderate, output naming clarity), 1-08 (Minor), 1-09 (Minor).

## Round 2 — 2026-02-24

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 2-01 | Major | Capture Procedure (`modules/capture.md` guidance) | Dark mode guidance proposed `page.evaluate()` before first navigation, which executes on `about:blank` and can fail to set target-origin storage. |
| 2-02 | Major | DOM Verification pseudocode (`modules/dom-verify.md` guidance) | Overflow snippet referenced `r` outside scope in `.map(...)`, which would throw at runtime and break DOM verification. |
| 2-03 | Moderate | Fact-find structure | `Test Landscape` section missing for a `code` execution track brief, weakening validation planning and downstream test-task shaping. |
| 2-04 | Moderate | Existing Signal Coverage + Confidence wording | Vision-analysis evidence wording overstated certainty despite non-persisted evidence source, inflating confidence language. |

### Issues Confirmed Resolved This Round

| Prior ID | Severity | Summary | How resolved |
|---|---|---|---|
| 1-06 | Moderate | Breakpoint claim partially unverified | Added primary-source verification from `packages/tailwind-config/src/index.ts` and root `tailwind.config.mjs`, confirming no custom `screens`. |
| 1-07 | Moderate | Output labelled fact-find but lacked contract spine | Output contract now explicitly requires `Scope`, `Evidence Audit`, `Confidence Inputs`, `Planning Readiness`, and required frontmatter (including `artifact: fact-find`). |
| 1-09 | Minor | Decision owner not named | Added explicit decision owner in `## Planning Readiness`. |

### Issues Carried Open (not yet resolved)

None.

### Autofix Applied This Round

| Fix | Section | Change |
|---|---|---|
| AF-1 | Capture Procedure | Rewrote dark mode injection guidance to use origin-safe `page.addInitScript(...)` (or post-navigation set + reload), removing incorrect pre-navigation `page.evaluate()` pattern. |
| AF-2 | DOM Verification pseudocode | Fixed overflow snippet by computing `getBoundingClientRect()` inside `.map(...)` and removing out-of-scope `r` reference. |
| AF-3 | Output — Fact-Find Brief | Added required `lp-do-fact-find` contract spine sections and frontmatter expectations. |
| AF-4 | Suggested Task Seeds → T5 | Expanded report-template task to require contract sections and `artifact: fact-find` frontmatter. |
| AF-5 | Test Landscape | Added full `## Test Landscape` section with infrastructure, coverage, gaps, assessment, and recommended validation approach. |
| AF-6 | Evidence Gap Review | Updated breakpoint evidence to include preset source verification (`packages/tailwind-config/src/index.ts`). |
| AF-7 | Planning Readiness | Added explicit decision owner line. |
| AF-8 | Existing Signal Coverage + Confidence Inputs | Downgraded H2 signal confidence to Medium and softened confidence wording from "confirmed" to "provisionally validated." |
| AF-9 | Suggested Task Seeds + Execution Routing Packet | Promoted T7 from optional to required validation and aligned sequencing text to T1–T7. |

### Score

**Round 2: 4.5/5.0 — credible**

Delta vs Round 1: **+1.0**, justified by closure of both carried Moderates (1-06, 1-07) plus correction of two newly discovered Major implementation defects (2-01, 2-02) and one structural Moderate (2-03).
