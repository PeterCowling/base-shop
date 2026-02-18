---
Type: Schema-Contract
Status: Active
Version: 1.0.0
Domain: Venture-Studio
Workstream: Mixed
Created: 2026-02-17
Last-updated: 2026-02-17
Owner: startup-loop maintainers
Source: docs/plans/startup-loop-marketing-sales-capability-gap-audit/fact-find.md
Related-capability: CAP-02 (docs/business-os/startup-loop/marketing-sales-capability-contract.md)
Related-plan: docs/plans/startup-loop-marketing-sales-capability-gap-audit/plan.md
---

# Demand Evidence Pack Schema

## Purpose

Defines the minimum evidence an operator must collect before treating message or channel confidence as above `low`. Required prior to GATE-S6B-ACT-01 (spend authorization). Enforced by `lp-channels` at activation time and referenced by `lp-readiness` for early capture guidance.

## When to Use

| Gate | Action |
|---|---|
| S1 / S1B | Begin DEP capture — register hypotheses, set up message variant log |
| Pre-S6B strategy design (GATE-S6B-STRAT-01) | DEP capture must be underway or completed |
| S6B spend authorization (GATE-S6B-ACT-01) | Full DEP pass-floor check required — blocks spend without pass |

## Schema Fields

| Field | Type | Required | Validation rule |
|---|---|---|---|
| `hypothesis_id` | string | **yes** | Stable ID linked to offer or channel hypothesis; must not change across capture windows |
| `capture_window` | date range | **yes** | `start` and `end` ISO timestamps both present |
| `message_variants` | list | **yes** | ≥2 variants per hypothesis; each has `channel`, `audience_slice`, `asset_ref`, `timestamp` |
| `denominators` | object | **yes** | Variant-level denominators present; one of: `impressions`, `conversations`, `visits`; value must be a positive integer |
| `intent_events` | list | **yes** | Each event has `event_type`, `source_tag`, `count`, `timestamp`; `source_tag` must be non-empty |
| `objection_log` | list | **yes** | Verbatim objection text + `frequency_count`; OR explicit `none_observed: true` with `sample_size` note |
| `speed_to_lead` | object | **yes** | `median_minutes_to_first_response` (integer) + `sample_size` (integer ≥1) |
| `operator_notes` | text | optional | Must distinguish measured signal from assumption if present |

## Pass Floor (Default)

A DEP record is **valid** only when ALL of the following are true:

1. ≥2 message variants tested per active hypothesis.
2. Every variant has a denominator (`impressions`, `conversations`, or `visits`) and a `source_tag`.
3. Objection log contains either ≥5 tagged objections with verbatim text, OR explicit `none_observed: true` with `sample_size` ≥5.
4. Speed-to-lead metric includes `sample_size` ≥1 and a timestamped `capture_window`.

A DEP record is **invalid** (failure reason must be explicit) when any of:
- `denominators` missing or empty for any variant → `FAIL: missing denominator for variant <variant_id>`
- `message_variants` count < 2 → `FAIL: fewer than 2 variants tested for hypothesis <hypothesis_id>`
- `source_tag` absent on any intent event → `FAIL: missing source_tag on intent event <event_type>`
- `objection_log` empty with no `none_observed` flag → `FAIL: objection log missing; required either ≥5 entries or none_observed: true`
- `speed_to_lead.sample_size` < 1 → `FAIL: speed_to_lead sample_size must be ≥1`

## Sample Records

### Record 1 — Valid (all fields pass)

```yaml
hypothesis_id: H-BRIK-CH-01
capture_window:
  start: "2026-02-10T00:00:00Z"
  end: "2026-02-17T00:00:00Z"
message_variants:
  - channel: instagram_stories
    audience_slice: couples_30_45_italy
    asset_ref: docs/business-os/strategy/BRIK/assets/story-v1.jpg
    timestamp: "2026-02-10T09:00:00Z"
  - channel: instagram_stories
    audience_slice: couples_30_45_italy
    asset_ref: docs/business-os/strategy/BRIK/assets/story-v2.jpg
    timestamp: "2026-02-12T09:00:00Z"
denominators:
  instagram_stories_v1:
    impressions: 412
  instagram_stories_v2:
    impressions: 398
intent_events:
  - event_type: link_click
    source_tag: utm_source=instagram&utm_medium=story&utm_campaign=brik-feb-test
    count: 23
    timestamp: "2026-02-17T00:00:00Z"
objection_log:
  - text: "Is it far from the village?"
    frequency_count: 4
  - text: "Too remote for a first visit"
    frequency_count: 3
  - text: "What's included in the price?"
    frequency_count: 6
  - text: "Can we bring children?"
    frequency_count: 5
  - text: "Do you have Wi-Fi?"
    frequency_count: 2
speed_to_lead:
  median_minutes_to_first_response: 18
  sample_size: 12
```

