---
Type: Fact-Find
Outcome: Planning
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-08
Last-updated: 2026-03-08
Feature-Slug: reception-theme-styling-cohesion
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-design-spec, lp-design-qa, frontend-design
Related-Plan: docs/plans/reception-theme-styling-cohesion/plan.md
Trigger-Why: Reception app theme-styling work has become fragmented. The check-in screen is a representative failure case, and the user wants an evidence-based, cohesive path forward grounded in the current codebase and the live hosted app.
Trigger-Intended-Outcome: type: operational | statement: Reception has a coherent styling strategy with explicit screen archetypes, shared shell/component standards, and a prioritized first implementation wave led by the check-in screen. | source: operator
---

# Reception Theme Styling Cohesion Fact-Find Brief

## Access Declarations
- `https://reception.hostel-positano.com` - read-only hosted UI inspection via MCP browser, `curl`, and a local Playwright crawl using operator-supplied staff credentials. Credentials were used for session establishment only and are not recorded in this artifact. Status in `memory/data-access.md`: `UNVERIFIED`.

## Scope
### Summary
Reception styling is no longer failing because the app lacks tokens. The theme layer now exists and has already been migrated toward OKLCH-backed semantic tokens, but the app still presents itself through multiple incompatible screen shells, component recipes, and DS escape hatches. The result is a system where individual screens can be "token-compliant" and still look unrelated.

The check-in screen is still the clearest example, but it is not an isolated outlier. A full route census across the reception app shows `29` staff-visible routes behind the `/` -> `/bar` redirect, with only `17` using `PageShell` at all and `12` still composing their own top-level wrappers. Even the `PageShell` routes frequently rebuild their own title rows, filter rails, and internal panel structure. Similar divergence exists across bar, inbox, queue screens, reconciliation screens, dashboards, and management forms. The correct next move is not another isolated polish pass or more token tweaking. It is to define a reception-specific screen system, then migrate screens by archetype while keeping route-health bugs in a separate lane.

### Goals
- Establish the actual root cause of reception styling drift using current repo evidence and live-route verification.
- Expand the evidence base from representative screens to the full reception route set so planning is not biased toward check-in alone.
- Define the minimum cohesive styling system that can unify reception without forcing every screen into the same layout.
- Identify the highest-leverage first implementation wave.
- Preserve existing operational behavior and avoid a big-bang DS rewrite.

### Non-goals
- Full design-system centralization across all reception primitives.
- Rebranding the reception theme from scratch.
- A single universal layout that every screen must use.
- Backend, auth, or workflow logic changes beyond what is required for UI structure.

### Constraints & Assumptions
- Constraints:
  - Reception is an active staff tool with `30` route entry pages at the current workspace state (`find apps/reception/src/app -name 'page.tsx' | wc -l`).
  - The hosted app is behind Firebase auth; authenticated inspection required operator-supplied credentials and still surfaced route-specific instability.
  - A hosted authenticated crawl covered `29` post-login routes on 2026-03-08, but some screens only reveal meaningful data after date/search/filter selection.
  - The current workspace already contains a broad in-flight reception styling sweep: `111` changed files across `apps/reception` and `packages/themes/reception`. These are **uncommitted local workspace changes** (visible in `git diff --stat`). Any implementation task that touches the same files must resolve this dirty state (commit or stash) before proceeding.
  - Local test execution is policy-restricted; validation must be planned around existing CI/parity mechanisms.
- Assumptions:
  - The operator-provided check-in screenshot is representative of the broader class of reception shell drift, not just a single screen defect.
  - Recent uncommitted reception changes are intentional in-flight work, not discarded noise.

## Outcome Contract
- **Why:** Reception styling has become piecemeal. Screens are individually patched, but the app still lacks a shared visual operating model, which creates cognitive friction for staff and wastes build effort.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A planning-ready reception styling strategy exists with named screen archetypes, shared shell rules, shared component recipes, and a first delivery wave that turns the check-in screen into the canonical table-workflow reference.
- **Source:** operator

## Evidence Audit (Current State)
### Entry Points
- `apps/reception/src/app/checkin/page.tsx` - check-in route entry; hosted route is `/checkin`.
- `apps/reception/src/components/checkins/view/CheckinsTable.tsx` - current check-in screen shell and table composition.
- `apps/reception/src/components/checkins/header/CheckinsHeader.tsx` - check-in title/action rail.
- `apps/reception/src/components/common/PageShell.tsx` - current shared screen wrapper used by many, but not all, reception screens.
- `apps/reception/src/components/AuthenticatedApp.tsx` - authenticated app chrome wrapper.
- `apps/reception/src/components/bar/Bar.tsx` - POS-root shell showing a different full-page pattern.
- `apps/reception/src/components/inbox/InboxWorkspace.tsx` - split-pane workspace shell showing a third pattern.
- `apps/reception/src/app/globals.css` - token registration and app-wide theme bridge.
- `packages/themes/reception/src/tokens.ts` - reception theme source of truth.
- `apps/reception/src/components/Login.tsx` - live-hosted access gate and login visual baseline.

