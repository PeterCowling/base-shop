Type: Plan
Status: Active
Domain: CMS
Last-reviewed: 2025-12-02
Relates-to charter: docs/cms/cms-charter.md

# CMS & Shop Platform – Master Thread

This file defines an execution order and priority for all thread tasks so work can proceed in parallel without blocking on missing decisions.

Use it as the “top-level backlog” and pick tasks by ID (e.g. `ARCH-02`, `PB-03`) once their prerequisites are satisfied.

## Active tasks

- **CMS-MASTER-01 — Keep master thread aligned with threads and charter**
  - Status: ☐
  - Scope:
    - Ensure the phases and task IDs in this file stay in sync with `docs/cms-plan/thread-*.md` and `docs/cms/cms-charter.md`.
  - Dependencies:
    - Individual thread plans updated as work lands.
  - Definition of done:
    - For any major architecture/flow changes, this file and the relevant thread file are updated together.

---

## Phase 0 – Orientation & contracts (lightweight, high leverage)

**Goal:** Make boundaries and contracts explicit before deeper refactors.

Can all run in parallel:

- `ARCH-01` – Document platform vs tenant API surface  
  - Establish which `@acme/platform-core` and `@acme/ui` subpaths are public vs internal.
- `PREVIEW-01` – Map and document all preview flows  
  - Baseline understanding; no code changes.
- `DX-01` – Codify layering rules and public surfaces  
  - Converge on dependency direction and public-surface conventions.

Once Phase 0 is done, you have a shared vocabulary and can enforce it in code.

---

## Phase 1 – Core architecture & infra invariants

**Goal:** Stabilise source-of-truth and backend selection; unblock downstream work.

Prioritised order (some parallelism possible):

1. `ARCH-02` – Enforce single backend per repo (`*_BACKEND`)  
   - High priority: clarifies DB vs JSON behaviour for shops/settings.
2. `ARCH-04` – Enforce `shopId` scoping in repositories  
   - High priority: safety for multi-shop data access.
3. `ARCH-03` – Separate business vs operational fields for shops  
   - Depends on `ARCH-02`; defines DB vs JSON ownership clearly.
4. `ARCH-05` – Capture tenancy & environment model in docs  
   - Can run in parallel with (2–3) once design stabilises.
5. `ARCH-06` – Add tests for `*_BACKEND` and data-root behaviour  
   - Locks in behaviour from `ARCH-02`/`ARCH-03`.

In parallel with the above (once `ARCH-01` from Phase 0 exists):

- `CONF-01` – Introduce shared configurator types  
  - Safe to add early; referenced later by configurator and checks.
- `DX-02` – Add lint rules for import boundaries  
  - Encode rules from `DX-01`; may temporarily be “warn” level while cleaning up.

---

## Phase 2 – Page Builder core and shared contracts

**Goal:** Solidify PB packages and shared block/metadata contracts.

Prerequisites: Phase 0 (`ARCH-01`, `DX-01`) and basic repo invariants from Phase 1 are helpful but not strictly blocking.

Recommended order:

1. `PB-01` – Define public surfaces for PB packages  
   - Clarify what `page-builder-core`, `page-builder-ui`, and `templates` expose.
2. `PB-02` – Centralise Page schema and history in `page-builder-core`  
   - Move shared schemas/transforms into the core package.
3. `PB-05` – Improve Page Builder metadata handling and export  
   - Add explicit helpers to export runtime-ready components from `HistoryState`.
4. `PB-03` – Normalise block registry and `DynamicRenderer` contract  
   - Build shared descriptors powering both CMS and runtime.
5. `PB-06` – Add focused tests for PB data contracts  
   - Lock in the exported behaviour from `PB-02`/`PB-05`.
6. `PB-04` – Codify reusable templates for key page types (completed)  
   - Depends on `PB-03`; templates later feed Configurator quick-launch (`CONF-05`).

In parallel:

- `DX-04` – Consolidate Page Builder dev experience (with Thread B)  
  - Add dev docs and examples as PB work stabilises.

---

## Phase 3 – Cart & checkout foundations

**Goal:** Standardise cart/checkout behaviour so CMS configurator can reason about readiness.

Prerequisites: `ARCH-02`/`ARCH-03` from Phase 1.

