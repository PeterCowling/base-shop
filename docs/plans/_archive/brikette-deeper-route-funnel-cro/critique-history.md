# Critique History: brikette-deeper-route-funnel-cro

## Round 1 — 2026-02-25

### Issues Opened This Round

| ID | Severity | Target | Summary |
|---|---|---|---|
| 1-01 | Major | Data & Contracts (line 103); Confidence Inputs; Task Seeds TASK-04 | `"experiences_page"` ctaLocation is claimed "in enum, never fired" but is absent from `GA4_ENUMS.ctaLocation` in `ga4-events.ts` AND absent from `ContentStickyCta` prop type. Deploying TASK-04 as written would cause TypeScript compile error or silent event drop. |
| 1-02 | Moderate | Data & Contracts (line 103); Remaining Assumptions; Confidence Inputs | `ctaLocation: "assistance"` listed as needing enum verification; it is already confirmed present in both `GA4_ENUMS.ctaLocation` and `ContentStickyCta` prop type. False uncertainty bloating open-item list. |
| 1-03 | Moderate | Goals (line 39) vs. Resolved Questions answer | Goal says "Remove OTA-first link ordering." Resolved answer says "Supplement and reorder." Task seed says "Add primary CTA above OTA block." Three inconsistent framings of the same action. |
| 1-04 | Minor | Evidence Audit — Key Modules (line 90) | `SocialProofSection` stated "deployed on `/book` only" — also renders in `HomeContent.tsx`. Minor evidence scope inaccuracy. |
| 1-05 | Minor | Test Landscape / Planning Constraints | `ExperiencesCtaSection` book button is `<Button onClick={onBookClick}>` with no fallback href — violates the stated no-JS constraint. TASK-03 (GA4 fix) should also close this no-JS gap on the same element; not noted in scope. |

### Issues Confirmed Resolved This Round

None (first critique round).

### Issues Carried Open (not yet resolved)

None (first critique round — all issues are new, and autofixed issues 1-01 through 1-05 are applied but require plan-level verification).

### Autofix Summary

All 5 issues received inline fixes to the fact-find document. Issues 1-01 and 1-03 also had cascading stale references (lines 60, 115, 234, 242, 311, risk table row) cleaned up in the AF-3 consistency scan.

Issue 1-01 remains a planning-level prerequisite: the GA4 enum and prop type changes must be implemented in source code as a gated step before TASK-04. The fact-find now correctly documents this requirement.
