---
Type: Notes
Status: Active
Domain: API
Last-reviewed: 2026-02-19
Relates-to: docs/plans/email-system-design-gaps-v2/plan.md
---

# Email System Design Gaps V2 Replan Notes

## Invocation (Run 1)

- Skill: `/lp-replan` (standard mode)
- Date: 2026-02-19
- Scope: low-confidence `IMPLEMENT` tasks (`TASK-03`, `TASK-04`, `TASK-05`, `TASK-07`, `TASK-08`, `TASK-10`) and direct dependents.

## Gate Outcomes (Run 1)

- Promotion Gate: not met for `TASK-03/04/05/07/08/10`; unresolved unknowns remain non-trivial.
- Validation Gate: met for all affected tasks (TC contracts present); precursor tasks added for unresolved design unknowns.
- Precursor Gate: applied via `TASK-12`, `TASK-13`, `TASK-14`, `TASK-15`.
- Sequencing Gate: topology changed; plan resequenced with stable task IDs.
- Escalation Gate: no user decision required; D1/D2/D3 already locked.

## Evidence (E2/E1)

### E2 executable checks

- Command:
  - `pnpm run test:governed -- jest -- --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/gmail-audit-log.test.ts --maxWorkers=2`
  - Result: `1/1` suite passed, `4/4` tests passed.
- Command:
  - `pnpm run test:governed -- jest -- --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/draft-generate.test.ts packages/mcp-server/src/__tests__/draft-quality-check.test.ts packages/mcp-server/src/__tests__/draft-interpret.test.ts packages/mcp-server/src/__tests__/gmail-organize-inbox.test.ts packages/mcp-server/src/__tests__/startup-loop-octorate-bookings.test.ts --maxWorkers=2`
  - Result: `5/5` suites passed, `102/102` tests passed.
- Command:
  - `pnpm run test:governed -- jest -- --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/booking-email.test.ts packages/mcp-server/src/__tests__/guest-email-activity.test.ts --maxWorkers=2`
  - Result: `2/2` suites passed, `8/8` tests passed.
- Command:
  - `pnpm run test:governed -- jest -- --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/template-lint.test.ts packages/mcp-server/src/__tests__/draft-pipeline.integration.test.ts --maxWorkers=2`
  - Result: `2/2` suites passed, `27/27` tests passed.
  - Harness output (`draft-pipeline.integration`): `10/10` fixtures passed quality checks; average question coverage `100%`.

### E1 static audit highlights

- Link requirement remains booking-monitor scoped:
  - `packages/mcp-server/src/tools/draft-quality-check.ts:306`
- Draft generation emits deterministic diagnostics but no cross-path telemetry contract yet:
  - `packages/mcp-server/src/tools/draft-generate.ts:1201`
  - `packages/mcp-server/src/tools/draft-generate.ts:1230`
- Reception booking/guest activity tools create drafts without unified outcome labeling calls:
  - `packages/mcp-server/src/tools/booking-email.ts:93`
  - `packages/mcp-server/src/tools/guest-email-activity.ts:213`
  - Label application seam exists in `gmail_mark_processed`:
    - `packages/mcp-server/src/tools/gmail.ts:2453`
- Octorate parser has tested paths but still pattern-sensitive and sample-capped:
  - `packages/mcp-server/src/tools/gmail.ts:248`
  - `packages/mcp-server/src/tools/gmail.ts:1934`
- Template inventory baseline remains `53` total / `24` no-url by `https?://` criterion:
  - `packages/mcp-server/data/email-templates.json`

## Replan Decisions (Run 1)

- Added `TASK-12` before `TASK-03` to resolve telemetry event taxonomy + rollup sink ambiguity.
- Added `TASK-13` before `TASK-04` to produce full template reference-scope matrix and avoid false-fail rollout.
- Added `TASK-14` before `TASK-07/08` as an explicit spike for reviewed-ledger state/idempotency contract.
- Added `TASK-15` before `TASK-10` to establish a 90-day Octorate subject baseline and fixture backlog.
- Kept existing low-confidence implementation tasks at `75%`; promotion deferred until precursor evidence is complete.

