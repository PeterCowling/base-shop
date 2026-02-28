# TASK-02: Prime App Locale Audit — en/it Content Completeness

**Date**: 2026-02-27
**Scope**: All 11 i18n namespaces under `apps/prime/public/locales/`
**Task**: Assess readiness of locale files before planning TASK-04 (content completion)

---

## Summary

The locale files are in a **remarkably healthy state**. All 11 namespaces exist in both `en` and `it`. Key-count parity is 100% across the board. Only 2 individual strings remain as `[IT]` placeholder stubs in the Italian files. The one structural gap is `rooms.json`, which is intentionally empty in both languages — room names/details are served via hard-coded English fallbacks in `roomUtils.ts`, and the JSON file exists as an integration point stub.

---

## Per-Namespace Analysis

### 1. Activities

| | en | it |
|---|---|---|
| Leaf key count | 28 | 28 |
| Parity | MATCH | |
| Stubs | none | none |

Sample en: `actions.backHome` → `"← Back to home"`, `time.inDays_one` → `"in {{count}} day"` (pluralised)

**Assessment**: Complete and production-ready in both languages.

---

### 2. BookingDetails

| | en | it |
|---|---|---|
| Leaf key count | 30 | 30 |
| Parity | MATCH | |
| Stubs | none | none |

Sample en: `dates.checkIn` → `"Check-in"`, `extension.title` → `"Request Extension"`

**Assessment**: Complete and production-ready in both languages.

---

### 3. Chat

| | en | it |
|---|---|---|
| Leaf key count | 28 | 28 |
| Parity | MATCH | |
| Stubs | none | **1 stub** |

**IT stub**: `sendFailed` → `"[IT] Send Failed"` (EN: `"Send Failed"`)

**Assessment**: One trivial untranslated placeholder. All structure complete.

---

### 4. FindMyStay

| | en | it |
|---|---|---|
| Leaf key count | 16 | 16 |
| Parity | MATCH | |
| Stubs | none | none |

Sample en: `title` → `"Find My Stay"`, `errors.notFound` → `"We couldn't find a booking with those details…"`

**Assessment**: Complete and production-ready in both languages.

---

### 5. Homepage

| | en | it |
|---|---|---|
| Leaf key count | 69 | 69 |
| Parity | MATCH | |
| Stubs | none | none |

Sample en: `welcome.greeting` → `"Welcome, {{firstName}}!"`, `services.barMenu.title` → `"Bar Menu"`

**Assessment**: Complete and production-ready in both languages.

---

### 6. Onboarding

| | en | it |
|---|---|---|
| Leaf key count | 92 | 92 |
| Parity | MATCH | |
| Stubs | none | none |

Sample en: `guestProfile.title` → `"Tell us about yourself"`, `guidedFlow.step3.cashDescription` → `"City tax + keycard deposit in cash — avoids delays at reception"`

**Assessment**: Complete and production-ready in both languages.

---

### 7. PositanoGuide

| | en | it |
|---|---|---|
| Leaf key count | 34 | 34 |
| Parity | MATCH | |
| Stubs | none | none |

Sample en: `guides.pathOfTheGods.title` → `"Path of the Gods"`, `guides.cheapEats.tag` → `"Budget-friendly"`

**Assessment**: Complete and production-ready in both languages. All 8 guide cards covered.

---

### 8. PreArrival

| | en | it |
|---|---|---|
| Leaf key count | 201 | 201 |
| Parity | MATCH | |
| Stubs | none | **1 stub** |

**IT stub**: `lateCheckin.priorityNotice` → `"[IT] Priority Notice"` (EN: `"Priority Notice"`)

Largest namespace (201 leaf keys). Covers arrival page, cash prep, check-in QR, ETA confirmation, late check-in, main door access, routes, staff lookup, etc.

**Assessment**: One trivial untranslated placeholder. All structure complete.

---

### 9. Quests

| | en | it |
|---|---|---|
| Leaf key count | 10 | 10 |
| Parity | MATCH | |
| Stubs | none | none |

Sample en: `completion.title` → `"Congratulations!"`, `labels.lockedUntil` → `"Available in {{hours}} hours"`

**Assessment**: Complete and production-ready in both languages.

---

### 10. Settings

| | en | it |
|---|---|---|
| Leaf key count | 17 | 17 |
| Parity | MATCH | |
| Stubs | none | none |

Sample en: `language.title` → `"Language"`, `chat.optIn.label` → `"Guest chat"`

**Assessment**: Complete and production-ready in both languages.

---

### 11. rooms

| | en | it |
|---|---|---|
| Leaf key count | 0 | 0 |
| Parity | MATCH (both empty) | |
| Stubs | n/a | n/a |

**Context**: Both `en/rooms.json` and `it/rooms.json` are `{}`. Room names/details fall back to the hard-coded English map in `roomUtils.ts` via `t('rooms.{id}.name', { defaultValue: fallback.name })`. Room IDs 3–12 need `name` and `details` keys = 20 leaf keys per locale.

---

## Namespace-Manifest Test

**File**: `apps/prime/src/__tests__/namespace-manifest.test.ts`

**What it checks** (currently runs — not skipped):
- Every namespace referenced in `useTranslation(...)` calls exists in `NAMESPACE_GROUPS`
- Every namespace in `NAMESPACE_GROUPS` has at least one consumer

**What it does NOT check**: individual key existence or en/it parity.

**No `translations-completeness.test.ts` exists.** There is no automated test for key-level translation parity. TASK-07 should CREATE this test (not "enable" an existing one).

---

## Gap Summary

### Missing IT translations (2 total)

| Namespace | Key path | EN value | IT stub |
|---|---|---|---|
| `Chat` | `sendFailed` | `"Send Failed"` | `"[IT] Send Failed"` |
| `PreArrival` | `lateCheckin.priorityNotice` | `"Priority Notice"` | `"[IT] Priority Notice"` |

### Structural gap (rooms.json)

Both `en/rooms.json` and `it/rooms.json` are empty `{}`. Needs 20 keys per locale (10 rooms × name + details). English source text exists verbatim in `roomUtils.ts` ROOM_DETAILS_MAP.

---

## TASK-04 Scope Revision: **S (not M)**

Total remaining content work:
1. Fix 2 IT placeholder stubs — trivial (1 line each)
2. Populate `en/rooms.json` with 20 keys from `roomUtils.ts`
3. Populate `it/rooms.json` with Italian translations of those 20 keys

**Estimated effort: 2–4 hours.** No bulk translation required; Italian content is 99.6% complete.

## TASK-06 Scope Revision: **S (not M)**

Existing IT locale is essentially complete. TASK-06 scope = translate only the NEW en keys introduced by TASK-05's guest-surface migration. Volume depends on TASK-05 output but is bounded by the 93 guest-surface warning sites.

## TASK-07 Scope Clarification

The "translations-completeness test" does not exist. TASK-07 should CREATE a new Jest test that:
1. Asserts every EN key exists in IT (key-count parity per namespace)
2. Asserts no IT values contain `[IT]` stub prefix

This is still S effort.
