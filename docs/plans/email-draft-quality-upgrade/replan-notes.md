---
Type: Reference
Status: Active
---
# Replan Notes — Email Draft Quality Upgrade

## TASK-12: Knowledge Injection Approach Design

**Completed:** 2026-02-18
**Deliverable for:** TASK-07 (knowledge-aware drafting)

### Q1 — Citation marker stripping

Citation markers in the form `[faq:check-in-window]` or `[knowledge:wifi-password]` must be stripped
from any snippet text before injection into the draft body. If markers pass through, they appear
verbatim in guest-facing emails.

**Stripping regex:** `/\[[^\]]+\]\s*/g`

Apply via a `stripCitationMarkers(text: string): string` helper before assembling the draft body.

### Q2 — Pre-draft vs post-draft injection timing

**Decision: pre-draft injection (before the body-assembly step, currently around line 999 in draft-generate.ts).**

Rationale:
- Post-assembly injection would bypass `removeForbiddenPhrases` (line 1023) and `enforceLengthBounds`
  (line 1037). Injected text could contain forbidden phrases or push the body over the word-count ceiling.
- Pre-draft injection feeds through all existing quality gates in sequence: forbidden-phrase removal →
  length enforcement → quality check. No new bypass risk.

### Q3 — `sources_used` schema

Current `KnowledgeSnippet` type: `{ citation: string; text: string; score: number }`
Current `KnowledgeSummary` type: `{ uri: string; summary: string }`

Neither type has an `injected` flag. TASK-07 needs to track which retrieved snippets were actually
incorporated into the draft body (for transparency and auditing).

**Proposed `SourcesUsedEntry` schema:**
```typescript
interface SourcesUsedEntry {
  uri: string;       // resource URI (e.g. "brikette://faq/check-in")
  citation: string;  // human-readable citation key (e.g. "faq:check-in-window")
  text: string;      // snippet text (citation markers already stripped)
  score: number;     // BM25 retrieval score (0–1 normalised)
  injected: boolean; // true if the snippet text was incorporated into the draft body
}
```

The `sources_used` field in the tool output should be `SourcesUsedEntry[]`.
`injected: false` entries represent retrieved candidates that were scored but not incorporated.

### Q4 — Forbidden-phrase safety for knowledge snippets

Audit of current KnowledgeSnippet texts: no current snippet triggers `removeForbiddenPhrases`.

Risk: pricing or promotional snippets could contain pricing language that violates `never` rules in
`draft-guide.json`. Mitigation: add a category allowlist check — only inject snippets from categories
that cannot plausibly contain forbidden phrases (e.g. `check-in`, `checkout`, `wifi`, `luggage`).
Pricing and payment snippets require explicit allow-listing by the draft-guide author.

---

## TASK-13: Thread Snippet Sufficiency + Pattern Expansion

**Completed:** 2026-02-18
**Deliverable for:** TASK-08 (thread-aware extraction)

### Q1 — Snippet-only verdict

**Decision: snippet-only format (`format='metadata'`, 180-char cap) is sufficient.**

Evidence:
- FAQ-04 snippet: 51 chars ("Is breakfast included for direct bookings?") — clear topic signal.
- PAY-01 snippet: 93 chars ("Could you confirm the bank transfer details and IBAN?") — clear topic signal.
- All existing fixture snippets are well under the 180-char cap and contain enough keywords for
  `extractRequests()` pattern matching.

No change to `gmail.ts` is required for TASK-08.

### Q2 — format='full' upgrade path (rejected for TASK-08)

Upgrading to `format='full'` would require:
1. Changing 1 line in `gmail.ts` (`format: 'metadata'` → `format: 'full'`)
2. Extending `ThreadMessage` type to include `body?: string`
3. Updating `summarizeThreadContext` to use `body ?? snippet`

Latency impact: full message fetch significantly increases Gmail API latency for long threads.
Rejected for TASK-08 scope. Can be a future SPIKE if snippet-only proves insufficient in production.

### Q3 — Expanded pattern set

Expand `extractRequests()` from 3 patterns to 9:

```
// Existing (keep):
/(?:can you|could you|please)\s+([^\.\n\r\?]+)[\.\n\r\?]?/i
/i (?:would like|want|need)\s+([^\.\n\r\?]+)[\.\n\r\?]?/i
/(?:requesting|request for)\s+([^\.\n\r\?]+)[\.\n\r\?]?/i

// New additions:
/i was wondering\s+(?:if\s+)?([^\.\n\r\?]+)[\.\n\r\?]?/ig
/we would like\s+([^\.\n\r\?]+)[\.\n\r\?]?/ig
/we need\s+([^\.\n\r\?]+)[\.\n\r\?]?/ig
/i need\s+([^\.\n\r\?]+)[\.\n\r\?]?/ig
/would it be possible\s+(?:to\s+)?([^\.\n\r\?]+)[\.\n\r\?]?/ig
/please could you\s+([^\.\n\r\?]+)[\.\n\r\?]?/ig
```