## TASK-12 Output (Build, 2026-02-19)

### Telemetry Contract Decision

Stable event keys selected for TASK-03 implementation:

| Event key | Purpose | Required fields |
|---|---|---|
| `email_draft_created` | Draft successfully created | `ts`, `event_key`, `source_path`, `tool_name`, `message_id`, `draft_id`, `actor` |
| `email_draft_deferred` | Flow deferred without draft | `ts`, `event_key`, `source_path`, `tool_name`, `message_id`, `actor`, `reason` |
| `email_outcome_labeled` | Queue outcome label applied | `ts`, `event_key`, `source_path`, `message_id`, `actor`, `action` |
| `email_queue_transition` | Queue label-state transition | `ts`, `event_key`, `source_path`, `message_id`, `actor`, `queue_from`, `queue_to` |
| `email_fallback_detected` | Fallback/unknown path taken | `ts`, `event_key`, `source_path`, `tool_name`, `actor`, `reason`, `classification` |

### Source-Path Taxonomy + Mandatory Metadata

- `queue`:
  - Requires `message_id`, `actor`, `action`, `queue_from`, `queue_to`.
  - Derived from queue handling and outcome labeling seams (`gmail_get_email`, `gmail_mark_processed`).
- `reception`:
  - Requires `tool_name`, `booking_ref` (when available), `activity_code` (when available), `draft_id`, `message_id`.
  - Derived from `booking-email` / `guest-email-activity` draft creation responses.
- `outbound`:
  - Requires `tool_name`, `message_id`, `draft_id`, `recipient_count`.
  - Derived from `gmail_create_draft` / outbound draft creation paths.

Backward-compatible defaults when metadata is missing:

- `source_path`: `"unknown"`
- `actor`: `"system"`
- `tool_name`: `"unknown_tool"`
- `draft_id`, `message_id`, `queue_from`, `queue_to`: `null`
- `reason`: `"unspecified"`

### Daily Rollup Sink Decision

- **Chosen sink for v1 rollups:** existing append-only audit-log JSONL at `packages/mcp-server/data/email-audit-log.jsonl` (read + aggregate).
- **Rationale:** this sink is already implemented and test-validated for append-only writes and parseability.
- **Fallback behavior:** if audit-log write/read fails, telemetry emission must remain non-fatal and rollups fall back to on-demand recomputation from surviving entries; no draft path is blocked.

### Evidence Anchors (call-site map)

- Audit schema + append-only sink:
  - `packages/mcp-server/src/tools/gmail.ts:173`
  - `packages/mcp-server/src/tools/gmail.ts:220`
  - `packages/mcp-server/src/tools/gmail.ts:2578`
- Queue lock/outcome flow:
  - `packages/mcp-server/src/tools/gmail.ts:2172`
  - `packages/mcp-server/src/tools/gmail.ts:2242`
- Draft diagnostics seam:
  - `packages/mcp-server/src/tools/draft-generate.ts:1201`
  - `packages/mcp-server/src/tools/draft-generate.ts:1230`
- Reception draft creation seams:
  - `packages/mcp-server/src/tools/booking-email.ts:93`
  - `packages/mcp-server/src/tools/guest-email-activity.ts:213`


## TASK-13 Output (Build, 2026-02-19)

### Inventory Baseline

- Template inventory script output: `{ total: 53, noUrl: 24 }`.
- Classification outcome:
  - `reference_required`: `41` templates
  - `reference_optional_excluded`: `12` templates
- Normalization anomaly detected:
  - Template `T37` currently contains a malformed embedded URL token (`https://hostel-positano.com/\r\n\r\nThat`) in body text and is assigned canonical target `https://hostel-positano.com/en/assistance/booking-basics` for TASK-04 cleanup.

### Full Reference-Scope Matrix (53/53)

