Type: Plan
Status: Active
Domain: CMS
Last-reviewed: 2025-12-02
Relates-to charter: docs/cms/cms-charter.md

# CMS & Shop Platform – Implementation Threads

This folder turns `docs/historical/cms-research.md` into concrete, parallelisable workstreams.

Each thread maps 1:1 to a section in the research log and owns a set of small, self-contained tasks that Codex (or a human) can tackle independently.

## Active tasks

- **CMS-PLAN-01 — Keep thread index aligned with charter**
  - Status: ☐
  - Scope:
    - Ensure the threads listed below remain in sync with `docs/cms/cms-charter.md` and active work.
  - Dependencies:
    - CMS charter Canonical.
  - Definition of done:
    - Any new CMS thread or major shift in focus is reflected here and linked to the appropriate charter section.

## Threads

- **Thread A – Overall architecture & boundaries**
  - Source: `docs/historical/cms-research.md` §1.
  - Focus: shop configuration source-of-truth, Prisma vs JSON semantics, tenancy model, platform vs tenant boundaries, deployment metadata.
  - Plan: `docs/cms-plan/thread-a-architecture.md`.

- **Thread B – Page builder, blocks, and templates**
  - Source: `docs/historical/cms-research.md` §2.
  - Focus: Page entity model, history, Page Builder UX, block registry, runtime `DynamicRenderer`, and extraction into `page-builder-*` packages.
  - Plan: `docs/cms-plan/thread-b-page-builder.md`.

- **Thread C – Cart & checkout end-to-end**
  - Source: `docs/historical/cms-research.md` §3.
  - Focus: cart domain & storage, cart API and UI primitives, checkout (Stripe, rental vs sale), and CMS-surfaced configuration.
  - Plan: `docs/cms-plan/thread-c-cart-checkout.md`.

- **Thread D – CMS → shop runtime wiring & preview**
  - Source: `docs/historical/cms-research.md` §4.
  - Focus: preview tokens, runtime preview endpoints, navigation/header/footer wiring, routing and page types across CMS and template/tenant apps.
  - Plan: `docs/cms-plan/thread-d-cms-runtime-preview.md`.

- **Thread E – CMS UX, workflows, and safety rails**
  - Source: `docs/historical/cms-research.md` §5.
  - Focus: configurator flow, launch gating, readiness/health checks, Page Builder ergonomics and guardrails.
  - Plan: `docs/cms-plan/thread-e-cms-ux-configurator.md`.

- **Thread F – Developer ergonomics & testing**
  - Source: `docs/historical/cms-research.md` §6.
  - Focus: layering between `platform-core`, `ui`, `cms-marketing`, template/tenant apps; public surfaces; Page Builder extraction; test coverage.
  - Plan: `docs/cms-plan/thread-f-developer-ergonomics.md`.

## Master thread

For an end-to-end view of execution order, priorities, and what can run in parallel, see:

- `docs/cms-plan/master-thread.md` – cross-thread phases and task ordering.

## Dependencies (high-level)

- **A → everyone**: decisions about source-of-truth (`*_BACKEND` semantics, Prisma vs JSON) and platform vs tenant boundaries feed into all other threads.
- **B ↔ D**: Page Builder and templates (B) interact closely with runtime preview and routing (D); they should share the same block/route contracts.
- **C ↔ E**: Cart/checkout flows (C) must expose clear configuration hooks so the configurator and launch gating (E) can validate readiness.
- **E ↔ F**: Configurator APIs and health checks (E) should live in shared packages and be well-tested (F) rather than ad-hoc in the CMS app.

Each thread file defines its own more detailed dependencies and validation strategy.
