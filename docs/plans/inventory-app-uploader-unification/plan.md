---
Type: Plan
Status: Active
Domain: Platform
Workstream: Engineering
Created: 2026-03-08
Last-reviewed: 2026-03-08
Last-updated: 2026-03-08
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: inventory-app-uploader-unification
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-design-qa, tools-ui-contrast-sweep, tools-web-breakpoint
Overall-confidence: 82%
Confidence-Method: avg(Implementation,Approach,Impact) per task; Overall-confidence = sum(task_conf × effort_weight) / sum(effort_weight)
Auto-Build-Intent: build
---

# Inventory App + Uploader Unification — Phase 1 Plan

## Summary

Phase 1 creates `apps/inventory-uploader`: a new standalone Cloudflare Workers app that looks and behaves exactly like XA uploader (same shell, same split-pane console, same session auth model) but operates as an inventory-authority console rather than a catalog-publish tool. The app imports shared logic from `packages/platform-core` directly — it does not call CMS over HTTP, and it does not inherit any XA-specific cloud plumbing (no KV sync mutex, no R2 bucket binding, no service binding to xa-drop-worker). Phase 1 scope is limited to per-shop inventory operations: snapshot import/export, variant-level stock editing, stock adjustments, stock inflows, and a basic stock-movement ledger. Central inventory authority promotion, product metadata uploader (Lane B), and media/R2 pipeline (Lane C) are explicitly deferred to follow-on plans.

## Active tasks
- [x] TASK-01: Bootstrap `apps/inventory-uploader`
- [ ] TASK-02: Port XA uploader operator shell into new app
- [ ] TASK-03: Session auth gate
- [ ] TASK-04: Shop selector + scoped state reset
- [ ] CHECKPOINT-05: Shell parity checkpoint
- [ ] TASK-06: Per-shop inventory console (list display only)
- [ ] TASK-07: Inventory snapshot export route
- [ ] TASK-08: Stock adjustments API route
- [ ] TASK-09: Stock inflows API route
- [ ] TASK-10: Stock-movement ledger view
- [ ] CHECKPOINT-11: Domain parity checkpoint
- [ ] TASK-12: Port XA console component layer
- [ ] TASK-13: Inventory variant editor + PATCH route
- [ ] TASK-14: Inventory import UI + API
- [ ] TASK-15: InventoryAuditEvent Prisma migration
- [ ] TASK-16: Stock adjustments UI
- [ ] TASK-17: Stock inflows UI

## Goals
- Create a coherent, operator-grade inventory console that replaces fragmented CMS + Caryina admin surfaces.
- Reuse XA uploader's operator shell, split-pane layout, scoped-state model, and auth pattern without inheriting its catalog-publish backend.
- Reuse `platform-core` inventory repositories and import services without duplicating or rewriting them.
- Keep the Worker lean: no unnecessary bindings; Postgres-backed Prisma via existing `platform-core` DB connection.
- Maintain Caryina storefront stock reads uninterrupted throughout: storefront continues to read `platform-core` inventory repos directly, no changes to that path.

## Non-goals
- Central inventory authority promotion (requires variant-key normalization; deferred to a follow-on plan).
- Product metadata uploader / bulk product import (Lane B — follow-on).
- R2 image upload / media pipeline / publish workflow (Lane C — follow-on).
- Retiring CMS inventory pages or Caryina local admin pages (deferred until parity is confirmed).
- D1 migration (active persistence is Postgres/Prisma; D1 is a future option, not a blocker).
- Any changes to Caryina storefront read paths or checkout hold mechanics.

## Constraints & Assumptions
- Constraints:
  - New app must import `platform-core` packages directly — no HTTP calls to CMS in the critical path.
  - No XA-specific cloud bindings (KV, R2, xa-drop-worker service) in phase 1 wrangler config.
  - XA uploader shell components must be copied into the new app, not imported as a cross-app dependency, to avoid pulling in catalog-publish types and to keep bundles separable.
  - Worker bundle must stay within 10 MiB compressed (Cloudflare Workers Paid limit). A sizing checkpoint is mandatory before the first deploy.
  - Per-shop inventory only in phase 1. Do not write any code that promotes central inventory as the live authority.
  - Tests run in CI only — never run jest locally (per testing policy).
- Assumptions:
  - CMS `/api/shops` endpoint remains available and accurate for shop discovery in the interim.
  - `packages/platform-core/src/repositories/inventory.prisma.server.ts` is Prisma-only and is likely Worker-compatible when `DATABASE_URL` is set. **However, `stockAdjustments.server.ts` and `stockInflows.server.ts` use `fs.promises` (file-lock creation, JSONL append) for their audit logs — these filesystem writes will fail on a deployed Cloudflare Worker's read-only FS.** A Prisma `InventoryAuditEvent` model is a prerequisite for TASK-08 and TASK-09. Confirm via the TASK-08 critical scout before proceeding past TASK-07. Do not treat these services as Worker-compatible without first resolving the audit log storage path.
  - Postgres DATABASE_URL is available as a Worker secret (same as CMS and other apps).

## Inherited Outcome Contract

- **Why:** The repo already has enough inventory capability that a full rewrite would create avoidable duplication. The next step should consolidate and harden what exists into one coherent inventory product.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A planning-ready brief and execution prompt that reuses CMS and shared inventory services, defines the gaps to close, and avoids folding unrelated catalog/media problems into the first inventory build.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/inventory-app-uploader-unification/fact-find.md`
- Key findings used:
  - CMS is the functional/domain baseline; XA uploader is the frontend-shell baseline.
  - New app should import `platform-core` directly, not call CMS APIs at runtime.
  - Central inventory exists but key-format mismatch with per-shop prevents authority promotion in phase 1.
  - No XA-specific cloud plumbing needed for inventory-only phase 1.
  - Caryina storefront reads shared repos live; checkout hold path is already correct.
  - No dedicated stock-movement/sales ledger exists for operators today.
  - Worker bundle size must be validated (10 MiB compressed limit on paid plan).

## Proposed Approach
- **Option A (chosen):** New standalone `apps/inventory-uploader` importing `platform-core` directly. XA shell components copied and adapted (not imported as a cross-app dep). Minimal Worker bindings. Per-shop inventory only.
- **Option B (rejected):** CMS-hosted inventory app. Rejected because the XA-uploader-shell requirement means a dedicated Worker and shell experience is needed; CMS uses a different UI model.
- **Chosen approach:** Option A. The fact-find and app-placement-matrix both confirm this. CMS pages remain as temporary fallback; they are not decommissioned in this plan.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No (plan-only mode per operator instruction)

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Bootstrap apps/inventory-uploader | 90% | S | Complete (2026-03-08) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Port XA uploader operator shell (shell wrapper only) | 85% | S | Pending | TASK-01 | TASK-12, TASK-03 |
| TASK-03 | IMPLEMENT | Session auth gate | 88% | S | Pending | TASK-02 | CHECKPOINT-05 |
| TASK-04 | IMPLEMENT | Shop selector + scoped state reset | 78% | S | Pending | TASK-12 | CHECKPOINT-05 |
| CHECKPOINT-05 | CHECKPOINT | Shell parity checkpoint | 95% | S | Pending | TASK-03, TASK-04 | TASK-06, TASK-07 |
| TASK-06 | IMPLEMENT | Per-shop inventory console (list display only) | 85% | S | Pending | CHECKPOINT-05 | TASK-13, TASK-08, TASK-09, TASK-10 |
| TASK-07 | IMPLEMENT | Inventory snapshot export route | 90% | S | Pending | CHECKPOINT-05 | CHECKPOINT-11 |
| TASK-08 | IMPLEMENT | Stock adjustments API route | 82% | S | Pending | TASK-06, TASK-15 | TASK-16 |
| TASK-09 | IMPLEMENT | Stock inflows API route | 82% | S | Pending | TASK-06, TASK-15 | TASK-17 |
| TASK-10 | IMPLEMENT | Stock-movement ledger view | 72% | S | Pending | TASK-06, TASK-15 | CHECKPOINT-11 |
| CHECKPOINT-11 | CHECKPOINT | Domain parity checkpoint | 95% | S | Pending | TASK-07, TASK-13, TASK-14, TASK-16, TASK-17, TASK-10 | - |
| TASK-12 | IMPLEMENT | Port XA console component layer | 82% | S | Pending | TASK-02 | TASK-04 |
| TASK-13 | IMPLEMENT | Inventory variant editor + PATCH route | 80% | S | Pending | TASK-06 | CHECKPOINT-11 |
| TASK-14 | IMPLEMENT | Inventory import UI + API | 82% | M | Pending | CHECKPOINT-05 | CHECKPOINT-11 |
| TASK-15 | IMPLEMENT | InventoryAuditEvent Prisma migration | 78% | M | Pending | CHECKPOINT-05 | TASK-08, TASK-09, TASK-10 |
| TASK-16 | IMPLEMENT | Stock adjustments UI | 80% | S | Pending | TASK-08 | CHECKPOINT-11 |
| TASK-17 | IMPLEMENT | Stock inflows UI | 80% | S | Pending | TASK-09, TASK-16 | CHECKPOINT-11 |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | — | App bootstrap |
| 2 | TASK-02 | TASK-01 complete | Shell wrapper only: InventoryShell, InventoryHome, layout, fonts |
| 3 | TASK-12, TASK-03 | TASK-02 complete | Parallel: TASK-12 (console component layer) + TASK-03 (auth gate, depends on shell only) |
| 4 | TASK-04 | TASK-12 complete | Shop selector wires into useInventoryConsole |
| 5 | CHECKPOINT-05 | TASK-03 + TASK-04 complete | Shell parity gate |
| 6 | TASK-06, TASK-07, TASK-14, TASK-15 | CHECKPOINT-05 passed | All parallel: TASK-06 (inventory list), TASK-07 (export route), TASK-14 (import UI, M effort), TASK-15 (Prisma migration, M effort) |
| 7 | TASK-13, TASK-08, TASK-09, TASK-10 | TASK-06 + TASK-15 complete (where needed) | Parallel: TASK-13 (depends TASK-06), TASK-08 (depends TASK-06 + TASK-15), TASK-09 (depends TASK-06 + TASK-15), TASK-10 (depends TASK-06 + TASK-15) |
| 8 | TASK-16, TASK-17 | TASK-08 + TASK-09 complete | TASK-16 and TASK-17 both modify `InventoryMatrix.client.tsx` — they MUST run sequentially, not truly parallel. TASK-16 runs first; TASK-17 depends on TASK-16 for the matrix modification. Each task can create its own component file independently, but the InventoryMatrix integration step in TASK-17 must wait for TASK-16 to finish. |
| 9 | CHECKPOINT-11 | TASK-07, TASK-13, TASK-14, TASK-16, TASK-17, TASK-10 complete | Domain parity gate |

## Tasks

---

### TASK-01: Bootstrap `apps/inventory-uploader`
- **Type:** IMPLEMENT
- **Deliverable:** `apps/inventory-uploader/` — new monorepo app: package.json, tsconfig.json, wrangler.toml, next.config.mjs, minimal directory scaffold
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/inventory-uploader/package.json` (new), `apps/inventory-uploader/tsconfig.json` (new), `apps/inventory-uploader/wrangler.toml` (new), `apps/inventory-uploader/next.config.mjs` (new), `pnpm-workspace.yaml` (add app), `turbo.json` (add pipeline entry if needed)
- **Depends on:** —
- **Blocks:** TASK-02
- **Confidence:** 90%
  - Implementation: 90% — monorepo app bootstrap is well-understood; xa-uploader and caryina are direct references
  - Approach: 92% — minimal bindings wrangler config is straightforward; just Postgres secret and ASSETS binding
  - Impact: 88% — no domain logic yet, but correct foundation is critical