| ID | Category | Subject | Scope | Canonical target | Batch | Rationale |
|---|---|---|---|---|---|---|
| T01 | booking-issues | Why cancelled | reference_required | https://docs.google.com/document/d/1-Qr5uCli0_vnTgmd9yTjLDtIDVcusGJYyCcnC_fPmf0/edit?usp=sharing | B | Explains cancellation rationale; must cite terms. |
| T02 | general | Agreement Received | reference_optional_excluded | - | D | Pure acknowledgement state update. |
| T03 | policies | Alcohol Policy | reference_required | https://docs.google.com/document/d/1-Qr5uCli0_vnTgmd9yTjLDtIDVcusGJYyCcnC_fPmf0/edit?usp=sharing | B | Policy answers must reference authoritative terms/rules. |
| T04 | transportation | Transportation to Hostel Brikette | reference_required | https://hostel-positano.com/en/assistance/travel-help | A | Travel directions should cite transport guides. |
| T05 | check-in | Arriving before check-in time | reference_required | https://hostel-positano.com/en/assistance/checkin-checkout | A | Early-arrival instructions map to check-in policy. |
| T06 | access | Essential - Inner Building, Opening Main Door | reference_required | https://docs.google.com/document/d/1nbe64lX27WM88W6d8ucsfvuJU-2_PX--zQB4LEv8LjM/edit?usp=sharing | A | Door/access instructions require canonical guide link. |
| T07 | access | Essential - Outer buildings, Opening Main Door | reference_required | https://docs.google.com/document/d/1nbe64lX27WM88W6d8ucsfvuJU-2_PX--zQB4LEv8LjM/edit?usp=sharing | A | Door/access instructions require canonical guide link. |
| T08 | check-in | Arrival Time - Hostel Brikette, Positano | reference_required | https://hostel-positano.com/en/assistance/checkin-checkout | A | Arrival window should cite check-in policy page. |
| T09 | payment | Change Credit Card Details | reference_required | https://book.octorate.com/octobook/site/reservation/login.xhtml?_xrand=1266613326&codice=45111 | B | Actionable payment-step email requires provider link. |
| T10 | check-in | Out of hours check-in | reference_required | https://hostel-positano.com/en/assistance/late-checkin | A | Out-of-hours flow should cite late check-in guide. |
| T11 | prepayment | Prepayment - Cancelled post 3rd Attempt | reference_optional_excluded | - | D | Automated prepayment chase/confirmation workflow; link optional. |
| T12 | prepayment | Prepayment - 1st Attempt Failed (Octorate) | reference_optional_excluded | - | D | Automated prepayment chase/confirmation workflow; link optional. |
| T13 | prepayment | Prepayment - 2nd Attempt Failed | reference_optional_excluded | - | D | Automated prepayment chase/confirmation workflow; link optional. |
| T14 | prepayment | Prepayment - 1st Attempt Failed (Hostelworld) | reference_optional_excluded | - | D | Automated prepayment chase/confirmation workflow; link optional. |
| T15 | cancellation | Cancellation of Non-Refundable Booking | reference_required | https://docs.google.com/document/d/1-Qr5uCli0_vnTgmd9yTjLDtIDVcusGJYyCcnC_fPmf0/edit?usp=sharing | B | Cancellation outcomes depend on policy terms and should cite them. |
| T16 | cancellation | No Show | reference_required | https://docs.google.com/document/d/1-Qr5uCli0_vnTgmd9yTjLDtIDVcusGJYyCcnC_fPmf0/edit?usp=sharing | B | No-show handling is terms-governed policy. |
| T17 | policies | Age Restriction | reference_required | https://docs.google.com/document/d/1-Qr5uCli0_vnTgmd9yTjLDtIDVcusGJYyCcnC_fPmf0/edit?usp=sharing | B | Policy answers must reference authoritative terms/rules. |
| T18 | activities | Path of the Gods Hike - Recommended Routes | reference_required | https://hostel-positano.com/en/assistance/path-of-gods-hike | A | Route recommendation should cite activity guides. |
| T19 | prepayment | Prepayment Successful | reference_optional_excluded | - | D | Confirmation-only workflow outcome. |
| T20 | breakfast | Breakfast — Eligibility and Hours | reference_required | https://hostel-positano.com/en/assistance/booking-basics | A | Breakfast eligibility/hours are factual amenity info. |
| T21 | breakfast | Breakfast — Not Included (OTA Booking) | reference_required | https://hostel-positano.com/en/assistance/booking-basics | A | Breakfast eligibility/hours are factual amenity info. |
| T22 | luggage | Luggage Storage — Before Check-in | reference_required | https://hostel-positano.com/en/assistance/luggage-storage-positano | A | Storage logistics should cite luggage/porter guides. |
| T23 | luggage | Luggage Storage — After Checkout | reference_required | https://hostel-positano.com/en/assistance/luggage-storage-positano | A | Storage logistics should cite luggage/porter guides. |
| T24 | luggage | Luggage Storage — Porter Service | reference_required | https://hostel-positano.com/en/assistance/luggage-storage-positano | A | Storage logistics should cite luggage/porter guides. |
| T25 | wifi | WiFi Information | reference_optional_excluded | https://hostel-positano.com/en/assistance | D | WiFi quick-answer is operational; link optional. |
| T26 | booking-changes | Booking Change — Date Modification | reference_required | https://hostel-positano.com/en/assistance/changing-cancelling | A | Change/cancellation instructions are policy/operational guidance. |
| T27 | booking-changes | Booking Change — Room Type | reference_required | https://hostel-positano.com/en/assistance/changing-cancelling | A | Change/cancellation instructions are policy/operational guidance. |
| T28 | booking-changes | Booking Extension Request | reference_required | https://hostel-positano.com/en/assistance/changing-cancelling | A | Change/cancellation instructions are policy/operational guidance. |
| T29 | checkout | Checkout Reminder | reference_required | https://hostel-positano.com/en/assistance/checkin-checkout | A | Checkout instructions are procedural and should cite official guide. |
| T30 | checkout | Late Checkout Request | reference_required | https://hostel-positano.com/en/assistance/checkin-checkout | A | Checkout instructions are procedural and should cite official guide. |
| T31 | house-rules | Quiet Hours Reminder | reference_required | https://hostel-positano.com/en/assistance/rules | A | Rule reminders should cite published house rules. |
| T32 | house-rules | Visitor Policy | reference_required | https://hostel-positano.com/en/assistance/rules | A | Rule reminders should cite published house rules. |
| T33 | check-in | Deposit and Keycard Info | reference_required | https://hostel-positano.com/en/assistance/checkin-checkout | A | Deposit/keycard policy should cite check-in terms. |
| T34 | promotions | Coupon Code Redemption | reference_optional_excluded | https://hostel-positano.com/ | D | Promo redemption is marketing/transactional. |
| T35 | employment | Job Application — Acknowledgement | reference_optional_excluded | - | D | Acknowledgement-only message. |
| T36 | lost-found | Lost Item — Report Received | reference_optional_excluded | https://hostel-positano.com/en/assistance | D | Operational acknowledgement; helper link optional. |
| T37 | booking-issues | Booking Inquiry — Availability | reference_required | https://hostel-positano.com/en/assistance/booking-basics | C | Availability guidance should cite booking-help page. |
| T38 | booking-issues | Room Capacity Clarification | reference_required | https://hostel-positano.com/en/assistance/booking-basics | C | Capacity clarification is factual booking info. |
| T39 | faq | Hostel Facilities and Services | reference_required | https://hostel-positano.com/en/assistance | A | FAQ answers are factual and should cite help center pages. |
| T40 | cancellation | Cancellation Request — Medical Hardship | reference_required | https://docs.google.com/document/d/1-Qr5uCli0_vnTgmd9yTjLDtIDVcusGJYyCcnC_fPmf0/edit?usp=sharing | B | Cancellation outcomes depend on policy terms and should cite them. |
| T41 | cancellation | Cancellation Confirmation | reference_optional_excluded | https://docs.google.com/document/d/1-Qr5uCli0_vnTgmd9yTjLDtIDVcusGJYyCcnC_fPmf0/edit?usp=sharing | D | Final state confirmation; policy link optional. |
| T42 | payment | Payment Dispute — Acknowledgement | reference_required | https://docs.google.com/document/d/1-Qr5uCli0_vnTgmd9yTjLDtIDVcusGJYyCcnC_fPmf0/edit?usp=sharing | B | Dispute handling references policy/terms baseline. |
| T43 | booking-issues | Overbooking Support — Next Steps | reference_required | https://hostel-positano.com/en/assistance/changing-cancelling | C | Reaccommodation/change process should cite policy page. |
| T44 | faq | Bar and Terrace — Hours and Access | reference_required | https://hostel-positano.com/en/assistance | A | Amenity hours/access are factual guide content. |
| T45 | transportation | Parking — Not Available, Nearby Options | reference_required | https://hostel-positano.com/en/assistance/travel-help | A | Parking alternatives are transport guidance. |
| T46 | policies | Pets — Policy | reference_required | https://docs.google.com/document/d/1-Qr5uCli0_vnTgmd9yTjLDtIDVcusGJYyCcnC_fPmf0/edit?usp=sharing | B | Pet policy should cite terms/rules source. |
| T47 | check-in | City Tax — What to Expect at Check-in | reference_required | https://hostel-positano.com/en/assistance/checkin-checkout | A | Check-in instructions are procedural and should cite official guide. |
| T48 | booking-issues | Private Room vs Dormitory — Comparison | reference_required | https://hostel-positano.com/en/assistance/booking-basics | C | Room-type comparison is factual booking guidance. |
| T49 | activities | Things to Do in Positano | reference_required | https://hostel-positano.com/en/assistance | A | Attraction recommendations should cite guide hub. |
| T50 | payment | Receipt / Invoice Request | reference_optional_excluded | https://docs.google.com/document/d/1-Qr5uCli0_vnTgmd9yTjLDtIDVcusGJYyCcnC_fPmf0/edit?usp=sharing | D | Transactional billing request; policy link optional. |
| T51 | booking-issues | Group Booking — How It Works | reference_required | https://hostel-positano.com/en/assistance/booking-basics | C | Group-booking guidance should cite booking basics. |
| T52 | check-in | Out of Hours Check-In Instructions | reference_required | https://hostel-positano.com/en/assistance/late-checkin | A | Detailed late check-in procedure requires guide link. |
| T53 | transportation | Arriving by Bus | reference_required | https://hostel-positano.com/en/assistance/arriving-by-bus | A | Transport instructions should cite bus/travel guide. |

