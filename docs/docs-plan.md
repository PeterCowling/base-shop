Type: Plan
Status: Active
Domain: Documentation
Last-reviewed: 2025-12-02
Relates-to charter: docs/architecture.md

# Documentation Plan — AI-First Taxonomy

This plan tracks work related to the AI-first documentation conventions defined in `docs/AGENTS.docs.md`.

## Active tasks

- **DOC-07 — Keep docs taxonomy in sync with usage**
  - Status: ☐
  - Scope:
    - Periodically review new/edited docs to ensure `Type`/`Status`/`Domain` and code pointers remain accurate.
  - Dependencies:
    - DOC-01–DOC-06 complete.
  - Definition of done:
    - No `docs:lint` regressions; docs authors routinely update headers alongside content.

## Completed / historical

## DOC-01 — Establish docs taxonomy and runbook

- Status: ✅
- Scope:
  - Document doc types (Charter, Contract, Plan, Research/Guide/Log, ADR).
  - Define status vocabulary and global rules (code is truth, planning via Plan docs). Plans must list blocking elements explicitly to enable parallel execution.
- Implementation:
  - Added `docs/AGENTS.docs.md` and linked it from `AGENTS.md` and `docs/index.md`.

## DOC-02 — Tag core docs with headers

- Status: ✅
- Scope:
  - Add `Type`, `Status`, `Domain`, and `Last-reviewed` headers to core CMS, runtime, and platform docs.
- Implementation:
  - Updated CMS research and plan docs, platform/runtime contracts, theming/SEO/returns, testing and troubleshooting guides, and Base-Shop implementation plan.

## DOC-03 — Add domain charters

- Status: ✅
- Scope:
  - Introduce small charters for major domains beyond CMS/runtime.
- Implementation:
  - Added:
    - `docs/i18n/i18n-charter.md`
    - `docs/theming-charter.md`
    - `docs/commerce-charter.md`

## DOC-04 — Add docs lint and registry tooling

- Status: ✅
- Scope:
  - Provide a lightweight way to validate doc headers and generate a registry for agents.
- Implementation:
  - Added `scripts/src/docs-lint.ts` and `pnpm docs:lint`:
    - Validates presence of `Type`/`Status` headers.
    - Ensures `Domain` and code pointers for `Charter`/`Contract` docs.
    - Writes `docs/registry.json` with `{ path, type, status, domain }` entries.
  - Wired a `Docs lint` step into `.github/workflows/ci.yml` so documentation issues are surfaced alongside other CI checks.

## DOC-05 — Extend taxonomy to remaining docs

- Status: ✅
- Scope:
  - Gradually add headers to remaining docs under `docs/` (for example marketing, MFA, machine utilities, CI/deploy docs).
- Implementation:
  - All Markdown files under `docs/` now declare `Type`, `Status`, `Domain`, and `Last-reviewed` headers and appear in `docs/registry.json`.

## DOC-06 — Make docs lint blocking in CI

- Status: ✅
- Scope:
  - Once all important docs have headers, tighten the CI step.
- Implementation:
  - Updated the `Docs lint` step in `.github/workflows/ci.yml` to run `pnpm run docs:lint` without `|| true` so missing headers or invalid statuses fail CI.
