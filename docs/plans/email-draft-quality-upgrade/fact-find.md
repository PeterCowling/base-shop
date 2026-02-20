---
Feature-Slug: email-draft-quality-upgrade
Business-Unit: brikette
Card-ID: ~new~
Status: Ready-for-planning
Outcome: planning
Execution-Track: mixed
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: none
Date: 2026-02-18
---

# Fact-Find: Email Draft Quality Upgrade

## Scope

Rapid improvement of Gmail draft quality produced by the Brikette customer reception system (`/ops-inbox`). The focus is on two user-stated pain points:

1. **Insufficient composable email elements** — system cannot assemble a coherent response to a multi-question email.
2. **AI underinvolved in reading and understanding emails** — interpretation and composition pipelines are almost entirely rule-based; AI/LLM reasoning is absent from the MCP tool layer.

---

## System Map (Current State)

```
/ops-inbox (Claude skill)
  └─ gmail_organize_inbox → gmail_list_pending → gmail_get_email
       └─ draft_interpret  [1]
            └─ EmailActionPlan
                 └─ draft_generate  [2]
                      └─ {draft.bodyPlain, draft.bodyHtml, knowledge_summaries, ...}
                           └─ draft_quality_check  [3]
                                └─ gmail_create_draft
```

All three MCP tools [1][2][3] are **100% deterministic TypeScript** — zero LLM/AI calls. Claude (the skill operator) runs the pipeline but has no opportunity to reason about content inside any tool step.

### Key source files

| File | Role |
|---|---|
| `packages/mcp-server/src/tools/draft-interpret.ts` | Email → EmailActionPlan (regex + keyword) |
| `packages/mcp-server/src/tools/draft-generate.ts` | EmailActionPlan → draft body (BM25 template ranking) |
| `packages/mcp-server/src/tools/draft-quality-check.ts` | Validate draft coverage |
| `packages/mcp-server/src/utils/template-ranker.ts` | BM25 + hard-rule template selection |
| `packages/mcp-server/data/email-templates.json` | 44 canonical templates, 19 categories |
| `packages/mcp-server/data/draft-guide.json` | Length/tone/content rules |
| `packages/mcp-server/data/voice-examples.json` | Per-scenario tone reference |
| `packages/mcp-server/data/policy-reference.json` | Policies source of truth |
| `.claude/skills/ops-inbox/SKILL.md` | Claude operator instructions |

---

## Gap Analysis

### GAP-1 (Critical) — Single-category classification breaks multi-question emails

`classifyScenario()` in `draft-interpret.ts` iterates a rule list and **returns on first match**:

```typescript
for (const rule of rules) {
  if (rule.pattern.test(lower)) {
    return { category: rule.category, confidence: rule.confidence };
  }
}
```

An email asking "Is breakfast included? What time can we check in? Can we store luggage?" is classified as `breakfast` only. The `check-in` and `luggage` questions appear in `intents.questions` but the single-category scenario causes template ranking and composite assembly to operate entirely within the breakfast category.

**`EmailActionPlan.scenario` is typed as a single object**, not an array. The entire downstream pipeline (template ranking, quality check, length calibration, voice selection) uses one `category`. This is a structural constraint, not just a logic flaw.

---

### GAP-2 (Critical) — Knowledge summaries are computed but never injected into draft body

In `draft-generate.ts`, `loadKnowledgeSummaries()` scores FAQ/policy/room/pricing snippets against the email's terms and returns ranked hits — but the output is attached as metadata only and never used to enrich the draft body:

```typescript
const knowledgeSummaries = await loadKnowledgeSummaries(knowledgeUris, { ... });
// ...
return jsonResult({
  knowledge_summaries: knowledgeSummaries,   // ← metadata only, not used in body
  ...
});
```

The ops-inbox skill doesn't instruct Claude to use `knowledge_summaries` to patch unanswered questions. The knowledge is fetched, scored, and discarded.

**Pipeline ordering constraint:** `quality.question_coverage` — which identifies which questions are missing answers — is produced by `draft_quality_check`, which runs *after* `draft_generate`. Any gap-filling logic that references coverage data must respect this ordering. Three viable patterns are considered in the Proposed Improvements section; **Pattern A (shared coverage module)** is selected.

