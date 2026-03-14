---
Type: Analysis
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: caryina-button-strategy
Execution-Track: code
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Fact-Find: docs/plans/caryina-button-strategy/fact-find.md
Related-Plan: docs/plans/caryina-button-strategy/plan.md
Auto-Plan-Intent: analysis+auto
artifact: analysis
---

# Caryina Button Strategy Analysis

## Decision Frame

### Summary

Caryina has 12 call sites using a locally-defined `.btn-primary` CSS utility class instead of the shared DS `<Button>` component from `@acme/design-system/shadcn`. The decision is: which migration approach replaces the local utility while preserving visual fidelity, centralises the styling source of truth, and carries the lowest execution risk?

### Goals

- Remove the `.btn-primary` CSS island from `apps/caryina/src/styles/global.css`.
- All 12 caryina-owned call sites use DS `<Button>` as the component primitive.
- Visual output is preserved (hover, active, focus-visible states match current behaviour).
- `pnpm --filter @apps/caryina typecheck` passes; existing render tests pass.

### Non-goals

- Redesigning the button visual style.
- Migrating `AddToCartButton` in `@acme/platform-core` (shared platform code, separate concern).
- Adding new DS Button variants or props.

### Constraints & Assumptions

- Constraints:
  - `@acme/design-system/shadcn` is the required import path (ESLint `no-restricted-imports` bans `@acme/ui/components/atoms/shadcn`).
  - `@acme/design-system` is already a declared dependency (added by dispatch 0002, Input migration).
  - 2 of 12 call sites are `<Link>` elements, not `<button>` elements — `<Button asChild>` pattern required for these.
  - `--color-focus-ring` is defined in `apps/caryina/src/styles/global.css:111` (not in `tokens.css`).
- Assumptions:
  - DS `<Button compatibilityMode="passthrough">` strips all DS-internal bg/padding/ring classes, giving the caller full className control.
  - Existing render tests assert DOM structure (button existence, disabled state) but not class names — migration does not break these tests.

## Inherited Outcome Contract

- **Why:** Local `.btn-primary` is a styling island: brand-token changes must be manually kept in sync between `global.css` and any DS-native button styles. Centralising on DS Button means one source of truth.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All caryina-owned call sites (12) use DS `<Button>` or an explicitly documented exception; `.btn-primary` CSS utility is removed from `global.css` once call sites are migrated.
- **Source:** auto

## Fact-Find Reference

- Related brief: `docs/plans/caryina-button-strategy/fact-find.md`
- Key findings used:
  - 12 call sites confirmed, all caryina-owned; AddToCartButton (platform-core) uses `bg-primary-main` and is excluded.
  - `compatibilityMode="passthrough"` confirmed available in `packages/design-system/src/primitives/button.tsx`.
  - Hover divergence: `.btn-primary:hover` uses `--color-primary-hover` (HSL 355 55% 68%); DS native default uses `hover:bg-primary/90` (opacity-based) — visually different on the caryina pink palette.
  - 2 sites in `apps/caryina/src/app/[lang]/shop/page.tsx:125,136` are `<Link>` elements — require `<Button asChild>` wrapping.
  - `--color-focus-ring: 220 90% 56%` lives in `global.css:111` `:root` block, not `tokens.css` — safe to keep when lines 39–57 are removed.

## Evaluation Criteria

| Criterion | Why it matters | Weight/priority |
|---|---|---|
| Visual fidelity | Hover/active/focus colours must match current — pink palette is brand-critical | High |
| DS centralisation | Removes the local utility island so brand token changes propagate automatically | High |
| Execution risk | Low regression risk required — buttons appear on every CTA in the shop funnel | High |
| Effort | Simple migration preferred; no new infrastructure | Medium |
| Future maintainability | Token-based approach should be self-documenting and easy to update | Medium |

## Options Considered

| Option | Description | Upside | Downside | Key risks | Viable? |
|---|---|---|---|---|---|
| A — Passthrough migration | Replace all 12 call sites with `<Button compatibilityMode="passthrough" className="...">` using an inline string constant that replicates the exact token-based hover/active/focus chain. Remove `.btn-primary` from global.css. | Exact visual fidelity preserved; full DS centralisation; no design change; single PR. | Fidelity depends entirely on the inline className string matching current token values; no automated test catches a mismatch — requires dev spot-check. | CSS specificity conflict between Tailwind utilities in passthrough mode (low risk; predictable in Tailwind v4). | Yes |
| B — DS-native migration | Replace all 12 call sites with `<Button>` using the default variant — no passthrough. Accept opacity-based hover (`bg-primary/90`) instead of token-based. | Cleanest component usage; no className overrides needed. | Visual change: hover colour will look lighter on white backgrounds (opacity blends with white). This is a product/design change without operator sign-off. | Unexpected brand-visual regression; hover on pink palette at 90% opacity = effectively HSL 355 55% ~77% (lighter than `--color-primary-hover` at 68%). | No — visual change without approval |
| C — Document and keep `.btn-primary` | Retain the local utility class; add a comment explaining its relationship to DS tokens and why it's intentional. | Zero migration effort; zero regression risk. | Styling island persists; brand token updates require manual sync across two systems; does not achieve the stated goal of centralisation. | Future maintainers may not see the comment; island grows. | No — does not achieve centralisation goal |

## Engineering Coverage Comparison

