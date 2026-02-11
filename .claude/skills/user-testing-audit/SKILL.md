---
name: user-testing-audit
description: Run a deep user-testing audit on a live URL (crawl, link integrity, image loading, contrast/a11y, layout heuristics, mobile behavior, no-JS SSR predicates, SEO/Lighthouse), then write a dated markdown issue report with prioritized findings and acceptance criteria.
---

# User Testing Audit

Run a structured user-testing pass for a live website and produce an actionable markdown report.

## Trigger

Use this skill when the user asks to:

- test a deployed site or URL,
- run QA/user testing,
- find UI/UX defects (broken links/images, contrast, spacing/layout issues),
- produce a bug list with priorities.

## Required Input

If URL is missing, ask exactly one question:

`What URL should I audit?`

Do not proceed without a valid `https://...` URL.

## Output Contract

Always produce:

1. A dated markdown report in `docs/audits/user-testing/`
2. A JSON artifact with raw evidence
3. A SEO summary JSON artifact (`...-seo-summary.json`) and raw Lighthouse artifact folder (`...-seo-artifacts/`)
4. A prioritized issue list (`P0/P1/P2`) with acceptance criteria per issue
5. Explicit no-JS predicate summary per key route (`meaningful H1`, bailout marker, home i18n leakage, booking-funnel key leakage, booking CTA fallback, visible `Book Now` label, homepage `mailto:` contact link, homepage social-link accessible names, deals parity, snapshot date)
6. Explicit hydrated booking transaction summary (`home CTA -> modal -> provider handoff`, `room-rate CTA -> confirm -> provider handoff`)
7. Deployment provenance in report frontmatter (`Deployment-URL`, `Deployment-Run`, `Deployment-Commit`)
8. For reruns: explicit delta vs previous report (`Resolved`, `Still-open`, `Regressions/new`)

## Workflow

### 1) Resolve a fresh immutable staging URL first (required for staging audits)

Never reuse an old `https://<hash>.brikette-website.pages.dev` URL. Those are immutable and can mask whether a fix was deployed.

For Brikette staging, resolve the newest URL from the latest successful `Deploy Brikette` workflow run on `staging`:

```bash
node .claude/skills/user-testing-audit/scripts/resolve-brikette-staging-url.mjs
```

This returns JSON:

- `url` (fresh immutable URL, defaulting to `/en`)
- `runId`
- `runUrl`
- `headSha`

If the latest run is still in progress, the resolver waits and polls until completion (or timeout). Use the returned `url` as `<TARGET_URL>` in all audit steps.

### 2) Run automated audit (expanded default; includes no-JS + SEO by default)

```bash
node .claude/skills/user-testing-audit/scripts/run-user-testing-audit.mjs \
  --url <TARGET_URL> \
  --slug <DEPLOYMENT-OR-BRANCH-SLUG> \
  --max-crawl-pages 140 \
  --max-audit-pages 36 \
  --max-mobile-pages 24
```

Optional tuning (only when needed for very large sites):

```bash
node .claude/skills/user-testing-audit/scripts/run-user-testing-audit.mjs \
  --url <TARGET_URL> \
  --max-crawl-pages 120 \
  --max-audit-pages 30 \
  --max-mobile-pages 18
```

This generates:

- `docs/audits/user-testing/YYYY-MM-DD-<slug>.md`
- `docs/audits/user-testing/YYYY-MM-DD-<slug>.json`
- `docs/audits/user-testing/YYYY-MM-DD-<slug>-screenshots/`
- `docs/audits/user-testing/YYYY-MM-DD-<slug>-seo-summary.json`
- `docs/audits/user-testing/YYYY-MM-DD-<slug>-seo-artifacts/`

The script includes a sitewide image-asset integrity sweep across discovered internal routes, so broken `/img/...` URLs are reported even if a page is outside the smaller desktop/mobile audit subset.
It also includes deterministic no-JS route checks on homepage/rooms/experiences/how-to-get-here/deals (including booking-funnel key leakage, booking CTA fallback semantics, visible `Book Now` label coverage, and homepage contact/accessibility checks), hydrated booking transaction checks (CTA interaction + provider handoff), and Lighthouse checks for homepage + rooms + help/assistance.

### 3) Validate critical findings manually

Do targeted repro checks for high-severity findings from the generated report:

- Broken internal routes (open failing URL directly)
- Suspected i18n key leakage pages
- No-JS route checks (raw HTML for `/en`, `/en/rooms`, `/en/experiences`, `/en/how-to-get-here`, `/en/deals`)
- Mobile menu state/focus issues
- Contrast failures on key CTAs/headings

### 4) Review generated SEO + no-JS sections (required)

The audit script now emits:

- `## No-JS Predicate Summary` in markdown
- `## Booking Transaction Summary` in markdown
- `## SEO/Lighthouse Summary` in markdown
- `...-seo-summary.json`
- `...-seo-artifacts/`

If Lighthouse/no-JS artifacts expose issues not represented in Findings Index, update the findings list before finalizing.

### 5) Compare against prior audit when this is a rerun

When re-auditing a previously reported issue set:

- link the prior report in the new report frontmatter/body,
- summarize issue delta (`P0/P1/P2` before vs after),
- call out `resolved`, `regressed`, and `still-open` findings explicitly.

### 6) Return concise summary to user

In chat, provide:

- total issues by priority,
- top blockers first,
- link/path to markdown report,
- link/path to SEO summary artifact,
- deployment source (immutable URL + workflow run URL + commit SHA),
- immediate next fix recommendation.

## Prioritization Rules

Use these defaults unless user requests different severity mapping:

- `P0`: blocks core tasks, major broken navigation/content, severe trust failures
- `P1`: materially degraded UX/accessibility but workaround exists
- `P2`: quality polish, minor accessibility/ergonomics, non-blocking noise

## Report Requirements

Each issue entry must include:

- clear title and priority,
- concrete evidence (URLs/selectors/status/error snippets),
- acceptance criteria checklist that is testable.

Keep issue descriptions factual and reproducible.