---

### GAP-3 (Critical) — No LLM step anywhere in the MCP tool pipeline

`draft_interpret` and `draft_generate` contain zero calls to any AI model. All interpretation is regex/keyword matching. All generation is template concatenation with BM25 scoring. For nuanced emails (indirect questions, emotional context, non-standard phrasing), the system produces generic template output because no semantic reasoning occurs.

Claude participates only as the human-in-the-loop operator running the skill — not as a reasoner inside the tool chain.

---

### GAP-4 (High) — Template candidate limit of 3 cuts off multi-topic coverage

`DEFAULT_LIMIT = 3` in `template-ranker.ts`. Combined with single-category classification, even if the BM25 query produces relevant results, the cap prevents surfacing a template per question when there are 4+ questions.

`isComposite` in `draft-generate.ts` requires `questions.length >= 2 AND policyCandidates.length >= 2`. With single-category classification, policyCandidates may all come from one category, suppressing composite assembly even when the email clearly has multiple topics.

---

### GAP-5 (High) — ops-inbox skill doesn't instruct gap-patching

The skill instructs Claude to run `draft_generate` and present the output, but contains no instruction to use the returned `knowledge_summaries` or `quality.question_coverage` to patch missing answers before creating the draft.

Correct tactical flow should be:

```
draft_generate → draft_quality_check → (patch if unanswered_questions present) → draft_quality_check → gmail_create_draft
```

Without this, Claude has the knowledge and coverage data but no instruction to act on it.

---

### GAP-6 (Medium) — Per-category template selection misaligns with per-question coverage need

Current composite logic selects top-1 template per BM25 ranking. This fails for emails where two questions fall in the same category (e.g., "check-in time" and "luggage storage before check-in" both map to `check-in`) — a single template is selected for both, leaving one question unanswered. Conversely, emails with semantically distinct questions that happen to share a category keyword also lose coverage.

**Stronger alternative:** rank templates **per extracted question** (question text + context window as query), apply a soft category boost from `scenarios[]`, then select a minimal covering set via a knapsack heuristic (max question coverage, min template blocks, hard cap 3–5). This aligns template selection to user pain — multi-question coverage — rather than multi-category labeling.

---

### GAP-7 (Medium) — `assembleCompositeBody()` is mechanical concatenation

```typescript
const contentParts = templates.map((t) => extractContentBody(t.body));
return `${greeting}\n\nThank you for your email.\n\n${contentParts.join("\n\n")}`;
```

No bridging language, no ordered question-answer mapping, no removal of redundant phrases across parts. The result reads as multiple pasted templates. Per `draft-guide.json` format_decision_tree: "If multiple questions, use numbered list." — this is not currently implemented.

If per-question template selection (GAP-6 fix) is adopted, coherent assembly becomes straightforward: question order defines answer order; each block is attached to its originating question.

Both `bodyPlain` and `bodyHtml` must be updated consistently; composite logic tends to drift between formats.

---

### GAP-8 (Medium) — 12+ common scenarios have no template

Audit of `email-templates.json` against common guest inquiry patterns:

| Missing scenario | Evidenced by |
|---|---|
| Bar/terrace hours and access | FAQ item exists (`brikette://faq`), no template |
| Parking (no parking available) | Common question; no template |
| Pets policy | `policy-reference.json` covers it; no template |
| City tax explanation | `policy-reference.json` §check_in.city_tax; no template |
| Private room vs dormitory comparison | Room config exists; no template |
| Things to do in Positano (beyond Path of Gods) | Activities category has only one template |
| Receipt / invoice request | Payment category has no post-stay template |
| Group booking inquiry | Only "Room Capacity Clarification" exists |
| Out-of-hours check-in (fix: missing link) | Current template body contains "here" with no URL |
| Arriving by bus | Transportation has only ferry + general guides |

**Template quality concern:** several existing templates have placeholder links or stubs (e.g., "Out of hours check-in" template body is just "Please find our out of hours check-in process here." with no actual URL). A CI linter is needed.

---

### GAP-9 (Medium) — `extractRequests()` only matches 3 explicit patterns

