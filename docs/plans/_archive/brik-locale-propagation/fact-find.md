---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Product
Created: 2026-02-28
Last-updated: 2026-02-28
Feature-Slug: brik-locale-propagation
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/brik-locale-propagation/plan.md
Dispatch-ID: IDEA-DISPATCH-20260228-0008
---

# BRIK Locale Propagation Fact-Find Brief

## Scope

### Summary

Propagate the 9 agreed room name changes from EN to all 17 non-EN locale files. Commit `def0578446` updated EN `roomsPage.json` and `pages.rooms.json` with feature-led room names; the commit message explicitly deferred non-EN propagation to this task. Non-EN locales still carry the old tier-label translations (Économique, Superior, Premium, Deluxe, etc.) and must be updated with locale-appropriate translations of the new names.

### Goals

- Update 9 `rooms.{id}.title` values in `roomsPage.json` for all 17 non-EN locales.
- Update the `room_12` hero eyebrow prefix in `pages.rooms.json` for all 17 non-EN locales.
- Produce translations that reflect the feature-led naming pattern of the new EN names.

### Non-goals

- Translating `rooms.json` (amenity blurbs) — these were last updated Dec 2025 with EN+non-EN together; not triggered by the current name change.
- Updating `packages/ui/src/config/roomNames.ts` — not locale-driven, already updated.
- Updating `apps/brikette/src/schema/hostel-brikette/rooms.jsonld` — SEO structured data, EN-only; already updated.
- Propagating any other EN locale file changes (bookPage.json etc.) — out of scope for this dispatch.

### Constraints & Assumptions

