---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Product
Workstream: Mixed
Created: 2026-02-17
Last-updated: 2026-02-17
Feature-Slug: startup-loop-business-naming
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-plan, lp-sequence
Related-Plan: docs/plans/startup-loop-business-naming/plan.md
Business-OS-Integration: off
Business-Unit: PIPE
Card-ID: none
---

# Startup Loop — Business Naming Step Fact-Find Brief

## Scope

### Summary

The startup loop workflow has no process for generating a business or product name when a company is new and unnamed. The loop currently assumes a business code (e.g. BRIK, HEAD, PET) and working name exist before S0 (Intake). For genuinely new ventures entering the loop without a confirmed name, there is no gate, no prompt, and no structured handoff to generate naming candidates.

This fact-find investigates where a naming step should be inserted, what intake data is available to seed a deep-research naming prompt, and what needs to be built to integrate the step cleanly into the existing gate sequence.

**Precondition:** This change assumes `business_code` exists and has been assigned before S0 artifacts are created (it is required for all filesystem path derivation). If a genuinely new venture has no code at all, it must receive a temporary code before entering S0. The naming step addresses the working `business_name` only — not the code.

### Goals

- Identify the correct insertion point in the loop for a naming step.
- Define a canonical seed-field contract mapping S0 intake fields to naming prompt placeholders.
- Define a deep-research prompt template that produces a long-list of company/product name candidates, a shortlist, and a recommendation.
- Specify the gate ID, trigger condition, pass condition, and non-retriggering rule for GATE-BD-00.
- Define the minimal changes required to existing skills and templates, including `loop-spec.yaml`.

### Non-goals

- Building a name-selection or trademark-checking tool — the output is a deep-research prompt for human use.
- Replacing or modifying `lp-brand-bootstrap` beyond reading the naming shortlist it receives.
- Changing the loop for businesses that already have a confirmed name.
- Producing a brand dossier — that remains `lp-brand-bootstrap` / GATE-BD-01.
- Second-pass naming prompt seeded from S2B offer-design data — deferred as TASK-05.

### Constraints & Assumptions

- Constraints:
  - The loop gate pattern must mirror the existing S2 (Market Intelligence) deep-research handoff — generate a prompt, block loop advance, user takes it externally, returns an artifact, loop resumes.
  - Gate IDs are sequential within the brand-identity family (GATE-BD-00 is the only slot available before GATE-BD-01).
  - The S0 intake packet template is the authoritative source of early business context — the naming prompt must draw from fields that are already collected there.
  - All `{{FIELD}}` placeholders in the prompt template must map 1:1 to fields in the **Naming Prompt Seed Contract** table below. No placeholder may reference a field not in that table.
  - The naming artifact path must follow the `docs/business-os/strategy/<BIZ>/` convention used by other S0/S1 outputs.
  - `loop-spec.yaml` must be updated to register GATE-BD-00. Whether this requires a `spec_version` bump must be assessed in TASK-03b.
- Assumptions:
  - `business_name_status` absent from intake packet = treated as `confirmed` (gate skipped). Trigger requires the field to be explicitly set to `unconfirmed`. **Confirmed by Peter 2026-02-17.**
  - The deep-research prompt is a markdown file the user copies into an external tool (e.g. Gemini Deep Research, Perplexity) — no API integration is required.
  - Second-pass naming prompt (S2B) is deferred. **Confirmed by Peter 2026-02-17.** Recorded as TASK-05 (non-binding).
  - Intake packet parsing errors on `business_name_status` (e.g. malformed YAML) = treat as `confirmed` (fail-open), but emit a warning. This matches the backwards-compat constraint.

### Gate BD-00 Decision Table

| `business_name_status` | Shortlist file exists? | Result |
|---|---|---|
| absent or `confirmed` | either | **Skipped** — no gate action |
| `unconfirmed` | no | **Blocked** — generate prompt (if not already generated); emit resume instruction |
| `unconfirmed` | yes | **Complete** — gate passes; emit advisory to update `business_name` in intake packet |

