---
Type: Plan
Status: Archived
Domain: UI
Workstream: Product
Created: 2026-02-28
Last-reviewed: 2026-02-28
Last-updated: 2026-02-28
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brik-apply-room-names
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 97%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# BRIK Apply Room Names Plan

## Summary
Apply 9 agreed dorm-room marketing names to every consumer-facing EN surface. The change touches 4 files: the nav dropdown config, the EN locale room titles, the JSON-LD structured data, and a single hero eyebrow string. All edits are pure string replacements — no logic, no type changes, no migration needed. `double_room` ("Double Room") is unchanged. Non-EN locale propagation is deferred to the separate brik-locale-propagation task.

## Active tasks
- [x] TASK-01: Update roomNames.ts dropdown config — Complete (2026-02-28) def0578446
- [x] TASK-02: Update roomsPage.json EN room titles — Complete (2026-02-28) def0578446
- [x] TASK-03: Update rooms.jsonld structured data names — Complete (2026-02-28) def0578446
- [x] TASK-04: Update pages.rooms.json room_12 hero eyebrow — Complete (2026-02-28) def0578446

## Goals
- Replace all 9 stale room name strings with the agreed feature-led names.
- Keep `double_room` name, all descriptions, amenity lists, and price copy unchanged.

## Non-goals
- Non-EN locale translations (brik-locale-propagation task).
- Changing room descriptions or facilities copy.
- Updating prime app internal operational names (`roomUtils.ts`).
- Editing the auto-generated `public/schema/` copy (regenerated at build time).

## Constraints & Assumptions
- Constraints:
  - `public/schema/hostel-brikette/rooms.jsonld` is auto-generated at postbuild — only `src/schema/` is edited.
- Assumptions:
  - All 9 names are final as agreed in session (no further operator confirmation needed).
  - `pages.rooms.json` eyebrow retains the ` • Terrace` suffix; only the room-name prefix changes.

