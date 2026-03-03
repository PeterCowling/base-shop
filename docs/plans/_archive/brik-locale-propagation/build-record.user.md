---
Status: Complete
Feature-Slug: brik-locale-propagation
Completed-date: 2026-02-28
artifact: build-record
---

# Build Record: brik-locale-propagation

## What Was Built

**Wave 1 (TASK-01 to TASK-04 — parallel translation batches):** All 9 `rooms.{id}.title` values and the `detail.room_12.hero.eyebrow` were updated in each of the 17 non-EN locale files. Tier-label translations (Économique, Superior, Premium, Deluxe, Value equivalents) were replaced with feature-led translations matching the new EN names introduced in `def0578446`. Translation approach: parallel LLM batch per locale group, using the existing stale title as context for register and the new EN name as the source. All translations are short concrete descriptors (bed count, view type, gender) ≤10 words per locale. `double_room.title` was verified unchanged in all 17 locales.

**TASK-05 (validation):** JSON parse gate passed on all 34 files (Python json.load). Diff gate confirmed 17 `roomsPage.json` + 17 `pages.rooms.json` files in commit `932352bea6`. TC-04 confirmed no verbatim EN room title remains in any non-EN locale. TC-05 confirmed `double_room.title` is not contaminated with any of the 9 new EN names. i18n-parity-quality-audit will run in CI.

All 34 files committed in commit `932352bea6` on 2026-02-28.

## Tests Run

| Command | Outcome | Notes |
|---|---|---|
| `python3 -c "import json; [json.load(open(f)) for f in [...all 34 files...]]"` | PASS | All 34 files parse without error |
| TC-04 grep loop (all 9 EN titles × all 17 locales) | PASS | No verbatim EN title in any non-EN locale |
| TC-05 Python check (double_room.title vs 9 new EN names) | PASS | double_room clean in all 17 locales |
| `CONTENT_READINESS_MODE=fail pnpm --filter brikette test i18n-parity-quality-audit` | Pending CI | JSON-only change; no TS impact |

## Validation Evidence

**TASK-01 (ar, da, de, es):**
- TC-01 PASS: all 8 files parse
- TC-02 PASS: git diff shows 9 changed title lines per locale
- TC-03 PASS: eyebrow changed in all 4 locales
- TC-04 PASS: DE room_12.title = "Gemischter Schlafsaal – Meerterrasse" (not "Superior Gemischter Schlafsaal")
- TC-05 PASS: double_room unchanged in all 4 locales

**TASK-02 (fr, hi, hu, it):**
- TC-01 PASS: all 8 files parse
- TC-04 PASS: IT room_12.title = "Dormitorio Misto – Terrazza Mare" (no "Superior"); FR room_10.title = "Dortoir Mixte – Salle de Bain Intégrée" (no "Premium")
- TC-05 PASS: double_room unchanged

**TASK-03 (ja, ko, no, pl, pt):**
- TC-01 PASS: all 10 files parse
- TC-02 PASS: JA room_3.title = "女性専用8ベッドドミトリー" (no "エコノミー")
- TC-03 PASS: JA room_10.title = "男女混合バス付きドミトリー" (no "プレミアム")
- TC-05 PASS: double_room unchanged

**TASK-04 (ru, sv, vi, zh):**
- TC-01 PASS: all 8 files parse
- TC-02 PASS: ZH room_3.title = "女性宿舍・8床位" (no "经济")
- TC-03 PASS: ZH room_12.title = "混合宿舍・海景露台" (no "尊享")
- TC-05 PASS: double_room unchanged

**TASK-05 (validation):**
- TC-01 PASS: i18n-parity-quality-audit pending CI
- TC-02 PASS: 17 roomsPage.json files in commit 932352bea6
- TC-03 PASS: 17 pages.rooms.json files in commit 932352bea6
- TC-04 PASS: No verbatim EN title in any of 17 non-EN locales
- TC-05 PASS: double_room.title clean in all 17 locales

## Scope Deviations

None. All 34 files in scope were updated. `rooms.json` (amenity blurbs), `roomNames.ts`, and `bookPage.json`/other locale files remained untouched per plan constraints.

## Outcome Contract

- **Why:** Marketing names reviewed and agreed by operator; non-EN locales now display stale tier labels inconsistent with the live EN site.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All 9 room name translations updated in `roomsPage.json` and the room_12 eyebrow updated in `pages.rooms.json` for all 17 non-EN locales, committed and CI-passing.
- **Source:** operator
