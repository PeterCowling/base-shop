---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-02-20
Last-updated: 2026-02-20
Feature-Slug: email-draft-self-improving-system
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/email-draft-self-improving-system/plan.md
Business-OS-Integration: off
Business-Unit: none
Card-ID: none
---

# Email Draft Self-Improving System — Fact-Find Brief

## Scope

### Summary

The email draft pipeline (`draft_interpret` → `draft_generate` → `draft_quality_check` → `draft_refine`) has no durable closed-loop learning path. When Claude rewrites a weak draft, we do not persist structured selection/outcome telemetry in a way the ranker and templates can consume safely. A key bug also suppresses the existing learning-ledger ingestion path for unanswered questions. This plan adds a self-improving loop covering: (1) durable ranker signal capture and correction, (2) template patch proposals for human approval, (3) new-template proposals when no fit exists, and (4) a slot/injection system so templates become composable rather than monolithic.

### Goals

- Capture selection metadata in `draft_generate` and refinement outcome in `draft_refine`, linked by a shared `draft_id`
- Wire those signals back into ranking decisions as bounded per-scenario template priors
- When a template is substantially rewritten by Claude, surface a template improvement proposal (diff or new template) for human review → JSON write-back
- When no template matched at all, capture the refined body as a new-template candidate
- Replace verbatim template bodies with a slot system (`{{SLOT:X}}`) enabling knowledge injection, booking detail injection, and CTA injection at declared points rather than appended at the end
- Fix known bugs in gap-fill wording and learning-ledger trigger wiring
- Add explicit data hygiene for new telemetry/proposal artifacts (redaction + retention)
- Fix the garbled gap-fill escalation sentence

### Non-goals

- Fully automated template updates without human review (the approval gate is mandatory)
- ML-based ranker retraining (stays BM25 + signal boosting; no model training pipeline)
- Changes to the `draft_interpret` classification logic (separate concern)
- Changing the hard-rule paths for `prepayment` and `cancellation` (these are fixed by policy)

### Constraints & Assumptions

- Constraints:
  - All template writes must go through a human-review gate before being committed to `email-templates.json`
  - Prepayment and cancellation template bodies are legally fixed — must never enter the improvement pipeline
  - The slot syntax must be backward-compatible: templates without slots continue to work identically
  - No new runtime dependencies (no LLM calls inside MCP server tools — Claude Code remains the refinement actor)
- Assumptions:
  - `draft_refine` is called on every `ops-inbox` path that writes a new Gmail draft. **Verification required before TASK-02:** audit `ops-inbox` SKILL.md branching logic to confirm every path that calls `gmail_create_draft` also calls `draft_refine`. Paths that skip `draft_refine` produce orphaned selection events (acceptable) — but if `gmail_create_draft` can be reached without calling `draft_refine`, the signal join is silently broken for those sessions. If any such path exists, it must be updated as part of TASK-02.
  - `draft_generate` remains the source of truth for selection metadata (`template_used`, ranker candidate set)
  - Edit distance between original and refined body, combined with `rewrite_reason`, is a reliable proxy for template fitness. Edit distance alone conflates stylistic rewrites with structural wrongness — `rewrite_reason` is the primary filter for proposal generation; edit distance provides a secondary severity signal.
  - Human (Pete/Cristiana) will review and approve template proposals during or after sessions — not automated

---

## Evidence Audit (Current State)

### Entry Points

- `packages/mcp-server/src/tools/draft-generate.ts` — orchestrates template selection, gap-fill, and body assembly
- `packages/mcp-server/src/tools/draft-refine.ts` — attestation layer; currently stateless (no writes)
- `packages/mcp-server/src/utils/template-ranker.ts` — BM25 ranker, synonym expansion, hard-rule fast-path
- `packages/mcp-server/data/email-templates.json` — 53 templates T01–T53, verbatim string bodies

### Key Modules / Files