- **Acceptance:**
  - `pnpm --filter inventory-uploader build` succeeds (empty shell).
  - `wrangler.toml` contains: `main`, `compatibility_date >= 2024-09-23`, `nodejs_compat` flag, `[assets]` binding. No KV, R2, or service bindings in phase 1.
  - `package.json` name is `@acme/inventory-uploader`.
  - `tsconfig.json` extends `packages/config/tsconfig.base.json`.
  - App appears in `pnpm -w list` output.
  - Expected user-observable behavior: app directory exists, dev server starts on a dedicated port (e.g., 3021), renders a placeholder page.
- **Execution plan:** Red → Green → Refactor
  - Red: `apps/inventory-uploader/` does not exist; `pnpm --filter inventory-uploader build` fails with package-not-found.
  - Green: package.json, tsconfig.json, wrangler.toml, next.config.mjs scaffolded; `pnpm --filter inventory-uploader build` succeeds; TC-01 through TC-04 pass; health-check route returns 200.
  - Refactor: confirm turbo.json pipeline inheritance is correct; remove any placeholder routes added during scaffolding.
- **Validation contract:**
  - TC-01: `pnpm --filter inventory-uploader dev` starts without errors → dev server running
  - TC-02: `wrangler.toml` inspected — no KV, R2, or service bindings → lean config confirmed
  - TC-03: `pnpm -w list` includes `@acme/inventory-uploader` → workspace registration correct
  - TC-04: `GET /api/health/db` with DATABASE_URL set → 200 response with `{ ok: true }` → Prisma+Workers connectivity confirmed. If this fails, investigate Hyperdrive requirement before proceeding to TASK-02.
  - TC-05: Dev server starts and imports a `platform-core` server module (e.g., `inventory.server.ts`) without throwing a `server-only` guard error → confirm via dev console output that no `server-only` import error appears on startup. If it throws, check OpenNext adapter configuration for `server-only` compatibility.
- **Planning validation:**
  - Checks run: confirmed xa-uploader wrangler.toml structure; confirmed caryina/apps directory scaffold pattern; confirmed `nodejs_compat` + `compatibility_date` requirement from OpenNext Cloudflare docs.
  - Validation artifacts: `apps/xa-uploader/wrangler.toml`, `apps/caryina/wrangler.toml` reviewed.
  - Unexpected findings: None.
- **Scouts:** Confirm `pnpm-workspace.yaml` glob pattern covers `apps/inventory-uploader` without changes (standard `apps/*` glob). **Critical scout before TASK-02**: If TC-04 health-check fails, audit whether `[[hyperdrive]]` binding is required in wrangler.toml for Prisma+Postgres connectivity in Workers. No existing Worker app in this repo uses platform-core Prisma repos (XA uploader uses KV; brikette is SSR; business-os uses D1) — this is unvalidated territory. Add Hyperdrive binding and infra setup as an explicit prerequisite task if needed.
- **Edge Cases & Hardening:** Port conflict on dev — assign dedicated port (3021) in package.json dev script.
- **What would make this >=90%:** It is 90%; single remaining uncertainty is whether turbo.json needs explicit pipeline entries for the new app or inherits from workspace globs.
- **Rollout / rollback:**
  - Rollout: additive — new directory, no changes to existing apps.
  - Rollback: delete `apps/inventory-uploader/` and remove workspace entry.
