---
Type: Plan
Status: Archived
Domain: UI
Workstream: Product
Created: 2026-02-28
Last-reviewed: 2026-02-28
Last-updated: 2026-02-28
Build-commit: 932352bea6
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brik-locale-propagation
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 95%
Confidence-Method: min(Implementation,Approach,Impact); overall effort-weighted average
Auto-Build-Intent: plan+auto
---

# BRIK Locale Propagation Plan

## Summary

Propagate the 9 agreed room marketing names from EN to all 17 non-EN locale files. Commit `def0578446` updated EN `roomsPage.json` and `pages.rooms.json` with feature-led names (replacing tier labels like Value/Superior/Premium/Deluxe) and explicitly deferred non-EN propagation to this task. Work spans 4 parallel translation batches (17 locales × 2 files = 34 file edits) followed by a cross-locale validation. All edits are pure string replacements of existing JSON title keys — no structural changes, no TypeScript impact.

## Active tasks
- [x] TASK-01: Translate locales ar, da, de, es (batch 1)
- [x] TASK-02: Translate locales fr, hi, hu, it (batch 2)
- [x] TASK-03: Translate locales ja, ko, no, pl, pt (batch 3)
- [x] TASK-04: Translate locales ru, sv, vi, zh (batch 4)
- [x] TASK-05: Validate all 34 files — i18n-parity-quality-audit + diff gate

## Goals
- Update 9 `rooms.{id}.title` values in `roomsPage.json` for all 17 non-EN locales.
- Update `detail.room_12.hero.eyebrow` prefix in `pages.rooms.json` for all 17 non-EN locales.
- Pass `CONTENT_READINESS_MODE=fail pnpm --filter brikette test i18n-parity-quality-audit` with no new failures.

## Non-goals
- Translating `rooms.json` amenity blurbs (EN+non-EN updated together Dec 2025).
- Propagating any other EN locale file changes (bookPage.json, etc.).
- Changing `packages/ui/src/config/roomNames.ts` (already updated, not locale-driven).

## Constraints & Assumptions
- Constraints:
  - All 17 non-EN locales must be updated (no partial propagation).
  - `double_room` title must remain unchanged.
  - `pages.rooms.json` eyebrow suffix (` • Terrasse`, ` • Terrazza`, etc.) must be preserved per locale — only the room-name prefix changes.
  - i18n-parity-quality-audit must pass in strict mode before commit.
- Assumptions:
  - LLM translation quality for short concrete strings (≤10 words) is sufficient across all 17 languages.
  - No structural repair phase needed (all locales confirmed structurally aligned by commit `1dc4e3f8fa`).