### Key Modules / Files
- `apps/reception/src/app/globals.css` - reception tokens are registered and usable; this is no longer a token-absence problem.
- `packages/themes/reception/src/tokens.ts` - reception semantic tokens, surfaces, borders, typography, and shade families exist and were recently adjusted.
- `apps/reception/src/components/common/PageShell.tsx` - only provides backdrop + accent-bar heading; it does not define toolbar, panel, or table scaffolding.
- `apps/reception/src/components/AuthenticatedApp.tsx` - global max-width container adds one shell layer, but screens frequently rewrap themselves independently.
- `apps/reception/src/components/checkins/view/CheckinsTable.tsx` - bespoke table-workflow page pattern outside PageShell.
- `apps/reception/src/components/checkins/TableHeader.tsx` - bespoke table-header styling and semantics for check-in.
- `apps/reception/src/components/checkins/DateSelector.tsx` - DS Button usage plus manual class recipes and button-state styling.
- `apps/reception/src/components/bar/Bar.tsx` - full-bleed POS shell distinct from PageShell and check-in patterns.
- `apps/reception/src/components/inbox/InboxWorkspace.tsx` - PageShell consumer with a custom split-pane header/workspace recipe.
- `apps/reception/src/components/Login.tsx` - polished auth screen showing the strongest currently cohesive single-surface styling.

### Route Census (All Staff Screens)
The app root redirects to `/bar`, so the route census below covers the `29` staff-visible screens that carry reception’s actual UI burden.

#### Table / Queue Workflows
| Route | Primary component | Shell family | Live hosted state (2026-03-08) | Data dependency / note |
|---|---|---|---|---|
| `/checkin` | `CheckinContent` -> `view/CheckinsTable` | custom table screen | populated table, validation banner, date chips, archive rail | canonical styling failure; no shared shell |
| `/checkout` | `Checkout` | `PageShell` table workflow | heading + date chips, empty state for sampled date | date-driven; likely same first-wave scaffold target as check-in |
| `/alloggiati` | `Alloggiati` | `PageShell` table/action workflow | heading + date chips, empty state, outbound action | date-driven; operational submit screen |
| `/loan-items` | `LoansContainer` | custom table workflow | heading + date chips, filter input, empty state | date + guest filter driven |
| `/prepayments` | `PrepaymentsContainer` | custom queue workspace | populated payment queue, search input, multiple CTA rows | high-value queue screen with no shared shell |
| `/email-automation` | `EmailAutomationContent` | custom queue workspace | populated reminder buckets, search input, per-row CTAs | another bespoke queue surface |
| `/audit` | `Search` | `PageShell` search workspace | heading + multi-input search form | usefulness depends on filters/search values |
| `/doc-insert` | `DocInsertPage` | `PageShell` form flow | live client-side exception | route-health bug, not just styling |
| `/extension` | `Extension` | `PageShell` table workflow | heading, currently empty | dependent on in-house guests |
| `/prepare-dashboard` | `PrepareDashboard` | custom table workflow | heading + date chips, empty cleaning state | date-driven operational board |
| `/ingredient-stock` | `IngredientStock` | `PageShell` table/editor | migration notice + editable stock grid | utility/editor screen |
| `/stock` | `Stock` | `PageShell` dense grid editor | massive inline stock input grid | extreme density case; `PageShell` only solves outer frame |
| `/prime-requests` | `PrimeRequestsQueue` | `PageShell` status queue | status tabs + empty queue | queue/status workflow |
| `/variance-heatmap` | `VarianceHeatMap` | `PageShell` analytics table | thresholds form + table | report/editor hybrid |

#### Workspace / Reconciliation / Reporting
| Route | Primary component | Shell family | Live hosted state (2026-03-08) | Data dependency / note |
|---|---|---|---|---|
| `/inbox` | `InboxWorkspace` | `PageShell` split-pane workspace | active counts + thread pane shell | already behaves like a dedicated workspace archetype |
| `/manager-audit` | `ManagerAuditContent` | custom dashboard/workspace | multi-panel audit surface with filters and KPIs | date + staff/item selection affects usefulness |
| `/till-reconciliation` | `TillReconciliation` | custom form/workspace | action strip, recent shifts, empty history state | operational finance workflow with bespoke card stack |
| `/reconciliation-workbench` | `ReconciliationWorkbench` | `PageShell` finance workspace | forms + tables + totals card | select/input driven workbench |
| `/safe-management` | `SafeManagement` | `PageShell` finance workspace | local Playwright saw client-side exception; MCP route lost auth shell | route-health problem and shell candidate |
| `/safe-reconciliation` | `SafeReconciliation` | `PageShell` action hub | expected balance + three large action CTAs | modal/action-driven management screen |
| `/eod-checklist` | `EodChecklistContent` | custom status board | completion cards + two primary actions | summary/action board |
| `/end-of-day` | `EndOfDayPacket` | custom report surface | blank render in hosted crawl | route-health or loading defect |
| `/staff-accounts` | `StaffAccountsForm` | custom form/admin | add-account form + loading list | management form archetype |
| `/live` | `Live` | `PageShell` dashboard/report | shift summary cards/tables populated | monitoring/reporting screen |
| `/real-time-dashboard` | `RealTimeDashboard` | `PageShell` dashboard/report | stuck on `Loading data...` in sampled run | route-health / async state issue |
| `/menu-performance` | `MenuPerformanceDashboard` | `PageShell` analytics page | only heading rendered in sampled run | likely low-fidelity analytics shell |
| `/statistics` | `Statistics` | `PageShell` analytics page | heading + period toggles + loading state | data loading, report controls |

#### Immersive / Spatial Operations
| Route | Primary component | Shell family | Live hosted state (2026-03-08) | Data dependency / note |
|---|---|---|---|---|
| `/bar` | `BarRoot` | full-bleed POS | category rails + product grid + sales/comp mode controls | intentionally distinct immersive mode |
| `/rooms-grid` | `RoomsGrid` | `PageShell` plus bespoke header/grid | dense room timeline grid with date range inputs | spatial planning screen; distinct grid affordances |

### Patterns & Conventions Observed
- **The token foundation exists, but consumption is inconsistent.**
  - Evidence: `packages/themes/reception/src/tokens.ts`, `packages/themes/reception/tokens.css`, `apps/reception/src/app/globals.css`.
  - Inference: theme work has advanced beyond raw token absence; the remaining failure is composition and usage discipline.

