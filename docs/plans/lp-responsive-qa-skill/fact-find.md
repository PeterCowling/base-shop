---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-02-24
Last-updated: 2026-02-24
Feature-Slug: lp-responsive-qa-skill
Execution-Track: code
Deliverable-Family: doc
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-plan, lp-design-qa
Related-Plan: docs/plans/lp-responsive-qa-skill/plan.md
Business-OS-Integration: off
Business-Unit: none
Card-ID: none
direct-inject: true
direct-inject-rationale: User proposed a new skill design as a /lp-do-fact-find argument — not triggered from an idea card.
---

# lp-responsive-qa Skill — Fact-Find Brief

## Scope

### Summary

A new skill is needed that takes browser-rendered screenshots of a specified page or route at multiple canonical viewport widths, visually analyzes those captures for layout integrity and content overflow, cross-references the DOM for precise element attribution, and outputs findings as a fact-find planning brief ready for `lp-do-build` to action.

The skill fills a capability gap between two existing skills:
- **`lp-design-qa`** — static code analysis of Tailwind classes and token usage; explicitly prohibits browser rendering or screenshot capture.
- **`meta-user-test`** — live browser functional testing (sitemap crawl, booking flows, JS-on/off); not focused on targeted responsive visual QA at individual breakpoints.

No existing skill renders a page at multiple viewport widths, captures pixel-accurate screenshots, reads them visually, and produces element-attributed layout issues.

### Goals

- Define the complete design for a new skill: `lp-responsive-qa`
- Specify the skill's intake protocol, capture procedure, visual analysis protocol, DOM verification procedure, issue taxonomy, severity model, and output contract
- Provide enough specification detail that `lp-do-build` can create all skill files without further input
- Establish screenshot naming conventions and output paths consistent with the existing `docs/screenshots/` convention

### Non-goals