### Canonical URL Targets by In-Scope Family

| Family | Canonical target(s) |
|---|---|
| Access | `https://docs.google.com/document/d/1nbe64lX27WM88W6d8ucsfvuJU-2_PX--zQB4LEv8LjM/edit?usp=sharing` |
| Activities | `https://hostel-positano.com/en/assistance/path-of-gods-hike`, `https://hostel-positano.com/en/assistance` |
| Transportation | `https://hostel-positano.com/en/assistance/travel-help`, `https://hostel-positano.com/en/assistance/arriving-by-bus` |
| Check-in / Checkout | `https://hostel-positano.com/en/assistance/checkin-checkout`, `https://hostel-positano.com/en/assistance/late-checkin` |
| Booking changes/issues | `https://hostel-positano.com/en/assistance/changing-cancelling`, `https://hostel-positano.com/en/assistance/booking-basics` |
| Luggage / porter | `https://hostel-positano.com/en/assistance/luggage-storage-positano`, `https://hostel-positano.com/en/assistance/porter-service-positano` |
| FAQ / amenities | `https://hostel-positano.com/en/assistance`, `https://hostel-positano.com/en/assistance/booking-basics` |
| Policy / cancellation / disputes | `https://docs.google.com/document/d/1-Qr5uCli0_vnTgmd9yTjLDtIDVcusGJYyCcnC_fPmf0/edit?usp=sharing` |
| Payment action links | `https://book.octorate.com/octobook/site/reservation/login.xhtml?_xrand=1266613326&codice=45111` |