**Verdict: VALID** — 2 variants ✅, denominators present ✅, source_tag present ✅, 5 objections ✅, speed_to_lead sample ≥1 ✅

### Record 2 — Invalid (missing denominators)

```yaml
hypothesis_id: H-HEAD-CH-01
capture_window:
  start: "2026-02-10T00:00:00Z"
  end: "2026-02-17T00:00:00Z"
message_variants:
  - channel: google_search
    audience_slice: tech_buyers_25_40_uk
    asset_ref: docs/business-os/strategy/HEAD/assets/ad-copy-v1.txt
    timestamp: "2026-02-10T09:00:00Z"
  - channel: google_search
    audience_slice: tech_buyers_25_40_uk
    asset_ref: docs/business-os/strategy/HEAD/assets/ad-copy-v2.txt
    timestamp: "2026-02-12T09:00:00Z"
denominators: {}
```

**Verdict: INVALID**
- `FAIL: missing denominator for variant google_search_v1`
- `FAIL: missing denominator for variant google_search_v2`
- `FAIL: objection log missing; required either ≥5 entries or none_observed: true`
- `FAIL: speed_to_lead missing`

### Record 3 — Valid with `none_observed` objection log

```yaml
hypothesis_id: H-PET-CH-01
capture_window:
  start: "2026-02-14T00:00:00Z"
  end: "2026-02-17T00:00:00Z"
message_variants:
  - channel: tiktok
    audience_slice: pet_owners_18_35_uk
    asset_ref: docs/business-os/strategy/PET/assets/tiktok-v1.mp4
    timestamp: "2026-02-14T09:00:00Z"
  - channel: tiktok
    audience_slice: pet_owners_18_35_uk
    asset_ref: docs/business-os/strategy/PET/assets/tiktok-v2.mp4
    timestamp: "2026-02-15T09:00:00Z"
denominators:
  tiktok_v1:
    views: 1240
  tiktok_v2:
    views: 980
intent_events:
  - event_type: profile_click
    source_tag: tiktok_organic_pet_feb14
    count: 67
    timestamp: "2026-02-17T00:00:00Z"
objection_log:
  none_observed: true
  sample_size: 24
speed_to_lead:
  median_minutes_to_first_response: 0
  sample_size: 0
  note: "pre-launch; no leads received yet"
operator_notes: "Views from organic TikTok trial post; no paid spend. Speed-to-lead not applicable pre-launch."
```

**Verdict: VALID** — `none_observed: true` with `sample_size` ≥5 (24) ✅; speed_to_lead sample_size = 0 is borderline; operator_notes distinguish assumption from signal ✅. Note: speed_to_lead `sample_size: 0` is acceptable at S1B/pre-launch only when `operator_notes` explicitly flag pre-launch status. Pass with advisory flag.

## Source-Tag Fallback Policy

When a channel has no standard UTM tag (e.g., word-of-mouth, referral, offline event):
- Use the closest identifiable origin as `source_tag` (e.g., `referral_<referrer_id>`, `event_<event_name>`, `direct_unknown`)
- Annotate in `operator_notes`: "source_tag is approximate; channel does not support UTM natively"
- Record is still **valid** as long as `source_tag` is non-empty and the approximation is noted

Empty or null `source_tag` is always invalid regardless of channel type.

## Channel Viability Constraints (Pre-Scale)

For each selected channel in the channel plan, the following fields are required before GATE-S6B-ACT-01:

| Field | Required | Description |
|---|---|---|
| `minimum_viable_spend_or_timebox` | **yes** | Minimum spend (€/£/$) or timebox (days) to generate a testable result |
| `minimum_denominator_target` | **yes** | Minimum impressions/conversations/visits to reach before declaring the test valid |
| `quality_metric` | **yes** | One quality metric (e.g., CVR, response-rate, retention-week-1) — volume metrics alone not sufficient |
| `stop_condition` | **yes** | Specific observable state that triggers channel exit (e.g., "CPA > €80 after 200 clicks") |
| `owner` | **yes** | Named person responsible for monitoring and actioning the stop condition |
| `review_date` | **yes** | ISO date for the next decision review (max 7 days from spend activation for first test) |

## References

- Marketing/sales capability contract: `docs/business-os/startup-loop/marketing-sales-capability-contract.md` (CAP-02)
- Capability plan: `docs/plans/startup-loop-marketing-sales-capability-gap-audit/plan.md` (TASK-05)
- Consumer: `.claude/skills/lp-channels/SKILL.md` (GATE-S6B-ACT-01 enforcement)
- Consumer: `.claude/skills/lp-readiness/SKILL.md` (capture initiation advisory)
- Consumer: `docs/business-os/workflow-prompts/_templates/pre-website-measurement-bootstrap-prompt.md` (S1B demand signal section)