- **Reception has multiple competing shell patterns.**
  - Across the `29` routed staff screens, `17` use `PageShell` and `12` do not. The non-`PageShell` set includes `checkin`, `bar`, `prepayments`, `loan-items`, `prepare-dashboard`, `till-reconciliation`, `staff-accounts`, `manager-audit`, `email-automation`, `eod-checklist`, `end-of-day`, and `rooms-grid`-adjacent providers.
  - Even the `PageShell` screens frequently rebuild their own title rows, filter rails, and panel framing inside `headerSlot` or first-child containers.
  - Evidence: route census above; `apps/reception/src/components/common/PageShell.tsx`; `apps/reception/src/components/checkins/view/CheckinsTable.tsx`; `apps/reception/src/components/bar/Bar.tsx`; `apps/reception/src/components/roomgrid/RoomsGrid.tsx`; `apps/reception/src/components/inbox/InboxWorkspace.tsx`.

- **DS escape hatches are still structural, not incidental.**
  - `compatibilityMode="no-wrapper"` appears `83` times and `compatibilityMode="passthrough"` appears `19` times in `apps/reception/src`.
  - Evidence: repo grep counts.
  - Inference: many screens still depend on bypassing DS structure/styling, so cohesion cannot be solved by assuming DS primitives alone will normalize the UI.

- **Brand-accent usage is overloaded.**
  - `bg-primary-main`, `text-primary-main`, and `text-primary-main/70` appear `145` times in component code.
  - Evidence: repo grep count.
  - Inference: primary green is doing too many jobs at once: action fill, heading tint, accents, and sometimes status emphasis.

- **Gradient/page roots are inconsistent — and three layers stack on every screen.**
  - `AuthenticatedApp.tsx:23` applies `bg-gradient-to-b from-[var(--color-bg)] to-surface-1 min-h-screen` as the app-wide outer frame.
  - `CheckinsTableView:79` (check-in) applies the same gradient again inside the `AuthenticatedApp` container — a second, nested gradient root.
  - `PageShell:28` (checkout, and 16 other routes) applies the gradient a third time inside `AuthenticatedApp`'s `p-6` container.
  - Result: every screen fires two nested gradient backgrounds. The outer `AuthenticatedApp` gradient is always hidden behind the inner one, making it dead CSS that nevertheless creates layout geometry.
  - **Constraint for the archetype task:** the new `OperationalTableScreen` must decide who owns the gradient. If the archetype owns it, `AuthenticatedApp` must stop applying it. If `AuthenticatedApp` keeps it, the archetype must not add a second layer. This decision must be explicit in the archetype design-spec before implementation begins — it affects all 29 routed screens via `AuthenticatedApp`.
  - Evidence: `apps/reception/src/components/AuthenticatedApp.tsx:23`, `apps/reception/src/components/checkins/view/CheckinsTable.tsx:79`, `apps/reception/src/components/common/PageShell.tsx:28`, repo grep count for gradient-root patterns.

- **Check-in is structurally bespoke.**
  - It owns its outer gradient shell, header, toolbar area, table card, row visuals, and "Rooms Ready" control pattern independently of PageShell.
  - Evidence: `apps/reception/src/components/checkins/view/CheckinsTable.tsx`, `apps/reception/src/components/checkins/header/CheckinsHeader.tsx`, `apps/reception/src/components/checkins/DateSelector.tsx`, `apps/reception/src/components/checkins/TableHeader.tsx`.

- **Check-in is only one member of a larger custom-shell cluster.**
  - Other custom route owners include `BarRoot`, `PrepaymentsContainer`, `LoansContainer`, `PrepareDashboard`, `TillReconciliation`, `ManagerAuditContent`, `EmailAutomationContent`, and `EodChecklistContent`.
  - Inference: the reception app is drifting at the route-family level, not just in one table screen.
  - Evidence: route census plus component entry points listed above.

- **`AuthenticatedApp` adds `p-6` that creates layered padding on all screens.**
  - `AuthenticatedApp.tsx:26`: `<div className="p-6">{children}</div>` wraps all screen content.
  - `PageShell:32`: adds its own `p-4` inside the `p-6` → checkout (and all `PageShell` screens) have `p-6 + p-4` double-padding.
  - `CheckinsTableView:79`: adds its own `p-4` inside the `p-6` → check-in also has `p-6 + p-4` double-padding.
  - Result: the new `OperationalTableScreen` inherits broken padding geometry unless the "Revisit `AuthenticatedApp`" task explicitly removes the `p-6` wrapper and moves padding control into the archetype. Leaving it unchanged means every archetype screen will have uncontrolled outer padding.
  - Evidence: `apps/reception/src/components/AuthenticatedApp.tsx:26`, `apps/reception/src/components/common/PageShell.tsx:32`, `apps/reception/src/components/checkins/view/CheckinsTable.tsx:79`.

- **Two structurally incompatible date-selector components serve the "same" role on check-in and checkout.**
  - `checkins/DateSelector.tsx`: Role-aware. Privileged users (owner/developer) see Yesterday + up to 7 days + unrestricted `DayPicker` (popup). Non-privileged see Today + Tomorrow + restricted calendar (admin/manager) or no calendar. Role gate: `isPrivileged`, `canAccess(Permissions.RESTRICTED_CALENDAR_ACCESS)`.
  - `checkout/DaySelector.tsx`: No role checks. All users see Yesterday + Today + 5 days + unrestricted inline `DayPicker`. No popup — calendar expands inline.
  - These are behaviorally incompatible: they implement different access-control policies and different UX patterns (popup vs inline).
  - **Constraint for the archetype task:** `FilterToolbar` cannot absorb these two without resolving the policy difference. The correct approach is to treat `DateSelector` and `DaySelector` as screen-specific injection points within the `FilterToolbar` slot — not as primitives the `FilterToolbar` owns. Unification of the date-access policy is explicitly a separate decision requiring operator input and must not be made implicitly during scaffold implementation.
  - Evidence: `apps/reception/src/components/checkins/DateSelector.tsx`, `apps/reception/src/components/checkout/DaySelector.tsx`.