- `packages/mcp-server/src/tools/draft-generate.ts` — `buildGapFillResult()` at line 816 (gap-fill assembly); `handleDraftGenerateTool()` at lines 1107–1329; garbled keyword interpolation at line 875–883
- `packages/mcp-server/src/utils/template-ranker.ts` — `rankTemplates()`, `buildCandidate()`, `applyThresholds()`; confidence: `matchedTerms.size / queryTerms.size * 100`
- `packages/mcp-server/src/utils/coverage.ts` — `extractQuestionKeywords()` at line 24; lacks punctuation stripping beyond `?`
- `packages/mcp-server/src/tools/reviewed-ledger.ts` — full ledger CRUD; `ingestUnknownAnswerEntries()`, `promoteReviewedLedgerEntry()`
- `packages/mcp-server/data/reviewed-learning-ledger.jsonl` — 2 existing entries; append-only JSONL
- `packages/mcp-server/src/resources/brikette-knowledge.ts` — merges active reviewed promotions into `brikette://faq` payload before draft generation

### Patterns & Conventions Observed

- Hard-rule fast-path bypasses BM25 for `prepayment` and `cancellation` — evidence: `template-ranker.ts:254–302`
- `HARD_RULE_CATEGORIES` constant controls which categories are protected — evidence: `template-ranker.ts:150`
- `personalizeGreeting()` is the only existing dynamic substitution (replaces `"Dear Guest,"`) — evidence: `draft-generate.ts:1015–1026`
- Templates use `\r\n` line endings, full greeting-to-sign-off bodies — evidence: `email-templates.json` (T22 example)
- `normalization_batch` field tracks revision history (A/B/C/D) — can be extended for improvement versioning
- `reviewed-learning-promotions.json` uses key format `faq:{sha256_hash}` with `status: "active"` — evidence: `reviewed-ledger.ts`

### Data & Contracts

- Types/schemas/events:
  - `EmailTemplate`: `{ subject, body, category, template_id, reference_scope, canonical_reference_url, normalization_batch }`
  - `RankResult`: `{ selection: "auto"|"suggest"|"none", candidates: RankedCandidate[] }`
  - `RankedCandidate`: `{ subject, category, confidence, evidence: string[] }`
  - `LearningLedgerEntry`: `{ question_hash, question_text, review_state, created_at, ... }`
- Persistence:
  - `email-templates.json` — master template store, read at tool call time
  - `reviewed-learning-ledger.jsonl` — append-only, unknown questions
  - `reviewed-learning-promotions.json` — approved answers keyed by `faq:{hash}`, read through `readActiveFaqPromotions()` into `brikette://faq`
  - **Missing:** joined selection/refinement signal event log with correlation id (`draft_id`)
- API/contracts:
  - `draft_refine` returns `{ draft, refinement_applied, refinement_source, quality }` — no writes
  - `draft_generate` returns `template_used` and `ranker` metadata, but no correlation id for refinement telemetry joining yet

### Dependency & Impact Map

- Upstream dependencies:
  - `draft_interpret` must produce `actionPlan.scenario.category` and `actionPlan.scenarios[0]` for ranker `categoryHint`
  - `draft_generate` must produce a `draft_id` and carry selection metadata in a persisted event record for later refinement join
- Downstream dependents:
  - `ops-inbox` skill consumes `draft_refine` output and passes it to `gmail_create_draft`
  - Any future agent using the draft pipeline
- Likely blast radius:
  - Template slot changes touch `email-templates.json` (53 templates) and `personalizeGreeting()` / assembly logic
  - Signal capture touches `draft-generate.ts`, `draft-refine.ts`, and telemetry storage utilities (join via `draft_id`)
  - Ranker correction touches `template-ranker.ts` and at least one calibrate tool registration path (`tools/index.ts`)

---

## Bugs to Fix Immediately (Pre-requisite)

### Bug 1: Garbled gap-fill escalation sentence