```typescript
const patterns = [
  /please\s+([^\.\n\r\?]+)/i,
  /(can|could|would) you\s+([^\.\n\r\?]+)/i,
  /i would like\s+([^\.\n\r\?]+)/i,
];
```

Implicit requests ("We need to know about parking", "Tell us about the ferry", "We're thinking about the hike") are missed, so they don't appear in `actionPlan.intents.requests` and won't trigger coverage checks.

Pure regex doesn't scale here; a noun-phrase capture fallback ("information about X" → store X as request topic) and thread-aware extraction ("Also, about parking…" in replies) are more tractable short-term improvements.

---

### GAP-10 (Lower) — Thread context is partially implemented but underused

`summarizeThreadContext()` in `draft-interpret.ts` exists and produces `prior_commitments`, `open_questions`, `tone_history`. But:
- Thread messages are passed as snippets only (truncated), not full bodies — implicit references ("as discussed", "the link you sent") may not be captured
- Questions that appear in reply threads rather than the latest message body may be misidentified as new questions
- Quoted text is stripped by `normalizeThread()` but reply context is lost entirely

---

## What Works Well (Preserve)

- **Deterministic prepayment/cancellation hard-rules** — 100% confidence, `HARD_RULE_CATEGORIES`. Do not change; they must remain exclusive/dominant in any multi-scenario model.
- **Agreement detection** — nuanced with negation, contrast, confidence levels, `requires_human_confirmation`. Solid.
- **Escalation classification** — NONE/HIGH/CRITICAL with specific trigger taxonomy. Good.
- **Quality check stem-based coverage scoring** — works well for single-topic; foundation to build on.
- **HTML renderer** — branded, dual-signature, social footer. Don't change.
- **BM25 + synonym expansion** — good foundation; build on it, don't replace it.

---

## Proposed Improvements

### P1 — Multi-intent classification (code)

Change `classifyScenario()` to return `ScenarioClassification[]` — all rules above a relevance threshold — ordered by confidence.

**Critical safeguards:**

- **Per-rule confidence thresholds**, not a single global cutoff. High-specificity patterns (prepayment, cancellation) can stay at 0.88+. Broad patterns (faq, policies) should require a higher match density before triggering, to prevent false-positive explosion on incidental mentions.
- **Dominant/exclusive rule metadata:** Encode `dominant: true` and/or `exclusive: true` on hard-rule categories. If `cancellation` is detected at 0.88+, it appears first and the downstream pipeline must not dilute it with secondary topics (unless multi-topic response is explicitly desired for that category). This replaces reliance on rule order.
- **Backwards compatibility:** Add `scenarios: ScenarioClassification[]` to `EmailActionPlan` alongside the existing `scenario: ScenarioClassification` (the primary). All existing consumers continue to work. Increment an `actionPlanVersion` field (or add a schema version field) so downstream consumers can detect which model produced the plan.

**Files:** `draft-interpret.ts`, `EmailActionPlan` type export; update consumers in `draft-generate.ts` and `draft-quality-check.ts` to use `scenarios[]` where available.

---

### P2 — Knowledge injection for gap-filling via shared coverage module (Pattern A — selected)

**Pipeline constraint:** `quality.question_coverage` is produced by `draft_quality_check`, which runs after `draft_generate`. P2 cannot reference quality output from within `draft_generate`. Three patterns were considered:

- **Pattern A (selected):** Extract the coverage-scoring logic into a shared `coverage.ts` module used by both `draft_generate` (pre-check, then patch) and `draft_quality_check` (final validation). `draft_generate` runs coverage detection internally without waiting for `draft_quality_check`, then uses `knowledgeSummaries` to fill identified gaps before returning the draft.
- Pattern B: New `draft_refine` MCP tool stage — adds latency and API cost, deferred.
- Pattern C: Skill-layer only — viable short-term (see P4), but brittle long-term.

**Pattern A implementation:**

Extract `evaluateQuestionCoverage()` and related helpers from `draft-quality-check.ts` into `packages/mcp-server/src/utils/coverage.ts`. Import in both tools. In `draft_generate`, after initial body assembly, run `evaluateQuestionCoverage(bodyPlain, allIntents)`. For each question with `status: "missing"`, search `knowledgeSummaries` for a snippet above a relevance threshold and insert a targeted answer.

