---
Type: Plan
Status: Historical
Domain: Documentation
Last-reviewed: 2026-01-16
Relates-to charter: none
Created: 2026-01-16
Created-by: Codex
Last-updated: 2026-01-16
Last-updated-by: Codex
Completed: 2026-01-16
Completed-by: Codex
---

# Agent-Only Runbook Tone Alignment

## Goal

Reword existing documentation to assume agent-only readership. This includes
removing human-directed phrasing ("you/your") where it is not part of UI copy or
code examples, and adding explicit runbook framing and metadata updates.

## Scope

1. Infra/deploy/security docs:
   - `docs/secrets-management.md`
   - `docs/domain-and-deployment-strategy.md`
   - `docs/git-hooks.md`
   - `docs/git-safety.md`
   - `docs/telemetry-deployment.md`
   - `docs/commerce/inventory-integration-guide.md`
   - `docs/commerce/inventory-deployment-checklist.md`
2. CMS ops docs:
   - `docs/cms/catalog-inventory-media-ops.md`
   - `docs/cms/build-shop-guide.md`
   - `docs/cms.md`
3. UI system docs:
   - `docs/ui-system-review-response-v2.md`
   - `docs/ui-system-IMPORTANT-READ-THIS-FIRST.md`
   - `docs/ui-system-quickstart.md`
   - `docs/ui-system-phase1-implementation.md`
   - `docs/ui-system-phase3-components.md`
   - `docs/ui-system-phase3-operations-integration.md`
   - `docs/ui-system-phase3-reception-integration.md`
   - `docs/ui-system-phase5-components.md`

## Approach

- Add/refresh `Last-reviewed` metadata to 2026-01-16 where present.
- Add "(Agent Runbook)" to titles when appropriate.
- Replace human-directed phrasing with neutral, operational phrasing.
- Preserve literal UI copy, code samples, and quoted strings.

## Tasks

- [x] Batch 1: Infra/deploy/security docs tone pass.
- [x] Batch 2: CMS ops docs tone pass.
- [x] Batch 3: UI system docs tone pass.

## Completion Summary

- Updated infra/deploy/security, CMS ops, and UI system docs to agent-runbook tone.
- Added or refreshed metadata headers and review dates where applicable.
- Preserved UI copy and code examples while removing human-directed phrasing in narrative text.

## Completion Criteria

- All scoped docs reflect agent-only tone with minimal narrative "you/your" phrasing.
- Metadata updates applied consistently.
- No changes to quoted UI copy or code examples.

## Active tasks

(Historical - all tasks completed)