- **`CheckinsHeader` and `PageShell` implement the same accent-bar + h1 pattern at different opacities.**
  - `CheckinsHeader.tsx:48`: `text-primary-main` (100% opacity on heading text).
  - `PageShell.tsx:38`: `text-primary-main/80` (80% opacity on heading text). Accent bar uses `bg-primary-main` at full opacity in both.
  - The proposed `ScreenHeader` primitive must canonicalize one value. If it uses 80%, check-in's header will change visually. If it uses 100%, PageShell's heading will change across all 17 consumers.
  - Evidence: `apps/reception/src/components/checkins/header/CheckinsHeader.tsx:48`, `apps/reception/src/components/common/PageShell.tsx:38`.

- **`PageShell` usage does not imply strong visual cohesion.**
  - `RoomsGrid` reimplements its own accent/title row inside `headerSlot`; `InboxWorkspace` adds a split-pane workspace recipe on top; `ReconciliationWorkbench`, `Statistics`, `Live`, `SafeManagement`, and `VarianceHeatMap` each create their own first-child card layouts.
  - Inference: `PageShell` is acting as a backdrop/title helper, not a full screen contract.
  - Evidence: `apps/reception/src/components/roomgrid/RoomsGrid.tsx`, `apps/reception/src/components/inbox/InboxWorkspace.tsx`, `apps/reception/src/components/till/ReconciliationWorkbench.tsx`, `apps/reception/src/components/stats/Statistics.tsx`, `apps/reception/src/components/live/Live.tsx`, `apps/reception/src/components/safe/SafeManagement.tsx`.

- **Data-state dependency is a major part of the lived experience.**
  - Multiple routes render as blank, sparse, or low-value until a date, search term, or filter is chosen: `checkout`, `alloggiati`, `loan-items`, `prepare-dashboard`, `audit`, `manager-audit`, `reconciliation-workbench`, `statistics`.
  - Inference: any design plan must treat filter rails and empty/loading/error states as first-class archetype slots, not edge cases.
  - Evidence: authenticated hosted crawl on 2026-03-08; route components `DateSelector`, `DaySelector`, date inputs in `RoomsGrid`, search forms in `Search`, `PrepaymentsContainer`, `EmailAutomationContent`, and `StaffAccountsForm`.

- **Route health issues are currently entangled with styling drift.**
  - Hosted `/doc-insert` and `/safe-management` raised client-side exceptions during authenticated inspection; `/end-of-day` rendered blank; `/real-time-dashboard` stayed in a loading state in the sampled run.
  - Inference: the next plan needs a separate health-triage lane so styling work is not blamed for runtime failures it cannot solve.
  - Evidence: authenticated hosted crawl on 2026-03-08.

- **The live route contract is inconsistent at the path layer too.**
  - Hosted `/checkin` loads the login gate; hosted `/check-in` resolves to a 404 page.
  - Evidence: MCP browser session + `curl` on 2026-03-08.

- **Prior work became fragmented into too many narrow narratives.**
  - Relevant existing artifacts separately track DS centralization, visual polish, inline theme cascade, token compliance, remove-light-mode, and app-wide layout standard.
  - Evidence: `docs/plans/reception-ds-centralization-growth-first/fact-find.md`, `docs/plans/reception-theme-inline-cascade/fact-find.md`, `docs/plans/reception-visual-ux-audit/fact-find.md`, `docs/plans/_archive/reception-component-token-compliance/plan.md`, queue-state entry `IDEA-DISPATCH-20260308104500-9403`.

### Data & Contracts
- Theme source of truth:
  - `packages/themes/reception/src/tokens.ts` -> generated `packages/themes/reception/tokens.css` -> imported by `apps/reception/src/app/globals.css`.
- Screen-shell contract:
  - `PageShell` currently guarantees backdrop, padding, and title treatment only.
  - `AuthenticatedApp` guarantees max-width app framing but not screen-level internal composition.
- Route inventory contract:
  - `30` route entry pages exist in `apps/reception/src/app`, but `/` immediately redirects to `/bar`, leaving `29` staff-visible routed screens to style and validate.
  - The current shell split is `17` `PageShell` consumers vs `12` custom top-level shells.
- DS compatibility contract:
  - `Button` and `Input` compatibility modes are actively relied on in operational flows; any future component consolidation must preserve DOM and interaction contracts for forms/tables.
- Route/access contract:
  - Reception routes are protected; unauthenticated hosted inspection reaches `Login.tsx`, while authenticated inspection can still surface route-level crashes or load stalls.

### Dependency & Impact Map
- Upstream dependencies:
  - `@acme/design-system` and `@acme/design-system/atoms`
  - `packages/themes/base`
  - `packages/themes/reception`
  - `AuthContext` / login gate for hosted verification
- Downstream dependents:
  - Table-driven operational screens (check-in, checkout, loans, prepayments, search, alloggiati, prepare, extension)
  - Queue/workspace screens (inbox, audit, email automation, prime requests, reconciliation, staff accounts)
  - Finance/reconciliation screens (till, safe, end-of-day, variance)
  - Full-bleed or spatial operational screens (bar POS, room grid)