**Location:** `packages/mcp-server/src/utils/coverage.ts:24` and `draft-generate.ts:875–883`

`extractQuestionKeywords()` (line 24) splits on whitespace, lowercases, drops stop-words by length/list — but strips only `?` characters (`.replace(/\?/g, "")`). Any other punctuation such as commas, exclamation marks, or colons survives. `"Hi,"` (length 3, not in STOP_WORDS) passes the filter unchanged. At `draft-generate.ts:875`, `keywords.join(", ")` produces the topic string interpolated into:
> `"For your question about hi,, wondered, was, any, we can confirm..."`

**Fix:** Strip non-alphanumeric characters from each token in `extractQuestionKeywords()` before filtering. Alternatively, replace the keyword-fragment sentence entirely with the escalation sentence from the skill:
> `"For this specific question we want to give you the most accurate answer — Pete or Cristiana will follow up with you directly."`

The latter is safer and removes the brittle keyword-to-prose path entirely.

### Bug 2: Learning ledger never fires for quality failures

**Location:** `draft-generate.ts:1272` (and again at line 1299)

Condition at line 1272: `quality.failed_checks.includes("missing_question_coverage")`
Actual key emitted by `draft-quality-check.ts:455–456`: `"unanswered_questions"`

The same wrong key is used twice: line 1272 (trigger condition) and line 1299 (reasons array). Both must be changed.

**Fix:** Change both occurrences in `draft-generate.ts` (lines 1272 and 1299) to `"unanswered_questions"`.

### Bug 3: Approved promotions are read back but not deterministically prioritized

**Location:** `brikette-knowledge.ts` + `draft-generate.ts` knowledge extraction/ranking

Promotions are already read via `readActiveFaqPromotions()` and merged into `brikette://faq`. The actual gap is deterministic prioritization: promoted answers are currently mixed with generic FAQ items and may not be selected for the exact unanswered question.

**Fix:** Preserve `question_hash`/`promoted_key` through FAQ snippet extraction, then add an exact-match fast-path in `buildGapFillResult()` (`draft-generate.ts:816`):
1. import and call `hashQuestion()` (`reviewed-ledger.ts:161`) on each uncovered question to derive a SHA-256 hex key
2. if an active promotion with matching `faq:{hash}` key exists in the promotions map, inject that answer as the first snippet for that question
3. fall back to score-ranked generic snippets only when no exact promotion exists

Both `buildGapFillResult` (confirmed at `draft-generate.ts:816`) and `hashQuestion` (confirmed at `reviewed-ledger.ts:161`, exported) exist under these exact names.

---

## Proposed Architecture: Self-Improving Loop

### Layer 1: Two-Stage Signal Capture (`draft_generate` + `draft_refine`)

Selection metadata and refinement outcomes should be captured at their native source, then joined by a shared `draft_id`.

**New file:** `packages/mcp-server/data/draft-signal-events.jsonl` (append-only JSONL)

**Signal event schema:**
```typescript
type DraftSignalEvent =
  | {
      event: "selection";
      draft_id: string; // UUID emitted by draft_generate
      timestamp: string;
      scenario_category: ScenarioCategory;
      selected_template_id: string | null;
      selected_template_category: ScenarioCategory | null;
      ranker_selection: "auto" | "suggest" | "none";
      ranker_confidence: number;
      candidate_template_ids: string[];
      question_hashes: string[];
    }
  | {
      event: "refinement";
      draft_id: string; // passed into draft_refine
      timestamp: string;
      refinement_applied: boolean;
      edit_distance_pct: number;
      outcome: "accepted" | "light-edit" | "heavy-rewrite" | "wrong-template";
      rewrite_reason: "style" | "wrong-template" | "missing-info" | "language-adapt" | "none";
      question_count: number;
      original_body_hash: string;
      refined_body_hash: string;
    };
```

This avoids widening `draft_refine` with ranker internals and prevents caller-side metadata drift.

### Layer 2: Ranker Template Priors