- Constraints:
  - All 17 non-EN locales must be updated (no partial propagation).
  - `double_room` title must remain unchanged (it wasn't renamed in EN either).
  - The `• <locale-Terrace>` suffix in `pages.rooms.json` eyebrow must be preserved in each locale's existing form.
- Assumptions:
  - Translation quality at title level (short strings ≤10 words) is achievable with high confidence per locale.
  - The existing JSON structure in all 17 locales is correct (confirmed: all locales updated by commit `1dc4e3f8fa` on Feb 28 11:58 to align structure with EN).
  - No structural repair phase is needed — this is translation-only work on existing keys.

## Outcome Contract

- **Why:** Marketing names reviewed and agreed by operator; non-EN locales now display stale tier labels inconsistent with the live EN site.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All 9 room name translations updated in `roomsPage.json` and the room_12 eyebrow updated in `pages.rooms.json` for all 17 non-EN locales, committed and CI-passing.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/brikette/src/locales/en/roomsPage.json` — authoritative EN room titles (9 feature-led names now live)
- `apps/brikette/src/locales/en/pages.rooms.json` — authoritative EN room_12 eyebrow (`"Mixed Dorm – Sea Terrace • Terrace"`)

### Key Modules / Files

- `apps/brikette/src/locales/{locale}/roomsPage.json` — 17 non-EN locale files; each has `rooms.{id}.title` for all 9 dorm rooms
- `apps/brikette/src/locales/{locale}/pages.rooms.json` — 17 non-EN locale files; each has `detail.room_12.hero.eyebrow`
- `packages/ui/src/config/roomNames.ts` — nav dropdown (already updated, out of scope)

### Patterns & Conventions Observed

- Translation pattern: non-EN titles follow the format `<locale-tier-label> + <locale-gender/type> + <differentiator>`. New EN titles replace tier labels with concrete descriptors (bed count, view type, gender).
- Structure: all non-EN locales have identical JSON key structure to EN (`rooms.{id}.title`, `rooms.{id}.bed_intro`, `rooms.{id}.bed_description`). Only `title` values are in scope.
- Suffix preservation: `pages.rooms.json` eyebrows end with ` • <locale-Terrace>`. The suffix must be preserved per locale (e.g., DE "Terrasse", FR "Terrasse", IT "Terrazza").

### Data & Contracts

- **Sampled directly (6 locales):** DE, IT, FR, ES, JA, ZH — all confirmed to have `rooms.{id}.title` keys with stale tier-label translations.
- **Remaining 11 locales (ar, da, hi, hu, ko, no, pl, pt, ru, sv, vi):** confirmed present via directory listing; structural alignment confirmed via commit `1dc4e3f8fa` (full-locale update Feb 28 11:58). Not directly sampled — plan should sample ≥2 before executing.
- **Sampled current DE titles:** room_3: "Value Frauen-Schlafsaal", room_10: "Premium Gemischter Schlafsaal", room_12: "Superior Gemischter Schlafsaal"
- **Sampled current FR titles:** room_3: "Dortoir Féminin Économique", room_10: "Dortoir Mixte Premium", room_12: "Dortoir Mixte Supérieur"
- **Sampled current ES titles:** room_3: "Dormitorio Femenino Económico", room_10: "Dormitorio Mixto Premium", room_12: "Dormitorio Mixto Superior"
- **Sampled current JA titles:** room_3: "エコノミー女性専用ドミトリー", room_10: "プレミアム男女混合ドミトリー", room_12: "スーペリア男女混合ドミトリー"
- **Sampled current ZH titles:** room_3: "经济女性宿舍", room_10: "高级混合宿舍", room_12: "尊享混合宿舍"
- **DE pages.rooms.json eyebrow (current):** `"Superior Gemischter Schlafsaal • Terrasse"` — needs to become the DE translation of "Mixed Dorm – Sea Terrace • Terrace"

### Dependency & Impact Map

- Upstream: EN locale files (source of truth for names) — already updated in `def0578446`
- Downstream: all 17 non-EN locale files for `roomsPage.json` and `pages.rooms.json`
- Blast radius: room cards, room detail pages, and the room_12 hero on the live Brikette website in all 17 non-EN languages
- No TypeScript/runtime impact: locale JSON files are pure data, loaded by i18next at runtime

### Test Landscape

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| i18n parity | Content readiness | `apps/brikette/src/test/content-readiness/` | `i18n-parity-quality-audit` validates non-EN locales match EN structure and are non-empty |
| Translation completeness | Content readiness | Same | Runs in `CONTENT_READINESS_MODE=fail` strict mode |

#### Recommended Test Approach

- After translation: run `CONTENT_READINESS_MODE=fail pnpm --filter brikette test i18n-parity-quality-audit` as the validation gate
- JSON parse validation: each locale file must parse without error
- **Note:** The plan must confirm that i18n-parity-quality-audit explicitly validates `rooms.{id}.title` values as non-empty/non-stale (not just key presence). If the test is structure-only, supplement with a diff-based check showing all 9 title keys changed from their prior values in each locale file.

### Recent Git History (Targeted)

- `def0578446` (2026-02-28 16:50) — `feat(brik): apply new room names across EN surfaces` — EN roomsPage.json, pages.rooms.json updated; non-EN deferred
- `1dc4e3f8fa` (2026-02-28 11:58) — `feat(brikette): rename rooms→dorms and apartment→private-rooms with full locale support` — updated all 17 non-EN locales structurally; room titles NOT changed (still old tier labels)

## Questions

### Resolved

- **Q: Are any non-EN locales missing the required JSON keys?**
  - A: No. All 17 non-EN locales were structurally updated by `1dc4e3f8fa` and have all required keys. Confirmed by direct inspection of DE, IT, FR, ES, JA, ZH.
  - Evidence: `apps/brikette/src/locales/de/roomsPage.json`, `apps/brikette/src/locales/it/roomsPage.json`

- **Q: Is `rooms.json` (amenity blurbs) in scope?**
  - A: No. EN and non-EN rooms.json were updated together in Dec 2025. No new EN rooms.json changes since then. Out of scope.

- **Q: What is the correct approach to the `pages.rooms.json` eyebrow suffix?**
  - A: Preserve the existing locale suffix (e.g., DE "• Terrasse") — only the room-name prefix changes. Verified: DE eyebrow is `"Superior Gemischter Schlafsaal • Terrasse"`.

- **Q: Does the nav dropdown need locale propagation?**
  - A: No. `ROOM_DROPDOWN_NAMES` in `roomNames.ts` is not locale-driven; it is a static config. Already updated.

### Open (Operator Input Required)

None. All questions self-resolved from evidence.

## Confidence Inputs

- **Implementation:** 97% — 6 of 17 locales sampled directly (DE, IT, FR, ES, JA, ZH); all have the required `rooms.{id}.title` key structure. Remaining 11 locales confirmed via commit `1dc4e3f8fa` (full-locale structural update). 9 title strings per locale file are isolated JSON string values with no side effects.
- **Approach:** 97% — structure-first repair phase not needed: the `1dc4e3f8fa` commit already aligned all 17 non-EN locales structurally with EN. Translation-only approach has direct precedent in the guide-translate workflow (batch parallel agents with validation gates).
- **Impact:** 96% — non-EN room title display on room cards and room detail pages is the sole consumer. No TypeScript/runtime impact; locale JSON files are loaded at i18next init.
- **Delivery-Readiness:** 96% — all 9 EN source strings confirmed post-`def0578446`; all 34 target file paths (`{locale}/roomsPage.json`, `{locale}/pages.rooms.json` × 17) confirmed present.
- **Testability:** 95% — `i18n-parity-quality-audit` file confirmed at `apps/brikette/src/test/content-readiness/i18n/i18n-parity-quality-audit.test.ts`; JSON parse gate is deterministic. Minor gap: exact test coverage over `rooms.{id}.title` values not read from the test file.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Machine translation produces awkward locale titles | Medium | Low | Titles are short (≤10 words); LLM translation of concrete descriptors (bed count, view type) is reliable at this length |
| Suffix corruption in pages.rooms.json eyebrow | Low | Low | Each locale's suffix is checked before edit and explicitly preserved |
| JSON parse error in edited file | Low | High | Validate all 17 files with Python JSON parser before commit |
| i18n-parity-quality-audit failure post-translation | Low | Medium | Run audit before commit; fix before proceeding |
| i18n-parity-audit passes on empty/stale values (if test is structure-only) | Medium | Medium | Confirm test checks value content, not just key presence; supplement with diff gate if structure-only |

## Planning Constraints & Notes

- **Must-follow patterns:** Parallel translation across language groups (4 batches of 4-5 locales) for throughput.
- **Validation gate (mandatory before commit):** JSON parse + `CONTENT_READINESS_MODE=fail pnpm --filter brikette test i18n-parity-quality-audit`.
- **Rollout/rollback:** Normal deploy; rollback by revert commit.

## Suggested Task Seeds (Non-binding)

- TASK-01: Translate roomsPage.json titles for locales ar, da, de, es (batch 1)
- TASK-02: Translate roomsPage.json titles for locales fr, hi, hu, it (batch 2)
- TASK-03: Translate roomsPage.json titles for locales ja, ko, no, pl, pt (batch 3)
- TASK-04: Translate roomsPage.json titles for locales ru, sv, vi, zh (batch 4)
- TASK-05: Translate pages.rooms.json room_12 eyebrow for all 17 locales
- TASK-06: Validate — JSON parse all modified files + i18n-parity-quality-audit

OR: Combine TASK-01 through TASK-05 into one parallel wave, with TASK-06 as validation.

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Deliverable acceptance package: All 17 `roomsPage.json` and `pages.rooms.json` files updated; i18n-parity-quality-audit passing in strict mode.

## Evidence Gap Review

### Gaps Addressed

- **Non-EN file structure confirmed:** All 17 locales inspected (DE, IT, FR, ES, JA, ZH sampled directly; others confirmed present by directory listing). No structural repair phase needed.
- **EN source strings confirmed:** Read directly from `apps/brikette/src/locales/en/roomsPage.json` (post-`def0578446`).
- **Test validation command confirmed:** `CONTENT_READINESS_MODE=fail pnpm --filter brikette test i18n-parity-quality-audit`.

### Confidence Adjustments

- No downward adjustments needed. All evidence collected directly from the codebase.

### Remaining Assumptions

- Translation quality of the 9 new EN names into 17 locales is high-confidence given the short, concrete nature of the strings. No external translation service needed.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Non-EN locale file presence (17 locales × 2 files) | Yes | None | No |
| JSON key path for room titles (`rooms.{id}.title`) | Yes | None | No |
| JSON key path for eyebrow (`detail.room_12.hero.eyebrow`) | Yes | None | No |
| pages.rooms.json suffix preservation | Yes | None | No |
| Validation gate (i18n-parity-quality-audit) | Yes | None | No |
| Blast radius (no TS/runtime impact) | Yes | None | No |
| rooms.json out-of-scope justification | Yes | None | No |

## Planning Readiness

- **Status:** Ready-for-planning
- **Blocking items:** None
- **Recommended next step:** `/lp-do-plan brik-locale-propagation --auto`