Order and parallelism:

1. `CART-01` – Align all `/api/cart` endpoints with `cartApi` (completed)  
  - High priority: remove API divergence between apps and CMS.
2. `CART-05` – Add focused tests for cart API and cookie semantics  
  - Can be written alongside/after `CART-01`.
3. `CART-03` – Clarify and codify rental vs sale checkout flows (completed)  
  - Depends on `ARCH-03`; sets the configuration model for flows.

After the above, and once PB contracts are stable (`PB-03`):

4. `CART-02` – Implement canonical header cart icon + mini-cart block (completed)  
   - Depends on shared block descriptors.

Configurator integration tasks (`CART-04`) belong with Phase 4.

---

## Phase 4 – Configurator, launch gating, and shop health

**Goal:** Turn architecture + PB + cart decisions into user-facing workflows and safety rails.

Prerequisites:

- `CONF-01` (Phase 1).
- `ARCH-03` and `CART-03` (for settings and checkout semantics).
- PB templates (`PB-04`) and header cart (`CART-02`) for quick launch.

Suggested order:

1. `CONF-02` – Implement `ConfigCheck` abstraction in platform-core  
   - Central mechanism for readiness checks.
2. `CONF-03` – Add `/cms/api/configurator-progress` (completed)  
   - Surfaces checks to UI; can be stubbed then iterated.
3. `CONF-04` – Implement launch gating and go-live pipeline  
   - Uses `ConfigCheck`s to gate deploy flows.
4. `CART-04` – Surface checkout configuration in CMS configurator (completed)  
   - Hooks cart/checkout into relevant steps and checks.
5. `CONF-06` – Expose shop health indicator using ConfigChecks (completed)  
   - Reuses checks for ongoing status, not just launch.
6. `CONF-05` – Add quick-launch path (completed)  
   - Depends on templates (`PB-04`) and `CART-04` wiring.
7. `CONF-07` – Improve Page Builder ergonomics and guardrails (completed)  
   - Ergonomic enhancements; can progress in parallel with earlier steps once PB metadata (`PB-05`) is in place.

---

## Phase 5 – CMS ↔ runtime preview alignment

**Goal:** Ensure all previews (CMS, runtime, configurator) show consistent, trustworthy output.

Prerequisites:

- PB contracts (`PB-03`, `PB-05`).
- Shared architecture helpers (`ARCH-01`).

Order:

1. `PREVIEW-02` – Unify preview token handling (completed)  
   - Requires shared helper placement from `ARCH-01`/`DX-01`.
2. `PREVIEW-03` – Runtime-rendered page version preview in CMS  
   - Depends on PB shared contracts and, optionally, unified tokens.
3. `PREVIEW-04` – Align configurator preview with runtime contracts  
   - Depends on `PB-03`/`PB-05`; ensures same block/props as runtime.
4. `PREVIEW-05` – Improve `/cms/live` dev-server discovery robustness (completed)  
   - Uses tenancy/env docs from `ARCH-05`; can be done in parallel with 2–3.

---

## Phase 6 – Developer ergonomics & hardening

**Goal:** Enforce the architecture in tooling and add guard-rails/tests around critical flows.

Prerequisites: earlier phases define rules and core flows; these tasks enforce and harden them.

Order (with parallelism):

1. `DX-02` – Add lint rules for import boundaries  
   - If not fully completed in Phase 1, finalise here.
2. `DX-03` – Clean up existing deep imports  
   - Remove violations surfaced by lint.
3. `DX-06` – Trim and clarify internal-only helpers  
   - Strengthens separation between public and internal APIs.
4. `DX-05` – Hardening tests for critical flows (completed)  
   - Build on tests added in other threads (ARCH-06, PB-06, CART-05, CONF-02/03, PREVIEW tasks).

These tasks can run largely in parallel with tail work from other phases, but ideally after major refactors to avoid constant churn.

---

## How to use this master thread

- When starting new work, pick the earliest phase with unfinished tasks whose prerequisites are met.
- Within a phase, choose tasks in the order listed if you want to minimise risk, or pick independent tasks in parallel across contributors/agents.
- Keep `docs/historical/cms-research.md` and the thread files (`thread-*.md`) as the source of truth for research context; update them if direction changes, then adjust this master thread accordingly.
