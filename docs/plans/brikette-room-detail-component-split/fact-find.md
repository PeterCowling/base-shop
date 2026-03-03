---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: UI Architecture
Workstream: Product-Engineering
Created: 2026-03-01
Last-updated: 2026-03-01
Last-reviewed: 2026-03-01
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brikette-room-detail-component-split
Execution-Track: mixed
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: operator-idea
Primary-Execution-Skill: lp-do-build
Supporting-Skills: tools-refactor
artifact: fact-find
Trigger-Source: lp-do-ideas:auto-executed
Trigger-Why: room-detail component remains oversized and mixes booking orchestration with rendering sections
Trigger-Intended-Outcome: "type: operational | statement: split RoomDetailContent into smaller feature modules while preserving booking and handoff behavior | source: operator"
---

# Brikette Room Detail Component Split — Fact-Find

## Scope

### Summary
Assess and define a safe decomposition of the room-detail page so booking-state orchestration, section rendering, and handoff controls are isolated into maintainable modules without behavior regression.

### Goals
- Reduce `RoomDetailContent.tsx` complexity and file size.
- Separate booking orchestration from presentation sections.
- Keep all current funnel contracts intact (hostel constraints, handoff path, recovery prompts).
- Prepare a planning-ready split map with task boundaries and validation contracts.

### Non-goals
- No booking-policy contract changes.
- No analytics schema changes.
- No SEO/canonical policy changes.

## Current Truth
- `apps/brikette/src/app/[lang]/dorms/[id]/RoomDetailContent.tsx` remains large (500+ LOC) and still combines:
  - page composition,
  - booking CTA orchestration,
  - translated content shaping,
  - and room-detail section rendering.
- Refactor work already extracted:
  - `apps/brikette/src/hooks/useRoomDetailBookingState.ts`
  - `apps/brikette/src/hooks/useRecoveryResumeFallback.ts`
  - shared booking notice components.
- Remaining complexity concentration is mainly rendering composition and translated content resolution.

## Candidate Decomposition
1. `RoomDetailHeader` (title + hero)
2. `RoomDetailBookingPanel` (picker + notices + room card + recovery capture)
3. `RoomDetailInfoSections` (feature, outline, amenities)
4. `RoomDetailGuides` (helpful guides block)
5. Thin `RoomDetailContent` orchestrator wiring data + callbacks

## Risks
- Rendering split can accidentally change DOM structure relied on by tests.
- Shared props may become too broad if boundaries are poorly defined.
- i18n key fallback logic can regress if duplicated instead of centralized.

## Planning Questions
- Which subcomponents should own translation fallback helpers?
- Should room-detail presentational components live under `components/rooms/` or co-locate near route?
- Which existing tests must be expanded/updated to pin behavior during split?

## Recommended Next Step
Create a plan with 2-3 implementation tasks:
1. component boundary extraction,
2. test stabilization pass,
3. optional cleanup pass for dead utilities/props.