Pass condition: shortlist file exists (glob match — see Artifact Spec below).
The gate does NOT require `business_name_status` to be flipped to `confirmed`. That is an advisory, not a gate requirement.
The gate does NOT regenerate the prompt if it already exists — idempotent on subsequent `/startup-loop advance` calls.

---

## Evidence Audit (Current State)

### Entry Points

- `.claude/skills/startup-loop/SKILL.md` — loop orchestrator; defines all stages, gates, and blocking behaviour
- `docs/business-os/startup-loop/loop-spec.yaml` — machine-readable spec (spec_version 1.0.0); stage definitions and gate identifiers
- `docs/business-os/startup-baselines/BRIK-intake-packet.user.md` — real S0 intake instance (website-live mode)
- `docs/business-os/startup-baselines/HEAD-intake-packet.user.md` — real S0 intake instance (pre-website mode)

### Key Modules / Files

- `.claude/skills/startup-loop/SKILL.md` — gate enforcement logic; needs new GATE-BD-00 check added at S0→S1 transition
- `docs/business-os/startup-loop/loop-spec.yaml` — needs GATE-BD-00 entry; spec_version impact to be assessed in TASK-03b
- `.claude/skills/lp-brand-bootstrap/SKILL.md` — GATE-BD-01 enforcer; needs to read `latest-candidate-names.user.md` if present
- `docs/business-os/market-research/_templates/deep-research-market-intelligence-prompt.md` — canonical reference for the deep-research handoff pattern this step must mirror
- `docs/business-os/startup-baselines/<BIZ>-intake-packet.user.md` — S0 intake packet; needs one new field (`business_name_status`)
- `docs/business-os/strategy/<BIZ>/brand-identity.user.md` — downstream consumer; naming shortlist informs the name field here

### Patterns & Conventions Observed

- **Deep-research handoff pattern** — used at S2 (Market Intelligence) and S6 (Site-Upgrade): loop generates a populated prompt file, blocks advance, user runs research externally, returns artifact to a specified path, loop resumes. Evidence: `.claude/skills/startup-loop/SKILL.md` (S2 gate logic), `docs/business-os/market-research/_templates/`
- **Gate-BD-XX series** — brand-related gates enforced at specific stage transitions. GATE-BD-01 (brand dossier) blocks S1→S2. GATE-BD-03 (messaging hierarchy) blocks S2B completion. No GATE-BD-00 currently exists — the slot is available. Evidence: `.claude/skills/startup-loop/SKILL.md`
- **Intake packet field convention** — `business_name_status` does not exist in the current template. All other status fields use `confirmed | unconfirmed | draft` vocabulary. Evidence: `docs/business-os/startup-baselines/HEAD-intake-packet.user.md`, `BRIK-intake-packet.user.md`
- **Prompt template location** — deep-research prompt templates live at `docs/business-os/market-research/_templates/`. Required output artifacts live at `docs/business-os/strategy/<BIZ>/`. Evidence: S2 gate config in loop spec.
- **Artifact naming convention** — `<YYYY-MM-DD>-<artifact-type>.user.md`. E.g. `2026-01-15-market-intelligence.user.md`. Evidence: loop-spec.yaml required_output_path entries.
- **Stable latest-file convention** — for artifacts returned by users, a stable `latest-<artifact-type>.user.md` file provides a deterministic read target for downstream skills, avoiding date-parse logic. Evidence: market intelligence `latest.user.md` pattern.

### Data & Contracts

#### Naming Prompt Seed Contract

Canonical field table. Every `{{FIELD}}` placeholder in the prompt template must appear here. No exceptions.