- Likely blast radius:
  - Any shell/scaffold decision will affect most staff-visible routes.
  - The first wave can be safely bounded to shared shell primitives plus check-in/checkout archetype consumers.
  - The route-health bugs discovered in hosted inspection should be tracked separately so they do not bloat the styling migration wave.
  - Active dirty-worktree styling changes increase merge/rebase risk during implementation.

### Security and Performance Boundaries
- Security:
  - Hosted visual QA for authenticated screens depends on a valid Firebase session; this fact-find used operator-supplied credentials without persisting them in repo artifacts.
- Performance:
  - There is no pixel-level visual regression suite. Styling regression detection currently depends on HTML parity snapshots and manual review.
  - Prior dynamic class/JIT issues in reception styling already show that structural styling errors can pass casual review without stronger test seams.
  - Several hosted screens already show runtime failures or indefinite loading, so visual QA cannot assume render success.

### Hypothesis & Validation Landscape
#### Key Hypotheses
| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | Reception’s cohesion problem is now primarily screen-architecture drift, not missing theme tokens. | Token layer actually being present and usable | Low | <1 day |
| H2 | `PageShell` is too weak to act as a true screen standard because it stops at title/backdrop. | Current shell implementation and call sites | Low | <1 day |
| H3 | Reception needs a small set of archetype scaffolds, not one universal page recipe. | Meaningful differences between check-in, inbox, and bar | Medium | 1-2 days |
| H4 | Converting check-in into the canonical table-workflow screen will give the highest downstream leverage. | Check-in pattern being shared by adjacent operational screens | Medium | 2-4 days |
| H5 | Planning must split styling cohesion work from route-health bug fixing or the scope will become incoherent. | Hosted failures being real and distinct from styling drift | Low | <1 day |

#### Existing Signal Coverage
| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | Tokens exist, recently migrated, and are already consumed by many screens | `tokens.ts`, `globals.css`, recent git history | High |
| H2 | `PageShell` exposes only backdrop/title; consumers still invent their own internal structure | `PageShell.tsx`, `InboxWorkspace.tsx`, `TillReconciliation.tsx`, check-in bypass | High |
| H3 | Bar, inbox, and check-in each use materially different workspace structures | `Bar.tsx`, `InboxWorkspace.tsx`, `CheckinsTable.tsx` | High |
| H4 | Check-in/checkout/table screens share common controls, headers, filters, and data tables | `CheckinsTable.tsx`, `Checkout.tsx`, related archived polish docs | Medium |
| H5 | Hosted route failures exist independently of shell styling issues | authenticated hosted crawl (`/doc-insert`, `/safe-management`, `/end-of-day`, `/real-time-dashboard`) | High |

#### Falsifiability Assessment
- Easy to test:
  - Whether a scaffold can replace the current check-in wrapper without changing behavior.
  - Whether table-workflow scaffolds also fit checkout.
- Hard to test:
  - Whether the same scaffold should stretch to bar POS or inbox without harming those use cases.
  - Whether visual hierarchy is actually improved without authenticated live QA.
  - Whether current loading/error states are styling regressions or underlying data/runtime failures.
- Validation seams needed:
  - Shared scaffold snapshot/parity coverage.
  - Authenticated preview/manual QA for the first-wave routes.
  - Separate smoke checks for routes already failing in hosted inspection.

#### Recommended Validation Approach
- Quick probes:
  - Model three explicit archetypes in a design-spec pass before implementation.
  - Pilot only the table-workflow archetype on check-in and checkout first.
- Structured tests:
  - Preserve existing check-in and checkout parity tests.
  - Add scaffold-focused snapshot coverage for the shared shell and toolbar primitives.
- Deferred validation:
  - Bar and inbox migration should happen only after the archetype model is proven on table workflows.

### Test Landscape
#### Test Infrastructure
- Frameworks:
  - Jest + React Testing Library in `apps/reception`
  - Route parity snapshot tests
- Commands:
  - Existing parity suite lives under `apps/reception/src/parity/__tests__/`
  - Validation is CI-first per repo policy
- CI integration:
  - Reception has app-specific workflow coverage in `.github/workflows/reception.yml`

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Route parity | Snapshot | `apps/reception/src/parity/__tests__/*.test.tsx` | `5` parity tests currently exist |
| Check-in components | Unit/snapshot | `apps/reception/src/components/checkins/__tests__/` | Covers local behaviors, not visual cohesion |
| Checkout components | Unit/snapshot | `apps/reception/src/components/checkout/__tests__/` | Useful adjacent archetype coverage |
| Login | Unit | `apps/reception/src/components/Login.tsx` tests | Confirms live route gate behavior and auth shell structure |

#### Coverage Gaps
- No visual screenshot regression coverage for authenticated operational screens.
- No test asserting a shared reception shell/scaffold contract.
- No automated hosted QA for the authenticated check-in route.
- Existing tests do not prevent further archetype drift as long as individual screens keep rendering.
- No targeted smoke coverage for hosted runtime failures now visible on `doc-insert`, `safe-management`, `end-of-day`, and `real-time-dashboard`.

#### Testability Assessment
- Easy to test:
  - Shared shell markup and class contracts.
  - Check-in/checkout scaffold adoption.
- Hard to test:
  - Full hosted visual behavior for protected routes.
  - Cross-screen consistency as a product quality outcome.
- Test seams needed:
  - Shared `ReceptionScreen` or equivalent scaffold snapshots.
  - Manual authenticated review gate for the first migration wave.

#### Recommended Test Approach
- Unit tests for:
  - Shared shell/header/toolbar primitives introduced by the first wave.