- Actually run the skill in this fact-find (that is the skill's own responsibility at invocation time)
- Replace `lp-design-qa` (static analysis remains complementary; this skill is the rendered companion)
- Full sitemap crawling or functional/booking flow testing (that is `meta-user-test`)
- Lighthouse/performance metrics (that is `lp-launch-qa`)

### Constraints & Assumptions

- Constraints:
  - The MCP `browser_session_open` / `browser_observe` / `browser_act` tool stack does **not** support viewport resizing or `page.screenshot()` — it is accessibility-tree–only via CDP. Cannot be used for this skill.
  - Playwright is available in the local dev environment via `pnpm` / `node_modules`. The Bash tool can invoke Node.js scripts directly.
  - Claude's vision capability (reading image files) is the analysis engine. Screenshots must be saved to disk so the Read tool can load them as images.
  - The target app must be running locally (or at a reachable URL) when the skill is invoked.
- Assumptions:
  - Canonical breakpoints match Tailwind defaults used in this codebase: 375 (mobile), 768 (tablet / `md:`), 1024 (laptop / `lg:`), 1280 (desktop / `xl:`).
  - `chromium` is available via `playwright-core` or a linked Playwright install (confirmed: `meta-user-test` already uses this pattern).
  - Screenshot output naming should follow the existing `docs/screenshots/` convention: `<app>-<slug>-<width>w[-dark|-light].png`.
  - The skill operates in local dev (not staging); it does not depend on a deployed URL.

---

## Evidence Audit (Current State)

### Entry Points

- `.claude/skills/lp-design-qa/SKILL.md` — explicit boundary: "Not Allowed: Browser testing or screenshot capture"
- `.claude/skills/meta-user-test/SKILL.md` — screenshot output path: `docs/audits/user-testing/YYYY-MM-DD-<slug>-screenshots/`; focus is functional/sitemap coverage, not targeted breakpoint QA
- `.claude/skills/lp-design-qa/modules/domain-responsive.md` — four static checks (RS-01–RS-04): mobile-first class presence, breakpoint class compliance, touch target grep, overflow constraint grep. All done by reading `.tsx` files, not rendering.

### Key Modules / Files

- `.claude/skills/lp-design-qa/SKILL.md` — boundary definition and static audit workflow
- `.claude/skills/lp-design-qa/modules/domain-responsive.md` — current responsive check definitions (RS-01–RS-04)
- `.claude/skills/meta-user-test/SKILL.md` — existing live browser skill (for contrast and integration point)
- `.claude/skills/meta-user-test/scripts/run-user-testing-audit.mjs` — existing Playwright script pattern (reference for how to run Playwright from Bash; `run-full-js-off-sitemap-crawl.mjs` and `resolve-brikette-staging-url.mjs` also present in the same directory)
- `packages/mcp-server/src/tools/browser/driver-playwright.ts` — MCP browser driver (confirms: no `page.screenshot()`, no `setViewportSize()`)
- `packages/mcp-server/src/tools/browser.ts` — MCP tool registrations (confirms: 6 tools, none support screenshot capture)
- `docs/screenshots/` — existing screenshot naming convention (14 files, all `<app>-<component>-<variant>[-v<n>][-dark|-light].png`)
- `tailwind.config.mjs` — no custom breakpoints; Tailwind defaults apply (sm=640, md=768, lg=1024, xl=1280, 2xl=1536)
- `apps/caryina/src/styles/global.css` — confirms `md:` (768px) and `lg:` (1024px) as primary breakpoints in actual codebase usage

### Patterns & Conventions Observed

- **Playwright-via-Bash pattern** — confirmed working in this session: `node -e "const { chromium } = require('playwright'); (async () => { ... })()"` using `page.setViewportSize()` and `locator.screenshot()` / `page.screenshot()`. Evidence: `docs/screenshots/caryina-header-final-light.png` captured at viewport `{ width: 1280, height: 200 }`.
- **Screenshot naming** — evidence: `docs/screenshots/` contains `caryina-header-final-light.png`, `caryina-header-final-dark.png`, `caryina-theme-toggle-v2-light.png`. Pattern: `<app>-<component>[-<variant>][-<mode>].png`.
- **Skill module structure** — evidence: `lp-design-qa/modules/` (5 files), `lp-launch-qa/modules/` (7 files). Pattern: one module per domain concern + one report template.
- **SKILL.md frontmatter** — evidence: all skills use `name`, `description`, `operating_mode` keys in YAML frontmatter.
- **Issue attribution standard** — evidence: `lp-design-qa` requires "every issue cites file path and line number" and "Expected vs Actual state and recommended fix". The new skill should require element path + breakpoint + bounding box evidence.

### Dependency & Impact Map

- Upstream dependencies:
  - A running local dev server (app under test must be available)
  - Playwright available in the environment (already present via `meta-user-test` usage)
  - No dependency on `lp-design-spec` (unlike `lp-design-qa` which requires a spec)
- Downstream dependents:
  - `lp-do-build` — consumes the fact-find/issue list to fix identified problems
  - `lp-design-qa` — the new skill is complementary; can be run before or after
  - Human PR reviewers — the output report provides a visual evidence base
- Likely blast radius:
  - New files only: `.claude/skills/lp-responsive-qa/SKILL.md` + module files + report template
  - No changes to existing skills or production code
  - Must register the skill by running `scripts/agents/generate-skill-registry --write` (adds to `.agents/registry/skills.json`)

---

## Skill Design Specification

This section is the primary deliverable. It specifies the complete design of `lp-responsive-qa` for implementation by `lp-do-build`.

### Skill Identity

```yaml
name: lp-responsive-qa
description: >
  Render a specified app page at canonical breakpoints using Playwright,
  capture screenshots, visually analyze them for layout breakdown and
  content overflow, cross-reference the DOM for precise element attribution,
  and output a structured issue list as a fact-find planning brief ready
  for lp-do-build to action.
operating_mode: AUDIT + CAPTURE
```

### Invocation

```
/lp-responsive-qa <app> <route>
/lp-responsive-qa <app> <route> --mode dark|light|both
/lp-responsive-qa <app> <route> --url http://localhost:<port>/<route>
/lp-responsive-qa <app> <route> --widths 375,768,1024,1280
```

If `<app>` and `<route>` are not provided, the skill asks:
1. "Which app are we auditing? (e.g. `caryina`, `xa-b`, `prime`, `reception`)"
2. "Which page or route? (e.g. `/en`, `/en/shop`, `/en/product/[slug]`)"
3. "Which theme mode? light / dark / both (default: both)"

### Canonical Breakpoints

| Label | Width | Rationale |
|-------|-------|-----------|
| mobile | 375px | iPhone SE; smallest common viewport; below Tailwind `sm` (640px) |
| tablet | 768px | Tailwind `md:` breakpoint; primary layout switch in caryina/xa-b |
| laptop | 1024px | Tailwind `lg:` breakpoint; secondary layout switch |
| desktop | 1280px | Tailwind `xl:` breakpoint; comfortable wide layout |

The skill always captures all four unless `--widths` overrides.

Viewport height: 900px at all widths (sufficient to see above-the-fold without excessive scroll). Full-page screenshots are also captured for scroll analysis.

### File Output Structure

```
docs/screenshots/rwd-audit/
  YYYY-MM-DD-<app>-<route-slug>/
    <app>-<route-slug>-375w-light.png
    <app>-<route-slug>-375w-dark.png
    <app>-<route-slug>-768w-light.png
    <app>-<route-slug>-768w-dark.png
    <app>-<route-slug>-1024w-light.png
    <app>-<route-slug>-1024w-dark.png
    <app>-<route-slug>-1280w-light.png
    <app>-<route-slug>-1280w-dark.png
    <app>-<route-slug>-375w-full-light.png      (full-page)
    <app>-<route-slug>-375w-full-dark.png       (full-page)
    ... (full-page at all widths)

docs/plans/rwd-audit-<app>-<route-slug>/
  fact-find.md   (the planning brief output of this skill)
```

Route slug derivation: replace `/` with `-`, strip leading `-`. Example: `/en/shop` → `en-shop`.

### Capture Procedure (`modules/capture.md`)

The capture module defines a Node.js Playwright script run via the Bash tool:

```js
const { chromium } = require('playwright');
const { mkdir } = require('fs/promises');
const breakpoints = [375, 768, 1024, 1280];
const modes = ['light', 'dark']; // or subset per --mode flag

(async () => {
  const outputDir = `docs/screenshots/rwd-audit/${DATE}-${APP}-${ROUTE_SLUG}`;
  // Create output directory before any screenshots are written
  await mkdir(outputDir, { recursive: true });

  for (const width of breakpoints) {
    for (const mode of modes) {
      const browser = await chromium.launch({ headless: true });
      const colorScheme = mode === 'dark' ? 'dark' : 'light';
      const page = await browser.newPage({
        viewport: { width, height: 900 },
        colorScheme,
      });
      await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
      // Wait for hydration: wait for body to have rendered content
      await page.waitForSelector('main', { timeout: 15000 });
      const slug = `${APP}-${ROUTE_SLUG}-${width}w-${mode}`;
      await page.screenshot({ path: `${outputDir}/${slug}.png` });
      await page.screenshot({ path: `${outputDir}/${slug}-full.png`, fullPage: true });
      await browser.close();
    }
  }
})();
```

**Error handling:** If `waitForSelector('main')` times out, the skill reports "page did not render — check dev server" and stops.

**Dark mode injection:** Do not rely on `page.evaluate()` on `about:blank` before first navigation (wrong origin). Use `page.addInitScript(() => localStorage.setItem('theme-mode', 'dark'))` before `page.goto(...)`, or navigate once, set storage on the target origin, then reload.

### Visual Analysis Protocol (`modules/analyze.md`)

After all screenshots are captured, the skill uses the Read tool to load each image and analyze it with the following structured checklist per breakpoint:

**Issue types to detect:**

| Code | Type | What to look for |
|------|------|-----------------|
| OVF | Overflow | Any element visually exceeding the viewport width; horizontal scrollbar visible or implied |
| BLD | Bleed | Content visually outside its containing card/section boundary |
| WRF | Wrap-fail | Flex/grid children that should stack but remain in a row, causing compression or overflow |
| CLK | Clip | Text or image cut off by `overflow: hidden` without a visible affordance (ellipsis, "Show more") |
| STK | Stack-order | Wrong visual stacking order at a breakpoint (e.g. CTA appears before product image at mobile when it should be below) |
| SPC | Spacing-break | Obvious padding/gap collapse or expansion that breaks the visual rhythm |
| TGT | Target-size | Interactive element visually too small to tap comfortably at mobile (< 44px apparent height) |
| ALN | Alignment | Element visually misaligned relative to its siblings or parent grid |
| VIS | Visibility | Element unexpectedly hidden or invisible at a breakpoint |

**Analysis output per image:** For each detected issue, record:
- Issue code (from table above)
- Breakpoint width (px)
- Theme mode
- Human description: what is wrong and where ("nav links overflow container at 375px — text bleeds right")
- Screenshot reference (filename)
- Confidence: High / Medium (if uncertain, flag for DOM verification)

**Comparison analysis:** After reviewing all widths, note any issues that only appear at specific breakpoints (regression at exactly one width) vs persistent issues (present at all widths).

### DOM Verification Protocol (`modules/dom-verify.md`)

For each High-confidence or flagged Medium-confidence issue from visual analysis, the skill opens a Playwright session at the relevant viewport width and queries the DOM:

```js
// Example: verify an overflow issue at 375px
const page = ...; // at width=375
await page.goto(TARGET_URL, { waitUntil: 'networkidle' });

// Find elements that overflow the viewport
const overflowing = await page.evaluate(() => {
  const vw = window.innerWidth;
  return Array.from(document.querySelectorAll('*'))
    .filter(el => {
      const r = el.getBoundingClientRect();
      return r.right > vw + 2; // 2px tolerance
    })
    .map(el => {
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName,
        id: el.id,
        className: el.className.slice(0, 120),
        right: Math.round(r.right),
        width: Math.round(r.width),
        text: el.textContent?.slice(0, 80),
      };
    });
});
```

Similar queries for:
- **Clip detection**: `overflow: hidden` + `getBoundingClientRect()` height vs `scrollHeight`
- **Target size**: `getBoundingClientRect()` height < 44 on `button`, `a`, `[role="button"]`
- **Wrap-fail**: `getComputedStyle(el).flexWrap === 'nowrap'` combined with children overflowing

The DOM verification step converts "I see something wrong in the screenshot" into "the issue is at `<nav class="flex gap-5 ...">` in `apps/caryina/src/components/Header.tsx`, whose right edge is 412px at a 375px viewport".

### Issue Taxonomy and Severity

| Severity | Definition | Examples |
|----------|-----------|---------|
| P0 | Page is broken at this breakpoint — layout collapsed, key content inaccessible, horizontal scroll introduced | Nav overflows viewport entirely; hero text hidden; checkout button inaccessible |
| P1 | Significant visual degradation; content present but substantially impaired | Product cards overlap at tablet; CTA wraps incorrectly; image bleeds container |
| P2 | Minor visual issue; content fully accessible but spacing/alignment off | Heading slightly misaligned; padding inconsistent; minor gap variation |

### Output — Fact-Find Brief

The skill outputs its findings as an `lp-do-fact-find`-compatible planning artifact with the required contract spine plus responsive-audit sections:

**Path:** `docs/plans/rwd-audit-<app>-<route-slug>/fact-find.md`

The brief includes:
- `## Scope` — page, breakpoints tested, theme modes
- `## Evidence Audit` — capture inputs, screenshot set, DOM verification artifacts
- `## Confidence Inputs` — Implementation/Approach/Impact/Delivery-Readiness/Testability with evidence
- `## Planning Readiness` — ready/no-go, blockers, recommended next action
- `## Screenshots` — table: breakpoint × mode → filename
- `## Issues Found` — each issue with: severity, type code, breakpoint, description, DOM evidence (element tag, class snippet, computed value), screenshot reference, suggested fix direction
- `## Summary Statistics` — count by severity and type
- `## Evidence Gap Review` — issues not DOM-verified and why
- `## Suggested Task Seeds` — one task per P0/P1 issue, formatted for `lp-do-plan`
- Frontmatter contract fields: `Status`, `Outcome`, `Execution-Track`, `Deliverable-Type`, `Feature-Slug`, `artifact: fact-find` (plus `Business-Unit` and `Card-ID` when BOS card path is used)

### Skill Operating Constraints

**Allowed:**
- Run Playwright via Bash to capture screenshots at specified URL + viewport
- Read screenshots via Read tool for visual analysis
- Execute read-only DOM queries via Playwright `page.evaluate()`
- Write screenshot files and the fact-find report

**Not allowed:**
- Code changes to the app under test
- Form submission, purchases, or any state-mutating browser actions
- Editing any existing skill files during a run
- Running against production URLs (local dev only, unless `--url` explicitly points to staging with user confirmation)

### Integration in the Skill Ecosystem

```
lp-design-spec (expected state)
       ↓
lp-do-build (implements UI)
       ↓
lp-responsive-qa  ← NEW: rendered visual breakpoint audit
       ↓
lp-design-qa (static token/a11y/visual code audit)
       ↓
lp-launch-qa (functional/compliance)
```

`lp-responsive-qa` sits between build and static QA. It catches what static analysis cannot: actual rendered overflow, real layout collapse, pixel-level spacing breaks. Its output feeds `lp-do-build` directly (via a planning brief) for targeted fixes before the full static + functional gates.

### Skill File Structure to Create

```
.claude/skills/lp-responsive-qa/
  SKILL.md                 — main skill doc (invocation, workflow, constraints, integration)
  modules/
    capture.md             — Playwright screenshot capture procedure and script template
    analyze.md             — visual analysis protocol (issue types, checklist, confidence rules)
    dom-verify.md          — DOM introspection queries for each issue type
    report-template.md     — fact-find output structure and issue entry format
```

---

## Hypothesis & Validation Landscape

### Key Hypotheses

| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | The Playwright-via-Bash capture pattern works reliably across all 4 breakpoints and both theme modes | Playwright available in env; dev server running | Low — can run in 5 min | Immediate |
| H2 | Claude's vision capability can accurately identify layout overflow and bleed issues from screenshots | Screenshot quality + image size | Low — run skill on one page | <1 hour |
| H3 | DOM `getBoundingClientRect` queries reliably identify overflowing elements | Playwright page.evaluate access | Low | <30 min |
| H4 | The fact-find output format is sufficient for `lp-do-plan` to create actionable fix tasks | lp-do-plan compatibility | Low | After first real run |

### Existing Signal Coverage

| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | `page.setViewportSize()` + `page.screenshot()` confirmed working at `{width:1280, height:200}` in this session | `docs/screenshots/caryina-header-final-light.png` | High |
| H2 | Claude identified likely layout issues from header screenshots in this session | Manual visual review notes in this fact-find (non-persisted benchmark) | Medium |
| H3 | `page.evaluate()` DOM querying is standard Playwright — confirmed available | Playwright docs + meta-user-test script pattern | High |
| H4 | lp-do-fact-find output feeds lp-do-plan in all other skills in this codebase | `.claude/skills/lp-do-plan/` integration contract | High |

### Recommended Validation Approach

- Quick probes: After creating skill files, run `/lp-responsive-qa caryina /en` against the running dev server to validate the full end-to-end flow before merging.
- Structured tests: None required at skill-creation stage.
- Deferred: Expand to include partial-page screenshots (scroll positions) if full-page screenshots prove hard to analyze visually.

---

## Confidence Inputs

- Implementation: 90% — Playwright capture pattern is proven; DOM queries are standard; Claude vision for image analysis is provisionally validated. Main risk is Playwright binary availability on CI (not relevant here — skill is dev-only).
- Approach: 85% — The combination of screenshot → vision analysis → DOM verification is novel for this repo but logically sound. Risk: some layout issues may require multiple screenshots at different scroll positions to fully characterize.
- Impact: 85% — This skill addresses a real gap (confirmed by `lp-design-qa`'s explicit exclusion of screenshots and `meta-user-test`'s functional focus). First use case (caryina) is immediately available.
- Delivery-Readiness: 95% — Skill files are markdown; no external dependencies; no code changes to production apps; no approvals needed.
- Testability: 80% — The skill itself creates screenshots which are the test artifacts. Correctness of issue detection relies on Claude vision quality, which cannot be unit-tested but can be validated by running the skill and reviewing outputs.

Evidence basis: Scores are grounded in direct evidence from this session (Playwright pattern confirmed, vision analysis provisionally validated, gap confirmed via lp-design-qa SKILL.md).

---

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Playwright binary not found at runtime | Low | High — skill fails entirely | Document in SKILL.md: run `npx playwright install chromium` if missing; check `meta-user-test` script for how it handles this |
| Screenshots too small for Claude to read element details | Low | Medium — visual analysis misses issues | Use 1:1 pixel screenshots at 375px (not retina-scaled); confirm during validation run |
| Dark mode injection via localStorage doesn't work for all apps | Medium | Low — dark mode screenshots show light theme | Per-app dark mode injection method must be documented; caryina confirmed (localStorage `theme-mode`); other apps may differ |
| Too many issues found on first run — report becomes unwieldy | Low | Low — limit to P0/P1 in default run | Add `--severity P0,P1` flag to filter output |
| DOM overflow query produces false positives from fixed/sticky elements | Medium | Low — creates noise in issue list | Filter out `position: fixed` and `position: sticky` elements from overflow check |
| Skill overlaps lp-design-qa RS-01–RS-04 static checks | Low | Low — complementary, not duplicative | Document explicitly in SKILL.md: static checks confirm code structure; lp-responsive-qa confirms rendered output. Both are needed. |

---

## Test Landscape

### Test Infrastructure

- Frameworks: none required for markdown-only skill artifacts.
- Commands: `bash scripts/validate-changes.sh` (docs policy + targeted typecheck/lint gate).
- CI integration: standard repository CI gates (lint/typecheck/docs checks).

### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Skill content correctness | Manual audit | `docs/plans/lp-responsive-qa-skill/fact-find.md` | Current evidence is document-level, not executable tests |
| Capture procedure viability | Manual probe | `docs/screenshots/caryina-header-final-light.png` | Confirms Playwright capture path for one viewport |

### Coverage Gaps

- No automated validation for screenshot-issue classification accuracy.
- No automated contract check for generated responsive audit `fact-find.md` frontmatter/sections.

### Testability Assessment

- Easy to test:
  - Screenshot capture success/failure per breakpoint and mode.
  - Presence of required output files and report sections.
- Hard to test:
  - Vision-model precision/recall for layout defect detection.
- Test seams needed:
  - Deterministic fixture pages with seeded responsive defects.

### Recommended Test Approach

- Contract checks for generated report format (required frontmatter + core sections).
- Dry-run validation on `caryina /en` across 375/768/1024/1280 in light/dark modes.
- Manual reviewer pass over first run's issue list to calibrate false-positive rate.

---

## Planning Constraints & Notes

- Must-follow patterns:
  - Skill files follow `name`, `description`, `operating_mode` YAML frontmatter (evidence: all existing SKILL.md files)
  - Module files are referenced from SKILL.md with explicit paths (`modules/capture.md`)
  - Issue entries must cite element tag + class snippet + computed value (matches lp-design-qa standard)
  - Screenshot output path must be under `docs/screenshots/rwd-audit/` (consistent with existing `docs/screenshots/` tree)
  - Fact-find output at `docs/plans/rwd-audit-<app>-<route-slug>/fact-find.md` (standard loop artifact path)
  - Skill registration: after creating SKILL.md, run `scripts/agents/generate-skill-registry --write` to register `lp-responsive-qa` in `.agents/registry/skills.json`. The `.claude/settings.json` file is NOT the skill registry.
- Rollout/rollback expectations:
  - New skill files only — rollback is a simple `git revert`
  - No production code changes; no database changes; no infrastructure changes
- Observability expectations:
  - Skill run produces screenshot artifacts as physical evidence of what was tested
  - Fact-find brief is the durable audit record

---

## Suggested Task Seeds

- T1: Create `.claude/skills/lp-responsive-qa/SKILL.md` with full invocation spec, workflow steps, operating constraints, integration diagram, and quality checklist
- T2: Create `modules/capture.md` — Playwright screenshot capture procedure, script template (including `mkdir` for output directory creation before first screenshot write), error handling. Include a per-app dark mode discovery section: for each app (`caryina`, `xa-b`, `prime`, `reception`), enumerate the dark mode injection mechanism (localStorage key, CSS class, system preference) before writing the module — do not assume caryina's `localStorage.setItem('theme-mode', 'dark')` pattern applies universally.
- T3: Create `modules/analyze.md` — visual analysis protocol: issue type table (OVF/BLD/WRF/CLK/STK/SPC/TGT/ALN/VIS), per-breakpoint checklist, confidence rules, comparison analysis
- T4: Create `modules/dom-verify.md` — DOM introspection queries for each issue type; `getBoundingClientRect` overflow detection; touch target size check; flex wrap-fail detection; false-positive filters (fixed/sticky elements)
- T5: Create `modules/report-template.md` — fact-find output structure with required contract sections (`Scope`, `Evidence Audit`, `Confidence Inputs`, `Planning Readiness`), required frontmatter fields (including `artifact: fact-find`), issue entry format (severity, code, breakpoint, mode, description, DOM evidence, screenshot ref, fix direction), summary statistics table, task seed format
- T6: Register `lp-responsive-qa` in the skill registry by running `scripts/agents/generate-skill-registry --write`, which adds the new skill to `.agents/registry/skills.json`. Note: `.claude/settings.json` contains only MCP server config and permissions — it is not the skill registry.
- T7: Run `/lp-responsive-qa caryina /en` against the running dev server and verify that screenshots are captured at all 4 breakpoints, visual analysis detects known issues (e.g. header toggle position), and DOM queries return element-attributed evidence

---

## Execution Routing Packet

- Primary execution skill: `lp-do-build` (creates skill markdown files)
- Supporting skills: none required; `lp-do-plan` will sequence tasks T1–T7
- Deliverable acceptance package:
  - All 5 skill files exist and are non-empty
  - SKILL.md invocation examples are runnable (correct argument format)
  - Capture module contains a working Playwright script template (consistent with confirmed pattern from this session)
  - Report template produces a valid `lp-do-fact-find`-compatible output
  - Skill is invocable via `/lp-responsive-qa`
- Post-delivery measurement plan:
  - Run the skill once on `caryina /en` to confirm end-to-end: screenshots captured, visual analysis populated, DOM evidence present, fact-find written

---

## Evidence Gap Review

### Gaps Addressed

- **MCP browser tool capabilities** — investigated fully: `driver-playwright.ts`, `browser.ts`, `session.ts`, `observe.ts`, `act.ts`. Confirmed: no screenshot or viewport resize. Gap is real, not assumed.
- **Existing screenshot pattern** — confirmed via `docs/screenshots/` listing and examination of Playwright Bash script pattern used in this very session.
- **Breakpoints** — confirmed from `tailwind.config.mjs` and `packages/tailwind-config/src/index.ts` (no custom `screens` in root config or preset), plus `apps/caryina/src/styles/global.css` (`md:` / `lg:` usage in real app code).
- **`lp-design-qa` boundary** — confirmed "Not Allowed: Browser testing or screenshot capture" verbatim.
- **`meta-user-test` scope** — confirmed: functional/sitemap focus; screenshot output goes to `docs/audits/user-testing/`, not targeted breakpoint QA.

### Confidence Adjustments

- Implementation confidence raised from initial 80% to 90% after confirming the `page.screenshot()` + `setViewportSize()` pattern works correctly in the Bash tool (physical evidence: `docs/screenshots/caryina-header-final-light.png`).
- Approach confidence set to 85% (not higher) because vision-based analysis of layout issues is new to this skill ecosystem — the first real run will validate or refine the visual analysis protocol.

### Remaining Assumptions

- Per-app dark mode injection pattern will differ across apps. Caryina uses `localStorage.setItem('theme-mode', 'dark')`. Other apps (xa-b, prime, reception) may use different keys or CSS class injection. The skill must document a discovery step for new apps — assumed solvable at T2 task execution time.
- Playwright binary path may vary between machines. Assumed resolvable via `require('playwright')` from the monorepo's installed dependencies.

---

## Planning Readiness

- Status: Ready-for-planning
- Decision owner: Engineering operator owning `/lp-do-plan` + `/lp-do-build` execution for this feature
- Blocking items: None
- Recommended next step: `/lp-do-plan lp-responsive-qa-skill` to sequence and elaborate tasks T1–T7