**New file:** `packages/mcp-server/data/ranker-template-priors.json`

Schema: `Record<ScenarioCategory, Record<template_id, prior_delta>>`

Example after a few sessions of `payment` scenario always being rewritten when "Group Booking" is selected:
```json
{
  "payment": {
    "T_GROUP_BOOKING": -30,
    "T_PREPAYMENT_CHASE_1": +20
  }
}
```

**How it works:**
- At ranker startup, load `ranker-template-priors.json`
- For each candidate, apply bounded prior to both ordering and selection confidence:
  - `adjustedScore = bm25Score + priorDelta / 100`
  - `adjustedConfidence = clamp(baseConfidence + priorDelta, 0, 100)`
- Keep priors capped at ±30 to prevent runaway drift
- Use `adjustedConfidence` in thresholding (`auto/suggest/none`) so corrections actually influence selection behavior

**How priors are updated:**
- New tool: `draft_ranker_calibrate` — reads joined selection/refinement events from `draft-signal-events.jsonl`, aggregates by `(scenario_category, selected_template_id)`, computes bounded deltas (`accepted=+4, light-edit=0, heavy-rewrite=-8, wrong-template=-16`), writes `ranker-template-priors.json`
- **Calibration delta rationale:** Wrong-template events are rarer and more damaging than accepted events, so the asymmetric ratio (−16 vs +4, i.e. 1 wrong-template costs as much as 4 accepted events) is intentional. Validate this ratio after the first calibration run — if priors drift too aggressively for low-volume categories, reduce the `wrong-template` delta.
- **Joining policy:** A selection event without a matching refinement event (e.g. session interrupted between `draft_generate` and `draft_refine`) is treated as an orphan and excluded from calibration. A refinement event without a matching selection event is also excluded. Orphans are logged but do not contribute to priors.
- **Threshold values are provisional:** The `<12%/35%/70%` boundaries were set without historical edit-distance data. Empirical note from the 2026-02-20 session: the Daniel Schmidt email was a category mismatch (group booking selected for a payment follow-up) with near-total rewrite — clearly `wrong-template` territory (estimated >70%). The Hayden Roberts email had one garbled sentence corrected — estimated `light-edit` territory (5–15%). This confirms the poles are in the right direction but the interior boundaries (`12%`, `35%`) should be reviewed after the first 10 joined events in TASK-02. **Do not build TASK-04 (proposal pipeline) or TASK-05 (ranker priors) until the boundary values have been validated by observed data.**
- This runs manually after ≥20 joined events (minimum sample gate), then optionally at end-of-session when sample gate is met

### Layer 3: Template Improvement Pipeline

**Trigger:** On joined event pairs (`selection` + `refinement`) when `outcome` is `heavy-rewrite` or `wrong-template` AND `rewrite_reason` is `"wrong-template"` or `"missing-info"` (not `"style"` or `"language-adapt"`), and category is not in `HARD_RULE_CATEGORIES`. Using `rewrite_reason` as a secondary filter prevents stylistic rewrites from flooding the proposal queue with cosmetic patches.

**PII redaction mechanism:** Before writing proposal bodies, apply a redaction pass using regex patterns:
- Email addresses: `[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}` → `[EMAIL]`
- Booking references: `[A-Z]{2,}[0-9A-Z]{4,}` (e.g. `MA4BJ9`) → `[BOOKING_REF]`
- Phone numbers: `[\+]?[(]?[0-9]{2,4}[)]?[\s.\-]?[(]?[0-9]{2,4}[)]?[\s.\-]?[0-9]{3,5}[\s.\-]?[0-9]{3,5}` → `[PHONE]`
- Personal names in greeting lines: strip the personalised greeting line entirely (it is always regenerated by `personalizeGreeting()`)
Set `pii_redaction_applied: true` after the pass. The `previous_body_redacted` field stores the original verbatim template body (which has no guest PII by design) and does not need redaction.