- Integration tests for:
  - Check-in and checkout render inside the new table-workflow scaffold without behavior loss.
- E2E tests for:
  - Not required immediately; manual hosted QA is the practical gate.
- Contract tests for:
  - Shared class/slot structure for the archetype scaffolds.

### Recent Git History (Targeted)
- `f1dcc15389` - reception theme tokens migrated to OKLCH. Implication: token infrastructure has materially advanced.
- `afa380ce3a` - update `@theme` consumers for OKLCH semantic tokens. Implication: styling breakage is not explained by missing theme registration.
- `f463fe63b5` - shade token families moved to `@theme inline`. Implication: theme mechanics were actively refined recently.
- `d23f167a85`, `af1f086f43`, `59441c441c`, `a681694e6e` - multiple reception polish waves. Implication: several screens were improved, but the app still lacks a single governing screen system.
- `ca7ecaa4dc` - narrow "component token compliance" fixes landed. Implication: point fixes are still happening after broader overhaul work.
- Current workspace diff:
  - `git diff --stat -- apps/reception packages/themes/reception` shows `111` changed files, `1600` insertions, `871` deletions.
  - Implication: any implementation plan must account for active in-flight styling churn.

## Questions
### Resolved
- Q: Is the check-in problem mainly that reception lacks theme tokens?
  - A: No. Reception now has a populated theme/token layer; the bigger failure is inconsistent shell and component composition.
  - Evidence: `packages/themes/reception/src/tokens.ts`, `apps/reception/src/app/globals.css`, recent OKLCH/theme commits.

- Q: Is check-in the only route with a bespoke top-level shell?
  - A: No. `12` of the `29` staff-visible routes still bypass `PageShell`, including `bar`, `prepayments`, `loan-items`, `prepare-dashboard`, `till-reconciliation`, `email-automation`, `manager-audit`, `staff-accounts`, `eod-checklist`, and `end-of-day`.
  - Evidence: route census and component entry-point scan.

- Q: Is there already a shared reception shell?
  - A: Partially. `PageShell` exists, but it is too thin to prevent divergence because it standardizes only backdrop/title.
  - Evidence: `apps/reception/src/components/common/PageShell.tsx`.

- Q: Is the live check-in route `/check-in`?
  - A: No. The hosted route is `/checkin`; `/check-in` returns the 404 page.
  - Evidence: MCP browser + `curl` inspection on 2026-03-08.

- Q: Should the next step be a full DS centralization pass?
  - A: No. The immediate need is a reception-specific screen system layered on top of the current theme/DS foundation. Full DS centralization remains a longer-horizon concern.
  - Evidence: existing DS-centralization fact-find plus current `compatibilityMode` counts.

- Q: Does one universal page layout fit the whole app?
  - A: No. The evidence supports at least three reception screen archetypes:
    1. `OperationalTableScreen` for check-in/checkout/loans/prepayments/search-style routes
    2. `OperationalWorkspaceScreen` for inbox/till/safe/reports split-pane or multi-panel screens
    3. `POSFullBleedScreen` for bar POS and similarly immersive operational screens
  - Evidence: `CheckinsTable.tsx`, `InboxWorkspace.tsx`, `Bar.tsx`.

- Q: Did the broader hosted sweep change the core diagnosis?
  - A: It strengthened it. The styling problem is app-wide, but the sweep also showed a second class of issues: runtime/load failures on some routes. Those need a separate plan lane so the styling program stays coherent.
  - Evidence: authenticated hosted crawl plus route census.

### Open (Operator Input Required)
- None. The current evidence is sufficient to route this to planning.

## Rehearsal Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Theme/token foundation | Yes | None | No |
| Check-in screen route + composition stack | Yes | **[R-01 Critical]** Triple-layered gradient: `AuthenticatedApp`, `CheckinsTableView`, and `PageShell` each independently apply `bg-gradient-to-b from-[var(--color-bg)] to-surface-1`. Two nested gradients fire on check-in; the outer is hidden CSS. **[R-04 Major]** Double-padding: `AuthenticatedApp` `p-6` + `CheckinsTableView` `p-4` = `p-6+p-4` on check-in. | **Yes** — gradient ownership and padding control must be specified in archetype design-spec before implementation |
| Full route census across routed staff screens | Yes | **[R-02 Critical]** Checkout already uses `PageShell`. Task seed sequence "migrate check-in → migrate checkout" is backwards: checkout's migration IS the PageShell upgrade. "Revisit PageShell" must come before checkout migration, not after. | **Yes** — task seed ordering corrected in Suggested Task Seeds |
| Shared shell patterns (`PageShell`, `AuthenticatedApp`, bar, inbox, workspaces, dashboards) | Yes | **[R-03 Major]** `checkins/DateSelector` and `checkout/DaySelector` are behaviorally incompatible: different role-access policies, different UX patterns (popup vs inline). `FilterToolbar` cannot own date selection as a primitive. **[R-05 Moderate]** `CheckinsHeader` uses `text-primary-main` (100%); `PageShell` uses `text-primary-main/80` (80%) — same pattern, different values; `ScreenHeader` must canonicalize one. | **Yes** — FilterToolbar injection-point constraint added; ScreenHeader opacity decision required in design-spec |
| Hosted authenticated route verification | Yes | [System boundary coverage] [Moderate]: some routes only expose meaningful data after additional filter/date selection, so the hosted sweep is broad but not exhaustive for every data permutation | No |
| Existing plan/dispatch history | Yes | None | No |
| Test and validation boundaries | Yes | None | No |
| Active worktree drift | Yes | None - risk recorded explicitly (now clarified as uncommitted local workspace changes) | No |

## Scope Signal
Signal: right-sized