## Inherited Outcome Contract
- **Why:** Marketing names reviewed and agreed — new names communicate actual features rather than abstract tier labels, improving booking intent clarity.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All 9 dorm room names updated across 4 EN source files with no broken tests or TypeScript errors.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/brik-apply-room-names/fact-find.md`
- Key findings used:
  - 4 source files identified; `public/schema/` confirmed as build artifact.
  - No hardcoded room name strings in TSX/TS source — all locale-driven.
  - `pages.rooms.json` contains only room_12 detail; only eyebrow prefix needs changing.

## Proposed Approach
- Option A: Update all 4 files in parallel (single wave, fully independent).
- Chosen approach: Option A — all edits are independent string replacements with no shared state; parallel execution is optimal.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Update roomNames.ts (9 strings) | 97% | S | Pending | - | - |
| TASK-02 | IMPLEMENT | Update roomsPage.json EN titles (9 keys) | 97% | S | Pending | - | - |
| TASK-03 | IMPLEMENT | Update rooms.jsonld name fields (9 entries) | 97% | S | Pending | - | - |
| TASK-04 | IMPLEMENT | Update pages.rooms.json room_12 eyebrow | 97% | S | Pending | - | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03, TASK-04 | - | All independent — run in parallel |

---

### TASK-01: Update roomNames.ts dropdown config
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `packages/ui/src/config/roomNames.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `packages/ui/src/config/roomNames.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 97%
  - Implementation: 99% — single file, 9 known string replacements
  - Approach: 97% — direct edit, no logic
  - Impact: 97% — dropdown names are the only consumer of this config
- **Acceptance:**
  - All 9 entries in `ROOM_DROPDOWN_NAMES` reflect the agreed names.
  - `double_room` key is absent (already removed in prior commit).
  - TypeScript compiles without error.
- **Validation contract:**
  - TC-01: `ROOM_DROPDOWN_NAMES["room_3"]` === `"8-Bed Female Dorm"`
  - TC-02: `ROOM_DROPDOWN_NAMES["room_12"]` === `"Mixed Dorm – Sea Terrace"`
  - TC-03: `"double_room"` key absent from the object
- **Execution plan:**
  - Red: current strings use old tier labels
  - Green: replace all 9 values with agreed names per mapping table in fact-find
  - Refactor: None required
- **Planning validation:** None: S effort, string replacements only
- **Scouts:** None: all values confirmed by operator
- **Edge Cases & Hardening:** None: read-only config object, no runtime side effects
- **What would make this >=90%:** Already at 97%; no further evidence needed
- **Rollout / rollback:**
  - Rollout: Deploy as part of normal release
  - Rollback: Revert commit
- **Documentation impact:** None
- **Notes / references:** File comment says "update here if room names change in the locale file" — locale change in TASK-02 is the corresponding update

---

### TASK-02: Update roomsPage.json EN room titles
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/brikette/src/locales/en/roomsPage.json`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/brikette/src/locales/en/roomsPage.json`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 97%
  - Implementation: 99% — JSON key paths are known, 9 `.rooms.{id}.title` values
  - Approach: 97% — direct JSON edit
  - Impact: 97% — primary display titles on rooms page and room cards
- **Acceptance:**
  - `.rooms.room_3.title` through `.rooms.room_12.title` (all 9 dorm rooms) updated.
  - `.rooms.double_room.title` unchanged ("Double Room").
  - JSON is valid.
- **Validation contract:**
  - TC-01: `rooms.room_8.title` === `"Female Garden Room"`
  - TC-02: `rooms.room_9.title` === `"Mixed Room – Single Beds"`
  - TC-03: `rooms.double_room.title` === `"Double Room"` (unchanged)
- **Execution plan:**
  - Red: current titles use old tier labels
  - Green: update all 9 `.rooms.{id}.title` values per mapping table
  - Refactor: None
- **Planning validation:** None: S effort
- **Scouts:** None
- **Edge Cases & Hardening:** None: JSON string replacement, no type impact
- **What would make this >=90%:** Already at 97%
- **Rollout / rollback:**
  - Rollout: Normal release
  - Rollback: Revert commit
- **Documentation impact:** None
- **Notes / references:** Non-EN locale files unchanged; those are deferred to brik-locale-propagation

---

### TASK-03: Update rooms.jsonld structured data names
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/brikette/src/schema/hostel-brikette/rooms.jsonld`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/brikette/src/schema/hostel-brikette/rooms.jsonld`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 97%
  - Implementation: 99% — 9 `name` fields in `@graph` array, values confirmed
  - Approach: 97% — direct JSON edit
  - Impact: 96% — SEO structured data; `public/schema/` copy auto-generated at build time so no separate edit needed
- **Acceptance:**
  - All 9 dorm room `name` fields updated in `@graph`.
  - `double_room` HotelRoom `name` unchanged ("Double Room").
  - JSON-LD is valid (well-formed JSON).
- **Validation contract:**
  - TC-01: `@graph` entry with `@id` containing `room_10` has `name` === `"Mixed Ensuite Dorm"`
  - TC-02: `@graph` entry with `@id` containing `room_11` has `name` === `"Female Dorm – Large Sea Terrace"`
  - TC-03: `@graph` entry for `double_room` has `name` === `"Double Room"` (unchanged)
- **Execution plan:**
  - Red: 9 stale `name` fields with old tier labels
  - Green: update each `name` field in the `@graph` array per mapping table
  - Refactor: None
- **Planning validation:** None: S effort
- **Scouts:** None: `public/schema/` confirmed to be auto-generated at postbuild — no separate edit needed
- **Edge Cases & Hardening:** None: build script copies src → public at postbuild
- **What would make this >=90%:** Already at 97%
- **Rollout / rollback:**
  - Rollout: Normal release; postbuild regenerates public copy automatically
  - Rollback: Revert commit
- **Documentation impact:** None
- **Notes / references:** `apps/brikette/package.json` postbuild: `scripts/generate-public-seo.ts` copies `src/schema/hostel-brikette/*.jsonld` → `public/schema/hostel-brikette/`

---

### TASK-04: Update pages.rooms.json room_12 hero eyebrow
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/brikette/src/locales/en/pages.rooms.json`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/brikette/src/locales/en/pages.rooms.json`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 97%
  - Implementation: 99% — single string, known path and value
  - Approach: 97% — direct JSON edit
  - Impact: 97% — room_12 detail page hero eyebrow label
- **Acceptance:**
  - `detail.room_12.hero.eyebrow` === `"Mixed Dorm – Sea Terrace • Terrace"`
  - No other fields in the file changed.
  - JSON valid.
- **Validation contract:**
  - TC-01: `detail.room_12.hero.eyebrow` === `"Mixed Dorm – Sea Terrace • Terrace"`
  - TC-02: All other keys in file unchanged
- **Execution plan:**
  - Red: `"Superior Mixed Dorm • Terrace"` (old tier label prefix)
  - Green: Update to `"Mixed Dorm – Sea Terrace • Terrace"`
  - Refactor: None
- **Planning validation:** None: S effort
- **Scouts:** None
- **Edge Cases & Hardening:** None: isolated string replacement
- **What would make this >=90%:** Already at 97%
- **Rollout / rollback:**
  - Rollout: Normal release
  - Rollback: Revert commit
- **Documentation impact:** None
- **Notes / references:** Non-EN locale `pages.rooms.json` files (de, es, fr, it, others) contain translated versions of "Superior Mixed Dorm" in their own eyebrow strings — those are deferred to brik-locale-propagation

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: roomNames.ts | Yes | None | No |
| TASK-02: roomsPage.json EN | Yes | None | No |
| TASK-03: rooms.jsonld | Yes | None | No |
| TASK-04: pages.rooms.json | Yes | None | No |

No critical findings. All tasks are independent string replacements. No type contracts, no API signatures, no ordering dependencies.