1. Compute edit distance and classify as patch vs. new-template candidate:
   - Same category, edit_distance_pct < 70 → **patch candidate** (improve existing template)
   - Different category OR edit_distance_pct ≥ 70 → **new template candidate**

2. Write a proposal record to `packages/mcp-server/data/template-proposals.jsonl`:
```typescript
interface TemplateProposal {
  proposal_id: string;          // UUID
  timestamp: string;
  type: "patch" | "new";
  source_template_id: string | null;
  scenario_category: ScenarioCategory;
  previous_body_redacted: string; // current template body before patch (enables rollback without git)
  original_body_redacted: string; // the draft body as generated (pre-refinement), PII-stripped
  proposed_body_redacted: string; // the refined body proposed as new template, PII-stripped
  email_subject: string;        // original email subject for context
  rewrite_reason: "style" | "wrong-template" | "missing-info" | "language-adapt" | "none";
  edit_distance_pct: number;
  pii_redaction_applied: boolean;
  retention_expires_at: string; // ISO 8601, default now + 90 days
  review_state: "pending" | "approved" | "rejected";
  approved_at: string | null;
  approved_by: string | null;
}
```

3. New tool: `draft_template_review` — lists pending proposals with diff view (original vs proposed), accepts `approve` or `reject` action, and on approval:
   - For **patch**: updates `body` in `email-templates.json` for the matching `template_id`, increments `normalization_batch` suffix (e.g. `"D"` → `"E"`)
   - For **new**: appends a new template entry to `email-templates.json` with auto-assigned `template_id` (next T-number), derived `subject` from the refined body's first sentence, and `category` from the action plan

### Layer 4: Template Slot / Injection System

**Problem:** Templates are verbatim strings. Knowledge injection currently appends snippets at the end of the body as new paragraphs, which produces awkward copy. Booking details, CTAs, and policy notes all need declared insertion points.

**Slot syntax:** `{{SLOT:name}}` within template body strings.

**Standard slots:**

| Slot | Filled by | Description |
|------|-----------|-------------|
| `{{SLOT:GREETING}}` | `personalizeGreeting()` | `Dear {name},` — already partially exists, formalise |
| `{{SLOT:KNOWLEDGE_INJECTION}}` | `buildGapFillResult()` | Where knowledge snippets are injected inline |
| `{{SLOT:BOOKING_REF}}` | template assembly | Booking reference number if present in action plan |
| `{{SLOT:CTA}}` | template assembly | Optional book-direct or contact CTA |
| `{{SLOT:POLICY_NOTE}}` | `evaluatePolicy()` | Policy-specific addendum (age restriction, cancellation notice) |

**Backward compatibility rule:** If no `{{SLOT:KNOWLEDGE_INJECTION}}` is present in a template, knowledge injection falls back to current behaviour (append at end). Unresolved slots are silently removed before output. Existing templates work unchanged.

**Migration:** Templates are migrated to use slots incrementally — only templates that participate in the improvement pipeline need to be updated. A migration is not required for launch.

**Deferred benefit:** The UX improvement described above (knowledge injection inline rather than appended at end) does not materialise until a template has been migrated to include `{{SLOT:KNOWLEDGE_INJECTION}}`. Until then, injection falls back to the current append-at-end behaviour. TASK-07 (migrate 5–10 high-value templates) is a prerequisite for realising the Layer 4 UX benefit, not a post-launch nice-to-have.

**Example migrated template body:**
```
{{SLOT:GREETING}}

Thank you for following up on your reservation.

We apologise for the delay in getting the payment processed. {{SLOT:KNOWLEDGE_INJECTION}}

Your booking{{SLOT:BOOKING_REF}} remains in our system and we look forward to welcoming you to Hostel Brikette in Positano.

{{SLOT:CTA}}

Warm regards,
Peter & Cristiana
Hostel Brikette, Positano
```

