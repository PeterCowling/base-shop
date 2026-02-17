---
Type: Startup-Intake-Packet
Status: Draft
Business: {{BUSINESS_CODE}}
Created: {{YYYY-MM-DD}}
Updated: {{YYYY-MM-DD}}
Last-reviewed: {{YYYY-MM-DD}}
Owner: {{OWNER}}
Source-Market-Intel:
Source-Forecast:
---

# {{BUSINESS_CODE}} Intake Packet

## A) Intake Summary

- Business idea: {{CORE_OFFER_DESCRIPTION}} (`observed | inferred`).
- Launch-surface mode: `pre-website | website-live` (`observed`).
- Channel intent: {{CHANNEL_INTENT}} (`observed | inferred`).
- Core uncertainty: {{CORE_UNCERTAINTY}} (`inferred`).

## B) Business and Product Packet

| Field | Value | Tag |
|---|---|---|
| Business code | {{BUSINESS_CODE}} | observed |
| Business name | {{BUSINESS_NAME}} | observed |
| Business name status | `confirmed` | observed |
| Region | {{REGION}} | observed |
| Target languages | {{TARGET_LANGUAGES}} | observed |
| Product 1 | {{PRODUCT_1}} | observed |
| Product 1 status | {{PRODUCT_1_STATUS}} | observed |
| Product 2 | {{PRODUCT_2_OR_NOT_LOCKED}} | observed |
| Product constraints | {{PRODUCT_CONSTRAINTS}} | inferred |

### Field notes — Business name status

- Vocabulary: `confirmed` or `unconfirmed`. Any other value or absent field is treated as `confirmed` (fail-open).
- `confirmed` (or absent): GATE-BD-00 is skipped. Business name is accepted as-is.
- `unconfirmed`: GATE-BD-00 triggers at the S0→S1 transition. The loop generates a deep-research naming prompt and blocks advance until a naming shortlist is returned.
- Parse error: treated as `confirmed` with a non-blocking warning emitted. Do not set to an invalid value.
- Reference: `docs/plans/startup-loop-business-naming/fact-find.md` § Gate BD-00 Decision Table.

### Field notes — Naming Prompt Seed Contract derivations

Three fields in the Naming Prompt Seed Contract (`revenue_model`, `price_positioning`, `key_differentiator`) are not explicit rows in this template but are derivable:

- `revenue_model` — derived from Product 1/2 type and Planned channels (e.g. DTC e-commerce, subscription, per-booking). The naming gate prompt generator infers this.
- `price_positioning` — derived from the 90-day target revenue and CAC figures in Section E. If explicit, add a row to Section B.
- `key_differentiator` — derived from Product constraints row and Intake Summary core uncertainty. If explicit, add a row to Section B.

Seed Contract reference: `docs/plans/startup-loop-business-naming/fact-find.md` § Naming Prompt Seed Contract.

### Field notes — Target languages

- Purpose: seeds the naming prompt with languages to check for negative/unintended meanings and pronunciation issues.
- If explicit: list as comma-separated strings (e.g. `Italian, English`).
- If absent or unknown: the naming prompt will derive best-effort languages from the `Region` field. For ambiguous regions, list explicitly.
- This field is optional. Leaving it blank does not block any gate.

## C) ICP and Channel Packet

| Field | Value | Tag |
|---|---|---|
| First-buyer ICP | {{PRIMARY_ICP}} | inferred |
| ICP context | {{PRIMARY_ICP_CONTEXT}} | inferred |
| ICP job-to-be-done | {{PRIMARY_ICP_JTBD}} | inferred |
| Secondary ICP | {{SECONDARY_ICP}} | inferred |
| Planned channels (initial) | {{PLANNED_CHANNELS}} | observed |
| Support expectation | {{SUPPORT_EXPECTATION}} | inferred |

## D) Constraints and Assumptions Register

| Item | Type | Evidence / note | Confidence |
|---|---|---|---|
| {{CONSTRAINT_1}} | observed | {{EVIDENCE_1}} | High |
| {{CONSTRAINT_2}} | inferred | {{EVIDENCE_2}} | Medium |

## E) Draft Outcome Contract

- Outcome statement: {{OUTCOME_STATEMENT}}
- Baseline:
  - paid orders: {{BASELINE_ORDERS}}
  - net revenue: {{BASELINE_REVENUE}}
  - blended CAC: {{BASELINE_CAC}}
  - return rate: {{BASELINE_RETURN_RATE}}
- Target (90 days):
  - net orders: {{TARGET_ORDERS}}
  - net revenue: {{TARGET_REVENUE}}
  - blended CAC: {{TARGET_CAC}}
  - return rate: {{TARGET_RETURN_RATE}}
- By: {{TARGET_DATE}}
- Owner: {{OWNER}}
- Leading indicators:
  - sessions by channel
  - CVR by channel
  - paid CAC and blended CAC
  - payment success rate
  - return reason distribution
- Stop / pivot guardrails: {{STOP_PIVOT_GUARDRAILS}}
- Decision link: `DEC-{{BUSINESS_CODE}}-01`

## F) Missing-Data Checklist (to progress S1/S3)

| Missing field | Why needed | Owner | Priority |
|---|---|---|---|
| {{MISSING_1}} | {{WHY_1}} | {{OWNER_1}} | critical |
| {{MISSING_2}} | {{WHY_2}} | {{OWNER_2}} | high |

## Priors (Machine)

Last updated: {{YYYY-MM-DD}} {{HH:MM}} UTC

```json
[
  {
    "id": "{{prior.id}}",
    "type": "assumption | risk | target | constraint | preference",
    "statement": "{{STATEMENT}}",
    "confidence": 0.0,
    "last_updated": "{{YYYY-MM-DDT00:00:00Z}}",
    "evidence": ["{{EVIDENCE_PATH_OR_NOTE}}"]
  }
]
```