### TASK-04 Normalization Batches + Deterministic Checks

- Batch A (`17` templates): Access, check-in/checkout, transportation, luggage, activities, house-rules, FAQ, breakfast.
  - Deterministic check: all `batch=A` + `scope=reference_required` templates include an `https://` URL matching one canonical family target.
- Batch B (`10` templates): Policy-heavy templates (policies, cancellation policy, payment dispute, cancellation rationale).
  - Deterministic check: all `batch=B` templates include canonical terms URL and pass `template-lint` with zero hard issues.
- Batch C (`5` templates): Booking-issues long-form guidance set.
  - Deterministic check: all `batch=C` templates reference booking-help/change URLs and preserve fixture quality pass rate in `draft-pipeline.integration`.
- Batch D (`21` templates): Operational/transactional templates (`reference_optional_excluded`) plus final-state confirmations.
  - Deterministic check: templates remain explicitly tagged as optional/excluded and are skipped by strict-link enforcement logic in TASK-05.

## Invocation (Run 2)

- Skill: `/lp-replan` (standard mode)
- Date: 2026-02-19
- Scope: promote Wave 3 foundation IMPLEMENT tasks (`TASK-03`, `TASK-04`) after precursor completion (`TASK-12`, `TASK-13`).

## Gate Outcomes (Run 2)