This allows the payment-follow-up template to be reused for any variant of the payment scenario by injecting different knowledge snippets and CTAs at the declared points.

### Layer 5: Session Summary Integration (ops-inbox)

At end of each session, `ops-inbox` reports:
- N selection events, N refinement events, and N joined signals captured this session
- N template proposals pending review (with one-line summaries)
- Prompt: `"Run draft_ranker_calibrate?"` when ≥20 joined signals are available since last calibration
- **Backlog escalation:** If pending proposal count exceeds 10, surface a warning: `"N proposals pending — consider a dedicated review session before this queue grows further."` Proposals older than 30 days without review are auto-marked `rejected` and excluded from future calibration to prevent stale data corrupting priors.

---

## Questions

### Resolved

- Q: Does `draft_refine` already write anything to disk?
  - A: No — it is stateless. It should capture only refinement outcomes, while `draft_generate` captures selection metadata.
  - Evidence: `packages/mcp-server/src/tools/draft-refine.ts`

- Q: Are `prepayment` and `cancellation` templates safe to include in the improvement pipeline?
  - A: No — `HARD_RULE_CATEGORIES` in `template-ranker.ts:150` marks these as legally fixed. The improvement pipeline must exclude them.
  - Evidence: `template-ranker.ts:150,254–302`

- Q: Is the learning ledger usable as the signal store?
  - A: It handles unknown questions only. Use a separate event log for ranking/refinement signals.
  - Evidence: `reviewed-ledger.ts` — scope is `review_state` lifecycle, not signal accumulation

- Q: Which threshold policy should drive proposal creation?
  - A: Lock thresholds to reduce operator noise while still capturing meaningful drift:
    - `<12%` → `accepted`
    - `12–34%` → `light-edit`
    - `35–69%` → `heavy-rewrite`
    - `>=70%` (or explicit category mismatch) → `wrong-template`
  - Proposal trigger: only `heavy-rewrite` and `wrong-template`.

- Q: Should proposal approval be async or inline?
  - A: Async review is the long-term default. Capture proposals during processing, review in a dedicated `draft_template_review` step, and batch approve/reject outside the inbox response loop.

---

## Confidence Inputs

- Implementation: 89% — pipeline entry/exit points and required contract changes are now explicit (`draft_id`, event join, tool registration)
  - Raises to 90%: add a concrete fixture proving selection/refinement event join in tests
- Approach: 88% — signal → bounded priors → proposal → human approval is coherent and policy-safe
  - Raises to 90%: run one end-to-end dry run with 20+ joined events to validate prior calibration behavior
- Impact: 89% — bugs are reproducible in current artifacts and degrade output quality
  - Bug 1 (garbled gap-fill) evidence: observed directly in session output — Hayden Roberts draft contained `"For your question about hi,, wondered, was, any..."` traceable to `coverage.ts:24` keyword-join path
  - Bug 2 (key mismatch) evidence: `reviewed-learning-ledger.jsonl` has only 2 entries despite many quality-gate failures — consistent with the ledger trigger being dead code
  - Bug 3 (promotion prioritization) evidence: `reviewed-learning-promotions.json` is populated but promotions are not deterministically preferred over generic FAQ snippets in `buildGapFillResult()`
- Delivery-Readiness: 85% — blast radius now includes required router/registration changes
- Testability: 84% — signal join, slot resolution, and calibrator deltas are testable with deterministic fixtures