| Coverage Area | Option A (Passthrough) | Option B (DS-native) | Chosen implication (Option A) |
|---|---|---|---|
| UI / visual | Inline className replicates exact token chain; hover/active/focus-visible preserved | Hover shifts to opacity-based; visual change on pink palette | Inline className constant must precisely match `.btn-primary` token references; spot-check in dev before commit |
| UX / states | Disabled, loading, hover, active, focus-visible all carried via className; `disabled:opacity-50` already present in all call sites | Same but hover state visual differs | All states verified via existing render tests + visual spot-check |
| Security / privacy | N/A | N/A | N/A |
| Logging / observability / audit | N/A | N/A | N/A |
| Testing / validation | Existing render tests survive (no class-name assertions); no new test infra needed; hover untestable in JSDOM | Same | Update/add render test assertions to confirm DS Button renders with expected role and disabled state |
| Data / contracts | N/A | N/A | N/A |
| Performance / reliability | N/A — component swap has no runtime cost difference | Same | N/A |
| Rollout / rollback | Single PR; rollback = git revert; no data migration | Same | No feature flag; rollback verified by reverting one commit |

## Chosen Approach

- **Recommendation:** Option A — Passthrough migration with inline className string constant.
- **Why this wins:**
  - Preserves exact visual fidelity using the existing token chain (`--color-primary`, `--color-primary-hover`, `--color-primary-active`, `--color-focus-ring`). No product/design change.
  - Removes the `.btn-primary` CSS island completely. Brand token changes now propagate automatically to all DS-managed call sites.
  - `@acme/design-system` is already a dep. No new packages, no new infrastructure.
  - Option B is not acceptable without a visual change sign-off — the pink palette makes the opacity divergence visible. Option C defers the problem without solving it.
- **What it depends on:**
  - `compatibilityMode="passthrough"` confirmed in DS source.
  - Inline className string must be defined once as a shared constant (e.g., exported from a `buttonStyles.ts` utility or inlined consistently) — not `@apply` (v4 constraint).
  - For 2 `<Link>` sites: `<Button asChild>` wrapping pattern — confirmed available via Radix Slot forwarding.

### Rejected Approaches

- **Option B (DS-native)** — Rejected: hover colour changes from `--color-primary-hover` (68% lightness) to `bg-primary/90` (blends with white background, appears ~77% lightness). Visual change on brand-critical pink CTA without operator sign-off.
- **Option C (document and keep)** — Rejected: styling island persists; fails the stated centralisation goal.

### Open Questions (Operator Input Required)

None. All approach decisions are resolvable from available evidence.

## End-State Operating Model

None: no material process topology change. This change alters component imports and removes a CSS utility class. No CI/deploy lane, approval path, or operator runbook is affected.

## Planning Handoff

- Planning focus:
  - Define the shared inline className constant (hover/active/focus-visible token chain + `rounded-full`) and export from a caryina-local constants file or inline at each call site.
  - Migrate 10 `<button>` call sites → `<Button compatibilityMode="passthrough" className={...}>`.
  - Migrate 2 `<Link>` call sites (shop/page.tsx:125,136) → `<Button asChild compatibilityMode="passthrough" className={...}><Link href={...}>label</Link></Button>`.
  - Delete lines 39–57 from `apps/caryina/src/styles/global.css` (`.btn-primary` rule block). Preserve `:root` token definitions (line 111 — `--color-focus-ring` must stay).
  - Typecheck gate + render test pass.
- Validation implications:
  - `pnpm --filter @apps/caryina typecheck` must pass (this is the acceptance gate, not a separate CI run).
  - Existing render tests for checkout, cart, PDP, admin, shop, and NotifyMeForm pages must remain green.
  - Visual spot-check in dev server for hover/active/focus-visible on at least one `<button>` site and one `<Link asChild>` site before commit.
- Sequencing constraints:
  - Define className constant first, then migrate call sites, then delete `.btn-primary`.
  - All 12 call sites + global.css deletion should land in a single commit so CI sees a consistent state.
- Risks to carry into planning:
  - `<Button asChild>` with Next.js `<Link>` — verify ref forwarding works (low risk; standard Radix Slot pattern, but worth confirming at dev time).
  - Tailwind v4 specificity on passthrough className — no known issue, verify locally.

## Risks to Carry Forward

| Risk | Likelihood | Impact | Why not resolved in analysis | Planning implication |
|---|---|---|---|---|
| `<Button asChild>` + Next.js `<Link>` ref forwarding issue | Low | Medium — navigation broken for filter toggles | Requires runtime dev verification | Builder should confirm in dev before committing |
| Inline className string diverges from `.btn-primary` token values | Low | Low — subtle visual delta, only hover/active | Not testable at analysis time | Builder spot-checks in dev; diff against tokens.css values |
| `--color-focus-ring` accidentally removed with `.btn-primary` block | Very low | High — a11y regression | Lines are clearly separated in global.css | Plan task should explicitly note line 39–57 vs line 111 scope |

## Planning Readiness

- Status: Go
- Rationale: Evidence gate passes (fact-find Ready-for-analysis, ECM complete, outcome contract present). Option gate passes (3 options compared, 2 rejected with rationale). Planning handoff gate passes (approach decisive, sequencing defined, risks documented, no open operator questions). End-state model confirmed None (local code path only).
