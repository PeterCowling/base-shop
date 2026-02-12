---
Type: Fact-Find
Outcome: Planning
Status: Needs-input
Domain: Business-OS
Workstream: Engineering
Created: 2026-02-11
Last-updated: 2026-02-11
Last-reviewed: 2026-02-11
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: idea-readiness-code-to-plan-traceability
Deliverable-Type: spreadsheet
Execution-Track: mixed
Primary-Execution-Skill: biz-spreadsheet
Supporting-Skills: idea-readiness, biz-update-plan
Business-OS-Integration: on
Business-Unit: BOS
---

# Ideas Readiness — Code-to-Plan Traceability Fact-Find

## Scope
### Summary
Define the exact mapping data required to link changed code/doc paths to business outcomes and decision links, so idea generation does not operate on orphan work.

### Goals
- Establish path-to-business and path-to-outcome traceability as mandatory pre-ideation data.
- Define strict schema for mapping registry and unmapped queue.
- Specify quality gates for when traceability is "good enough" to allow idea generation.

### Non-goals
- Refactoring code in this brief.
- Accepting low-confidence/missing mappings as warnings.

## Evidence Audit (Current State)
- High-volume changed-path set across multiple domains without complete confirmed mappings.
  - `docs/business-os/readiness/2026-02-10-idea-readiness.user.md:42`
- Initial mapping registry exists but includes unresolved questions.
  - `docs/business-os/readiness/path-business-map.user.yaml:70`

## Required Mapping Schema

The mapping register must contain one row per active path-prefix group:

| Field | Type | Constraints | Required |
|---|---|---|---|
| Prefix | string | repo-relative path prefix | yes |
| Business | enum | `BRIK|PIPE|PLAT|BOS|cross-cutting` | yes |
| Outcome-ID | string | must exist in corresponding business plan | yes |
| Decision-Link-ID | string | must exist in corresponding business plan | yes |
| Owner | person | accountable confirmer | yes |
| Confidence | enum | `high|medium|low` | yes |
| Evidence | list | >=1 pointer proving mapping | yes |
| Last-Confirmed | date | `YYYY-MM-DD` | yes |
| Expiry-Days | integer | max `30` | yes |

## Unmapped Queue Schema

Every unmapped changed path must be captured with:
- `Path`
- `Why-Unmapped`
- `Proposed-Business`
- `Required-Decision`
- `Owner`
- `Due-Date`
- `Status` (`open|resolved|parked|deleted`)

## Required Validation Rules
- No changed path under `apps/`, `packages/`, `scripts/`, `docs/` may remain unmapped when readiness is marked READY.
- Any `cross-cutting` mapping must still include explicit outcome IDs in >=1 business.
- Mappings with `confidence=low` require explicit user confirmation before READY.
- Stale mappings (`Last-Confirmed + Expiry-Days < today`) are treated as blockers.

## Question Set (User Input Needed)
1. Confirm ownership mapping for these high-volume groups: `apps/prime`, `apps/reception`, `packages/mcp-server`, `scripts`.
2. For each group, which active outcome ID(s) does it directly support?
3. For each group, which decision-link ID does it unlock?
4. Which paths should be explicitly marked `parked` or `delete-candidate`?

## Planning Readiness Gate
- [ ] Mapping schema complete for all active changed path groups.
- [ ] Unmapped queue is empty or has explicit parked/deleted decisions.
- [ ] All low-confidence mappings confirmed by owner.
- [ ] No stale mappings.

## Recommended Next Step
- Maintain `docs/business-os/readiness/path-business-map.user.yaml` as authoritative registry.
- Add/refresh per-path outcome and decision-link mapping.
- Re-run `/idea-readiness`.