---

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Template priors drift or conflict across scenarios | Medium | Medium | Cap priors at ±30; enforce minimum sample gate (>=20 joined events); reset priors on deliberate template rebuild |
| Priors fail to influence selection despite changing candidate order | Medium | High | Apply priors to both score ordering and threshold confidence (`adjustedConfidence`) |
| Template proposal approved with incorrect body introduces regression | Low | High | Mandatory human approval gate before write; `previous_body_redacted` field in `template-proposals.jsonl` preserves the prior body for targeted rollback. Full file rollback via git revert of `email-templates.json` remains available as a fallback. |
| Slot syntax breaks existing template bodies if incorrectly parsed | Low | High | Strict regex for slot detection; fallback to full-body if slot not found |
| Edit distance calculation is slow for long bodies | Low | Low | Use token-level diff (split on whitespace) rather than character Levenshtein |
| Signal/proposal files grow unbounded across sessions | Low | Low | 90-day retention with compaction task; archive summarized aggregates before purge |
| Proposal artifacts accidentally persist PII | Medium | High | Redact guest email/phone/booking refs using defined regex patterns before write; template bodies (`previous_body_redacted`) contain no guest PII by design and need no redaction |
| `HARD_RULE_CATEGORIES` check accidentally excluded from proposal pipeline | Low | High | Centralise the check in a single `isHardRuleProtected(category)` guard used by both ranker and proposal writer |
| Ranker priors converge toward "templates Claude doesn't rewrite" rather than "templates correctly matched" (Goodhart risk) | Medium | Medium | `rewrite_reason` field filters out `"style"` and `"language-adapt"` rewrites from proposal generation; priors only receive negative signals from `"wrong-template"` and `"missing-info"` events — not from stylistic polish |
| Edit distance alone conflates stylistic rewrites with structural wrongness, flooding proposal queue with cosmetic patches | Medium | Medium | `rewrite_reason` is the primary trigger gate for proposals; edit distance is secondary severity only. Validate `rewrite_reason` distribution after first 20 joined events. |

---

## Planning Constraints & Notes

- Must-follow patterns:
  - All template writes must go via the human-approval proposal system — never auto-write to `email-templates.json`
  - Hard-rule categories (`prepayment`, `cancellation`) remain observable in telemetry but are excluded from priors and template proposals
  - JSONL files are append-only; no in-place mutations
  - Slot resolution must be idempotent: calling it twice with same inputs produces same output
- Rollout/rollback expectations:
  - Bug fixes (Bug 1, 2, 3) can ship first as an independent quality slice
  - Selection/refinement signal capture can ship before priors/proposals if `draft_id` is introduced first
  - Slot system can be introduced incrementally (no mandatory migration)
- Observability expectations:
  - Session summary in `ops-inbox` surfaces pending proposal count
  - `draft_generate` should return `draft_id` alongside existing `ranker.selection` and `template_used` to support signal joins

---

## Suggested Task Seeds (Non-binding)

1. **TASK-01 (Bug fixes):** Fix `extractQuestionKeywords()` punctuation stripping; fix learning ledger key mismatch (`"missing_question_coverage"` → `"unanswered_questions"`); add exact-match promotion prioritization in gap-fill
2. **TASK-02 (Signal capture):** Introduce `draft_id`; write `selection` event in `draft_generate` and `refinement` event (including `rewrite_reason` populated by Claude) in `draft_refine` to `draft-signal-events.jsonl`; add edit-distance calculation (token-level diff). **Verification prerequisite:** audit `ops-inbox` SKILL.md and confirm every `gmail_create_draft` path calls `draft_refine` first; fix any gaps. **Validation gate (blocks TASK-04 and TASK-05):** after first 10 joined events, report observed `edit_distance_pct` distribution and `rewrite_reason` distribution; confirm `<12%/35%/70%` boundaries are reasonable before the proposal pipeline is built.
3. **TASK-03 (Slot system):** Define `SlotResolver` utility with `resolveSlots(body, slots: Record<string, string>)`; integrate into template assembly; update `personalizeGreeting()` to use `SLOT:GREETING`
4. **TASK-04 (Template proposal pipeline):** Generate proposals from joined events; write redacted `template-proposals.jsonl`; implement `draft_template_review` MCP tool (list, diff, approve, reject, write-back)
5. **TASK-05 (Ranker priors):** Implement `draft_ranker_calibrate`; load `ranker-template-priors.json` at ranker startup; apply priors to candidate ordering + threshold confidence
6. **TASK-06 (Session summary integration):** Add joined-signal/proposal counts to `ops-inbox` summary; surface `draft_ranker_calibrate` prompt when ≥20 joined signals accumulated
7. **TASK-07 (Migrate high-value templates to slots):** Migrate 5–10 most-used non-protected templates (payment, check-in, FAQ, transport) to `{{SLOT:GREETING}}` and `{{SLOT:KNOWLEDGE_INJECTION}}`