**Guardrails:**

- **Source precedence:** `policy-reference` snippets dominate over `faq` snippets; `faq` over `pricing`; `rooms` last. Define this as a constant priority array.
- **Quoting vs paraphrase:** For policy-critical topics (cancellation, payment, tax), prefer near-verbatim extraction from the source snippet, not free paraphrase. Record `sources_used: [{uri, snippetId}]` in the draft metadata for audit.
- **Confidence gating:** If no snippet meets a relevance threshold for a given question, do not invent an answer — emit a short escalation sentence: "I'd like to confirm this detail for you and will follow up shortly." Never hallucinate.
- **Answer placement:** Insert answers in numbered Q/A structure (per P6), not as appended paragraphs. Appended paragraphs read as patched.

**Files:** new `packages/mcp-server/src/utils/coverage.ts`; `draft-generate.ts`; `draft-quality-check.ts` (import shared module).

---

### P3 — Per-question template ranking (code)

Replace "per-category template ranking" with **per-question template ranking**:

1. For each `intents.questions[i]` (and `intents.requests[i]`), build a query: question text + a small context window from `normalized_text`.
2. Run `rankTemplates()` across all templates (not filtered by category) with a soft category boost from `scenarios[]`.
3. Apply a coverage/knapsack heuristic: select the minimal set of templates that maximises question coverage, with a hard cap of 3–5 template blocks.
4. Increase `DEFAULT_LIMIT` from 3 to 5 (trivially safe with 44 templates).

**Why per-question beats per-category:** Two questions in the same category ("check-in time" + "luggage storage before check-in") both map to `check-in`; per-category top-1 selection answers only one. Per-question selection independently finds "Arriving before check-in time" and "Luggage Storage — Before Check-in" as distinct best matches.

**Files:** `draft-generate.ts`, `template-ranker.ts`.

---

### P4 — Skill-layer gap-patching (ops-inbox, short-term)

Reorder the ops-inbox skill to run coverage-aware patching after `draft_quality_check`. Correct flow:

```
draft_generate → draft_quality_check → (if unanswered_questions present) patch → draft_quality_check → gmail_create_draft
```

Patch step instructions (to add to SKILL.md):
> "For each entry in `quality.failed_checks` with `unanswered_questions` and each `question_coverage` entry with `status: 'missing'` or `'partial'`: examine `knowledge_summaries` for a relevant snippet. If found (confidence > 0), compose one short answer paragraph from that snippet and insert it into the draft in numbered-list order. Use only content from knowledge_summaries or explicit policy docs — do not invent. Do not change any template text for cancellation or prepayment categories. Re-run `draft_quality_check` after patching."

**Strict bounds for this step:**
- Only answer using `knowledge_summaries` or explicit policy docs. If absent, escalate.
- Never modify cancellation/prepayment template language.
- Preserve all `draft-guide.json` constraints (length, tone, format).
- Always re-run `draft_quality_check` after patching.

**Files:** `.claude/skills/ops-inbox/SKILL.md`.

P4 is the quickest win and should be shipped before the code changes in P1–P3 are complete. It is explicitly a **short-term bridge**, not the long-term architecture (P2/Pattern A is).

---

### P5 — Add missing templates + CI linting (code + data)

Add 10 templates to `email-templates.json`:

| Subject | Category | Notes |
|---|---|---|
| Bar and Terrace — Hours and Access | faq | |
| Parking — Not Available Nearby Options | transportation | note nearby alternatives |
| Pets — Policy | policies | |
| City Tax — What to Expect at Check-in | check-in | near-verbatim from policy-reference |
| Private Room vs Dormitory — Comparison | booking-issues | |
| Things to Do in Positano | activities | |
| Receipt / Invoice Request | payment | |
| Group Booking — How It Works | booking-issues | |
| Out of Hours Check-In Instructions | check-in | fix: replace "here" stub with actual link |
| Arriving by Bus | transportation | |