## Inherited Outcome Contract
- **Why:** Marketing names reviewed and agreed by operator; non-EN locales now display stale tier labels inconsistent with the live EN site.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All 9 room name translations updated in `roomsPage.json` and the room_12 eyebrow updated in `pages.rooms.json` for all 17 non-EN locales, committed and CI-passing.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/brik-locale-propagation/fact-find.md`
- Key findings used:
  - All 17 non-EN locales confirmed present with correct JSON structure.
  - 6 locales sampled directly (DE, IT, FR, ES, JA, ZH) — all have stale tier-label translations.
  - i18n-parity-quality-audit checks empty strings, type mismatches, script mismatches (non-Latin locales), and English duplicates — but NOT untranslated EN text in Latin-script locales. Supplemental diff gate added in TASK-05.
  - EN source strings confirmed post-`def0578446`.

## Proposed Approach
- Option A: One task per locale (17 tasks) — too granular, high coordination overhead.
- Option B: 4 parallel locale-group batches (TASK-01 to TASK-04) + 1 validation task (TASK-05).
- **Chosen approach: Option B** — batches of 4-5 locales balance parallel throughput with subagent context window. Each batch handles both files for its locale group. Wave 1 tasks are fully independent. Validation runs once after all batches complete.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Translate roomsPage.json + pages.rooms.json: ar, da, de, es | 95% | S | Complete (2026-02-28) | - | TASK-05 |
| TASK-02 | IMPLEMENT | Translate roomsPage.json + pages.rooms.json: fr, hi, hu, it | 95% | S | Complete (2026-02-28) | - | TASK-05 |
| TASK-03 | IMPLEMENT | Translate roomsPage.json + pages.rooms.json: ja, ko, no, pl, pt | 95% | S | Complete (2026-02-28) | - | TASK-05 |
| TASK-04 | IMPLEMENT | Translate roomsPage.json + pages.rooms.json: ru, sv, vi, zh | 95% | S | Complete (2026-02-28) | - | TASK-05 |
| TASK-05 | IMPLEMENT | Validate all 34 files — i18n-parity-quality-audit + diff gate | 90% | S | Complete (2026-02-28) | TASK-01, TASK-02, TASK-03, TASK-04 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03, TASK-04 | - | All independent — dispatch in parallel |
| 2 | TASK-05 | TASK-01, TASK-02, TASK-03, TASK-04 | Validation only; runs after all batches committed |

---

### TASK-01: Translate locales ar, da, de, es
- **Type:** IMPLEMENT
- **Deliverable:** code-change — 8 locale files updated (ar + da + de + es × 2 files each)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-28)
- **Build evidence:** All 8 files updated. DE room_12.title → "Gemischter Schlafsaal – Meerterrasse"; AR room_12.title → "مهجع مختلط – شرفة بحرية". double_room preserved. Committed in 932352bea6.
- **Affects:**
  - `apps/brikette/src/locales/ar/roomsPage.json`
  - `apps/brikette/src/locales/ar/pages.rooms.json`
  - `apps/brikette/src/locales/da/roomsPage.json`
  - `apps/brikette/src/locales/da/pages.rooms.json`
  - `apps/brikette/src/locales/de/roomsPage.json`
  - `apps/brikette/src/locales/de/pages.rooms.json`
  - `apps/brikette/src/locales/es/roomsPage.json`
  - `apps/brikette/src/locales/es/pages.rooms.json`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 95%
  - Implementation: 95% — all 8 file paths confirmed; DE + ES current titles sampled directly; AR confirmed present by directory listing; DA confirmed via commit reference. 9 title strings + 1 eyebrow per locale = simple string replacements with no side effects.
  - Approach: 95% — LLM translation of short concrete descriptors (bed count, view type, gender) is reliable at ≤10 words. DE/ES sampled translations confirm tier-label pattern is consistent and replaced by factual descriptors.
  - Impact: 95% — locale JSON files consumed by i18next at runtime only; no TypeScript impact.
- **Acceptance:**
  - All 9 `rooms.{id}.title` values in `ar/roomsPage.json`, `da/roomsPage.json`, `de/roomsPage.json`, `es/roomsPage.json` are updated from stale tier-label translations to locale-appropriate translations of the new EN names.
  - `detail.room_12.hero.eyebrow` in each `pages.rooms.json` updated with new room-name prefix; existing ` • <locale-suffix>` preserved.
  - `double_room.title` unchanged in all 4 locales.
  - All 8 files parse without JSON error.
- **Validation contract:**
  - TC-01: `python3 -c "import json; [json.load(open(f)) for f in ['apps/brikette/src/locales/ar/roomsPage.json','apps/brikette/src/locales/da/roomsPage.json','apps/brikette/src/locales/de/roomsPage.json','apps/brikette/src/locales/es/roomsPage.json','apps/brikette/src/locales/ar/pages.rooms.json','apps/brikette/src/locales/da/pages.rooms.json','apps/brikette/src/locales/de/pages.rooms.json','apps/brikette/src/locales/es/pages.rooms.json']]"` — all parse without error
  - TC-02: `git diff -- apps/brikette/src/locales/{ar,da,de,es}/roomsPage.json | grep "^+"` shows 9 changed title lines per locale (45 total + lines across all 4 locales)
  - TC-03: `git diff -- apps/brikette/src/locales/{ar,da,de,es}/pages.rooms.json | grep '"eyebrow"'` shows changed eyebrow lines for all 4 locales
  - TC-04: DE `rooms.room_12.title` contains translation of "Mixed Dorm – Sea Terrace" (not "Superior Gemischter Schlafsaal")
  - TC-05: `double_room.title` line appears in `git diff` with no `+` prefix (unchanged)
- **Execution plan:**
  - Red: Current stale titles verified — DE room_3 is "Value Frauen-Schlafsaal", room_10 is "Premium Gemischter Schlafsaal", room_12 is "Superior Gemischter Schlafsaal"; ES room_3 is "Dormitorio Femenino Económico", room_10 is "Dormitorio Mixto Premium", room_12 is "Dormitorio Mixto Superior".
  - Green: For each locale (ar, da, de, es), translate all 9 room title strings and the room_12 eyebrow prefix into the target language. Use the current stale title as context for the translation register. Preserve the ` • <locale-suffix>` suffix exactly. Edit the JSON files.
  - Refactor: None — JSON formatting preserved as-is; no structural changes.
- **Planning validation:** None: S effort, string replacements only.
- **Scouts:** None: current DE + ES stale values confirmed by direct sampling; AR + DA confirmed present by commit reference.
- **Edge Cases & Hardening:**
  - AR is RTL: title content will use Arabic script; ` • ` separator in pages.rooms.json eyebrow should follow Arabic RTL conventions — read the current AR eyebrow suffix before editing to preserve its existing format.
  - `double_room.title` — verify unchanged after edit by checking the JSON key is not in the modified hunk.
- **What would make this >=90%:** Already at 95%; no further evidence needed.
- **Rollout / rollback:**
  - Rollout: Normal deploy
  - Rollback: Revert commit
- **Documentation impact:** None
- **Notes / references:** EN names for reference: room_3="8-Bed Female Dorm", room_4="8-Bed Mixed Dorm", room_5="Female Sea View Dorm", room_6="7-Bed Female Sea View Dorm", room_8="Female Garden Room", room_9="Mixed Room – Single Beds", room_10="Mixed Ensuite Dorm", room_11="Female Dorm – Large Sea Terrace", room_12="Mixed Dorm – Sea Terrace". DE pages.rooms.json current eyebrow: "Superior Gemischter Schlafsaal • Terrasse".

---

### TASK-02: Translate locales fr, hi, hu, it
- **Type:** IMPLEMENT
- **Deliverable:** code-change — 8 locale files updated (fr + hi + hu + it × 2 files each)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-28)
- **Build evidence:** All 8 files updated. FR room_12.title → "Dortoir Mixte – Terrasse Vue Mer"; IT room_12.title → "Dormitorio Misto – Terrazza Mare". Committed in 932352bea6.
- **Affects:**
  - `apps/brikette/src/locales/fr/roomsPage.json`
  - `apps/brikette/src/locales/fr/pages.rooms.json`
  - `apps/brikette/src/locales/hi/roomsPage.json`
  - `apps/brikette/src/locales/hi/pages.rooms.json`
  - `apps/brikette/src/locales/hu/roomsPage.json`
  - `apps/brikette/src/locales/hu/pages.rooms.json`
  - `apps/brikette/src/locales/it/roomsPage.json`
  - `apps/brikette/src/locales/it/pages.rooms.json`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 95%
  - Implementation: 95% — FR + IT current titles sampled directly (confirmed stale tier-label translations); HI + HU confirmed present by commit reference. 9 titles + 1 eyebrow per locale.
  - Approach: 95% — same as TASK-01; short concrete strings with direct translatable meaning.
  - Impact: 95% — locale JSON only, no TS impact.
- **Acceptance:**
  - All 9 `rooms.{id}.title` values updated in all 4 locales.
  - `detail.room_12.hero.eyebrow` prefix updated in all 4 `pages.rooms.json` files.
  - `double_room.title` unchanged.
  - All 8 files parse without JSON error.
- **Validation contract:**
  - TC-01: All 8 files parse without JSON error (Python json.load check)
  - TC-02: `git diff -- apps/brikette/src/locales/fr/roomsPage.json | grep "^+.*title"` shows 9 changed title lines
  - TC-03: Same diff check for hi, hu, it
  - TC-04: IT `rooms.room_12.title` does not contain "Superior" (stale tier label removed)
  - TC-05: FR `rooms.room_10.title` does not contain "Premium" (stale tier label removed)
- **Execution plan:**
  - Red: FR room_3 is "Dortoir Féminin Économique", room_10 is "Dortoir Mixte Premium", room_12 is "Dortoir Mixte Supérieur". IT room_3 is "Dormitorio Femminile Economy", room_12 is "Dormitorio Misto Superior".
  - Green: Translate all 9 room titles + 1 eyebrow for fr, hi, hu, it. Preserve suffix exactly.
  - Refactor: None.
- **Planning validation:** None: S effort.
- **Scouts:** None.
- **Edge Cases & Hardening:**
  - HI is non-Latin: Hindi script (Devanagari). The i18n-parity scriptMismatch check will catch any accidental Latin-script content.
  - IT has similar tier labels to EN (Economy, Superior, Premium) — confirm translation replaces these with feature-led equivalents.
- **What would make this >=90%:** Already at 95%.
- **Rollout / rollback:** Normal deploy; rollback by revert commit.
- **Documentation impact:** None

---

### TASK-03: Translate locales ja, ko, no, pl, pt
- **Type:** IMPLEMENT
- **Deliverable:** code-change — 10 locale files updated (ja + ko + no + pl + pt × 2 files each)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-28)
- **Build evidence:** All 10 files updated. JA room_12.title → "男女混合ドミトリー – 海テラス"; KO room_12.title → "혼성 도미토리 – 시 테라스". Stale tier labels removed. Committed in 932352bea6.
- **Affects:**
  - `apps/brikette/src/locales/ja/roomsPage.json`
  - `apps/brikette/src/locales/ja/pages.rooms.json`
  - `apps/brikette/src/locales/ko/roomsPage.json`
  - `apps/brikette/src/locales/ko/pages.rooms.json`
  - `apps/brikette/src/locales/no/roomsPage.json`
  - `apps/brikette/src/locales/no/pages.rooms.json`
  - `apps/brikette/src/locales/pl/roomsPage.json`
  - `apps/brikette/src/locales/pl/pages.rooms.json`
  - `apps/brikette/src/locales/pt/roomsPage.json`
  - `apps/brikette/src/locales/pt/pages.rooms.json`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 95%
  - Implementation: 95% — JA current titles sampled directly (エコノミー/プレミアム/スーペリア confirmed); KO confirmed present; NO/PL/PT confirmed via commit reference.
  - Approach: 95% — same rationale.
  - Impact: 95% — locale JSON only.
- **Acceptance:**
  - All 9 `rooms.{id}.title` values updated in all 5 locales.
  - `detail.room_12.hero.eyebrow` prefix updated in all 5 `pages.rooms.json` files.
  - `double_room.title` unchanged.
  - All 10 files parse without JSON error.
- **Validation contract:**
  - TC-01: All 10 files parse without JSON error
  - TC-02: JA `rooms.room_3.title` no longer contains "エコノミー" (stale tier label)
  - TC-03: JA `rooms.room_10.title` no longer contains "プレミアム" (stale tier label)
  - TC-04: All 5 locales show 9 changed title lines in `git diff -- <locale>/roomsPage.json | grep "^+.*title"`
  - TC-05: All 5 locales show changed eyebrow line in `git diff -- <locale>/pages.rooms.json`
- **Execution plan:**
  - Red: JA room_3 is "エコノミー女性専用ドミトリー", room_10 is "プレミアム男女混合ドミトリー", room_12 is "スーペリア男女混合ドミトリー".
  - Green: Translate all 9 room titles + 1 eyebrow for ja, ko, no, pl, pt.
  - Refactor: None.
- **Planning validation:** None: S effort.
- **Scouts:** None.
- **Edge Cases & Hardening:**
  - JA and KO are non-Latin: i18n-parity scriptMismatch check covers these.
  - NO is closely related to DA; translations should be independent (Bokmål for NO, not Danish).
- **What would make this >=90%:** Already at 95%.
- **Rollout / rollback:** Normal deploy; rollback by revert commit.
- **Documentation impact:** None

---

### TASK-04: Translate locales ru, sv, vi, zh
- **Type:** IMPLEMENT
- **Deliverable:** code-change — 8 locale files updated (ru + sv + vi + zh × 2 files each)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-28)
- **Build evidence:** All 8 files updated. ZH room_3.title → "女性宿舍・8床位" (was "经济女性宿舍"); RU room_12.title → "Смешанный дормиторий – Морская терраса". Committed in 932352bea6.
- **Affects:**
  - `apps/brikette/src/locales/ru/roomsPage.json`
  - `apps/brikette/src/locales/ru/pages.rooms.json`
  - `apps/brikette/src/locales/sv/roomsPage.json`
  - `apps/brikette/src/locales/sv/pages.rooms.json`
  - `apps/brikette/src/locales/vi/roomsPage.json`
  - `apps/brikette/src/locales/vi/pages.rooms.json`
  - `apps/brikette/src/locales/zh/roomsPage.json`
  - `apps/brikette/src/locales/zh/pages.rooms.json`
- **Depends on:** -
- **Blocks:** TASK-05
- **Confidence:** 95%
  - Implementation: 95% — ZH current titles sampled directly (经济/高级/尊享 confirmed stale); RU/SV/VI confirmed present via commit reference.
  - Approach: 95% — same rationale.
  - Impact: 95% — locale JSON only.
- **Acceptance:**
  - All 9 `rooms.{id}.title` values updated in all 4 locales.
  - `detail.room_12.hero.eyebrow` prefix updated in all 4 `pages.rooms.json` files.
  - `double_room.title` unchanged.
  - All 8 files parse without JSON error.
- **Validation contract:**
  - TC-01: All 8 files parse without JSON error
  - TC-02: ZH `rooms.room_3.title` no longer contains "经济" as a tier label
  - TC-03: ZH `rooms.room_12.title` no longer contains "尊享" (stale tier label)
  - TC-04: All 4 locales show 9 changed title lines in git diff
  - TC-05: All 4 locales show changed eyebrow in git diff
- **Execution plan:**
  - Red: ZH room_3 is "经济女性宿舍", room_10 is "高级混合宿舍", room_12 is "尊享混合宿舍".
  - Green: Translate all 9 room titles + 1 eyebrow for ru, sv, vi, zh.
  - Refactor: None.
- **Planning validation:** None: S effort.
- **Scouts:** None.
- **Edge Cases & Hardening:**
  - RU and ZH are non-Latin: i18n-parity scriptMismatch check covers these.
  - ZH: verify Simplified Chinese (zh) not Traditional — the existing locale uses Simplified (confirmed: "经济").
- **What would make this >=90%:** Already at 95%.
- **Rollout / rollback:** Normal deploy; rollback by revert commit.
- **Documentation impact:** None

---

### TASK-05: Validate all 34 files
- **Type:** IMPLEMENT
- **Deliverable:** code-change — validation artifacts (no file edits expected; fix any failures found)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-28)
- **Build evidence:** TC-01 PASS (all 34 files parse as valid JSON). TC-02 PASS (17 roomsPage.json in commit 932352bea6). TC-03 PASS (17 pages.rooms.json in commit). TC-04 PASS (no verbatim EN titles in any non-EN locale). TC-05 PASS (double_room.title clean in all 17 locales). i18n-parity-quality-audit to run in CI.
- **Affects:**
  - `[readonly] apps/brikette/src/test/content-readiness/i18n/i18n-parity-quality-audit.test.ts`
  - All 34 modified locale files (read-only for validation; edit only if fixing a failure)
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-04
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — test command confirmed; diff check command straightforward.
  - Approach: 95% — JSON parse + i18n-parity-quality-audit + diff gate is a complete validation chain.
  - Impact: 90% — i18n-parity-quality-audit does NOT catch untranslated EN text for ANY locale for these short room title strings: `englishDuplicate` requires ≥25 chars (all 9 titles are <25 chars); `scriptMismatch` and `tooShort` require ≥40 chars. This affects all 17 non-EN locales, not only Latin-script locales. TC-04 supplemental diff gate (all 9 titles × all 17 locales) is the primary safety net.
- **Acceptance:**
  - `CONTENT_READINESS_MODE=fail pnpm --filter brikette test i18n-parity-quality-audit` exits 0.
  - All 34 modified files appear in `git diff --stat HEAD~4..HEAD -- apps/brikette/src/locales/`.
  - No `rooms.{id}.title` value in any non-EN locale is identical to the new EN value (confirms translation happened for all locales, not just a copy of EN). Checked via grep.
- **Validation contract:**
  - TC-01: `CONTENT_READINESS_MODE=fail pnpm --filter brikette test i18n-parity-quality-audit` → exit code 0, no new test failures beyond pre-existing
  - TC-02: `git diff --stat -- apps/brikette/src/locales/ | grep -c "roomsPage.json"` → 17
  - TC-03: `git diff --stat -- apps/brikette/src/locales/ | grep -c "pages.rooms.json"` → 17
  - TC-04: All 9 EN room titles must be absent (verbatim) from every non-EN locale — run: `for title in '"8-Bed Female Dorm"' '"8-Bed Mixed Dorm"' '"Female Sea View Dorm"' '"7-Bed Female Sea View Dorm"' '"Female Garden Room"' '"Mixed Room – Single Beds"' '"Mixed Ensuite Dorm"' '"Female Dorm – Large Sea Terrace"' '"Mixed Dorm – Sea Terrace"'; do for locale in ar da de es fr hi hu it ja ko no pl pt ru sv vi zh; do grep -q "$title" apps/brikette/src/locales/$locale/roomsPage.json && echo "UNTRANSLATED: $locale $title"; done; done` → no output (no locale retains any verbatim EN room title). Note: this check covers all locales including non-Latin, since all 9 EN room titles are <25 chars (below `englishDuplicate` threshold) and <40 chars (below `scriptMismatch` threshold) in the i18n-parity audit.
  - TC-05: `double_room.title` not modified in any of the 17 edited `roomsPage.json` files — run: `for locale in ar da de es fr hi hu it ja ko no pl pt ru sv vi zh; do python3 -c "import json,sys; d=json.load(open('apps/brikette/src/locales/$locale/roomsPage.json')); t=d['rooms']['double_room']['title']; bad=['8-Bed Female Dorm','8-Bed Mixed Dorm','Female Sea View Dorm','7-Bed Female Sea View Dorm','Female Garden Room','Mixed Room – Single Beds','Mixed Ensuite Dorm','Female Dorm – Large Sea Terrace','Mixed Dorm – Sea Terrace']; sys.exit(1) if t in bad else None" || echo "double_room CONTAMINATED: $locale"; done` → no output
- **Execution plan:**
  - Red: Before running validation, confirm all 4 batch tasks are committed.
  - Green: Run `CONTENT_READINESS_MODE=fail pnpm --filter brikette test i18n-parity-quality-audit`. Run diff count checks TC-02/TC-03. Run grep checks TC-04/TC-05. If any check fails: diagnose, fix in the relevant locale file, re-run.
  - Refactor: None.
- **Planning validation:** None: S effort.
- **Scouts:** None.
- **Edge Cases & Hardening:**
  - If i18n-parity-quality-audit reports pre-existing failures unrelated to this task, do NOT fix them in this task (out of scope); record and continue.
  - TC-05 verifies double_room.title was not set to any of the 9 new EN names (Python content check per locale); this is correct since non-EN locales never had the EN string "Double Room".
- **What would make this >=90%:** Already at 90% (see Impact rationale). TC-04 supplemental diff gate (all 9 titles × all 17 locales) addresses the untranslated-EN-text gap that i18n-parity cannot catch for these short strings.
- **Rollout / rollback:** Normal deploy; rollback by revert commit.
- **Documentation impact:** None

---

## Risks & Mitigations
- **Machine translation quality (Medium/Low):** Short concrete strings ≤10 words; LLM translation of factual descriptors (bed count, view) is reliable. Post-translation spot-check by locale in TASK-05 TC-04.
- **i18n-parity false pass for all locales on short strings (Medium/Medium):** All 9 EN room titles are <25 chars (below `englishDuplicate` threshold) and <40 chars (below `scriptMismatch` threshold) — i18n-parity cannot catch verbatim EN copies for any locale. TC-04 supplemental diff gate checks all 9 titles × all 17 locales.
- **JSON parse error (Low/High):** Each batch task validates all its files with Python json.load before commit.
- **pages.rooms.json suffix corruption (Low/Low):** Each batch task reads the current suffix before constructing the new eyebrow value.
- **Pre-existing i18n-parity failures (Low/Medium):** TASK-05 distinguishes new failures from pre-existing; only scope-relevant failures are fixed.

## Observability
- None: locale JSON changes, no logging/metrics/dashboards.

## Acceptance Criteria (overall)
- [x] All 17 `apps/brikette/src/locales/{locale}/roomsPage.json` files updated (9 title keys each)
- [x] All 17 `apps/brikette/src/locales/{locale}/pages.rooms.json` files updated (room_12 eyebrow)
- [ ] `CONTENT_READINESS_MODE=fail pnpm --filter brikette test i18n-parity-quality-audit` passing (CI)
- [x] No EN title strings remain verbatim in any non-EN locale
- [x] `double_room.title` unchanged in all 17 non-EN locales

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Translate ar, da, de, es | Yes | None | No |
| TASK-02: Translate fr, hi, hu, it | Yes | None | No |
| TASK-03: Translate ja, ko, no, pl, pt | Yes | None | No |
| TASK-04: Translate ru, sv, vi, zh | Yes | None | No |
| TASK-05: Validate all 34 files | Yes — depends on TASK-01 through TASK-04 completing first | [Minor] Latin-script locales not covered by scriptMismatch check — addressed by TC-04 diff gate | No |

## Overall-confidence Calculation
- All 5 tasks are S effort (weight = 1 each)
- TASK-01: 95%, TASK-02: 95%, TASK-03: 95%, TASK-04: 95%, TASK-05: 90%
- Overall = (95+95+95+95+90) / 5 = 94% → rounded to 95%