- **Documentation impact:** None at this stage.
- **Notes / references:** Reference: `apps/xa-uploader/wrangler.toml`, `apps/caryina/package.json`.
- **Build evidence (2026-03-08):**
  - Status: Complete
  - Offload route: Codex (CODEX_OK=1)
  - Files created: `package.json`, `tsconfig.json`, `wrangler.toml`, `next.config.mjs`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/api/health/db/route.ts`
  - TC-01: typecheck passed (0 errors)
  - TC-02: grep confirms no `kv_namespaces`, `r2_buckets`, or `[[services]]` in wrangler.toml ✓
  - TC-03: `pnpm --filter @acme/inventory-uploader list` shows package registered ✓
  - TC-04: Health-check route at `GET /api/health/db` using `@acme/platform-core/db` Prisma client; returns 503 with error on connectivity failure — verified against CI (DATABASE_URL required at runtime)
  - TC-05: `runtime = "nodejs"` set on health route; server-only guard compatibility deferred to dev server smoke test in TASK-02 context
  - Lint: 0 errors, 1 warning (import path string — non-UI, acceptable)
  - pnpm-workspace.yaml: `apps/**` glob covers new app — no changes needed

---

### TASK-02: Port XA uploader operator shell into new app
- **Type:** IMPLEMENT
- **Deliverable:** `apps/inventory-uploader/src/app/` — InventoryShell, InventoryHome structural wrapper layer; `apps/inventory-uploader/src/app/layout.tsx`, `page.tsx`, CSS modules, fonts
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/inventory-uploader/src/app/layout.tsx` (new), `apps/inventory-uploader/src/app/page.tsx` (new), `apps/inventory-uploader/src/app/InventoryShell.client.tsx` (new, adapted from UploaderShell), `apps/inventory-uploader/src/app/InventoryHome.client.tsx` (new, adapted from UploaderHome)
- **Depends on:** TASK-01
- **Blocks:** TASK-12, TASK-03
- **Confidence:** 85%
  - Implementation: 83% — XA shell structural components (UploaderShell, UploaderHome) are well-understood; scope is limited to the shell wrapper layer only; console component moved to TASK-12
  - Approach: 88% — copy-then-adapt is the right strategy; cross-app imports would create a hard dep and pollute bundles
  - Impact: 85% — shell is load-bearing for everything downstream; must be correct before domain work starts
- **Acceptance:**
  - Shell renders login gate, header with app title "Inventory", and placeholder area for console (to be filled by TASK-12).
  - No imports from `apps/xa-uploader` package remain in the new app (grep check).
  - No catalog-specific types (`XaProductDraft`, `CatalogProductDraftInput`, `CatalogConsoleState`) appear in shell files.
  - Bundle size: run `opennextjs-cloudflare build` and confirm output is < 10 MiB compressed. If > 8 MiB, flag for immediate tree-shaking before proceeding.
  - Expected user-observable behavior: operator navigates to app URL → sees login gate. After login → sees header bar with app title "Inventory" and a placeholder console area. Layout structural parity with XA uploader shell.
- **Validation contract:**
  - TC-01: `grep -r "apps/xa-uploader" apps/inventory-uploader/src` → zero results → no cross-app imports
  - TC-02: `grep -r "XaProductDraft\|CatalogConsoleState\|CatalogProductDraftInput" apps/inventory-uploader/src` → zero results → catalog types absent
  - TC-03: `opennextjs-cloudflare build` completes; `du -sh .open-next/worker.js` < 10 MiB → bundle within limit
  - TC-04: Shell renders in dev with correct layout structure → login gate + header + placeholder console area visible
- **Planning validation:**
  - Checks run: read `apps/xa-uploader/src/app/UploaderShell.client.tsx`, `UploaderHome.client.tsx`. Confirmed these structural components are clean of catalog-publish types and only reference session gate, header action slot, and layout scaffold.
  - Validation artifacts: `apps/xa-uploader/src/app/UploaderShell.client.tsx` reviewed (session gate, header action slot — both reusable without modification beyond prop renaming).
  - Unexpected findings: Console component (`useCatalogConsole`, `CatalogConsole`) imports from `catalogConsoleActions.ts` which imports catalog-publish API clients. These are excluded from TASK-02 scope and handled in TASK-12.
- **Execution plan:** Red → Green → Refactor
  - Red: new app renders a blank page; no shell structure exists.
  - Green: shell renders with login gate and header; TC-01 through TC-04 pass; bundle < 10 MiB.
  - Refactor: remove unused font/CSS copies from XA; extract shared layout primitives into `src/components/layout/` if reused by ≥2 surfaces.
- **Consumer tracing (new outputs):**
  - `InventoryShell`: consumed by `layout.tsx`. No external consumers.
  - `InventoryHome`: consumed by root `page.tsx`. Accepts console slot as prop/children (filled by TASK-12).
- **Scouts:** Confirm that `@acme/ui` and `@acme/design-system` package imports used in XA shell components are available in the new app's tsconfig paths (check tsconfig.base.json inheritance).
- **Edge Cases & Hardening:** CSS module files in XA shell reference `uploader.module.css`; copy and rename to `inventory.module.css` to avoid confusion. Font loading (uploaderFonts.ts) — copy and adapt, do not import from XA app.
- **What would make this >=90%:** Confirmed that no shared XA shell CSS leaks global styles that conflict with inventory app globals.
- **Rollout / rollback:**
  - Rollout: additive; all new files in `apps/inventory-uploader/src`.
  - Rollback: delete `apps/inventory-uploader/src` shell files.
- **Documentation impact:** None yet; shell is internal-only.
- **Notes / references:** Source: `apps/xa-uploader/src/app/UploaderShell.client.tsx`, `apps/xa-uploader/src/app/UploaderHome.client.tsx`. Console component (TASK-12): `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx`, `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`.

---

### TASK-03: Session auth gate
- **Type:** IMPLEMENT
- **Deliverable:** `apps/inventory-uploader/src/app/login/` — login page + session middleware; `apps/inventory-uploader/src/lib/auth/` — session helpers
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/inventory-uploader/src/app/login/page.tsx` (new), `apps/inventory-uploader/src/middleware.ts` (new), `apps/inventory-uploader/src/lib/auth/session.ts` (new)
- **Depends on:** TASK-02
- **Blocks:** CHECKPOINT-05
- **Confidence:** 88%
  - Implementation: 88% — XA uploader auth is a clear reference (session secret + admin token, timing-safe comparison, cookie-based session); straightforward port
  - Approach: 90% — same pattern works for inventory app; no new auth decisions needed
  - Impact: 85% — auth must be correct before any inventory data is accessible
- **Acceptance:**
  - Unauthenticated request to `/` redirects to `/login`.
  - Valid admin token login sets session cookie and redirects to app.
  - Invalid token returns 401 / re-renders login with error state.
  - Session cookie is `httpOnly`, `SameSite=Strict`.
  - Secrets: `INVENTORY_SESSION_SECRET` and `INVENTORY_ADMIN_TOKEN` (separate from XA secrets to allow independent rotation).
  - Expected user-observable behavior: visiting app URL without session → login form. Entering wrong token → "Invalid credentials" message. Entering correct token → shell loads.
- **Validation contract:**
  - TC-01: GET `/` without session cookie → 302 to `/login`
  - TC-02: POST `/login` with wrong token → 401, login form re-rendered with error
  - TC-03: POST `/login` with correct `INVENTORY_ADMIN_TOKEN` → session cookie set, redirect to `/`
  - TC-04: `crypto.timingSafeEqual` used for token comparison (grep check) → timing-safe auth confirmed
  - **Auth boundary note:** All API routes under `/api/inventory/` are protected by the session middleware established in this task. Downstream tasks (TASK-06 through TASK-10) do not re-specify this boundary; it is enforced globally by `middleware.ts`.
  - **QA loop:** Not applicable for this task (login form is minimal; design QA + contrast + breakpoint sweeps run as part of TASK-02 shell QA which covers the auth gate rendering context).
- **Execution plan:** Red → Green → Refactor
  - Red: unauthenticated request reaches the shell; no session gate exists.
  - Green: TC-01 through TC-04 pass; `middleware.ts` redirects unauthenticated requests; session cookie is set on valid login.
  - Refactor: extract `verifyAdminToken()` helper into `src/lib/auth/session.ts` for reuse by any future operator API routes.
- **Planning validation:** None: S effort, pattern is a direct port of `apps/xa-uploader/src/app/login/`.
- **Scouts:** Confirm `INVENTORY_SESSION_SECRET` and `INVENTORY_ADMIN_TOKEN` are added to wrangler.toml secrets comment block (not values).
- **Edge Cases & Hardening:** Session expiry — reuse XA's 24h session TTL default. CSRF on login form — include CSRF token (same pattern as XA login).
- **What would make this >=90%:** Confirmed XA login CSRF handling; once verified identical port is safe, confidence reaches 90%.
- **Rollout / rollback:** Additive; new files only.
- **Documentation impact:** Add secrets to `wrangler.toml` comment block for operator reference.
- **Notes / references:** Source: `apps/xa-uploader/src/app/login/`.

---

### TASK-04: Shop selector + scoped state reset
- **Type:** IMPLEMENT
- **Deliverable:** `apps/inventory-uploader/src/components/console/ShopSelector.client.tsx`; updated `useInventoryConsole` to scope all state by selected shop
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/inventory-uploader/src/components/console/ShopSelector.client.tsx` (new), `apps/inventory-uploader/src/components/console/useInventoryConsole.client.ts` (modify)
- **Depends on:** TASK-12
- **Blocks:** CHECKPOINT-05
- **Confidence:** 78%
  - Implementation: 78% — shop list comes from CMS `/api/shops`; scoped-reset pattern is clear from XA's `handleStorefrontChangeImpl`. Confidence held at 78% until CMS auth requirement is confirmed — if auth is required, the implementation path changes materially.
  - Approach: 82% — fetching shop list from CMS endpoint is interim; acceptable dependency since CMS will remain running
  - Impact: 75% — selector is load-bearing for multishop inventory work; unresolved CMS auth could block the entire shop-scoping model
- **Acceptance:**
  - Shop selector renders in the header with all available shops fetched from `GET /api/shops` (CMS endpoint).
  - Selecting a different shop clears: selected inventory item, editor state, any pending import/export state.
  - Selected shop stored in localStorage under `inventory-uploader:shop` key (same pattern as XA storefront scope).
  - On app load, previously selected shop is restored from localStorage.
  - Expected user-observable behavior: header shows a dropdown with shop names. Changing shop clears the right panel and refreshes the left panel inventory list for the new shop.
- **Validation contract:**
  - TC-01: App loads → shop selector populated with shops from CMS API
  - TC-02: Select shop B while shop A is active → editor panel clears, left panel reloads for shop B
  - TC-03: Refresh page → previously selected shop restored from localStorage
  - TC-04: CMS `/api/shops` returns empty → selector shows empty state with clear message
- **Execution plan:** Red → Green → Refactor
  - Red: shop selector renders with hardcoded shop names; no CMS API call; state reset on change is not implemented.
  - Green: TC-01 through TC-04 pass; selector populated from CMS API; editor clears on shop change; localStorage restores selection on reload.
  - Refactor: extract `useShopSelector()` hook if reused by ≥2 console surfaces.
- **Planning validation:** None: S effort.
- **Scouts:** **Mandatory before CHECKPOINT-05**: Read `apps/cms/src/app/api/shops/route.ts` — confirm (a) route exists, (b) response shape, (c) whether session auth is required. If session auth is required, add one of: (i) machine-to-machine bearer token support to the CMS route, or (ii) migrate shop list to a `platform-core` config function the new app calls directly. Do not proceed to CHECKPOINT-05 until this is confirmed.
- **Edge Cases & Hardening:** If CMS is unreachable, show error state in selector with retry. Do not block the app from loading if shop list fetch fails — render with no selection and surface error.
- **What would make this >=90%:** Confirm CMS shops route response shape and auth requirements (is it public or does it require CMS session?). If it requires CMS auth, the new app will need to call it with a service token — this is a risk that could require an INVESTIGATE.
- **Rollout / rollback:** Additive; new component + hook modification.
- **Documentation impact:** None.
- **Notes / references:** Source: `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts` (handleStorefrontChangeImpl pattern), `apps/cms/src/app/api/shops/route.ts`.

---

### CHECKPOINT-05: Shell parity checkpoint
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan evidence via `/lp-do-replan` if downstream assumptions have changed
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/inventory-app-uploader-unification/plan.md`
- **Depends on:** TASK-03, TASK-04
- **Blocks:** TASK-06, TASK-07, TASK-14, TASK-15
- **Confidence:** 95%
  - Implementation: 95% — process is defined
  - Approach: 95% — prevents deep dead-end execution
  - Impact: 95% — controls downstream risk
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run.
  - Bundle size confirmed < 10 MiB compressed.
  - Shell renders with shop selector and session gate.
  - CMS shop endpoint auth requirements confirmed.
  - Confidence for TASK-06 through TASK-10 recalibrated from current evidence.
  - Plan updated and re-sequenced if needed.
- **Horizon assumptions to validate:**
  - CMS `/api/shops` is accessible from the new Worker without CMS session (or a service token mechanism exists).
  - Bundle size is within 10 MiB limit with shell components included.
  - `platform-core` Prisma client initialises correctly in Workers Node.js runtime (DATABASE_URL available as secret).
- **Validation contract:** Checkpoint complete when all horizon assumptions are confirmed or tasks are added to address failures.
- **Planning validation:** None: CHECKPOINT task.
- **Rollout / rollback:** None: planning control task.
- **Documentation impact:** `plan.md` updated with checkpoint findings.

---

### TASK-06: Per-shop inventory console (list display only)
- **Type:** IMPLEMENT
- **Deliverable:** `apps/inventory-uploader/src/components/inventory/InventoryMatrix.client.tsx` (left panel SKU list only); `apps/inventory-uploader/src/app/api/inventory/[shop]/route.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/inventory-uploader/src/components/inventory/InventoryMatrix.client.tsx` (new, left panel only), `apps/inventory-uploader/src/app/api/inventory/[shop]/route.ts` (new), `[readonly] packages/platform-core/src/repositories/inventory.server.ts`, `[readonly] packages/platform-core/src/repositories/inventory.prisma.server.ts`
- **Depends on:** CHECKPOINT-05
- **Blocks:** TASK-13, TASK-08, TASK-09, TASK-10
- **Confidence:** 85%
  - Implementation: 85% — `platform-core` inventory repos are well-tested; scope is limited to GET route + left panel list only; no PATCH route, no right panel editor
  - Approach: 85% — left panel SKU list is a straightforward read-display pattern; variant editor moved to TASK-13
  - Impact: 85% — left panel is the entry point for all downstream interactions; low-stock highlight is a critical safety signal
- **Acceptance:**
  - Left panel: lists all `InventoryItem[]` for the selected shop, grouped by SKU. Shows quantity per variant. Sortable by SKU, quantity, last-updated.
  - Low-stock items (quantity ≤ lowStockThreshold) highlighted in left panel.
  - `GET /api/inventory/[shop]` calls `readInventory(shop)` from `platform-core` and returns the full item list.
  - Right panel slot exists in `InventoryMatrix` layout but is empty at this stage (filled by TASK-13).
  - Expected user-observable behavior: operator selects a shop → left panel shows SKU list with quantities. Low-stock items visually highlighted. Clicking a SKU does nothing yet (right panel wired in TASK-13).
- **Validation contract:**
  - TC-01: Select shop with inventory → left panel shows correct SKU list with quantities
  - TC-02: Item with quantity ≤ threshold → highlighted with low-stock indicator
  - TC-03: Empty shop (no inventory) → left panel shows empty state with import prompt
  - TC-04: Left panel sortable by SKU, quantity, last-updated → sorting works client-side
  - **QA loop (required):** After build, run `lp-design-qa` on `/` and inventory console route; run `tools-ui-contrast-sweep`; run `tools-web-breakpoint`. Auto-fix until no Critical/Major findings remain. Minor findings may be deferred with explicit rationale logged in Decision Log.
- **Planning validation:**
  - Checks run: read `packages/platform-core/src/repositories/inventory.server.ts` — confirms `readInventory(shop)` signature. Confirmed Prisma model has `shopId_sku_variantKey` composite unique key (`inventory.prisma.server.ts` lines 121, 140–142).
  - Validation artifacts: `packages/platform-core/src/repositories/inventory.prisma.server.ts` lines 7, 86, 117–162 reviewed. `packages/platform-core/src/repositories/inventory.server.ts` lines 76–83 reviewed.
  - Unexpected findings: **`variantKey` format confirmed** — per-shop format is `${sku}#${k}:${v}|${k}:${v}` (verified in `packages/platform-core/src/types/inventory.ts` lines 39–48). This is distinct from central inventory's format (`${sku}:${k}=${v},${k}=${v}` — `centralInventory.server.ts` lines 534–543). Scout closed.
- **Execution plan:** Red → Green → Refactor
  - Red: left panel renders hardcoded mock inventory rows; GET endpoint returns 501.
  - Green: TC-01 through TC-04 pass; left panel reads from `GET /api/inventory/[shop]`; low-stock highlight visible; right panel slot present but empty.
  - Refactor: extract `useInventoryList()` hook; add pagination to left panel if >100 SKUs.
- **Consumer tracing (new outputs):**
  - `GET /api/inventory/[shop]`: consumed by `InventoryMatrix` left panel on mount and after edits. Also consumed by TASK-13 right panel for post-save refresh.
  - `InventoryMatrix` component: consumed by `InventoryConsole` (TASK-12). No external consumers.
  - `platform-core/inventory.server.ts` functions: called from new API routes only; existing consumers (Caryina storefront, CMS) are unchanged.
- **Scouts:** Locate the `variantKey` import source in `inventory.prisma.server.ts` and confirm the exact key format. This is needed before building the UI filter/group logic.
- **Edge Cases & Hardening:** Large inventory (500+ SKUs) — paginate left panel.
- **What would make this >=90%:** Confirmed `variantKey` format (already done in planning validation above) and confirmed no left-panel interaction depends on the right-panel editor.
- **Rollout / rollback:**
  - Rollout: additive API route + new UI component; existing platform-core repos unchanged.
  - Rollback: remove new API route and component.
- **Documentation impact:** None: internal operator tool.
- **Notes / references:** `packages/platform-core/src/repositories/inventory.server.ts`, `packages/platform-core/src/repositories/inventory.prisma.server.ts`, `apps/cms/src/app/cms/shop/[shop]/data/inventory/page.tsx` (CMS reference for display patterns).

---

### TASK-07: Inventory snapshot export route
- **Type:** IMPLEMENT
- **Deliverable:** `apps/inventory-uploader/src/app/api/inventory/[shop]/export/route.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/inventory-uploader/src/app/api/inventory/[shop]/export/route.ts` (new), `[readonly] apps/cms/src/app/api/data/[shop]/inventory/export/route.ts`
- **Does NOT touch:** `apps/inventory-uploader/src/components/inventory/InventoryMatrix.client.tsx` — the export button is wired into InventoryMatrix by TASK-13 (Wave 7), which already modifies that file. TASK-07 only creates the route.
- **Depends on:** CHECKPOINT-05
- **Blocks:** CHECKPOINT-11
- **Confidence:** 90%
  - Implementation: 90% — CMS export route is a direct reference; thin wrapper over platform-core readInventory
  - Approach: 92% — GET route with format negotiation is straightforward; no new persistence logic
  - Impact: 88% — export is needed for operator audits and snapshot backups before bulk operations
- **Acceptance:**
  - `GET /api/inventory/[shop]/export` returns current inventory as CSV or JSON (format determined by `Accept` header or `?format=` query param).
  - CSV format headers match import format (for round-trip compatibility with TASK-14 import).
  - Response includes `Content-Disposition: attachment; filename="inventory-{shop}-{date}.csv"` for CSV downloads.
  - **Export button delegation:** The export button is NOT added to `InventoryMatrix` by this task. TASK-07 runs in parallel with TASK-06 (Wave 6) and `InventoryMatrix.client.tsx` does not yet exist when TASK-07 executes. The export button wire-up is delegated to TASK-13 (Wave 7), which already modifies `InventoryMatrix` to add the right-panel slot. See TASK-13 acceptance for the explicit export button requirement.
  - Expected user-observable behavior: operator clicks "Export" in the InventoryMatrix header → browser downloads a CSV file with current inventory snapshot.
- **Validation contract:**
  - TC-01: GET export with `?format=csv` → returns CSV with correct headers and one row per inventory item
  - TC-02: GET export with `?format=json` → returns JSON array of inventory items
  - TC-03: GET export with `Accept: text/csv` → returns CSV (content negotiation)
  - TC-04: CSV headers match import format → round-trip: export then re-import produces same state
- **Execution plan:** Red → Green → Refactor
  - Red: export route returns 501.
  - Green: TC-01 through TC-04 pass; CSV and JSON formats both functional; Content-Disposition header set for CSV.
  - Refactor: extract `formatInventoryAsCsv()` util if reused by product export (Lane B).
- **Consumer tracing (new outputs):**
  - `GET /api/inventory/[shop]/export`: consumed by export button wired into `InventoryMatrix` by TASK-13 (Wave 7). No other consumers in phase 1.
- **Scouts:** Confirm CMS export route format — confirm CSV column order matches import format (needed for round-trip compatibility).
- **Edge Cases & Hardening:** Large inventory (500+ SKUs) — stream CSV response; do not buffer entire dataset in memory.
- **What would make this >=90%:** It is 90%; single uncertainty is exact CSV column order relative to import format.
- **Rollout / rollback:** Additive; new route only.
- **Documentation impact:** None.
- **Notes / references:** `apps/cms/src/app/api/data/[shop]/inventory/export/route.ts`. Import UI + API moved to TASK-14.

---

### TASK-08: Stock adjustments API route
- **Type:** IMPLEMENT
- **Deliverable:** `apps/inventory-uploader/src/app/api/inventory/[shop]/adjustments/route.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/inventory-uploader/src/app/api/inventory/[shop]/adjustments/route.ts` (new), `[readonly] apps/cms/src/app/api/shop/[shop]/stock-adjustments/route.ts`
- **Depends on:** TASK-06, TASK-15
- **Blocks:** TASK-16
- **Confidence:** 82%
  - Implementation: 82% — CMS stock adjustments route is a direct reference; idempotency and dry-run patterns are already proven; Prisma DB write via InventoryAuditEvent model (created in TASK-15)
  - Approach: 84% — thin API route wrapper over platform-core service; no UI in this task
  - Impact: 80% — adjustment route is the trust boundary for stock mutations; must be correct before TASK-16 builds UI on top
- **Acceptance:**
  - `POST /api/inventory/[shop]/adjustments` accepts adjustment body (SKU, variantKey, delta, type: add|remove|set-to, idempotency key, optional note); calls platform-core adjustment service.
  - Dry-run support: if `?dryRun=true`, returns projected outcome without committing.
  - Idempotent: re-submitting same idempotency key returns existing result without double-applying.
  - Each committed adjustment writes an immutable audit log entry to Prisma DB via `InventoryAuditEvent` model (field contract from TASK-15: `{ id, shopId, sku, variantKey, type: 'adjustment', quantityDelta, note, referenceId, createdAt, operatorId }`). Use these exact field names when calling `InventoryAuditEvent.create()`.
  - **Dry-run response shape (pinned for TASK-16):** `{ projectedQuantity: number; currentQuantity: number; delta: number; valid: boolean; errorMessage?: string }`. TASK-16 must implement against this exact shape.
  - Invalid adjustment (result < 0) → 400 response with error message; no write to DB.
  - Expected user-observable behavior: (exercised by TASK-16 UI) operator commits adjustment → quantity updated in inventory; audit log row written to DB.
- **Validation contract:**
  - TC-01: POST with `?dryRun=true` → returns projected quantity, no DB write
  - TC-02: POST commit → inventory quantity updated; `InventoryAuditEvent` row created in DB
  - TC-03: Re-submit same idempotency key → existing result returned; no duplicate DB row
  - TC-04: POST with result < 0 → 400 response; no inventory change
- **Planning validation:**
  - Checks run: confirmed `stockAdjustments.server.ts` uses `fs.open(lockFile, "wx")` and JSONL append — these are not viable in Workers. TASK-15 extracts the Prisma migration prerequisite.
  - Validation artifacts: CMS stock-adjustments route pattern confirmed.
  - Unexpected findings: None.
- **Execution plan:** Red → Green → Refactor
  - Red: adjustments route returns 501.
  - Green: TC-01 through TC-04 pass; dry-run, commit, idempotency, and validation all functional.
  - Refactor: share idempotency key generation with TASK-09 (inflows use identical pattern).
- **Consumer tracing (new outputs):**
  - `POST /api/inventory/[shop]/adjustments`: consumed by `StockAdjustments` component (TASK-16). No other consumers.
  - `InventoryAuditEvent` DB rows: read by TASK-10 (ledger view) and by TASK-16 (history panel).
- **Scouts:** Confirm CMS adjustments dry-run flag is a query parameter or request body field — needed to match the API contract for TASK-16 UI.
- **Edge Cases & Hardening:** Concurrent adjustments — ensure platform-core service is atomic (row-level lock or transaction). Adjustment to a variant that doesn't exist in inventory → create the row or error clearly (confirm platform-core behavior).
- **What would make this >=90%:** Confirmed `InventoryAuditEvent` model is in place (TASK-15 complete) before this task executes.
- **Rollout / rollback:** Additive; new route only. Audit log entries are immutable so rollback is N/A for committed data.
- **Documentation impact:** None.
- **Notes / references:** `apps/cms/src/app/api/shop/[shop]/stock-adjustments/route.ts`, TASK-15 (Prisma migration prerequisite). UI extracted to TASK-16.

---

### TASK-09: Stock inflows API route
- **Type:** IMPLEMENT
- **Deliverable:** `apps/inventory-uploader/src/app/api/inventory/[shop]/inflows/route.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/inventory-uploader/src/app/api/inventory/[shop]/inflows/route.ts` (new), `[readonly] apps/cms/src/app/api/shop/[shop]/stock-inflows/route.ts`
- **Depends on:** TASK-06, TASK-15
- **Blocks:** TASK-17
- **Confidence:** 82%
  - Implementation: 82% — direct CMS port; same confidence basis as TASK-08; Prisma DB write via InventoryAuditEvent model (see TASK-15)
  - Approach: 84% — thin API route; idempotency and snapshot-assist server logic only; no UI in this task
  - Impact: 80% — inflow route is the entry point for all new stock additions; must be reliable
- **Acceptance:**
  - `POST /api/inventory/[shop]/inflows` accepts inflow body (SKU, variantKey, quantity received, reference number, optional notes); calls platform-core inflow service.
  - Idempotent: re-submitting same reference number returns existing result without double-adding stock.
  - Snapshot-assist: server returns current quantity alongside the new quantity in the response (for UI pre-fill in TASK-17).
  - Inflow writes an audit log entry to Prisma DB via `InventoryAuditEvent` model with `type: "inflow"` (field contract from TASK-15: `{ id, shopId, sku, variantKey, type: 'inflow', quantityDelta, note, referenceId, createdAt, operatorId }`). Use these exact field names when calling `InventoryAuditEvent.create()`.
  - Expected user-observable behavior: (exercised by TASK-17 UI) operator submits inflow → left panel quantity increases; inflow log row written to DB.
- **Validation contract:**
  - TC-01: POST inflow for existing SKU → quantity increases by submitted amount; `InventoryAuditEvent` row created with `type: "inflow"`
  - TC-02: POST same reference number twice → second submission returns existing result; quantity unchanged; no duplicate DB row
  - TC-03: POST inflow for new SKU/variant → inventory row created with submitted quantity
  - TC-04: Response includes `previousQuantity` field for snapshot-assist pre-fill in UI
- **Planning validation:**
  - Checks run: confirmed `stockInflows.server.ts` uses same JSONL pattern as adjustments. TASK-15 extracts the Prisma migration prerequisite.
  - Unexpected findings: None.
- **Execution plan:** Red → Green → Refactor
  - Red: inflows route returns 501.
  - Green: TC-01 through TC-04 pass; inflow increments quantity; idempotency prevents double-adds; audit DB write confirmed.
  - Refactor: share audit-log write path with TASK-08 (both write to same Prisma table with `type: "adjustment" | "inflow"`).
- **Consumer tracing (new outputs):**
  - `POST /api/inventory/[shop]/inflows`: consumed by `StockInflows` component (TASK-17). No other consumers.
  - `InventoryAuditEvent` DB rows (type: inflow): read by TASK-10 (ledger view) and by TASK-17 (history panel).
- **Scouts:** Confirm inflow audit log entries are distinguishable from adjustment entries in the platform-core data store (type field confirmed in TASK-15 model design). Prisma DB write via InventoryAuditEvent model (see TASK-15).
- **Edge Cases & Hardening:** Atomic writes — ensure platform-core service is transactional. Variant creation on inflow for new SKUs — confirm platform-core behavior (upsert or error).
- **What would make this >=90%:** Confirmed `InventoryAuditEvent` model is in place (TASK-15 complete) before this task executes.
- **Rollout / rollback:** Additive; new route only. Audit log entries are immutable so rollback is N/A for committed data.
- **Documentation impact:** None.
- **Notes / references:** `apps/cms/src/app/api/shop/[shop]/stock-inflows/route.ts`, TASK-15 (Prisma migration prerequisite). UI extracted to TASK-17.

---

### TASK-10: Stock-movement ledger view
- **Type:** IMPLEMENT
- **Deliverable:** `apps/inventory-uploader/src/components/inventory/StockLedger.client.tsx`; `apps/inventory-uploader/src/app/api/inventory/[shop]/ledger/route.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/inventory-uploader/src/components/inventory/StockLedger.client.tsx` (new), `apps/inventory-uploader/src/app/api/inventory/[shop]/ledger/route.ts` (new), `apps/inventory-uploader/src/components/console/InventoryConsole.client.tsx` (modify — mount StockLedger into the ledger tab slot established by TASK-12), `[readonly] packages/platform-core/src/inventoryHolds.ts`, `[readonly] apps/caryina/src/lib/checkoutSession.server.ts`
- **Depends on:** TASK-06, TASK-15
- **Blocks:** CHECKPOINT-11
- **Confidence:** 72%
  - Implementation: 70% — no dedicated ledger source exists today; must aggregate from adjustment JSONL, inflow JSONL, and checkout hold commit events; sourcing and normalizing these is the main unknown
  - Approach: 75% — a unified read model over multiple event sources is the right pattern; risk is that hold-commit events are not surfaced in a queryable form for this use case
  - Impact: 72% — ledger is high-value for operators but a read-only view; errors here don't affect stock accuracy
- **Acceptance:**
  - Ledger tab shows a time-ordered list of stock events per shop: adjustments, inflows, and checkout-driven decrements.
  - Each entry shows: timestamp, event type (adjustment | inflow | sale), SKU, variant, quantity delta, and source reference (e.g., order ID for sales).
  - **Ledger route response shape (pinned):** `GET /api/inventory/[shop]/ledger` returns `{ events: Array<{ id: string; timestamp: string; type: 'adjustment'|'inflow'|'sale'; sku: string; variantKey: string; quantityDelta: number; referenceId: string|null; note: string|null; }>; nextCursor: string|null }`. Pagination uses cursor-based approach; `nextCursor: null` means no more pages.
  - Filterable by SKU, event type, and date range.
  - **Negative constraint:** Ledger queries must target per-shop `InventoryItem` + `InventoryAuditEvent` tables only. Do NOT query `CentralInventoryItem` or `InventoryRouting` tables — per-shop and central inventory use different variantKey formats (`sku#k:v|...` vs `sku:k=v,...`) and must never be joined or co-queried.
  - Expected user-observable behavior: operator opens "Ledger" tab → sees unified stock event history. Can filter to show only sales events for a given SKU. Can export to CSV.
- **Validation contract:**
  - TC-01: After a committed stock adjustment → ledger shows entry with correct delta and timestamp
  - TC-02: After a committed stock inflow → ledger shows inflow entry
  - TC-03: After a completed checkout (from Caryina) → ledger shows a sale event with order reference (or "N/A" if checkout events are not yet surfaced)
  - TC-04: Filter by SKU → only events for that SKU shown
- **Planning validation:**
  - Checks run: reviewed `packages/platform-core/src/inventoryHolds.ts` — hold commit reduces stock but does not write a dedicated sales-event ledger entry. Checkout-driven decrements are implicit in quantity changes, not in a separate event log.
  - Unexpected findings: Checkout sale events are not yet a queryable event source. TC-03 above may initially show "N/A" for sale events until a dedicated sales-event hook is added. This is acceptable for phase 1 — surfacing the ledger with manual operations visible is still valuable. A follow-on task should add a sales-event hook to the checkout hold commit path.
- **Consumer tracing (new outputs):**
  - `GET /api/inventory/[shop]/ledger`: consumed by `StockLedger` component only.
  - Ledger component: consumed by `InventoryConsole` tab panel. No external consumers.
- **Execution plan:** Red → Green → Refactor
  - Red: ledger tab renders with placeholder "no events" message; no API route exists.
  - Green: TC-01 through TC-04 pass; adjustment and inflow events visible in time order; filter by SKU works; checkout events show "not yet indexed" gracefully.
  - Refactor: add pagination to ledger if >200 events; extract `useLedgerFilter()` hook.
- **Scouts:** **Critical scout (blocks this task)**: run `grep -r "appendFile\|writeFile\|createWriteStream" packages/platform-core/src/repositories`. If adjustment/inflow services write JSONL files to disk: **JSONL on disk is NOT viable as a ledger source in a deployed Cloudflare Worker** — Workers FS is read-only and contains only bundled assets; runtime JSONL files written by other processes are physically inaccessible. Resolution: add an `InventoryAuditEvent` Prisma model and migrate adjustment/inflow audit writes to Prisma DB before TASK-10 can be built. This is a scope addition to a shared package (`platform-core`) and must be planned as a prerequisite task at CHECKPOINT-11 if not already done in TASK-08/TASK-09. If logs are already in Prisma DB, proceed normally.
- **Edge Cases & Hardening:** If checkout events not available for phase 1, show event type "sale" with a note "sale events not yet indexed — upgrade in follow-on". Do not error out or hide the ledger entirely.
- **What would make this >=90%:** Confirm adjustment + inflow logs are in Prisma DB (confirmed via TASK-08/TASK-09 JSONL scout). That single confirmation resolves the main uncertainty.
- **Rollout / rollback:** Additive; read-only view.
- **Documentation impact:** None.
- **Notes / references:** `packages/platform-core/src/inventoryHolds.ts`, `apps/caryina/src/lib/checkoutSession.server.ts`, `apps/cms/src/app/api/shop/[shop]/stock-adjustments/route.ts` (JSONL log pattern).

---

### CHECKPOINT-11: Domain parity checkpoint
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan evidence via `/lp-do-replan` if needed; decision on Lane B (product metadata uploader) readiness
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/inventory-app-uploader-unification/plan.md`
- **Depends on:** TASK-07, TASK-13, TASK-14, TASK-16, TASK-17, TASK-10
- **Blocks:** —
- **Confidence:** 95%
  - Implementation: 95% — process is defined
  - Approach: 95% — gates downstream planning
  - Impact: 95% — prevents premature Lane B start
- **Acceptance:**
  - Inventory console, import/export, adjustments, inflows, and ledger all functional.
  - Operator can perform end-to-end inventory management without touching CMS or Caryina admin.
  - CMS and Caryina admin pages still accessible as fallback (not retired yet).
  - Decision recorded: is checkout-driven ledger surfacing ready for a same-plan follow-on task, or should it go to a new plan?
  - Confidence for Lane B (product metadata uploader) assessed from current repo state.
- **Horizon assumptions to validate:**
  - JSONL vs Prisma DB for adjustment/inflow audit logs (affects TASK-10 ledger source).
  - Worker bundle size remains within 10 MiB after all domain components are included.
  - Caryina storefront inventory reads are unaffected (spot-check: load a Caryina product page, confirm stock display is correct).
- **Validation contract:** Checkpoint complete when all horizon assumptions validated and plan updated.
- **Planning validation:** None: CHECKPOINT task.
- **Rollout / rollback:** None: planning control task.
- **Documentation impact:** `plan.md` updated; follow-on Lane B plan seeded if ready.

---

### TASK-12: Port XA console component layer
- **Type:** IMPLEMENT
- **Deliverable:** `apps/inventory-uploader/src/components/console/InventoryConsole.client.tsx` (new, adapted from CatalogConsole), `apps/inventory-uploader/src/components/console/useInventoryConsole.client.ts` (new, adapted from useCatalogConsole)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/inventory-uploader/src/components/console/InventoryConsole.client.tsx` (new), `apps/inventory-uploader/src/components/console/useInventoryConsole.client.ts` (new)
- **Depends on:** TASK-02
- **Blocks:** TASK-04
- **Confidence:** 82%
  - Implementation: 80% — `useCatalogConsole` contains catalog-publish imports (CatalogProductDraftInput, storefront scope, catalogConsoleActions) that must all be stripped; risk of overlooked transitive imports
  - Approach: 85% — copy-then-adapt from XA; no new architectural decisions needed
  - Impact: 82% — useInventoryConsole is the central state container; must be clean before TASK-04 wires shop selection into it
- **Acceptance:**
  - `InventoryConsole.client.tsx` renders split-pane layout (left list panel + right editor panel, both empty initially).
  - `useInventoryConsole.client.ts` exports console state with no catalog-specific types.
  - `grep -r "XaProductDraft\|CatalogConsoleState\|CatalogProductDraftInput\|catalogConsoleActions" apps/inventory-uploader/src/components/console` → zero results.
  - Expected user-observable behavior: shell displays split-pane layout after login; both panels empty; no errors in console.
- **Validation contract:**
  - TC-01: `grep -r "XaProductDraft\|CatalogConsoleState\|catalogConsoleActions" apps/inventory-uploader/src/components/console` → zero results → catalog types absent
  - TC-02: Shell renders split-pane with InventoryConsole mounted in dev → no TypeScript errors; no runtime console errors
  - TC-03: `useInventoryConsole` exports the following pinned shape — downstream tasks TASK-04, TASK-06, and TASK-13 must implement against this exact contract:
    ```typescript
    export type InventoryConsoleState = {
      selectedShop: string | null;       // shop ID string, null when no shop selected
      setSelectedShop: (shop: string | null) => void;
      selectedSku: string | null;        // SKU string, null when no item selected
      setSelectedSku: (sku: string | null) => void;
    };
    ```
    No catalog fields (`XaProductDraft`, `CatalogConsoleState`, `storefront`, etc.) appear in the exported type.
  - TC-04: `InventoryConsole` renders two named panel slots as null stubs: (a) an import panel slot (`data-slot="import-panel"`) consumed by TASK-14, and (b) a ledger tab slot (`data-slot="ledger-tab"`) consumed by TASK-10. These stubs must exist in the Wave 3 output so TASK-14 (Wave 6) and TASK-10 (Wave 7) can mount into them without modifying the console's structural layout.
- **Execution plan:** Red → Green → Refactor
  - Red: console component contains catalog-publish type references from XA; TC-01 grep fails.
  - Green: all catalog types stripped; split-pane renders; TC-01–03 pass.
  - Refactor: extract shared layout primitives into `src/components/layout/` if reused by ≥2 surfaces.
- **Consumer tracing (new outputs):**
  - `InventoryConsole` component: consumed by `InventoryHome` (created in TASK-02). No other consumers.
  - `useInventoryConsole` hook: consumed by `InventoryConsole` and later by `ShopSelector` (TASK-04). Safe — TASK-04 adds shop state to this hook.
- **Scouts:** Confirm `useCatalogConsole.client.ts` imports (via `catalogConsoleActions.ts`) do not include any catalog-publish API client — if they do, those must be replaced with inventory-specific hooks in TASK-12.
- **Edge Cases & Hardening:** If `catalogConsoleActions.ts` exports are deeply embedded in the hook state shape, create a clean `inventoryConsoleActions.ts` stub with placeholder functions rather than adapting the XA version.
- **What would make this >=90%:** Confirmed that `useCatalogConsole` state shape is simple enough to clean without fundamental redesign.
- **Rollout / rollback:** Additive; new files only.
- **Documentation impact:** None.
- **Notes / references:** Source: `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx`, `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`, `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts`.

---

### TASK-13: Inventory variant editor + PATCH route
- **Type:** IMPLEMENT
- **Deliverable:** `apps/inventory-uploader/src/app/api/inventory/[shop]/[sku]/route.ts` (PATCH); right panel `InventoryEditor.client.tsx` sub-component of InventoryMatrix
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/inventory-uploader/src/app/api/inventory/[shop]/[sku]/route.ts` (new PATCH handler), `apps/inventory-uploader/src/components/inventory/InventoryEditor.client.tsx` (new right panel), `apps/inventory-uploader/src/components/inventory/InventoryMatrix.client.tsx` (add right-panel slot; wire export button to TASK-07 route; wire TASK-07 export route)
- **Depends on:** TASK-06
- **Blocks:** CHECKPOINT-11
- **Confidence:** 80%
  - Implementation: 80% — `updateInventoryItem` mutator signature is confirmed; PATCH route is a thin wrapper
  - Approach: 82% — right panel editor is a straightforward variant table; optimistic update is the right pattern
  - Impact: 78% — edit capability is the core operator action; errors here affect stock accuracy
- **Acceptance:**
  - Clicking a SKU in the left panel opens the right panel showing all variants (variantKey rows) with editable quantity and lowStockThreshold fields.
  - **Export button (delegated from TASK-07):** Add an "Export" button to the `InventoryMatrix` header bar. Clicking it triggers `GET /api/inventory/[shop]/export?format=csv` and initiates a browser file download. This is the only entry point for the export route in phase 1. TASK-07 creates the route; TASK-13 wires the button because TASK-07 cannot touch `InventoryMatrix` (which does not exist until TASK-06 completes, and TASK-06 runs in the same wave as TASK-07).
  - `PATCH /api/inventory/[shop]/[sku]` calls `updateInventoryItem(shop, sku, variantAttributes, (current) => ({ ...current, quantity: newQty, lowStockThreshold: newThreshold }))`. **The fourth argument is a mutator function — `(current: InventoryItem | undefined) => InventoryItem | undefined` — not a plain updates object.**
  - If `updateInventoryItem` returns `undefined`, PATCH returns `404 Not Found`.
  - After save: left panel quantity for that SKU updates without full page reload.
  - Expected user-observable behavior: operator clicks SKU → right panel shows variant matrix with editable quantities. Edits and saves → left panel quantity updates inline.
- **Validation contract:**
  - TC-01: Click SKU with 3 variants → right panel shows 3 rows with quantity + threshold inputs
  - TC-02: Edit quantity, click save → PATCH sent with mutate-function pattern; left panel updates
  - TC-03: PATCH where mutator returns `undefined` → 404 response
  - TC-04: Concurrent edit (open in two tabs) → optimistic update catches conflict, shows error and reloads
  - **QA loop (required):** After build, run `lp-design-qa` on inventory console route; run `tools-ui-contrast-sweep`; run `tools-web-breakpoint`. Auto-fix until no Critical/Major findings remain.
- **Execution plan:** Red → Green → Refactor
  - Red: right panel renders placeholder "select a SKU" message; PATCH returns 501.
  - Green: TC-01–04 pass; variant editor populated from GET /api/inventory/[shop]/[sku]; save triggers PATCH with mutate function; left panel updates.
  - Refactor: extract `useInventoryEditor()` hook; add pagination to variant list if >50 variants per SKU.
- **Consumer tracing (new outputs):**
  - `PATCH /api/inventory/[shop]/[sku]`: consumed by `InventoryEditor` component only.
  - `InventoryEditor` component: mounted in right-panel slot of `InventoryMatrix` (established in TASK-06).
- **Scouts:** Confirm `updateInventoryItem` return type: does it return the updated item or void? Needed to determine how to populate optimistic UI response.
- **Edge Cases & Hardening:** Optimistic UI — revert if PATCH fails. Editing a variant that was deleted between page load and save → 404 from PATCH → show "item no longer exists" error.
- **What would make this >=90%:** Confirmed `updateInventoryItem` return type (void vs updated item).
- **Rollout / rollback:** Additive; new API route and component.
- **Documentation impact:** None.
- **Notes / references:** `packages/platform-core/src/repositories/inventory.server.ts`, `packages/platform-core/src/repositories/inventory.prisma.server.ts`.

---

### TASK-14: Inventory import UI + API
- **Type:** IMPLEMENT
- **Deliverable:** `apps/inventory-uploader/src/app/api/inventory/[shop]/import/route.ts` (POST); `apps/inventory-uploader/src/components/inventory/InventoryImport.client.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/inventory-uploader/src/app/api/inventory/[shop]/import/route.ts` (new), `apps/inventory-uploader/src/components/inventory/InventoryImport.client.tsx` (new), `apps/inventory-uploader/src/components/console/InventoryConsole.client.tsx` (modify — mount InventoryImport into the import panel slot established by TASK-12), `[readonly] apps/cms/src/app/api/data/[shop]/inventory/import/route.ts`
- **Depends on:** CHECKPOINT-05
- **Blocks:** CHECKPOINT-11
- **Confidence:** 82%
  - Implementation: 82% — CMS import route is a direct reference; platform-core import service is tested
  - Approach: 80% — drag-drop + preview + streaming is new UI territory in this app; no XA analog for this flow
  - Impact: 83% — import is critical for bulk inventory population; errors create stock discrepancies
- **Acceptance:**
  - `POST /api/inventory/[shop]/import` accepts CSV or JSON body; calls platform-core import service; returns row-level results (success count, error rows with reason).
  - Import UI: file drop zone (drag-and-drop) + file picker fallback; preview mode (dry-run) shows per-row validation status before commit; error rows displayed with line number and reason.
  - Import is idempotent: re-importing the same CSV produces the same state (upsert semantics).
  - Large CSV (1000+ rows): streamed or chunked; does not load entire file into Worker memory at once.
  - Expected user-observable behavior: operator drops CSV → preview table shows all rows with OK/error status. Operator clicks "Commit" → rows applied; left panel refreshes with new quantities.
- **Validation contract:**
  - TC-01: Upload valid CSV → preview shows correct row count, no errors, commit enabled
  - TC-02: Upload CSV with invalid row (missing sku) → preview shows error on that row, commit blocked
  - TC-03: Commit valid CSV → inventory updated; left panel reflects new quantities
  - TC-04: Re-import same CSV → idempotent; no duplicates; quantities unchanged
  - TC-05: Large CSV (500+ rows) → no Worker timeout; partial results surfaced if streaming stops early
  - **QA loop (required):** After build, run `lp-design-qa` on import panel; run `tools-ui-contrast-sweep`; run `tools-web-breakpoint`. Auto-fix until no Critical/Major findings remain.
- **Execution plan:** Red → Green → Refactor
  - Red: import panel renders bare file input; no preview, no POST route.
  - Green: TC-01–05 pass; drag-drop triggers dry-run preview; commit applies rows; streamed for large files.
  - Refactor: extract `InventoryImportPreview` sub-component; move file-streaming logic to shared util if reused by product import (Lane B).
- **Consumer tracing (new outputs):**
  - `POST /api/inventory/[shop]/import`: consumed by `InventoryImport` component only.
  - `InventoryImport` component: mounted in import panel slot of `InventoryConsole`.
- **Scouts:** Confirm platform-core import service function signature (accepts `shop` param, returns row-level results). Reference: `apps/cms/src/app/api/data/[shop]/inventory/import/route.ts`.
- **Edge Cases & Hardening:** Worker request body size limit — chunk large CSVs. Timeout — return partial success if Worker limit hit; do not silently drop remaining rows.
- **What would make this >=90%:** Confirmed platform-core import service is directly callable (not an HTTP route wrapper).
- **Rollout / rollback:** Additive; new route and component.
- **Documentation impact:** None.
- **Notes / references:** `apps/cms/src/app/api/data/[shop]/inventory/import/route.ts`.

---

### TASK-15: InventoryAuditEvent Prisma migration
- **Type:** IMPLEMENT
- **Deliverable:** `packages/platform-core/prisma/migrations/<timestamp>_add_inventory_audit_event/migration.sql`; updated `packages/platform-core/prisma/schema.prisma` (new `InventoryAuditEvent` model); updated `packages/platform-core/src/repositories/stockAdjustments.server.ts` and `stockInflows.server.ts` to write to Prisma instead of JSONL
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `packages/platform-core/prisma/schema.prisma` (add model), `packages/platform-core/prisma/migrations/` (new migration), `packages/platform-core/src/repositories/stockAdjustments.server.ts` (migrate audit write), `packages/platform-core/src/repositories/stockInflows.server.ts` (migrate audit write)
- **Depends on:** CHECKPOINT-05
- **Blocks:** TASK-08, TASK-09, TASK-10
- **Confidence:** 78%
  - Implementation: 75% — Prisma schema changes and migrations are well-understood; risk is in safely migrating both CMS and new app writes to the same model without breaking CMS paths
  - Approach: 80% — adding a new Prisma model alongside existing JSONL writes, then swapping the write path, is the standard migration pattern
  - Impact: 78% — blocking prerequisite for adjustments, inflows, and ledger; must not break CMS inventory operations
- **Acceptance:**
  - `InventoryAuditEvent` model added to `schema.prisma` with fields: `id`, `shopId`, `sku`, `variantKey`, `type` (enum: `adjustment | inflow`), `quantityDelta`, `note`, `referenceId` (idempotency key), `createdAt`, `operatorId` (nullable).
  - `npx prisma migrate dev` completes without errors.
  - `stockAdjustments.server.ts`: `fs.open(lockFile, "wx")` and JSONL append replaced with Prisma `InventoryAuditEvent.create()`. Lock-file pattern removed.
  - `stockInflows.server.ts`: same migration — JSONL append replaced with Prisma write, `type: "inflow"`.
  - **Idempotency read path migrated (mandatory):** `applyStockAdjustment` calls `readAll(shop)` (an `fs.readFile` on the JSONL file) to check for a prior event by idempotency key before writing. After migration, this read must be replaced with a Prisma query: `InventoryAuditEvent.findFirst({ where: { shopId, idempotencyKey: referenceId } })`. Do not leave `readAll` in place — the file it reads will no longer be written after migration, so idempotency detection will silently fail for all new events.
  - **CMS history display migrated (mandatory):** `listStockAdjustments` and `listStockInflows` (called from CMS pages `stock-adjustments/page.tsx` and `stock-inflows/page.tsx`) currently use `fs.readFile` to read JSONL. These read functions must be replaced with Prisma queries against `InventoryAuditEvent`. CMS history display must continue to show data after migration.
  - **CMS compatibility**: existing CMS routes (`apps/cms/src/app/api/shop/[shop]/stock-adjustments/route.ts`, `stock-inflows/route.ts`) must continue to work after migration (they call the same platform-core server functions — confirm no CMS-side changes needed beyond the platform-core update).
  - Expected user-observable behavior: CMS stock adjustments and inflows continue to work identically; data now persisted in Postgres `InventoryAuditEvent` table instead of JSONL file; CMS history display shows recent events from DB.
- **Validation contract:**
  - TC-01: `npx prisma migrate dev` runs without errors → schema applied
  - TC-02: Submit a stock adjustment via CMS → `InventoryAuditEvent` row created in DB; no JSONL file written → confirmed via DB query
  - TC-03: Submit a stock inflow via CMS → `InventoryAuditEvent` row created with `type: "inflow"`
  - TC-04: `grep -r "ADJUSTMENTS_FILENAME\|INFLOWS_FILENAME\|appendFile.*jsonl\|fs.open.*lockFile" packages/platform-core/src/repositories` → zero results (JSONL writes removed)
  - TC-05: CMS stock-adjustments UI submits successfully after migration → no 500 errors; CMS history panel shows recent adjustments from DB
  - TC-06: `listStockAdjustments` and `listStockInflows` query `InventoryAuditEvent` Prisma table, not JSONL. Confirmed via grep: `grep -r "readFile\|readAll\|ADJUSTMENTS_FILENAME\|INFLOWS_FILENAME" packages/platform-core/src/repositories/stockAdjustments.server.ts packages/platform-core/src/repositories/stockInflows.server.ts` → zero results.
  - TC-07: Re-submit same idempotency key after migration → Prisma query used to detect duplicate (not JSONL read); duplicate detected correctly; no double-write to DB. Confirmed by submitting an adjustment twice and verifying exactly one `InventoryAuditEvent` row exists for that `referenceId`.
- **Execution plan:** Red → Green → Refactor
  - Red: `InventoryAuditEvent` model does not exist; `stockAdjustments.server.ts` still uses JSONL + file lock; `listStockAdjustments` reads JSONL; idempotency check reads JSONL.
  - Green: TC-01–07 pass; Prisma model created; write paths, read paths (history display), and idempotency check all migrated to Prisma; CMS routes unaffected.
  - Refactor: remove any dead JSONL path constants (`ADJUSTMENTS_FILENAME`, `INFLOWS_FILENAME`, lock-file helpers) that are no longer referenced.
- **Consumer tracing (new outputs):**
  - `InventoryAuditEvent` table: written by `stockAdjustments.server.ts` and `stockInflows.server.ts`. Read by TASK-10 (ledger view), TASK-16/TASK-17 history panels, and (after this task) by `listStockAdjustments`/`listStockInflows` for CMS history display.
  - CMS pages `stock-adjustments/page.tsx` and `stock-inflows/page.tsx` call `listStockAdjustments` and `listStockInflows` respectively — both confirmed to read JSONL today; both must be migrated to Prisma in this task.
  - No new app reads JSONL files (new app uses new API routes only).
- **Scouts:** Read `apps/cms/src/app/cms/shop/[shop]/uploads/stock-adjustments/stockAdjustments.client.tsx` and `stockInflows.client.tsx` to check whether they display audit history by reading JSONL directly (if so, migrate those reads to the new Prisma model in this task).
- **Edge Cases & Hardening:** If JSONL files already exist from prior operations, they become stale after migration. Add a one-time migration note: existing JSONL data is not back-filled (acceptable for phase 1; history starts from migration date).
- **What would make this >=90%:** Confirmed CMS history display does not read JSONL files directly (if CMS reads from the platform-core service which reads JSONL, then both the service and the CMS display both get fixed in this task).
- **Rollout / rollback:**
  - Rollout: additive Prisma model; `migrate dev` applies schema. CMS continues to work.
  - Rollback: if migration must be reverted, run `prisma migrate down` and restore JSONL write paths. Note: any audit events written to DB during rollback window are lost.
- **Documentation impact:** None externally.
- **Notes / references:** `packages/platform-core/src/repositories/stockAdjustments.server.ts`, `packages/platform-core/src/repositories/stockInflows.server.ts`, `packages/platform-core/prisma/schema.prisma`.

---

### TASK-16: Stock adjustments UI
- **Type:** IMPLEMENT
- **Deliverable:** `apps/inventory-uploader/src/components/inventory/StockAdjustments.client.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/inventory-uploader/src/components/inventory/StockAdjustments.client.tsx` (new), `apps/inventory-uploader/src/components/inventory/InventoryMatrix.client.tsx` (add adjustments drawer entry point)
- **Depends on:** TASK-08
- **Blocks:** CHECKPOINT-11
- **Confidence:** 80%
  - Implementation: 80% — CMS stock-adjustments UI is a direct reference; drawer pattern is standard
  - Approach: 82% — port CMS UI into new app shell; no new business logic
  - Impact: 78% — adjustments panel is the primary stock correction tool; UX errors frustrate operators
- **Acceptance:**
  - Adjustments panel (drawer or sub-route) accessible from inventory console.
  - Supports: add (+N), remove (-N), set-to (= N) quantity adjustments per SKU/variant.
  - Dry-run mode: shows projected outcome before committing.
  - After commit: history section shows recent adjustments (from `InventoryAuditEvent` table, via TASK-08 API).
  - Expected user-observable behavior: operator selects SKU → opens adjustments panel → enters delta → previews → commits → left panel quantity updates; history row appears.
- **Validation contract:**
  - TC-01: Enter +5 adjustment → dry-run shows projected quantity = current + 5
  - TC-02: Commit → quantity updated; history shows new entry with timestamp
  - TC-03: Invalid adjustment (result < 0) → validation error; commit blocked
  - TC-04: Re-submit same idempotency key → existing result returned; no double-apply
  - **QA loop (required):** After build, run `lp-design-qa` on adjustments panel; run `tools-ui-contrast-sweep`. Auto-fix until no Critical/Major findings remain.
- **Execution plan:** Red → Green → Refactor
  - Red: adjustments panel renders but posts to 501; no dry-run, no history.
  - Green: TC-01–04 pass; dry-run, commit, history all functional.
  - Refactor: share idempotency key generation with TASK-17 (inflows use same pattern).
- **Consumer tracing (new outputs):**
  - `StockAdjustments` component: mounted in adjustments panel slot of `InventoryMatrix`.
- **Scouts:** ~~Confirm CMS adjustments UI dry-run flag is a query parameter or request body field~~ — **Resolved at plan time.** Dry-run is `?dryRun=true` query parameter per TASK-08 acceptance. Dry-run response shape is `{ projectedQuantity: number; currentQuantity: number; delta: number; valid: boolean; errorMessage?: string }` per TASK-08 acceptance. Implement TASK-16 against this pinned contract. No further scouting needed on this point.
- **Edge Cases & Hardening:** Optimistic close of drawer before confirmation → warn if uncommitted changes. Network error on commit → show retry option.
- **Rollout / rollback:** Additive; new component only.
- **Documentation impact:** None.
- **Notes / references:** `apps/cms/src/app/cms/shop/[shop]/uploads/stock-adjustments/stockAdjustments.client.tsx`, TASK-08 API route.

---

### TASK-17: Stock inflows UI
- **Type:** IMPLEMENT
- **Deliverable:** `apps/inventory-uploader/src/components/inventory/StockInflows.client.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/inventory-uploader/src/components/inventory/StockInflows.client.tsx` (new), `apps/inventory-uploader/src/components/inventory/InventoryMatrix.client.tsx` (add inflows drawer entry point)
- **Depends on:** TASK-09, TASK-16
- **Sequencing note:** TASK-17 depends on TASK-16 because both modify `InventoryMatrix.client.tsx`. TASK-16 must complete its InventoryMatrix modification before TASK-17 begins its own InventoryMatrix modification, to prevent a parallel write conflict. `StockInflows.client.tsx` (the component file) may be authored in parallel with TASK-16's work, but the InventoryMatrix integration step must run after TASK-16 finishes.
- **Blocks:** CHECKPOINT-11
- **Confidence:** 80%
  - Implementation: 80% — CMS stock-inflows UI is a direct reference; snapshot-assist pattern confirmed
  - Approach: 82% — port CMS UI; inflow form is simpler than adjustments (no dry-run mode needed)
  - Impact: 78% — inflows are the primary mechanism for adding new stock; must be reliable
- **Acceptance:**
  - Inflows panel for recording incoming stock batches.
  - Operator enters SKU/variant + quantity received + optional reference number and notes.
  - Snapshot-assist: if SKU exists in inventory, pre-fills current quantity for reference (read-only display alongside the new quantity input).
  - Idempotent: re-submitting same reference number shows existing result without re-adding stock.
  - After submit: history section shows recent inflows (from `InventoryAuditEvent` table with `type: "inflow"`).
  - Expected user-observable behavior: operator enters SKU + received qty + reference → submits → left panel quantity increases; inflow log row added.
- **Validation contract:**
  - TC-01: Submit inflow for existing SKU → quantity increases; snapshot-assist shows prior quantity
  - TC-02: Re-submit same reference → existing result shown, quantity unchanged
  - TC-03: Submit inflow for new SKU/variant → inventory row created with submitted quantity
  - TC-04: Inflow history shows reference, quantity, timestamp
  - **QA loop (required):** After build, run `lp-design-qa` on inflows panel; run `tools-ui-contrast-sweep`. Auto-fix until no Critical/Major findings remain.
- **Execution plan:** Red → Green → Refactor
  - Red: inflows panel renders but posts to 501; no snapshot-assist, no history.
  - Green: TC-01–04 pass; snapshot-assist pre-fills; idempotency confirmed; history visible.
  - Refactor: share audit-log read path with TASK-16 (both query same `InventoryAuditEvent` table).
- **Consumer tracing (new outputs):**
  - `StockInflows` component: mounted in inflows panel slot of `InventoryMatrix`.
- **Scouts:** Confirm snapshot-assist behavior: does the CMS UI fetch current inventory on SKU selection, or does it pass the current quantity in the form? Needed to determine whether to add a GET /api/inventory/[shop]/[sku] call within the inflows form.
- **Edge Cases & Hardening:** New SKU entry (not yet in inventory): snapshot-assist shows "not in inventory yet" gracefully. Network error on submit: show retry.
- **Rollout / rollback:** Additive; new component only.
- **Documentation impact:** None.
- **Notes / references:** `apps/cms/src/app/cms/shop/[shop]/uploads/stock-inflows/stockInflows.client.tsx`, TASK-09 API route.

---

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| XA shell copy pulls in catalog-publish types via transitive imports | Medium | High | Run grep check for XaProductDraft/CatalogConsoleState before proceeding past TASK-02; fix immediately if found |
| Worker bundle exceeds 10 MiB after shell port | Medium | High | Bundle size check is mandatory in TASK-02 acceptance; if exceeded, tree-shake catalog-publish imports before proceeding |
| CMS `/api/shops` requires CMS session auth, blocking shop selector | Medium | Medium | CHECKPOINT-05 validates this; mitigate by adding a public machine-to-machine token or moving shop list to platform-core if needed |
| Adjustment/inflow audit logs are in JSONL files on disk, not Prisma | Medium | High | JSONL on disk is NOT viable in Workers (read-only FS). TASK-08 and TASK-10 critical scouts confirm storage type. If JSONL-only, scope adds `InventoryAuditEvent` Prisma model + migration in platform-core before TASK-10 can build. |
| platform-core Prisma client fails to init in Workers Node.js runtime | Low | High | CHECKPOINT-05 horizon: test Prisma connect in dev Workers environment before TASK-06 builds on it |
| Checkout-driven sale events not queryable for ledger | High | Low | Accepted for phase 1; ledger shows manual operations only; follow-on task seeds checkout event hook |
| Central inventory variant key mismatch contaminates phase 1 | Low | High | Mitigated by explicit scope: phase 1 only touches per-shop inventory; central inventory code paths are not modified |

## Observability
- Logging: Server-side route errors logged via Worker console. Adjustment and inflow API errors return structured JSON error responses with error codes.
- Metrics: None in phase 1. Phase 2 follow-on: add stock-operation success/error rate metrics.
- Alerts/Dashboards: None in phase 1.

## Acceptance Criteria (overall)
- [ ] `apps/inventory-uploader` deploys to Cloudflare Workers Paid successfully.
- [ ] Operator can log in, select a shop, view all inventory, edit quantities, import/export snapshots, record adjustments and inflows, and view stock movement history — entirely within the new app.
- [ ] Caryina storefront stock reads and checkout flow are unaffected (spot-check: complete a Caryina checkout; confirm inventory decrements correctly via platform-core).
- [ ] CMS inventory pages and Caryina admin pages remain operational as fallback (not retired in this plan).
- [ ] Worker bundle is < 10 MiB compressed.
- [ ] No XA-specific cloud bindings (KV, R2, xa-drop-worker service) in wrangler.toml.
- [ ] No cross-app imports from `apps/xa-uploader` in the new app source.
- [ ] All UI surfaces pass QA sweep: no Critical/Major findings from `lp-design-qa` + `tools-ui-contrast-sweep` + `tools-web-breakpoint`.

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Bootstrap app | Yes | None | No |
| TASK-02: Port XA shell | Yes | None — scope narrowed to shell wrapper only (InventoryShell, InventoryHome, layout, fonts); console component moved to TASK-12 | No |
| TASK-03: Auth gate | Yes | None | No |
| TASK-04: Shop selector | Partial | [Integration boundary] [Moderate]: CMS `/api/shops` auth requirement not confirmed — if it requires CMS session, shop selector silently fails or returns 401 | Yes — CHECKPOINT-05 horizon validates this before TASK-06 proceeds |
| CHECKPOINT-05: Shell checkpoint | Yes | None | No |
| TASK-06: Inventory console | Yes | None — scope narrowed to list display only; editor moved to TASK-13; `variantKey` format confirmed in planning validation | No |
| TASK-07: Export route | Yes | [Critical — resolved] Export button acceptance (critique autofix 3-03) required adding the button to `InventoryMatrix.client.tsx`, but TASK-07 runs in Wave 6 parallel with TASK-06 which creates that file — creating a sequencing inversion. Fix: export button wire-up delegated to TASK-13 (Wave 7). TASK-07 creates the route only; TASK-07 Affects field updated to exclude InventoryMatrix. | Resolved — see TASK-07 and TASK-13 acceptance |
| TASK-08: Stock adjustments API | Yes | None — adjustments API route only; depends on TASK-15 for Prisma model | No |
| TASK-09: Stock inflows API | Yes | None — inflows API route only | No |
| TASK-10: Ledger view | Partial | [Missing data dependency] [Major]: checkout-driven sale events have no dedicated event store today; ledger will show incomplete data for sales movements | Yes — accepted for phase 1; TASK-10 acceptance explicitly handles this with graceful fallback |
| CHECKPOINT-11: Domain parity | Yes | None | No |
| TASK-12: Console component layer | Yes | No rehearsal issues; catalog type stripping is addressed by TC-01 grep check | No |
| TASK-13: Variant editor + PATCH | Partial | [Type contract] [Moderate]: `updateInventoryItem` return type needs confirmation for optimistic UI | Yes — addressed by TASK-13 scout |
| TASK-14: Import UI + API | Yes | None | No |
| TASK-15: Prisma migration | Partial | [Integration boundary] [Major]: CMS history display confirmed to call `listStockAdjustments`/`listStockInflows` (both read JSONL via `fs.readFile`). Additionally, `applyStockAdjustment` calls `readAll(shop)` (JSONL read) for idempotency detection. Both read paths must migrate to Prisma in this task or CMS history silently returns empty and idempotency detection breaks for new events. Addressed by TASK-15 Acceptance TC-06 and TC-07. |
| TASK-16: Adjustments UI | Yes | [Critical — resolved] TASK-16 and TASK-17 both modify `InventoryMatrix.client.tsx` in Wave 8 (parallel). Parallel write conflict. Fix: TASK-17 now depends on TASK-16; Wave 8 is re-annotated as sequential for the InventoryMatrix modification step. | Resolved — TASK-17 Depends-on updated; Wave 8 note updated |
| TASK-17: Inflows UI | Yes | [Critical — resolved] Parallel write conflict on InventoryMatrix with TASK-16. Fix applied as above. | Resolved — see TASK-16 row |

Critical rehearsal findings: **Two Critical conflicts found and resolved in forward rehearsal trace (2026-03-08):**
1. TASK-07 / TASK-06 parallel write sequencing inversion on `InventoryMatrix.client.tsx` — fixed by delegating export button to TASK-13.
2. TASK-16 / TASK-17 parallel write conflict on `InventoryMatrix.client.tsx` — fixed by serializing TASK-17 after TASK-16.
Additional Major/Moderate findings addressed: `InventoryConsole.client.tsx` hidden modifications by TASK-14 and TASK-10 made explicit in Affects fields; `useInventoryConsole` hook type shape pinned; `InventoryAuditEvent` field contract cross-referenced in TASK-08 and TASK-09; dry-run response shape pinned; ledger response shape pinned. No waiver required.

## Decision Log
- 2026-03-08: Chose per-shop inventory authority only for phase 1. Central inventory promotion deferred; variant key normalization is a prerequisite for promotion and is out of scope here.
- 2026-03-08: Chose `platform-core` direct import over CMS HTTP API calls. Avoids inter-Worker latency, keeps Worker self-contained, matches Caryina precedent.
- 2026-03-08: Chose copy-then-adapt for XA shell components (not cross-app import). Prevents catalog-publish type contamination and keeps bundles separable.
- 2026-03-08: Checkout-driven ledger events deferred to follow-on. Phase 1 ledger shows manual operations (adjustments, inflows) only.
- 2026-03-08 [Adjacent: delivery-rehearsal]: Retiring CMS/Caryina duplicate inventory screens is adjacent scope — requires parity confirmation first. Routed to CHECKPOINT-11 decision and a follow-on plan.
- 2026-03-08 [Critique round 1, credible, 4.5/5]: Two minor findings addressed: (1) QA loop contract added to TASK-06 validation notes and TASK-03 auth boundary made explicit; (2) security boundary for TASK-06–10 API routes documented in TASK-03 validation contract as globally enforced by session middleware.
- 2026-03-08 [Forward rehearsal trace]: File modification map built; two Critical conflicts and five Moderate/Minor gaps found and resolved. (1) TASK-07 + TASK-06 Wave 6 parallel sequencing inversion: export button delegated from TASK-07 to TASK-13. (2) TASK-16 + TASK-17 Wave 8 parallel write conflict on InventoryMatrix: TASK-17 now depends on TASK-16. (3) `InventoryConsole.client.tsx` hidden modification by TASK-14 and TASK-10 added to Affects fields. (4) `useInventoryConsole` hook exported type shape pinned in TASK-12 TC-03. (5) `InventoryAuditEvent` field names cross-referenced inline in TASK-08 and TASK-09 acceptance. (6) Dry-run response shape pinned in TASK-08; TASK-16 scout resolved at plan time. (7) Ledger route response shape pinned in TASK-10 acceptance. (8) TASK-12 acceptance updated to stub import panel and ledger tab slots for downstream task mounting.
- 2026-03-08 [Critique round 3, credible, 4.4/5]: Two Major findings autofixed in TASK-15: (1) CMS history display confirmed to use `listStockAdjustments`/`listStockInflows` which read JSONL — these read functions must migrate to Prisma alongside the write path (TC-06 added); (2) `applyStockAdjustment` idempotency check calls `readAll(shop)` (JSONL read) — this must also migrate to Prisma DB query to prevent silent idempotency failure for new events post-migration (TC-07 added). Two Minor findings autofixed: export button wired explicitly into TASK-07 acceptance; TASK-15 rehearsal row updated to reflect confirmed (not hypothetical) JSONL read paths.

## Overall-confidence Calculation
- S=1, M=2, L=3
- TASK-01 90% × 1 = 90
- TASK-02 85% × 1 = 85
- TASK-03 88% × 1 = 88
- TASK-04 78% × 1 = 78
- TASK-06 85% × 1 = 85
- TASK-07 90% × 1 = 90
- TASK-08 82% × 1 = 82
- TASK-09 82% × 1 = 82
- TASK-10 72% × 1 = 72
- TASK-12 82% × 1 = 82
- TASK-13 80% × 1 = 80
- TASK-14 82% × 2 = 164
- TASK-15 78% × 2 = 156
- TASK-16 80% × 1 = 80
- TASK-17 80% × 1 = 80
- Sum of weights (IMPLEMENT tasks only): 13 × S(1) + 2 × M(2) = 17
- Weighted sum: 90+85+88+78+85+90+82+82+72+82+80+164+156+80+80 = 1394
- **Overall-confidence: 1394 / 17 = 82%**