| Field name | Required / Optional | Type / Shape | Fallback if missing | Source in intake packet |
|---|---|---|---|---|
| `business_code` | Required | Short string (e.g. `BRIK`) | None — precondition; S0 cannot proceed without it | Front matter / metadata |
| `business_name` | Optional | String — may be placeholder | `"[unnamed]"` | Section B: Business and Product Packet |
| `region` | Required | String — geography/locale (e.g. `Italy`, `UK`) | None — required field; prompt must flag if absent | Section B |
| `core_offer` | Required | Prose description of what is sold | None — required field | Section B |
| `primary_icp_who` | Required | Demographic label string | None — required field | Section C: ICP and Channel Packet |
| `primary_icp_context` | Optional | String — occasion/context of use | `"[not specified]"` | Section C |
| `primary_icp_jtbd` | Optional | String — job to be done / motivation | `"[not specified]"` | Section C |
| `revenue_model` | Required | String (e.g. `e-commerce`, `subscription`, `per-booking`) | None — required field | Section B |
| `price_positioning` | Optional | String (e.g. `premium`, `mid-market`, `budget`) | Infer from 90-day targets if missing | Section D / Outcome Contract |
| `key_differentiator` | Optional | Prose hypothesis | `"[not yet defined]"` | Section D / Constraints register |
| `target_languages` | Optional | List of languages for the target region | Derive from `region` as best effort | Section B or C |

Notes:
- `constraints_register` is NOT included — it is structured evidence, not a naming input. The prompt researcher does not need it.
- `secondary_icp` is NOT included as a distinct field — if relevant, the researcher is instructed to consider the primary ICP's adjacencies.
- `target_languages` is a new derived field not currently in the intake packet; TASK-01 must add it or document derivation rules.

#### Artifact Spec