Rationale: The investigation now covers the token layer, the full routed screen inventory, shared shell families, authenticated hosted route behavior, current plan history, test coverage, and active worktree drift. Remaining uncertainty is about deeper per-filter data permutations, but the current evidence is already sufficient to plan a cohesive styling program with a separate route-health lane.

## Confidence Inputs
- Implementation: 84%
  - Evidence basis: the structural failure is clear and bounded; concrete first-wave files are known; the route census confirms the migration surface.
  - What raises this to >=80: already met.
  - What raises this to >=90: design-spec the three archetypes, confirm the first-wave route list, and quarantine route-health fixes from shell work.

- Approach: 92%
  - Evidence basis: archetype-based consolidation fits the actual route diversity better than token tweaks or a universal shell.
  - What raises this to >=80: already met.
  - What raises this to >=90: already met; further strengthened by a written archetype contract.

- Impact: 91%
  - Evidence basis: the route census shows the shell decision affects almost every staff-visible screen, not just adjacent check-in screens.
  - What raises this to >=80: already met.
  - What raises this to >=90: show that checkout, loans, and alloggiati can share the same table-workflow scaffold with minimal exceptions.

- Delivery-Readiness: 78%
  - Evidence basis: path is clear, but the workspace is already mid-edit, no design-spec artifact exists yet, and some hosted routes have runtime instability.
  - What raises this to >=80: capture a design-spec or plan task that freezes the three archetypes and first-wave scope.
  - What raises this to >=90: reduce or reconcile the in-flight styling sweep and explicitly separate route-health remediation from shell migration before implementation starts.

- Testability: 76%
  - Evidence basis: parity coverage exists but only for `5` routes, and there is no pixel-level authenticated QA; however, authenticated hosted crawl patterns are now known.
  - What raises this to >=80: add scaffold-level snapshot coverage, route-level acceptance checks for check-in + checkout, and smoke assertions for the known failing routes.
  - What raises this to >=90: add authenticated preview/manual QA protocol or visual regression coverage for the first wave.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| More token tweaks are made without fixing shell drift | High | High | Plan must explicitly freeze "token churn as strategy" and move to archetype scaffolds |
| In-flight reception styling edits conflict with the new plan | High | High | Keep first wave tightly scoped and reconcile active owners before build |
| A universal screen shell is forced onto bar/inbox and harms usability | Medium | High | Use explicit archetypes, not one recipe |
| Removing DS compatibility escape hatches too early breaks operational flows | Medium | High | Treat compatibility reduction as later-phase work, not a prerequisite |
| Route-health bugs get absorbed into the styling wave and stall delivery | High | High | Add a dedicated triage lane for runtime/load failures discovered in the hosted sweep |
| Lack of authenticated live QA hides regressions until late | Medium | Medium | Make hosted manual review part of first-wave acceptance |
| Gradient ownership not decided before implementation — two nested gradients persist | High | Medium | Archetype design-spec must specify gradient ownership; implementation gate blocks until decision is documented |
| `AuthenticatedApp` `p-6` preserved alongside archetype padding — double-padding on all screens | High | Medium | Archetype task must remove `AuthenticatedApp` `p-6` or explicitly define combined padding geometry |
| `FilterToolbar` attempts to unify DateSelector/DaySelector — breaks role-access policy on check-in | Medium | High | Design-spec explicitly names FilterToolbar as slot-based; date selector is caller-injected; no unification until operator decides access policy |
| "Migrate checkout" misunderstood as wrapping Checkout in new primitive — PageShell left in place | Medium | High | Clarified in task seeds: checkout migration = PageShell → OperationalTableScreen upgrade, not a wrapper add |

## Planning Constraints & Notes
- Must-follow patterns:
  - Do not treat token edits as the primary solution unless a scaffold reveals a real token gap.
  - Define and name reception screen archetypes before implementation. **The archetype contract (design-spec task output) must be produced and reviewed before any implementation (migration) task begins.**
  - First wave should establish shared shell/header/toolbar/panel recipes for table workflows only.
  - Planning must explicitly separate shell cohesion work from route-health bug remediation.
  - Preserve compatibility-mode usage unless a touched flow is explicitly proven safe without it.
  - **Gradient ownership must be decided and stated in the archetype design-spec.** `AuthenticatedApp`, `CheckinsTableView`, and `PageShell` each independently apply the same gradient. The archetype must own exactly one layer; the others must be removed. This decision affects all 29 routed screens via `AuthenticatedApp` and must not be deferred to implementation.
  - **`AuthenticatedApp`'s `p-6` wrapper must be addressed in the same task as the archetype shell build.** Leaving it in place causes inherited double-padding (`p-6 + p-4`) on every archetype screen. Either remove the `p-6` from `AuthenticatedApp` and own padding in `OperationalTableScreen`, or explicitly account for it in the archetype padding definition.
  - **`FilterToolbar` treats date selection as an injection point, not an owned primitive.** `checkins/DateSelector` and `checkout/DaySelector` implement incompatible role-access policies. The scaffold must not attempt to unify them; each screen injects its own date selector into the `FilterToolbar` slot. Unification of date-access policy is a separate operator decision.
  - **"Migrate checkout" means PageShell → OperationalTableScreen, not wrapping checkout in a new component.** Checkout already uses `PageShell`. The correct migration path is to evolve `PageShell` into `OperationalTableScreen` during the primitives task; checkout then aligns automatically. The "Revisit PageShell" task must come before, not after, the checkout migration step.
- Rollout/rollback expectations:
  - Roll out by archetype wave, not by random screen list.
  - First rollback unit is the table-workflow wave (shared scaffold + check-in + checkout).
