---
Type: Build-Record
Status: Complete
Domain: UI
Last-reviewed: 2026-03-13
Feature-Slug: caryina-button-strategy
Execution-Track: code
Completed-date: 2026-03-13
artifact: build-record
Build-Event-Ref: docs/plans/caryina-button-strategy/build-event.json
---

# Build Record: Caryina Button Strategy

## Outcome Contract

- **Why:** Local `.btn-primary` is a styling island: brand-token changes must be manually kept in sync between `global.css` and any DS-native button styles. Centralising on DS Button means one source of truth.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All caryina-owned call sites (12) use DS `<Button>` or an explicitly documented exception; `.btn-primary` CSS utility is removed from `global.css` once call sites are migrated.
- **Source:** auto

## What Was Built

TASK-01 migrated all 12 `.btn-primary` call sites in the caryina app to `<Button compatibilityMode="passthrough">` from `@acme/design-system/shadcn`. Six direct `<button>` replacements (error page, NotifyMeForm, CheckoutClient, admin login, InventoryEditor, ProductForm) received `<Button type="..." compatibilityMode="passthrough" className={...}>` wrapping with the shared `BTN_PRIMARY` className constant. Five Next.js `<Link>` sites (home CTA, cart checkout, 404 back-to-shop, shop filter "All" tab, shop filter family tabs) and one plain `<a>` element (admin products "New product") were migrated to `<Button asChild compatibilityMode="passthrough"><Link>` — the admin products `<a>` was upgraded to client-side navigation via Next.js `<Link>` as a side benefit.

The shared `BTN_PRIMARY` constant was extracted to `apps/caryina/src/styles/buttonStyles.ts`, removing the in-file duplication that would have occurred with 11 importing files. The entire `@layer components { .btn-primary { ... } }` block (formerly lines 38–58 in `global.css`) was deleted. All hover/active/focus-visible token chains from the original CSS rule are reproduced exactly via Tailwind v4 arbitrary-value syntax in the BTN_PRIMARY constant.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @apps/caryina typecheck` | Pass | Exit 0; 0 errors, 3 pre-existing warnings |
| `grep -rn "btn-primary" apps/caryina/src` | Pass (0 results) | Only comment in buttonStyles.ts |
| `grep -n ".btn-primary" apps/caryina/src/styles/global.css` | Pass (0 results) | Block fully removed |
| `grep -n "color-focus-ring" apps/caryina/src/styles/global.css` | Pass (1 result) | Token preserved in media-query block |
| lint-staged (eslint + simple-import-sort) | Pass | 5 import-order errors auto-fixed before commit |
| TC-05: render tests | CI | Will confirm in CI; no class-name-specific test assertions |
| TC-07: asChild navigation spot-check | Pending | Dev spot-check required before merging |

## Workflow Telemetry Summary

4 workflow steps recorded across lp-do-fact-find, lp-do-analysis, lp-do-plan, and lp-do-build stages. Modules loaded: `outcome-a-code.md` (2.5 KB), `analyze-code.md` (0.9 KB), `plan-code.md` (3.4 KB), `build-code.md` (4.6 KB), `build-validate.md` (10.3 KB). Token measurement not available for this session (no CODEX_THREAD_ID). Stage `lp-do-ideas` not recorded (direct workflow invocation). All 4 stages had deterministic checks (`validate-fact-find.sh`, `validate-analysis.sh`, `validate-plan.sh`, `validate-engineering-coverage.sh`).

## Validation Evidence

### TASK-01
- TC-01 PASS: `grep -rn "btn-primary" apps/caryina/src` → 0 source matches (comment in buttonStyles.ts excluded).
- TC-02 PASS: `@layer components { .btn-primary {...} }` block removed from `global.css`.
- TC-03 PASS: `--color-focus-ring` token preserved at line ~97 of trimmed `global.css` (inside `@media (prefers-color-scheme: dark)` block).
- TC-04 PASS: `pnpm --filter @apps/caryina typecheck` exits 0.
- TC-05: CI pending (render tests do not assert class names).
- TC-06/TC-07: Dev spot-check pending before merge.
- Commit: `0ab1174475` — 13 files changed, 233 insertions, 80 deletions.

## Engineering Coverage Evidence

| Coverage Area | Evidence / N/A | Notes |
|---|---|---|
| UI / visual | BTN_PRIMARY constant reproduces exact token chain from original `.btn-primary`; hover/active/focus-visible replicated via Tailwind v4 arbitrary values | Dev spot-check of hover/active on checkout + asChild navigation required before merge |
| UX / states | `disabled:opacity-50` in BTN_PRIMARY; `disabled` prop forwarded via `<Button compatibilityMode="passthrough">`; all 6 asChild sites use standard Radix Slot ref forwarding | Filter tabs conditional class preserves active/inactive toggle state |
| Security / privacy | N/A — no auth, no sensitive data | - |
| Logging / observability / audit | N/A — no analytics hooks | - |
| Testing / validation | Typecheck pass; lint pass; render tests CI-only; TC-01–TC-04 verified pre-commit | TC-05 (CI render tests) and TC-07 (dev nav spot-check) pending |
| Data / contracts | N/A — no schema or API change | - |
| Performance / reliability | N/A — component swap; no runtime cost change | - |
| Rollout / rollback | Single atomic commit `0ab1174475`; rollback = `git revert 0ab1174475` | No data migration; no feature flag |

## Scope Deviations

- `admin/products/page.tsx`: plain `<a href="/admin/products/new">` upgraded to `<Button asChild><Link href="/admin/products/new">`. This is within plan scope (the `<a>` site was explicitly planned as an asChild migration), and the upgrade to `<Link>` delivers Next.js client-side navigation as a consequential side benefit — no additional scope.
- `apps/caryina/src/styles/buttonStyles.ts`: new file extracted for BTN_PRIMARY constant. Planned in TASK-01 Refactor step; executed alongside Green phase to avoid 11-file duplication.
