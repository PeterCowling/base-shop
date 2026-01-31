---
Type: Card
Lane: Planned
Priority: P1
Owner: Pete
ID: BRIK-ENG-0003
Title: Content Translation Pipeline Plan
Business: BRIK
Tags:
  - plan-migration
  - i18n/cms
Created: 2026-01-20T00:00:00.000Z
Updated: 2026-01-20T00:00:00.000Z
---
# Content Translation Pipeline Plan

**Source:** Migrated from `content-translation-pipeline-plan.md`


# Content Translation Pipeline Plan

## Goals
- Enable authors to write content in a primary language and generate machine translations for one or more target locales.
- Integrate translation output into existing `TranslatableText` inline content so runtime rendering stays unchanged.
- Add a Brikette i18next namespace translation workflow (git/PR-based) that preserves keys and shares TM/tokenization/glossary primitives.
- Support moderate-to-high volume translation with retries, rate limits, and auditability.
- **Keep translation costs minimal**:
  - Primary: subscription-based translation via Claude Code/Codex sessions (no pay-as-you-go API spend by default)
  - Efficiency: $0 re-runs of unchanged content via TM
  - Optional fallback: if an API overflow mode is later enabled, keep a typical-shop run under ~$5
- Avoid overwriting human-edited or already-localized content.
- Default new shops to `contentLanguages = ["en", "it"]` while allowing opting into the full Brikette locale set (including region/script variants).

## Non-goals
- Human-quality localization or editorial QA workflows.
- Replacing i18n keys in `packages/i18n/src/*.json` or `apps/brikette/src/locales/*` (Workstream B translates values only; keys are immutable).
- Introducing a new runtime i18n library or changing fallback rules.
- Real-time/synchronous translation during content editing.

[... see full plan in docs/plans/content-translation-pipeline-plan.md]
