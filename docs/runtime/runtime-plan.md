Type: Plan
Status: Active
Domain: Runtime
Last-reviewed: 2025-12-02
Relates-to charter: docs/runtime/runtime-charter.md

# Runtime Plan — Template & Tenant Alignment

This plan tracks work related to keeping the template runtime contract and tenant apps aligned with `runtimeContractManifest`.

## Active tasks

- **RT-01 — Validate tenant apps against runtime contract**
  - Status: ☐
  - Scope:
    - Compare `apps/cover-me-pretty` and any other tenant runtimes against `packages/template-app/src/runtimeContractManifest.ts` and `docs/runtime/template-contract.md`.
    - Identify divergences in routes (`/api/cart`, `/api/checkout-session`, `/api/return`, preview routes) and env usage.
  - Dependencies:
    - `docs/runtime/runtime-charter.md` and `docs/runtime/template-contract.md` marked Canonical (done).
  - Definition of done:
    - A short findings list exists (per app) and follow-up tasks are created for any divergences.

- **RT-02 — Harden runtimeContractManifest coverage**
  - Status: ☐
  - Scope:
    - Ensure `runtimeContractManifest` lists all externally observable routes and capabilities used by CMS/tests.
    - Extend tests in `packages/template-app/__tests__/runtimeContractManifest.test.ts` to assert on new entries.
  - Dependencies:
    - RT-01 (so manifest gaps are understood).
  - Definition of done:
    - Manifest covers all required runtime routes; tests fail when routes or runtimes drift.

- **RT-03 — Document tenant convergence path**
  - Status: ☐
  - Scope:
    - Add a short convergence guide (section in `docs/runtime/runtime-charter.md` or a separate guide) describing how a non‑template app becomes “platform‑compatible”.
  - Dependencies:
    - RT-01 and RT-02 to reflect real gaps.
  - Definition of done:
    - Guide exists and references the manifest + template contract as the source of truth.

## Completed / historical

- None yet.