**Template design constraints:**
- **Category precision:** City tax is `check-in` (collected at check-in); don't assign to `policies` to avoid weakening BM25 category boosts.
- **Placeholder convention:** Use `{{guest_name}}` consistently. Missing variables must degrade gracefully — no "undefined" in output.
- **Link integrity:** Add a CI lint check (or `template-lint.ts` rule) that fails if a template body contains "here" or "click here" with no URL in the same sentence. The current "Out of hours check-in" template fails this check.
- **Localization note:** Defer IT/ES template variants. Decide whether to fork templates per locale or apply locale as a rendering layer before adding locale-specific content.

**Files:** `packages/mcp-server/data/email-templates.json`, `packages/mcp-server/src/utils/template-lint.ts`.

---

### P6 — Coherent composite assembly (code)

Depends on P3 (per-question template selection). Once templates are selected per-question, assembly becomes straightforward:

- Question order (from `intents.questions[]`) defines answer order.
- For each question: attach the matched template block, or a knowledge-snippet answer (from P2), or an escalation line.
- Format as numbered list per `draft-guide.json` format_decision_tree.
- Remove duplicate phrases across blocks (duplicate greetings, repeated "Thank you for your email.").
- Apply once-only greeting and signature.
- Update both `bodyPlain` and `bodyHtml` from the same assembly logic — centralize in `assembleCompositeBody()` to prevent format drift.

**Files:** `draft-generate.ts`.

---

### P7 — Implicit request extraction improvement (code)

Extend `extractRequests()` patterns as a short-term measure:

```typescript
/(we need|we want|we'd like) (to know|information|details) (about|on)\s+([^\.\n\r?]+)/i
/(tell us|can you tell|could you tell) (us|me) (about|more about)\s+([^\.\n\r?]+)/i
/(interested in|thinking about|planning to)\s+([^\.\n\r?]+)/i
```

Add noun-phrase capture fallback: when pattern sees "information about X", store X as request topic even without explicit scenario mapping.

Add thread-aware extraction: "Also, about parking…" in reply threads lacks request verbs; detect topic-continuation fragments.

Note: if an LLM-assisted interpretation stage is added later, P7 becomes lower priority. Ship it as a cheap short-term improvement.

**Files:** `draft-interpret.ts`.

---

## Missing Workstreams

### W1 — Success metrics and evaluation harness (must plan)

No quantitative acceptance criteria exist for any improvement. Without these, "feels better" replaces "provably better." Add:

**Golden set:** 50–200 real anonymized emails labeled with extracted questions, expected answer coverage, required escalation vs safe-to-answer, tone/length constraints. Stored in `packages/mcp-server/data/test-fixtures/`.

**Metrics to track:**
- Question coverage rate (% of extracted questions with `status: covered`)
- Hallucination rate (draft claims not supported by templates or knowledge_summaries)
- Escalation precision/recall (are CRITICAL/HIGH escalations correctly routed?)
- Average draft length + variance per category
- "Template paste" indicators: duplicate greetings, repeated "Thank you for your email."

**Files:** new `packages/mcp-server/data/test-fixtures/`; new test in `__tests__/draft-pipeline.integration.test.ts`.

---

### W2 — Thread context / previous messages

Many multi-question emails are incremental follow-ups. If the pipeline reads only the last message body, it misinterprets references ("as discussed", "same as last time", "the link you sent"). Fixes:

- Pull the last N (e.g. 3) full messages in the thread for interpretation context, not just snippets.
- Detect quoted text and exclude it from intent extraction (avoid re-answering stale questions).
- Thread snippets are already truncated; ensure `gmail_get_email` with `includeThread: true` actually returns enough context for `summarizeThreadContext()`.

**Files:** `draft-interpret.ts`, `gmail.ts`, `ops-inbox/SKILL.md`.

---

### W3 — Policy-safe variable language

Drafts can over-promise if not guarded:

- Check-in times may differ by season.
- Luggage storage availability depends on staffing.
- Pricing and taxes may vary.
- "Parking" answer needs nearby-alternatives language, not a flat "no."

Consistent policy: prefer "generally" language for variable data; confirm when necessary; avoid hard commitments unless backed by `policy-reference.json` fields. This should be encoded in `draft-guide.json` content_rules as additional "never" and "if" entries, not just in SKILL.md.

