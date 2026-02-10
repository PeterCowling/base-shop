---
name: user-testing-audit
description: Run a deep user-testing audit on a live URL (crawl, link integrity, image loading, contrast/a11y, layout heuristics, mobile behavior), then write a dated markdown issue report with prioritized findings and acceptance criteria.
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
3. A prioritized issue list (`P0/P1/P2`) with acceptance criteria per issue

## Workflow

### 1) Run automated audit (expanded default)

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

The script includes a sitewide image-asset integrity sweep across discovered internal routes, so broken `/img/...` URLs are reported even if a page is outside the smaller desktop/mobile audit subset.

### 2) Validate critical findings manually

Do targeted repro checks for high-severity findings from the generated report:
- Broken internal routes (open failing URL directly)
- Suspected i18n key leakage pages
- Mobile menu state/focus issues
- Contrast failures on key CTAs/headings

### 3) Lighthouse SEO pass (required)

Run desktop + mobile SEO checks on:
- homepage (`/<lang>`)
- rooms/discovery page (`/<lang>/rooms`)
- help/assistance page (`/<lang>/help` or localized equivalent)

Desktop:

```bash
npx lighthouse <TARGET_URL> \
  --chrome-flags='--headless --no-sandbox' \
  --preset=desktop \
  --only-categories=accessibility,best-practices \
  --output=json \
  --output-path=/tmp/lh-home-desktop.json
```

Mobile:

```bash
npx lighthouse <TARGET_URL_OR_KEY_PAGE> \
  --chrome-flags='--headless --no-sandbox' \
  --form-factor=mobile \
  --screenEmulation.mobile=true \
  --throttling-method=provided \
  --only-categories=accessibility,best-practices \
  --output=json \
  --output-path=/tmp/lh-mobile.json
```

Also generate a JSON summary artifact in `docs/audits/user-testing/` and link both:
- `...-seo-summary.json`
- `...-seo-artifacts/` (raw Lighthouse JSON files)

If Lighthouse adds findings not already in the markdown report, update the report and Findings Index.

### 4) Return concise summary to user

In chat, provide:
- total issues by priority,
- top blockers first,
- link/path to markdown report,
- link/path to SEO summary artifact,
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