Pattern covers FAQ-02 fixture: "I was wondering if breakfast is included for direct bookings" →
captures "breakfast is included for direct bookings".

### Q4 — Migration requirements

Three implementation requirements for the pattern expansion:

1. **Add `g` flag to all regexes** — change from `match()` to `matchAll()` so multi-instance
   patterns in a single message are all captured (not just the first match).

2. **Migrate to `matchAll()`** — `String.prototype.matchAll()` requires the `g` flag.
   Update each pattern call: `for (const m of text.matchAll(pattern))`.

3. **Cross-pattern deduplication guard** — when multiple patterns fire on the same sentence,
   the extracted text may be near-identical. Deduplicate by normalised text (lowercase + trim)
   before appending to the results array.

---

## TASK-07: Replan Evidence — Confidence Promotion 70% → 80%

**Date:** 2026-02-18
**Trigger:** TASK-12 Complete — all 4 questions answered. TASK-05+TASK-06+TASK-12 all Complete; all dependencies satisfied.

### Audit findings (E1 static, 2026-02-18)

| Surface | Finding |
|---|---|
| `draft-generate.ts:1036` | Body assembly begins: `let bodyPlain: string; if (isComposite) ...` |
| `draft-generate.ts:1087` | `loadKnowledgeSummaries` call — currently **after** body assembly; must be moved to before line 1036 |
| `draft-generate.ts:772` | `removeForbiddenPhrases(body, phrases): string` — runs at lines 1059, 819 |
| `draft-generate.ts:916` | `enforceLengthBounds(body, bounds): string` — runs at line 1073 |
| `draft-generate.ts:220-221` | `KnowledgeSummary = { uri, summary }`, `KnowledgeSnippet = { citation, text, score }` — private types |
| `draft-generate.ts:1136-1137` | `knowledge_summaries` in output payload — passive metadata only, not injected into body |
| `sources_used` | **Absent everywhere** — net-new field |
| `draft-quality-check.ts` | No awareness of knowledge or `sources_used` |
| `draft-generate.test.ts` | Zero assertions verify knowledge content appears in `bodyPlain`/`bodyHtml` |

### Confidence dimensions

| Dimension | Old | New | Justification |
|---|---|---|---|
| Implementation | 80% | 80% | Unchanged. Injection point: insert after line 1042, before `stripSignature` at line 1058. `loadKnowledgeSummaries` reorder from 1087→before 1036 is safe (context — actionPlan, normalizedText, intents — is available much earlier). `stripCitationMarkers` fully specified (Q1). `SourcesUsedEntry` schema fully specified (Q3). Remaining: relevance score threshold (builder decision, 0.5 recommended) and injection paragraph format. Held-back test passes: neither is a blocking unknown. |
| Approach | 70% | 80% | E3 uplift +10 (minimum range): TASK-12 explicitly resolved all three blocking concerns. (a) Citation markers → `stripCitationMarkers()` using `/\[[^\]]+\]\s*/g` (Q1). (b) Pre-draft injection ensures `removeForbiddenPhrases` and `enforceLengthBounds` both run after injection (Q2). (c) `sources_used` schema is `SourcesUsedEntry[]` with `injected: boolean` flag (Q3). (d) Category allowlist guards against forbidden-phrase bypass (Q4). Held-back test: category allowlist is conservative and `removeForbiddenPhrases` provides a second safety net. |
| Impact | 85% | 85% | Unchanged. |
| **Overall** | **70%** | **80%** | **min(80, 80, 85) = 80%** |

### Implementation notes for builder

1. **Move `loadKnowledgeSummaries` call**: from line 1087 to before body assembly at line 1036. All required context (`primaryScenarioCategory`, `normalizedText`, `intents`) is available from `actionPlan` well before this point.