- Promotion Gate: met for `TASK-03` and `TASK-04` via completed precursor outputs plus fresh E2 checks.
- Validation Gate: met for promoted tasks; TC-03 and TC-04 remain complete for build execution.
- Precursor Gate: unchanged; no new precursor tasks required.
- Sequencing Gate: no topology change (stable task IDs, dependencies, and wave ordering unchanged).
- Escalation Gate: no new user decision required; D1/D2/D3 remain active.

## Evidence (Run 2, E2)

- Command:
  - `node -e 'const fs=require("fs");const a=JSON.parse(fs.readFileSync("packages/mcp-server/data/email-templates.json","utf8"));const arr=Array.isArray(a)?a:(a.templates||[]);const no=arr.filter(t=>!/https?:\\/\\//i.test(JSON.stringify(t)));console.log(JSON.stringify({total:arr.length,noUrl:no.length}));'`
  - Result: `{"total":53,"noUrl":24}`.
- Command:
  - `pnpm run test:governed -- jest -- --config packages/mcp-server/jest.config.cjs --runTestsByPath packages/mcp-server/src/__tests__/gmail-audit-log.test.ts packages/mcp-server/src/__tests__/draft-generate.test.ts packages/mcp-server/src/__tests__/template-lint.test.ts packages/mcp-server/src/__tests__/draft-pipeline.integration.test.ts --maxWorkers=2`
  - Result: `4/4` suites passed, `55/55` tests passed.
  - Harness output (`draft-pipeline.integration`): `10/10` fixtures passed quality checks; average question coverage `100%`.

## Replan Decisions (Run 2)

- Promoted `TASK-03` confidence from `75%` to `80%`:
  - Unknown removed: telemetry event taxonomy + rollup sink ambiguity, resolved by TASK-12 output.
  - E2 reconfirmation: `gmail-audit-log` + `draft-generate` governed tests passed in this replan run.
- Promoted `TASK-04` confidence from `75%` to `80%`:
  - Unknown removed: template scope partition ambiguity, resolved by TASK-13 full 53-template matrix and batch plan.
  - E2 reconfirmation: template lint + draft pipeline integration suites passed in this replan run.
- Left `TASK-05`, `TASK-07`, `TASK-08`, `TASK-10` unchanged at `75%` pending post-implementation evidence from upstream dependencies/checkpoint flow.

## Next Build Order

1. Run `/lp-build` for Wave 3 foundation tasks (`TASK-03`, `TASK-04`) now that both are `>=80` and unblocked.
2. Re-run `/lp-replan` after Wave 3 and Wave 4 complete (or at CHECKPOINT TASK-06) for downstream confidence reassessment.