**Files:** `packages/mcp-server/data/draft-guide.json`.

---

## Acceptance Gates (for planning)

Any task touching the core pipeline must pass these:

- [ ] **Backwards compatibility:** `scenario` singular remains on `EmailActionPlan`; `scenarios[]` is additive; `actionPlanVersion` field added.
- [ ] **Deterministic invariants preserved:** Cancellation and prepayment templates still trigger via hard-rule and are not diluted by multi-intent selection. Dominant/exclusive category metadata enforced.
- [ ] **No-regression tests:** A fixed set of single-topic emails produce identical (or strictly better) drafts. Changes gated behind a feature flag if needed.
- [ ] **Auditability:** When a knowledge snippet is injected, draft metadata includes `sources_used: [{uri, snippetId}]`. Injected sentences traceable to source.
- [ ] **Formatting guarantees:** Multi-question responses use numbered structure per `draft-guide.json`. No duplicate greetings or signatures. HTML and plain parity from shared assembly logic.
- [ ] **Template lint passes:** No template body contains "here" or "click here" without a URL. No `{{placeholder}}` tokens unresolved in output.

---

## Implementation Order

Dependencies govern the sequence:

```
P4 (skill patch — zero code)                    → ship immediately
P5 (templates + CI lint)                         → ship immediately

W1 (evaluation harness)                          → start alongside P4/P5; needed to measure P1–P3

shared coverage.ts module                        → required before P2; implement first
P1 (multi-intent classification)                 → independent; implement alongside coverage.ts
P3 (per-question template ranking)               → depends on P1 (scenarios[])
P6 (composite assembly)                          → depends on P3

P2 (knowledge injection)                         → depends on coverage.ts + P3

W2 (thread context)                              → independent; can overlap with P1–P3
W3 (policy-safe language in draft-guide.json)   → independent; low effort

P7 (implicit request extraction)                 → independent; lowest priority; deferred if LLM step planned
```

---

## Evidence Gap Review

### Gaps Addressed
- Full source of `draft-interpret.ts`, `draft-generate.ts`, `draft-quality-check.ts`, `template-ranker.ts` read and analysed
- All 44 templates in `email-templates.json` audited for coverage gaps and broken links
- `draft-guide.json`, `voice-examples.json`, `policy-reference.json` reviewed in full
- `ops-inbox/SKILL.md` fully read and skill flow mapped

### Confidence Adjustments
- Multi-intent classification gap: **confirmed by direct code inspection** — high confidence
- Knowledge injection gap: **confirmed** (`knowledgeSummaries` returned but unused) — high confidence
- No LLM in MCP tools: **confirmed** — all tool code is deterministic TypeScript — high confidence
- Pipeline ordering constraint for P2: **confirmed** — quality check runs after generate; Pattern A selected
- Template gap count (GAP-8): approximate; some scenarios may exist under a different subject wording

### Remaining Assumptions
- Pattern A (shared `coverage.ts`) is implementable without breaking existing test coverage of `draft-quality-check.ts`; verify during planning that `evaluateQuestionCoverage` can be extracted cleanly
- `DEFAULT_LIMIT 3 → 5` is safe at 44 templates; would need profiling if template count reaches hundreds
- Thread context improvements (W2) require validating that `gmail_get_email` with `includeThread: true` returns sufficient message body text, not only snippets — unverified

### Open Questions

1. Should knowledge injection (P2/Pattern A) eventually be replaced with an explicit LLM call (Pattern B's `draft_refine` tool)? If yes, how is latency/cost managed per email?
2. Are Italian or Spanish inbound emails common enough to justify locale-specific template variants in this release?
3. Is there an existing mechanism to collect feedback on draft quality (Pete rates drafts), or should W1 create one?
4. Should `actionPlanVersion` be a simple integer, or a semver string aligned with the MCP server package version?

---

## Fact-Find Complete

Brief saved to `docs/plans/email-draft-quality-upgrade/fact-find.md`.
Status: **Ready-for-planning**.
Primary execution skill: `lp-do-build`.
Evidence gap review complete.
Proceed to `/lp-do-plan` when ready.
