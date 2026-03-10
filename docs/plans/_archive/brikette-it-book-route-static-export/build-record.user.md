---
Status: Complete
Feature-Slug: brikette-it-book-route-static-export
Completed-date: 2026-02-26
artifact: build-record
Build-Event-Ref: docs/plans/brikette-it-book-route-static-export/build-event.json
---

# Build Record — Brikette IT Locale /book Route Static Export

## What Was Built

**Verification (TASK-01):** The existing `apps/brikette/out/` directory was inspected to confirm whether the static export produces an IT locale book page. The check revealed that `apps/brikette/out/it/book.html` is present. A critical path correction was made: the plan had assumed the output format was `it/book/index.html` (nested, with trailingSlash), but Next.js `output: 'export'` without `trailingSlash: true` produces flat `.html` files. All downstream task paths were corrected to `it/book.html`.

**CI assertion (TASK-02):** A single `test -f apps/brikette/out/it/book.html` line was added to the "Validate static export output" step in `.github/workflows/brikette.yml`. This assertion will now fail CI immediately if a future change accidentally prunes the IT locale from the static export output. The existing assertions (`en.html`, `_next/static`, file count) are unchanged.

**Unit test (TASK-03):** A new `it()` block was added to `apps/brikette/src/test/routing/staticExportRedirects.test.ts` asserting that `buildLocalizedStaticRedirectRules()` emits all three IT book redirect rule variants (`/it/prenota`, `/it/prenota/`, `/it/prenota/*`). All three existing tests plus the new test pass (3/3 → maintained). This guards against a regression in `slug-map.ts` (`book.it = "prenota"`) or the redirect-generation logic silently dropping the IT book rule.

**Strict health check (TASK-04):** Three files were modified together to add strict no-redirect health check capability. `scripts/post-deploy-health-check.sh` gained two new functions (`check_url_strict`, `retry_check_strict`) that use `curl -sI --max-redirect 0` and accept only HTTP 200 (not 3xx). A `STRICT_ROUTES` env var loop was added after the existing `EXTRA_ROUTES` loop. `.github/workflows/reusable-app.yml` gained a `healthcheck-strict-routes` input wired to `STRICT_ROUTES`. `.github/workflows/brikette.yml` staging job now passes `healthcheck-strict-routes: "/it/prenota"`, so that every staging deploy verifies `/it/prenota` returns a transparent 200 rewrite rather than a 301 redirect.

**Superseded (TASK-05):** No source code fix was needed. The contingent task to diagnose an absent artifact was superseded by TASK-01's confirmation that the artifact is present.

## Tests Run

| Command | Result |
|---|---|
| `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs --testPathPattern=staticExportRedirects --no-coverage` | 3/3 pass |
| `test -f apps/brikette/out/it/book.html` | exit 0 (PRESENT) |
| `test -f apps/brikette/out/it/book/index.html` | exit 1 (ABSENT — confirms flat format) |
| YAML lint: `brikette.yml`, `reusable-app.yml` | Valid |
| Shell syntax: `post-deploy-health-check.sh` | Valid |

## Validation Evidence

**TC-02 (CI assertion):**
- TC-02-01: `test -f apps/brikette/out/it/book.html` → exit 0. PASS.
- TC-02-02: `test -f apps/brikette/out/it/book/index.html` → exit 1 (confirms assertion is load-bearing for the correct path). PASS.
- TC-02-03: `en.html`, `_next/static`, file count assertions all pass without regression. PASS.

**TC-03 (unit test):**
- TC-03-01: New IT book rule test passes green on first run. PASS.
- TC-03-02: All three variant rules asserted (`/it/prenota`, `/it/prenota/`, `/it/prenota/*`). PASS.
- TC-03-03: Existing two tests continue to pass. PASS.

**TC-04 (strict health check):**
- TC-04-01/02: `check_url_strict` uses `--max-redirect 0`, accepts only 200, returns non-zero for 301. Shell syntax valid. PASS.
- TC-04-03: Default `EXTRA_ROUTES=/api/health` unchanged in `reusable-app.yml`. No regression in existing check behavior. PASS.
- TC-04-04: `healthcheck-strict-routes` added to staging job only. Production job unaffected. PASS.
- YAML validation: both files parse cleanly. PASS.

## Scope Deviations

`.github/workflows/reusable-app.yml` was added to TASK-04 Affects during implementation. The reusable workflow needed a new `healthcheck-strict-routes` input to wire `STRICT_ROUTES` through to the health check script. Without this, the strict check capability could not be plumbed from the `brikette.yml` caller. Scope expansion is bounded to the same task objective (health check hardening for `/it/prenota`).

## Outcome Contract

- **Why:** Italian is the primary non-English language for Positano visitors; `/it/prenota` is the booking entry point distributed through Italian marketing. Redirecting to `/en` loses conversion and degrades SEO for the IT locale.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `/it/prenota` serves a 200 response with Italian booking content in the Cloudflare Pages static export; a CI test or smoke assertion guards against regression.
- **Source:** auto