2. **Injection logic** (new function, e.g. `injectKnowledgeGapFills`):
   - Check `preliminary_coverage` (from TASK-05's shared coverage module) for questions with `status: 'missing'` or `status: 'partial'`.
   - For each uncovered question, find the highest-scoring `KnowledgeSnippet` with `score >= 0.5`.
   - Category allowlist for safe injection: `['check-in', 'checkout', 'wifi', 'luggage', 'faq', 'general']`. Pricing/payment categories require explicit opt-in.
   - Strip citation markers from snippet text via `stripCitationMarkers(text)` before injection.
   - Append injected snippets as new paragraphs to `bodyPlain` (before `removeForbiddenPhrases` / `enforceLengthBounds`).
   - Record each snippet as `SourcesUsedEntry` with `injected: true`; non-injected candidates get `injected: false`.

3. **`stripCitationMarkers` helper**: `/\[[^\]]+\]\s*/g` — add near line 770 alongside `removeForbiddenPhrases`.

4. **`SourcesUsedEntry` interface**: add near lines 220-221 (private types block in `draft-generate.ts`).

5. **Escalation text**: when no sufficient snippet exists for a question (`score < 0.5` or category not in allowlist), append: "For more details on [topic], please visit our website or contact us directly."

6. **Output schema**: add `sources_used: SourcesUsedEntry[]` alongside `knowledge_summaries` in the `jsonResult(...)` payload.

### Updated TC-07 contract

- **TC-07-01**: fixture with matching snippet (score ≥0.5, safe category) → `bodyPlain` contains injected snippet text (citation markers stripped); `sources_used` includes entry with `injected: true`; quality check passes.
- **TC-07-02**: fixture without sufficient snippet (score <0.5 OR unsafe category) → body contains escalation text; `sources_used` entry has `injected: false`; no fabricated answer.
- **TC-07-03**: policy-topic fixture → policy-source snippet preferred over FAQ/pricing sources; category allowlist enforced.
- **TC-07-04**: `pnpm -w run test:governed -- jest -- --testPathPattern="draft-generate|draft-quality-check" --no-coverage`

---

## TASK-08: Replan Evidence — Confidence Promotion 75% → 80%

**Date:** 2026-02-18
**Trigger:** TASK-13 Complete — all 4 questions answered.

### Implementation scope (scout findings)

`extractRequests` at `draft-interpret.ts:291-302`:
- 12 lines, 3 patterns, `text.match()` (first-match only per pattern, no dedup)
- Uses `match[0]` (full matched span) as both `text` and `evidence`
- Replacement scope: swap 3 patterns → 9, `match()` → `matchAll()`, add dedup guard

`draft-guide.json` variable-data rules:
- Current `content_rules.never` covers card-charging and availability-confirmation only
- No existing variable-data guardrail for speculative pricing or uncertain operating details
- TC-08-03 requires adding: e.g. "Never quote specific prices that may vary without consulting live rates"

`gmail.ts`: NOT IN SCOPE — TASK-13 Q1 confirmed snippet-only is sufficient; no format='full' needed.

### Confidence dimensions

| Dimension | Old | New | Justification |
|---|---|---|---|
| Implementation | 75% | 85% | 9 patterns fully specified (replan-notes Q3), matchAll migration specified (Q4), `extractRequests` is 12-line function. All unknowns resolved. |
| Approach | 75% | 85% | TASK-13 Q1 closed snippet sufficiency; Q4 closed matchAll edge cases; zero FP on all existing fixture bodies confirmed. |
| Impact | 75% | 80% | FAQ-02 "I was wondering" gap directly addressed by pattern 4; held-back test passed (dedup uses equality not similarity; distinct requests are not collapsed). |
| **Overall** | **75%** | **80%** | **min(85, 85, 80) = 80%** |

### Affects scope change

- `packages/mcp-server/src/tools/gmail.ts` → `[readonly]` (no changes needed per TASK-13 Q1)
- `packages/mcp-server/src/__tests__/gmail-organize-inbox.test.ts` → `[readonly]` (no gmail changes needed)

### TC-08 contract clarifications for builder

- **TC-08-01:** Verify "I was wondering", "we need", and "would it be possible" phrasings each produce ≥1 `requests` entry.
- **TC-08-02:** Verify `summarizeThreadContext` with snippet-only thread messages correctly populates `resolved_questions`; no `gmail.ts` change involved.
- **TC-08-03:** Verify new `draft-guide.json` `never` rules cause `removeForbiddenPhrases` to strip speculative wording (e.g. "€15 per bag" without qualification).
- **TC-08-04:** Run `pnpm -w run test:governed -- jest -- --testPathPattern="draft-interpret" --no-coverage` (gmail-organize-inbox excluded from scope).

---

## TASK-09: Replan Evidence — Confidence Promotion 75% → 80%

**Date:** 2026-02-18
**Trigger:** All IMPLEMENT dependencies complete (TASK-01..TASK-08); TASK-09 now runnable; 75% < 80% IMPLEMENT threshold.

### Scout audit findings (E1 static, 2026-02-18)

| Surface | Finding |
|---|---|
| `pipeline-integration.test.ts` | EXISTS. 1209 lines. 7 describe blocks, ~20 named tests + `it.each` over 47 inline customer-fixture objects. `afterAll` asserts `passRate >= 0.90` — this IS the calibration answer for TASK-09 metric threshold. All fixtures are inline TypeScript (no JSON file loading). |
| `draft-pipeline.integration.test.ts` | DOES NOT EXIST. Net-new file — full creation scope for TASK-09. |
| `data/test-fixtures/draft-pipeline/` | DOES NOT EXIST. `data/test-fixtures/` itself does not exist. Net-new directory for TASK-09. |
| `package.json` test scripts | Only `"test:startup-loop"` exists. No `"test"` script. TC-09-04 command `pnpm --filter mcp-server test -- ...` is broken; corrected to governed runner form (see below). |
| TASK-01 baseline artifact | `artifacts/quality-baseline-and-fixture-manifest.md` EXISTS and complete: 57 fixtures, 47-gate, 14 metric definitions, 20-fixture minimum — direct implementation reference for TASK-09 metric calibration. |
| Anonymization | No anonymization script or documented workflow exists in `packages/mcp-server/`. Two collection scripts (`collect-baseline-sample.ts`, `analyze-email-patterns.ts`) but no PII-stripping pass. |
| `docs/testing-policy.md` | EXISTS but contains no reference to draft-pipeline, `draft-pipeline.integration.test.ts`, or any regression command for the email draft pipeline. Needs update as TASK-09 documentation impact. |

### Confidence dimensions

| Dimension | Old | New | Justification |
|---|---|---|---|
| Implementation | 85% | 85% | Unchanged. `pipeline-integration.test.ts` (1209 lines, passRate ≥0.90 gate, 47 inline fixtures) is a direct template. `draft-pipeline.integration.test.ts` is net-new. TC-09-04 command corrected (governed runner — no `"test"` script exists). All other decisions bounded. Held-back: TC-09-04 command fix is known and bounded — no blocking unknown. |
| Approach | 75% | 80% | E1+5 uplift (max-range justified): (1) calibration concern fully resolved — `pipeline-integration.test.ts:afterAll` `passRate >= 0.90` is a proven in-repo threshold; adopt it directly; no estimation needed; (2) anonymization scout eliminated by scope decision — synthetic fixtures only, no production-derived fixture commits, PII concern gone by design; (3) TASK-01 artifact gives 14 metric definitions. Held-back at 80%: "synthetic fixtures may not expose real-world failures" — rejected; existing 47-fixture inline suite proves synthetic fixtures are sufficient for this pipeline. |
| Impact | 85% | 85% | Unchanged. All upstream TASK-03..TASK-08 improvements complete; evaluation harness now measures real signal. |
| **Overall** | **75%** | **80%** | **min(85, 80, 85) = 80%** |

### TC-09-04 command correction

- **Old (broken):** `pnpm --filter mcp-server test -- src/__tests__/draft-pipeline.integration.test.ts --maxWorkers=2`
  - Broken because: no `"test"` script in `packages/mcp-server/package.json` (only `"test:startup-loop"` exists)
- **Corrected:** `pnpm -w run test:governed -- jest -- --testPathPattern="draft-pipeline.integration" --no-coverage`

### Scout resolution

- **Anonymization scout** (`Scout anonymization workflow for production-derived emails before fixture commit`): resolved by scope decision — TASK-09 uses **synthetic fixtures only**. No production-derived emails will be committed. Rationale: existing `pipeline-integration.test.ts` uses 47 inline synthetic/paraphrased fixtures without production data, and they're sufficient to gate the pipeline. New `draft-pipeline.integration.test.ts` follows the same pattern. PII risk eliminated by design, not by a stripping workflow.

### Implementation notes for builder

1. **New file: `draft-pipeline.integration.test.ts`** — follow structure of `pipeline-integration.test.ts`. Focus on: labeled fixture objects with `expected_covered_questions` and `expected_missing_questions` fields; at least 5 single-topic + 5 multi-topic fixtures; `passRate >= 0.90` gate in `afterAll` (same threshold as existing suite).

2. **Fixture format:** inline TypeScript (same as existing test). No JSON file loading needed. `data/test-fixtures/draft-pipeline/` directory can be omitted from scope if all fixtures are inline — update plan `Affects` accordingly on controlled expansion.

3. **Coverage metric:** use `evaluateQuestionCoverage(bodyPlain, intents)` from `packages/mcp-server/src/utils/coverage.ts` (already exported post-TASK-05). Fixture assertions check `status === 'covered'` for expected-covered questions and `status === 'missing'` for expected-missing ones.

4. **`sources_used` check:** TC-09-01 should assert at least one fixture produces non-empty `sources_used` (TASK-07 integration evidence).

5. **Command contract for `docs/testing-policy.md`:** add a `## Email Draft Pipeline` section following the Startup-Loop pattern. Document: `pnpm -w run test:governed -- jest -- --testPathPattern="draft-pipeline" --no-coverage` with a note on minimum fixture count and passRate gate.

---
