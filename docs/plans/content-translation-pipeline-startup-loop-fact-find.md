---
Type: Fact-Find
Outcome: Planning
Status: Active
Domain: i18n / Startup loop
Workstream: Engineering
Created: 2026-02-14
Last-updated: 2026-02-14
Last-reviewed: 2026-02-14
Relates-to charter: docs/i18n/i18n-charter.md
Feature-Slug: content-translation-pipeline-startup-loop
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: /lp-do-build
Supporting-Skills: /lp-readiness, /lp-offer, /lp-channels, /lp-seo, /lp-launch-qa
Related-Plan: docs/plans/content-translation-pipeline-plan.md
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID:
---

> **Note:** S7/S8/S9 stage IDs referenced below were consolidated into stage DO in loop-spec v3.0.0 (2026-02-21).

# Content Translation Pipeline: Startup Loop Integration Fact-Find

## Scope

### Summary
Writing marketing and sales content and translating it into the customer's language is a conversion lever and, for EU-first launches, often a differentiator. Base-Shop already has an implementation plan for a translation pipeline; this fact-find retrofits that plan into the Startup Loop so localisation is treated as a stage output and QA gate rather than ad hoc post-launch cleanup.

This doc focuses on loop integration only: where language decisions happen, what artifacts/gates they produce, and how Workstream A (shop/CMS content) and Workstream B (Brikette app content) map into stages.

### Goals
- Define minimal, deterministic integration points for content writing plus translation inside the loop.
- Make EU-first readiness explicit: target markets, required languages, and MVP quality bar are decided early.
- Prevent half-localised launches: required locales are enforced via publish gates and S9B QA checks.
- Keep translation costs minimal by default (operator-run, subscription-based execution plus TM), consistent with the plan.

### Non-goals
- Designing a human editorial localisation program (professional translation, multi-review workflows).
- Changing the loop stage graph in `docs/business-os/startup-loop/loop-spec.yaml`.
- Rewriting the implementation plan tasks; this doc links to them.

### Constraints and assumptions
- We will often sell into EU markets first; reasonable-quality in-language content affects trust and conversion.
- The i18n model separates UI chrome bundles (today: UiLocale is limited) from content locales (broader ContentLocale set). This is necessary, but the UI fallback tradeoff must be explicit in readiness decisions.
- Execution remains operator-run (Claude Code/Codex) rather than headless server-side translation.

## Evidence Audit (Current State)

### Translation pipeline plan (platform capability)
- `docs/plans/content-translation-pipeline-plan.md`
  - Defines Workstream A (CMS/shop `TranslatableText` inline content) with publish gating and non-overwrite rules.
  - Defines Workstream B (Brikette git/PR-based i18next namespaces and nested guide content) with strict key/shape invariants.
  - Defines safety primitives (tokenization/placeholder safety/undo bundles/staleness reporting).

### i18n contracts and inventories
- `docs/i18n/i18n-charter.md` (canonical behaviour framing)
- `docs/i18n/translatable-content-audit.md` (inventory and locale model split: UI_LOCALES vs CONTENT_LOCALES)

### Startup loop authority
- `docs/business-os/startup-loop/loop-spec.yaml` (authoritative stage graph)
- `docs/business-os/startup-loop/autonomy-policy.md` (guarded vs autonomous boundaries)

## Findings
- Localisation affects acquisition (channel/SEO surfaces) and conversion (landing page trust, legal clarity, purchase confidence).
- Without explicit loop placement, translation is consistently deferred until after launch, producing predictable failure modes:
  - EU conversion drag due to English-only trust surfaces.
  - Inconsistent language sets per business.
  - Repeated rework and avoidable spend (no glossary/TM discipline).
- The translation pipeline plan already contains the right mechanics; the missing piece is loop-level routing:
  - When languages are decided.
  - What must be translated before a launch is considered ready.
  - How we measure outcomes per locale.

## Proposed Startup Loop Integration (stage-by-stage)

### S1: Readiness (decision)
Treat languages as a readiness decision, not a build afterthought.
- Decide target markets and required customer languages for the first launch.
- Decide the MVP localisation bar:
  - content-only localisation acceptable, or
  - UI chrome localisation required for checkout-critical UX.
- Record the explicit tradeoff when UI bundles do not exist for a target content locale:
  - UI chrome falls back to the primary UI language, but content remains routable.

### S2B: Offer design (positioning)
Capture whether in-language experience is part of the offer and which surfaces are sales-critical:
- hero/value prop, pricing clarity, policies/legal, help content, onboarding emails.

### S6B: Channel strategy plus SEO (acquisition)
Localisation should be part of acquisition planning.
- Output includes:
  - target locales (from S1)
  - which pages/sections must be localised for acquisition and conversion
  - glossary/term list needs (brand and place names)
  - measurement plan: conversion by locale plus translation completeness/staleness diagnostics

### S7: Fact-find (per-business inventory)
For the selected build business, produce a planning-ready map:
- inventory of sales-critical content surfaces
- minimal required locale set to call the launch ready
- explicit mapping to Workstream A vs Workstream B

### S8: Plan
Plans for EU-first launches include explicit translation tasks:
- write primary-language content
- run translation pipeline for required locales
- review high-risk copy (legal/trust/checkout guidance)
- verify publish gates and QA checks

### S9: Build
Execute translation as part of build work.
- Workstream A:
  - translate draft/pre-publish content only
  - never overwrite reviewed/manual translations by default
  - staleness tracked and undo bundles available
- Workstream B:
  - translate values only, preserve keys and structure
  - PR-based delivery and review

### S9B: QA gates
Add a localisation section to launch QA:
- Required locales exist for sales-critical surfaces.
- Format safety checks pass (placeholders/URLs/tokens preserved).
- Locale traits are correct (`lang`, `dir` for RTL locales) even when UI chrome falls back.

### S10: Weekly readout plus experiments
Treat localisation as measurable.
- KPI slice: conversion by locale.
- Diagnostic: translation completeness and staleness rates by locale.
- Experiments: per-locale copy iterations and glossary fixes.

## Minimal Sales-Critical Locale Completeness (MVP)
For EU-first launch readiness, define a per-business minimal required translation set:
- landing/home hero/value prop and primary CTAs
- pricing/fees clarity surfaces
- policies/legal/trust pages surfaced in the purchase journey
- navigation labels and SEO titles/descriptions for indexed pages
- onboarding/confirmation emails and key transactional copy (when customer-facing)

## Risks and Open Questions
- UI vs content locale gap: when does content-only localisation become a readiness blocker?
- Trust and legal copy: which pages require human review before launch-ready?
- External source licensing for authored content (Workstream B authoring): ensure attribution and ShareAlike handling is enforceable.

## Recommended next step
Proceed to planning for loop integration (checklists and acceptance criteria in S1/S6B/S9B), then execute the underlying pipeline work in `docs/plans/content-translation-pipeline-plan.md`.
