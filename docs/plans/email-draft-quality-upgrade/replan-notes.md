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