---

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - Bug fixes verified by unit tests
  - Signal capture: joined `selection` + `refinement` events written to `draft-signal-events.jsonl` with matching `draft_id`
  - Slot resolution: unit tests confirm slots filled / missing slots silently removed
  - Template proposal: redacted `template-proposals.jsonl` entry created on heavy-rewrite/wrong-template; `draft_template_review` approve path writes to `email-templates.json`
  - Ranker priors: `ranker-template-priors.json` updated by calibrate tool; ranker tests confirm priors affect thresholding and candidate order
- Post-delivery measurement plan:
  - Track `edit_distance_pct` trend per session — expect decline over time as templates improve
  - Track `outcome: "wrong-template"` frequency per scenario category — expect decline after priors accumulate
  - Track `template_proposals.jsonl` proposal acceptance rate — signal of proposal quality

---

## Evidence Gap Review

### Gaps Addressed

- Template structure fully confirmed by reading `email-templates.json` directly
- Ranker algorithm confirmed by reading `template-ranker.ts` in full
- Gap-fill bug root cause confirmed at exact file + line (`coverage.ts:24`, `draft-generate.ts:875–883`)
- Learning ledger key mismatch confirmed (`draft-generate.ts:1272` vs `draft-quality-check.ts:455–456`)
- Promotion read-back path confirmed via `readActiveFaqPromotions()` merged into `brikette://faq`
- `buildGapFillResult()` confirmed at `draft-generate.ts:816`; `hashQuestion()` confirmed at `reviewed-ledger.ts:161` (exported)
- `draft_refine` confirmed stateless — no file writes; `draft_generate` return shape confirmed: no `draft_id` yet
- `HARD_RULE_CATEGORIES` confirmed at `template-ranker.ts:150`: `["prepayment", "cancellation"]`

### Confidence Adjustments

- Edit-distance implementation: token-level diff preferred over character Levenshtein to avoid dependency bloat and keep runtime deterministic
- Slot migration scope: scoped to incremental / voluntary migration — no forced migration of all 53 templates
- Proposal trigger now uses `rewrite_reason` as primary gate, edit distance as secondary severity — reduces Goodhart risk and prevents stylistic-rewrite proposals
- Rollback mechanism: `previous_body_redacted` in `template-proposals.jsonl` replaces the misleading `normalization_batch` rollback claim

### Remaining Assumptions

- Token-diff thresholds (`12%/35%/70%`) are provisional — validate against first 10 joined events in TASK-02 before TASK-04/05 proceed
- `draft_refine` is called on every path that writes a new Gmail draft — needs explicit verification in TASK-02
- Human review cadence for template proposals is practical — Pete/Cristiana will batch-review during or after inbox sessions; backlog escalation triggers at >10 pending proposals

---

## Planning Readiness

- Status: Ready-for-planning
- Blocking items:
  - TASK-01 (bug fixes) can proceed immediately — fully evidenced
  - TASK-02 (signal capture) can proceed; must include `draft_refine` call-coverage audit as a prerequisite step
  - TASK-03 (slot system) can proceed independently
  - **TASK-04 and TASK-05 are gated:** the plan must encode an explicit dependency on TASK-02's calibration validation gate (observe 10 joined events, confirm threshold boundaries) before TASK-04 (proposal pipeline) or TASK-05 (ranker priors) are built
- Recommended next step: `/lp-do-plan` with this fact-find as input; encode TASK-02 → TASK-04/05 dependency in the task dependency graph