**Prompt file (loop-generated):**
- Path: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-naming-prompt.md`
- Generated once. If file already exists, gate skips regeneration (idempotent).
- The generation date is the date of the `/startup-loop advance` call that triggered the gate.

**Shortlist file (user-returned):**
- Accepted path pattern (glob): `docs/business-os/strategy/<BIZ>/*-candidate-names.user.md`
- Gate passes on any glob match — date in filename does not need to match prompt file date.
- Required frontmatter (machine-readable, minimum):
  ```yaml
  ---
  recommended_business_name: "Acme"
  shortlist:
    - "Acme"
    - "Acme Labs"
    - "Acme Studio"
  ---
  ```
  Without this frontmatter, `lp-brand-bootstrap` cannot reliably extract the recommended name.

**Stable latest pointer (loop-written on gate pass):**
- Path: `docs/business-os/strategy/<BIZ>/latest-candidate-names.user.md`
- Written by the gate logic when the gate passes (copy/symlink of the matched shortlist file).
- `lp-brand-bootstrap` reads this stable path. Falls back gracefully if absent.
- This replaces the previously proposed `latest_naming_shortlist` field in `loop-spec.yaml` — avoids schema creep and keeps the pointer in the filesystem (consistent with the `latest.user.md` pattern for market intelligence).

#### Other Contract Notes

- Persistence:
  - Prompt: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-naming-prompt.md` (idempotent — not overwritten if exists)
  - Shortlist: `docs/business-os/strategy/<BIZ>/*-candidate-names.user.md` (glob accepted)
  - Stable pointer: `docs/business-os/strategy/<BIZ>/latest-candidate-names.user.md` (written by gate on pass)

- API/contracts:
  - No API changes required.
  - `lp-brand-bootstrap` reads `latest-candidate-names.user.md` front matter to extract `recommended_business_name` and optionally `shortlist`. Graceful skip if file absent.
  - `loop-spec.yaml` requires a new GATE-BD-00 gate entry. Schema impact assessed in TASK-03b.

### Dependency & Impact Map

- Upstream dependencies:
  - S0 intake packet (must be complete before naming prompt can be generated)
  - `business_name_status: unconfirmed` explicitly set in intake packet (trigger condition)
  - `business_code` assigned (precondition for all path derivation)
- Downstream dependents:
  - `lp-brand-bootstrap` (GATE-BD-01) — reads `latest-candidate-names.user.md` to pre-populate brand dossier name field
  - `docs/business-os/strategy/<BIZ>/brand-identity.user.md` — the confirmed name flows into this document
  - All subsequent stages that reference `business_name` (offer copy, SEO, GTM) — benefit from a well-researched name
- Likely blast radius:
  - Changes to `startup-loop/SKILL.md` affect all new loop runs. Existing businesses with `business_name_status` absent or `confirmed` are unaffected — the gate is skipped.
  - Changes to `loop-spec.yaml` affect the machine-readable spec. Scope of impact depends on whether spec_version must increment (TASK-03b).
  - Addition of `business_name_status` field to intake packet template is additive and backwards-compatible.
  - No changes to S1 through S10 logic.

---

## Hypothesis & Validation Landscape

### Key Hypotheses

| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | S0 is the correct insertion point — enough context exists at intake to seed a useful naming prompt | Naming Prompt Seed Contract field inventory | Low — compare seed contract fields against naming prompt requirements | 1 hour |
| H2 | The deep-research handoff pattern (used at S2) works for naming — no new infrastructure needed | S2 gate pattern in loop-spec.yaml | Low — review existing S2 gate implementation | 30 min |
| H3 | A second-pass prompt at S2B materially improves name quality | S2B output fields (ICP, positioning, competitive frame) | Medium — requires a real naming run to compare outputs | Deferred (TASK-05) |
| H4 | `lp-brand-bootstrap` can consume the naming shortlist via front matter without a full rewrite | lp-brand-bootstrap SKILL.md structure | Low — read the skill and check field mapping | 30 min |

### Existing Signal Coverage

| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | Seed contract fields confirmed from two real intake instances | `HEAD-intake-packet.user.md`, `BRIK-intake-packet.user.md` | High |
| H2 | S2 gate uses identical generate-prompt → block → user-returns-artifact pattern | `startup-loop/SKILL.md`, `loop-spec.yaml` | High |
| H3 | S2B fields (Moore template, competitive frame, ICP psychographics) are richer for naming | `lp-offer/SKILL.md` output section list | Medium — inferred, not tested |
| H4 | lp-brand-bootstrap reads strategy/<BIZ>/ dir; naming shortlist is in same dir | `lp-brand-bootstrap/SKILL.md` | Medium |

### Falsifiability Assessment

- Easy to test:
  - H1, H2, H4 — all verifiable by reading existing skill files (done in this fact-find)
- Hard to test:
  - H3 — requires running a real naming session twice (once at S0 data, once at S2B data) and evaluating output quality
- Validation seams needed:
  - Naming prompt template should include a `Data-Richness` header noting S0-only vs S0+S2B seed, so future runs can compare quality

---

## Questions

### Resolved

- Q: Does any naming step exist in the loop today?
  - A: No. The loop assumes a business code and name exist before S0. `/lp-brand-bootstrap` covers brand language (visual identity, voice/tone, messaging hierarchy) but does not generate name candidates.
  - Evidence: `.claude/skills/startup-loop/SKILL.md`, `.claude/skills/lp-brand-bootstrap/SKILL.md`

- Q: What gate slot is available for the naming step?
  - A: GATE-BD-00. The existing brand-identity gate series starts at GATE-BD-01. The slot before it is unused.
  - Evidence: `.claude/skills/startup-loop/SKILL.md` gate inventory

- Q: What data fields are available at S0 to seed a naming prompt?
  - A: 11 fields assessed; 11 included in the Naming Prompt Seed Contract (8 from S0 intake, 1 derived). See the canonical contract table in Data & Contracts above — that table is the authoritative reference. The "9 fields" count used in earlier drafts was inaccurate and has been removed.
  - Evidence: `HEAD-intake-packet.user.md`, `BRIK-intake-packet.user.md`

- Q: What naming/branding infrastructure already exists?
  - A: `lp-brand-bootstrap` produces a brand dossier (visual identity, personality, voice/tone, token overrides). GATE-BD-03 requires a messaging hierarchy at S2B completion. Neither step generates name candidates.
  - Evidence: `.claude/skills/lp-brand-bootstrap/SKILL.md`

- Q: Should the naming step be a new skill or an extension of an existing one?
  - A: Extension of `startup-loop/SKILL.md` (new gate check) plus a new prompt template file. No new skill binary needed — the loop generates the populated prompt and hands it off exactly as S2 does. A `/lp-name` skill is optional sugar for discoverability but not required for the gate to function.
  - Evidence: S2 gate pattern in loop spec

- Q: Should `business_name_status` absent from the intake packet be treated as `confirmed`?
  - A: Yes — absence is treated as `confirmed`. Gate only triggers when the field is explicitly set to `unconfirmed`. This ensures zero impact on all existing intake packets (BRIK, HEAD, PET).
  - Decision owner: Peter — confirmed 2026-02-17

- Q: Should a second-pass naming prompt (seeded from S2B offer-design output) be in scope for this plan?
  - A: No — deferred. Recorded as TASK-05 (non-binding seed). S0 gate is the sole deliverable for this plan.
  - Decision owner: Peter — confirmed 2026-02-17

### Open (User Input Needed)

_None — all questions resolved._

---

## Confidence Inputs

- Implementation: 82%
  - Basis: Gate pattern is well-established (S2 precedent). Seed contract fields confirmed from real intake instances. Both open questions resolved. Gate decision table is explicit with no ambiguity on pass/trigger/non-retrigger.
  - To reach 90%: (a) Review `lp-brand-bootstrap` SKILL.md to confirm front matter extraction is straightforward. (b) Verify `loop-spec.yaml` accepts new gate entry without forcing a breaking schema change (TASK-03b).
- Approach: 87%
  - Basis: Inserting at S0 with the deep-research handoff pattern is the minimal-change, precedent-backed approach. Stable latest-pointer pattern avoids schema creep. Glob-based shortlist detection avoids date-mismatch footgun.
  - To reach 90%: Confirm glob-based gate check is already used elsewhere in loop (or confirm it can be added without new infrastructure).
- Impact: 90%
  - Basis: The gap is confirmed and clear. Every new unnamed business entering the loop benefits. Zero impact on existing named businesses.
  - To reach 95%: Run a pilot naming session with a real intake packet to validate prompt quality.
- Delivery-Readiness: 83%
  - Basis: All deliverables (gate addition, prompt template, intake field, loop-spec update, stable pointer) are well-scoped. No external dependencies.
  - To reach 90%: Confirm loop-spec.yaml schema impact (TASK-03b) — the only remaining uncertainty.
- Testability: 75%
  - Basis: Gate enforcement is testable via decision table (3 rows, all deterministic file-existence checks). Prompt template quality is not automatically testable.
  - To reach 80%: Add one gate unit test per row of the decision table. Prompt quality deferred to manual pilot session.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| S0 data insufficient to produce differentiated name candidates | Low | Medium | Seed contract fields (offer, ICP, region, differentiator) match brand-consultant discovery inputs. Prompt instructs researcher to flag if more context is needed before completing the long-list. |
| User sets `business_name_status: confirmed` prematurely to skip the gate | Medium | Low | Gate is process adherence only. Loop cannot validate name quality — that is a human decision. Accept as an intentional override. |
| Shortlist artifact never returned; loop appears stuck | Low | High | Blocking message must include the resume instruction verbatim: "Place shortlist at `docs/business-os/strategy/<BIZ>/*-candidate-names.user.md` with required front matter, then run `/startup-loop advance`." Mirror S2 resume pattern exactly. |
| Prompt overwritten on repeated `/startup-loop advance` calls; original lost | Medium | Low | Gate checks for prompt file existence before generating. If prompt exists, skip regeneration. Idempotent behaviour must be explicit in TASK-03 implementation note. |
| `business_name_status` parse fails silently (malformed YAML) | Low | Medium | Fail-open: treat parse errors as `confirmed` (gate skipped) and emit a warning. Consistent with backwards-compat constraint. Document the behaviour explicitly in TASK-01. |
| Date in shortlist filename does not match prompt file date; gate appears stuck | Low | High | Gate check is glob-based (`*-candidate-names.user.md`), not exact-path. Date mismatch is not a failure condition. Explicitly documented in Artifact Spec above. |
| `lp-brand-bootstrap` fails to extract recommended name from shortlist (brittle parse) | Medium | Medium | Required YAML front matter in shortlist (`recommended_business_name`, `shortlist`) provides a deterministic extraction target. If front matter absent, lp-brand-bootstrap skips gracefully and emits an advisory. |
| `loop-spec.yaml` schema change forces a `spec_version` bump with wider team impact | Low | Medium | TASK-03b must assess before committing. If a bump is required, document it and communicate. If not, proceed. |
| Multi-locale naming: region seed alone may miss linguistic/cultural collision risks | Medium | Medium | `target_languages` field in seed contract instructs the researcher to check top languages in the target region. Prompt template must explicitly request cultural/pronunciation review per language. |

---

## Planning Constraints & Notes

- Must-follow patterns:
  - Gate behaviour must mirror the S2 Market Intelligence handoff exactly: generate prompt file (idempotent) → emit blocking message with resume path → user runs external research → user places shortlist at glob-matched path → `/startup-loop advance` passes gate.
  - Gate ID must be GATE-BD-00 (before GATE-BD-01). Do not renumber existing gates.
  - Prompt template at `docs/business-os/market-research/_templates/deep-research-naming-prompt.md`.
  - All `{{FIELD}}` placeholders must map 1:1 to the Naming Prompt Seed Contract table. No straying.
  - Shortlist detection: glob-based (`*-candidate-names.user.md`), not exact-path.
  - Stable pointer: `latest-candidate-names.user.md` written on gate pass. Do not add pointer field to `loop-spec.yaml`.
  - Shortlist front matter schema (`recommended_business_name`, `shortlist`) is required for downstream consumption by `lp-brand-bootstrap`.
  - `loop-spec.yaml` must be updated to register GATE-BD-00 (TASK-03b). Assess spec_version impact before committing.
- Rollout/rollback expectations:
  - Change is additive. Existing businesses with `business_name_status` absent or `confirmed` are unaffected.
  - Rollback: remove GATE-BD-00 from `startup-loop/SKILL.md` and revert `loop-spec.yaml` entry. Delete prompt template. Zero impact on existing businesses.
- Observability expectations:
  - Loop `status` output must include `naming_gate` field, computed from filesystem state only (no stored state):
    - `skipped` — `business_name_status` absent or `confirmed`
    - `blocked` — `business_name_status: unconfirmed` and no glob match for shortlist
    - `complete` — `business_name_status: unconfirmed` and glob match found

---

## Suggested Task Seeds (Non-binding)

- TASK-01: Add `business_name_status: confirmed | unconfirmed` and `target_languages` fields to S0 intake packet template; document semantics, fallback rules, and parse-error behaviour (fail-open = treat as `confirmed`, emit warning).
- TASK-02: Create `docs/business-os/market-research/_templates/deep-research-naming-prompt.md` — full prompt template with `{{FIELD}}` placeholders mapped to Naming Prompt Seed Contract, research tasks (competitor landscape, 15-20 candidate long-list, shortlist of 5, single recommendation), output format spec including required front matter schema for the returned shortlist.
- TASK-03: Add GATE-BD-00 check to `startup-loop/SKILL.md` at S0→S1 transition — reads `business_name_status`; if `unconfirmed` and prompt file absent, populates template fields from intake and writes prompt (idempotent); if `unconfirmed` and shortlist glob match exists, writes `latest-candidate-names.user.md` and passes gate with advisory; emits blocking message with verbatim resume instruction when blocked.
- TASK-03b: Update `docs/business-os/startup-loop/loop-spec.yaml` — add GATE-BD-00 entry with `trigger_condition`, `pass_condition`, `blocking_message_template`, and `required_output_glob`. Assess whether `spec_version` must increment and document the decision.
- TASK-04: Update `lp-brand-bootstrap/SKILL.md` — read `latest-candidate-names.user.md` front matter if present; extract `recommended_business_name` to pre-fill brand dossier name field; skip gracefully (with advisory) if file absent or front matter malformed.
- TASK-05 (deferred — do not plan): Design optional second-pass naming prompt seeded from S2B offer-design output (full ICP psychographics, Moore positioning statement, competitive frame); triggered as soft recommendation at S2B completion.

---

## Execution Routing Packet

- Primary execution skill:
  - `lp-do-build` — for TASK-01 through TASK-04 (file creation and skill edits)
- Supporting skills:
  - `lp-do-plan` — to produce the sequenced, confidence-gated plan from these seeds
  - `lp-sequence` — to set explicit dependency ordering: TASK-01 before TASK-02 (seed contract defines field names used in template); TASK-02 before TASK-03 (gate references template); TASK-03b independent of TASK-03 but both must complete before integration test; TASK-04 independent
- Deliverable acceptance package:
  - TASK-01: `business_name_status` and `target_languages` present in intake packet template with semantics and parse-error behaviour documented
  - TASK-02: Prompt template at specified path; all `{{FIELD}}` placeholders map to Naming Prompt Seed Contract; output format section includes required front matter schema; `Data-Richness` header present
  - TASK-03: Gate passes all three rows of Gate BD-00 decision table when tested against synthetic intake packets
  - TASK-03b: GATE-BD-00 entry in loop-spec.yaml with all required fields; spec_version decision documented
  - TASK-04: lp-brand-bootstrap extracts `recommended_business_name` from front matter when file present; skips gracefully when absent
- Post-delivery measurement plan:
  - Run one naming session end-to-end with a real (or synthetic) intake packet
  - Evaluate: does deep-research output produce ≥10 distinct, positioned candidates with front matter schema present? Does the shortlist align with ICP and offer?
  - Flag and adjust prompt template based on output quality

---

## Evidence Gap Review

### Gaps Addressed

- Confirmed no naming step exists in the current loop (startup-loop/SKILL.md, lp-brand-bootstrap/SKILL.md).
- Established canonical Naming Prompt Seed Contract (11 fields) from two real intake instances. Removed ambiguous "9 fields" count.
- Confirmed the S2 deep-research handoff pattern is directly reusable (same file-existence gate, same blocking/resume pattern).
- Confirmed GATE-BD-00 slot is available.
- Confirmed prompt template directory convention from S2 and S6 implementations.
- Resolved filename reliability trap: committed to glob-based shortlist detection (not exact-path).
- Resolved latest-pointer approach: stable `latest-candidate-names.user.md` file (no loop-spec.yaml schema change).
- Added explicit shortlist front matter schema to enable deterministic downstream extraction.
- Added `target_languages` to seed contract to address multi-locale naming risk.
- Added explicit `business_code` precondition to prevent misreading scope.
- Made Gate BD-00 pass condition explicit (shortlist exists) and separated it from advisory (flip status to confirmed).

### Confidence Adjustments

- Implementation raised from 80% to 82%: gate decision table is now explicit; idempotency rule added; glob-based detection removes date-mismatch risk.
- Approach raised from 85% to 87%: stable latest-pointer avoids schema creep; artifact spec is unambiguous.
- Delivery-Readiness raised from 80% to 83%: only remaining uncertainty is loop-spec.yaml schema impact (TASK-03b).

### Remaining Assumptions

- **`loop-spec.yaml` schema — resolved by TASK-03b (2026-02-17):** No `gates:` block exists. Gate registration is comment-based (inline YAML comment on stage entry + header changelog line). Fields `trigger_condition`, `pass_condition`, `blocking_message_template`, `required_output_glob` are SKILL.md-only — not YAML fields. **spec_version bump required**: `1.2.0` → `1.3.0` (established pattern). run_packet `loop_spec_version` must match; existing in-flight packets show mismatch but are functionally safe. No TASK-03c needed — loop-spec.yaml change is a comment addition + version bump only.
- Glob-based gate check (`*-candidate-names.user.md`) is implementable in `startup-loop/SKILL.md` without new infrastructure — consistent with how other artifact checks work, but not directly confirmed by file read.
- `lp-brand-bootstrap` front matter extraction will be straightforward — Medium confidence (H4). To be verified in TASK-04.

---

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none
- Recommended next step:
  - `/lp-do-plan docs/plans/startup-loop-business-naming/fact-find.md`