- Observability expectations:
  - CI parity results for touched routes.
  - Hosted manual QA for authenticated check-in before closing the first wave.

## Suggested Task Seeds (Non-binding)

**Note on ordering:** checkout already uses `PageShell`. "Migrating checkout" means replacing `PageShell` with `OperationalTableScreen` — which requires the `PageShell`/`AuthenticatedApp` revisit to happen first, not after. The correct sequence is: define archetypes → build `OperationalTableScreen` (during which `PageShell` and `AuthenticatedApp` are reconciled) → migrate check-in → checkout aligns automatically. See gradient-root and double-padding notes in Patterns.

1. **Define reception styling contract** (archetype design-spec — must complete before any implementation task):
   - Name and describe three archetypes: `OperationalTableScreen`, `OperationalWorkspaceScreen`, and the `POSFullBleedScreen` carve-out (non-migrating).
   - Specify gradient ownership decision: does `OperationalTableScreen` own the gradient, or does `AuthenticatedApp`?
   - Specify heading opacity canon: `text-primary-main` or `text-primary-main/80` for `ScreenHeader`.
   - Specify `FilterToolbar` slot contract: date selection is an injection point, not an owned primitive (DateSelector and DaySelector diverge on access policy).

2. **Reconcile `AuthenticatedApp` and `PageShell`** (prerequisite to any scaffold implementation):
   - Remove or make conditional the gradient in `AuthenticatedApp` if the archetype owns it.
   - Remove the `p-6` wrapper from `AuthenticatedApp` and move padding control into `OperationalTableScreen` (prevents inherited double-padding on all archetype screens).
   - At this point `PageShell` either becomes `OperationalTableScreen` or is deprecated in favour of it.

3. **Build the shared primitives for `OperationalTableScreen`**:
   - `OperationalTableScreen` (top-level screen wrapper; owns gradient, padding, and font baseline)
   - `ScreenHeader` (accent bar + title + optional action rail; canonical opacity defined in step 1)
   - `ActionRail` (bulk action buttons, role-gated)
   - `FilterToolbar` (slot-based; date selection injected by caller)
   - `TableCard` (scrollable table wrapper with standard border/shadow/rounding)

4. **Migrate check-in to `OperationalTableScreen`** — reference implementation:
   - Replace `CheckinsTableView`'s outer gradient div with `OperationalTableScreen`.
   - Replace `CheckinsHeader` with `ScreenHeader` + `ActionRail`.
   - Replace the date area wrapper with `FilterToolbar` (injecting existing `DateSelector` as-is).
   - Keep `DateSelector` unchanged — do not consolidate with `DaySelector` in this task.

5. **Checkout aligns automatically** once `PageShell` → `OperationalTableScreen` is resolved in step 2/3:
   - `Checkout.tsx` already wraps with `PageShell title="Checkouts"`. If `PageShell` is upgraded to `OperationalTableScreen`, checkout gets the archetype for free.
   - Verify checkout renders correctly; confirm `DaySelector` is unaffected as an injection point.
   - Do not consolidate `DaySelector` access policy with `DateSelector` in this task — that is a separate operator decision.

6. **Defer bar and inbox migration** until after the table-workflow archetype is proven.
7. **Document `POSFullBleedScreen`** as a **non-migrating carve-out** (deferred indefinitely; intentionally distinct from the shared archetype system). Do not treat it as a migration target at the same priority as `OperationalTableScreen` or `OperationalWorkspaceScreen`.
8. **Route-health triage lane** (separate from shell migration; do not mix into the archetype wave):
   - `/doc-insert`
   - `/safe-management`
   - `/end-of-day`
   - `/real-time-dashboard`

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `lp-design-spec`
  - `lp-design-qa`
  - `frontend-design`
- Deliverable acceptance package:
  - A written archetype contract exists before code migration starts.
  - Check-in and checkout share the same table-workflow scaffold.
  - Shared shell/header/toolbar rules are codified rather than copied per screen.
  - Hosted manual QA sign-off exists for the authenticated check-in screen.
- Post-delivery measurement plan:
  - Count bespoke full-page wrappers remaining after each wave.
  - Track parity coverage added for shared scaffolds.
  - Track reduction in compatibility-mode usage only when achieved safely.

## Evidence Gap Review
### Gaps Addressed
- Compared current code to prior reception styling fact-finds/plans instead of relying on a single stale audit.
- Verified the hosted route contract directly (`/checkin` vs `/check-in`).
- Expanded the audit from representative screens to the full routed screen inventory (`29` staff-visible routes).
- Ran an authenticated hosted crawl to capture live headings, empty states, loading states, and route failures.
- Measured current structural drift with repo counts (`compatibilityMode`, `PageShell`, gradient roots, route count).
- Recorded active worktree drift rather than assuming HEAD and workspace are identical.

### Confidence Adjustments
- Delivery-Readiness remains below 80 because the current workspace already contains a wide styling sweep and the hosted app has unrelated route-health instability.
- Testability remains conservative because protected-route hosted QA is still manual and no automated route smoke suite exists.

### Remaining Assumptions
- The operator screenshot accurately reflects the authenticated check-in experience needing cleanup.
- The hosted route failures seen on 2026-03-08 are genuine current defects, not transient network noise.
- The current uncommitted reception changes are intended to be built on rather than discarded.
- No hidden auth-only layout variant exists that materially contradicts the checked-in source.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None — however, Delivery-Readiness (78%) is below the 80% threshold. This must be resolved by treating the archetype design-spec task as the plan's first required deliverable; no implementation (migration) task may begin before the archetype contract is reviewed and approved.
- Recommended next step:
  - `/lp-do-plan reception-theme-styling-cohesion --auto`
