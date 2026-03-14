---
Status: Ready-for-analysis
Outcome: planning
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: none
Dispatch-ID: IDEA-DISPATCH-20260312-PRIME-TEMPLATES
---

# Fact-Find: Reception Prime Template Responses

## Outcome Contract

Why: When guests message through Prime, staff have no pre-written answers to draw from. Every reply is written from scratch, even for common questions like "how do I get to the hostel?" or "what's included in breakfast?". The Prime app already has a rule-based Q&A agent with good answers and links, but that knowledge is not available to staff replying in the reception inbox. Making those answers available as templates, and learning from manual replies when no template fits, means faster responses and consistently helpful answers.

Intended Outcome: Staff can select from template responses when replying to Prime messages, each giving a clear answer plus a link for more detail. When staff write a manual reply to a question no template covers, the system captures that as a candidate for a new template — building the knowledge base over time.

Source: dispatch

## Routing Header

```yaml
execution_track: code
deliverable_family: code-change
deliverable_channel: none
deliverable_subtype: none
deliverable_type: code-change
startup_deliverable_alias: none
loop_gap_trigger: none
dispatch_id: IDEA-DISPATCH-20260312-PRIME-TEMPLATES
```

## Access Declarations

None

## Area Under Investigation

The reception inbox handles Prime messaging threads (guest-to-staff chat from the Prime guest portal). Staff currently write every reply from scratch with no access to existing answer knowledge. The Prime app has a rule-based Q&A engine (`answerComposer.ts`) with 6 categories of structured answers (booking, experiences, food, transport, bag_drop, general), each containing answer text and relevant links. This investigation determines how to surface those answers as selectable templates in the reception draft UI, and how to capture manual replies as candidates for new templates.

## Key Files and Modules

| # | File | Role |
|---|------|------|
| 1 | `apps/prime/src/lib/assistant/answerComposer.ts` (L1-141) | Rule-based Q&A engine: 6 categories, keyword matching, `AssistantAnswer` type with answer + category + links |
| 2 | `apps/prime/functions/api/assistant-query.ts` (L1-222) | LLM fallback (gpt-5-mini) for unmatched questions, grounded with guest booking context |
| 3 | `apps/prime/public/locales/en/Homepage.json` (L122-133) | 10 preset questions (EN) used by digital assistant UI |
| 4 | `apps/prime/public/locales/it/Homepage.json` (L122-133) | 10 preset questions (IT) — full i18n parity exists |
| 5 | `apps/reception/src/lib/inbox/channel-adapters.server.ts` (L34-55) | Prime direct channel adapter: `supportsDraftRegenerate: false`, `supportsDraftSave: true` |
| 6 | `apps/reception/src/components/inbox/DraftReviewPanel.tsx` (L1-480) | Draft composition UI: textarea, save/send/regenerate buttons, `templateUsed` badge display (L240-243) |
| 7 | `apps/reception/src/components/inbox/ThreadDetailPane.tsx` (L1-311) | Thread view: renders conversation bubbles then DraftReviewPanel |
| 8 | `apps/reception/src/app/api/mcp/inbox/[threadId]/draft/route.ts` (L1-212) | Draft save API: PUT accepts `{ plainText }` for Prime threads, delegates to `savePrimeInboxDraft` |
| 9 | `apps/reception/src/lib/inbox/prime-review.server.ts` (L1-595) | Prime integration: thread listing, detail, draft save/send, thread resolve/dismiss |
| 10 | `apps/reception/src/services/useInbox.ts` (L1-755) | Client state hook: `InboxDraft` type includes `templateUsed: string | null` field |

## Current Architecture

### Prime Q&A Engine (answerComposer.ts)

The `composeAssistantAnswer(question: string)` function normalizes input to lowercase and runs keyword-based matching through 7 branches:

1. **Booking** — keywords: booking, check in, check-in, check out, checkout, status
2. **Extension** — keywords: extend, extension, stay longer
3. **Experiences** — keywords: activity, activities, experience, event, tour
4. **Food** — keywords: breakfast, drink, bar, meal, food
5. **Bag drop** — keywords: bag, luggage, drop
6. **Transport** — keywords: bus, ferry, taxi, how to get, get to, transport, around, where to go
7. **Fallback** — no match: generic "I do not have a direct answer" message

Each answer returns an `AssistantAnswer` object:
```typescript
{
  answer: string;           // Human-readable response text
  category: 'booking' | 'experiences' | 'food' | 'transport' | 'bag_drop' | 'general';
  answerType: 'known' | 'fallback' | 'llm' | 'llm-safety-fallback';
  links: AssistantLink[];   // Array of { label, href } with allowlisted URLs
}
```

Links are sanitized against an allowlist of hostel domains and internal Prime paths.

### LLM Fallback (assistant-query.ts)

When the rule-based engine returns a fallback, the Prime guest app calls the LLM endpoint. This is a guest-facing Cloudflare Pages Function that:
- Validates guest session tokens
- Applies per-guest rate limiting (5 req/min)
- Reads guest booking context from Firebase for grounding
- Calls OpenAI gpt-5-mini with a system prompt that constrains answers to hostel/Positano topics
- Returns structured JSON `{ answer, links }` with link allowlisting

This LLM path is NOT relevant for reception templates — it is guest-facing and requires guest auth. The rule-based answers are the reusable knowledge base.

### Reception Draft Flow (Prime threads)

1. Staff selects a Prime thread in the inbox (prefixed `prime:` thread ID)
2. `ThreadDetailPane` renders conversation bubbles + `DraftReviewPanel`
3. For Prime direct: `supportsDraftRegenerate: false` — no AI-generated drafts
4. Staff writes plaintext in the textarea manually
5. On save: `PUT /api/mcp/inbox/{threadId}/draft` with `{ plainText }` body
6. Draft is stored via `savePrimeInboxDraft()` which calls Prime API `PUT /api/review-thread-draft`
7. On send: `POST /api/mcp/inbox/{threadId}/send` which calls Prime API `POST /api/review-thread-send`

### Existing Template Infrastructure

The `InboxDraft` type already has a `templateUsed: string | null` field (useInbox.ts L32). The DraftReviewPanel already renders a `templateUsed` badge when present (DraftReviewPanel.tsx L240-243). Currently this is always `null` for Prime drafts (prime-review.server.ts L338). This existing plumbing means the system is architecturally ready for template tracking — only the template selection UI and source data are missing.

## Current Process Map

### Staff replies to a Prime guest question (today)

1. Prime thread appears in reception inbox (via `listPrimeInboxThreadSummaries`)
2. Staff clicks thread, sees conversation bubbles in ThreadDetailPane
3. Staff reads guest question (e.g., "How do I get to the hostel?")
4. Staff mentally recalls or looks up the answer
5. Staff types full reply from scratch in the DraftReviewPanel textarea
6. Staff clicks Save, then Send
7. Reply is delivered to guest via Prime messaging

**Time per reply**: ~2-5 minutes for common questions, longer for less familiar topics.

### With templates (proposed)

1-3: Same as today
4. System shows matching template suggestions based on guest message content
5. Staff clicks a template to populate the textarea (can edit before sending)
6. Staff clicks Save, then Send (`templateUsed` is recorded on the draft)
7. Reply is delivered to guest

**Time per reply**: ~30 seconds for template matches.

### Self-improvement loop (proposed)

1. Staff writes a manual reply (no template selected)
2. On send, system flags the sent draft as a "template candidate" (since `templateUsed` is null and the reply was manually written)
3. Candidates are stored for operator review
4. Operator periodically reviews candidates and promotes good ones to templates

## Evidence

### Template Source Analysis

The `answerComposer.ts` answers are directly reusable as reception templates. Each answer has:

- **Clear text**: concise, already human-proofed answers suitable for staff-to-guest messaging
- **Links**: allowlisted internal Prime paths (`/booking-details`, `/activities`, etc.) — these are relevant when the guest is using Prime, which is the case for Prime thread replies
- **Categories**: 6 well-defined categories provide natural grouping for a template picker
- **Keyword patterns**: the `includesAny` keyword arrays serve as matching hints

However, `answerComposer.ts` is embedded in the Prime app (not a shared package). The answers are hardcoded strings with an i18n-exempt marker. For reception templates, the answers need to be:

1. **Extracted to a shared data source** — either a shared JSON file or a new package
2. **Staff-facing tone adjusted** — current answers address the guest in second person ("Use Booking Details to check your stay...") which works well for staff sending to guests
3. **Link format adapted** — Prime internal paths need to be presented as "tell the guest to open X in Prime" rather than raw hrefs, unless the links are rendered as tappable URLs in Prime messages (which they are, based on the `links` field in message objects)

### Draft UI Integration Points

The `DraftReviewPanel` component (DraftReviewPanel.tsx) has a clear structure for template insertion:

1. **Above the textarea** (after the manual-draft warning, before the body field): a template picker component showing matching templates based on the latest inbound message content
2. **Template selection action**: clicking a template populates the `plainText` state variable and optionally sets a `templateUsed` identifier
3. **The `templateUsed` badge** (L240-243) already renders when set — this provides visual confirmation of which template was used
4. **Channel-gating**: template picker should only render when `threadDetail.thread.channel` starts with `prime_` (Prime direct or Prime broadcast), since email threads have their own AI-generated draft system

The DraftReviewPanel receives `threadDetail` which includes `messages` — the latest inbound message content is available for template matching.

### Storage Options

**Option A: Static JSON file in a shared location** (recommended)

- Create `packages/prime-templates/templates.json` or `apps/reception/src/lib/inbox/prime-templates.ts`
- Structure: array of template objects with `id`, `category`, `keywords`, `answerEN`, `answerIT`, `links`
- Imported at build time into reception, no runtime fetching
- Template matching happens client-side in the DraftReviewPanel
- Self-improvement candidates stored in a separate file or D1 table

Pros: Simple, fast, no API calls, no DB schema changes.
Cons: Adding new templates requires a code deploy.

**Option B: D1 database table**

- New `prime_templates` table in reception's D1 database
- Templates managed via API endpoints
- Self-improvement candidates stored in same table with a `status` field (candidate/approved/rejected)

Pros: Templates can be updated without deploy. Self-improvement loop is native.
Cons: Requires migration, API endpoints, more complex architecture.

**Option C: Hybrid — static templates + D1 candidates**

- Core templates from answerComposer as static JSON (deployed with code)
- Self-improvement candidates in D1 with `status` workflow
- Template picker merges both sources

Pros: Best of both — immediate templates without DB dependency, self-improvement loop has persistence.
Cons: Two data sources to merge at render time.

**Recommendation: Option A (static JSON) for v1.** The answerComposer has 6 well-established categories. A static file is simplest, testable, and matches the current zero-DB-migration pattern for Prime integration. The self-improvement loop can be Phase 2 with D1 if the static templates prove useful.

### Self-Improvement Loop Design

When staff send a Prime reply without selecting a template (`templateUsed === null`):

1. **Capture**: The draft route already records `templateUsed` on save. A null value combined with a successful send indicates a manual reply.
2. **Store**: Append the sent reply text + thread context (guest question snippet, category if detectable) to a candidates log. Options:
   - JSONL file in `data/` (like `data/email-audit-log.jsonl`) — simplest, auditable
   - D1 `template_candidates` table — structured, queryable
3. **Review**: Operator reviews candidates periodically (could be a process-improvement card or a simple admin page)
4. **Promote**: Approved candidates are added to the static templates file (manual step for v1)

For v1, the self-improvement loop should be **observability-only**: log when manual replies are sent for Prime threads so the operator can periodically review them. Full automated promotion is over-engineered for the initial release.

### i18n Considerations

- Prime `Homepage.json` preset questions exist in both EN and IT
- `answerComposer.ts` answers are EN-only (marked i18n-exempt with `PRIME-01` marker)
- `AssistantApi.json` prompts exist in both EN and IT
- Reception app is staff-facing — staff are bilingual (EN/IT), but guests may be either
- Template answers should be stored in both EN and IT, with language selection based on the Prime thread's detected language or a staff toggle
- The 10 preset questions from `Homepage.json` already have IT translations — these can serve as the basis for IT template variants

## Engineering Coverage Matrix

| Row | Treatment | Notes |
|-----|-----------|-------|
| Unit tests | Required | Template matching logic: given a message, return ranked template suggestions |
| Integration tests | Required | Draft flow with template selection: template populates textarea, templateUsed is recorded on save |
| Type safety | Required | Template type definitions, template picker props |
| Error handling | Required | Graceful fallback when no template matches (show empty state, not an error) |
| Migration | N/A | No DB schema change needed for static JSON approach |
| Performance | Required | Template lookup is O(n) keyword scan — with <20 templates this is instant |
| Security | N/A | Internal staff tool, templates are hardcoded text, no user input injection risk |
| Accessibility | Required | Template picker UI needs keyboard navigation and screen reader labels |
| i18n | Required | EN + IT template text; language selection mechanism |
| Monitoring | N/A | Optional: track template usage rates via existing telemetry |

## Risks

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| 1 | Template answers drift from answerComposer — two sources of truth | Medium | Extract shared data source; or accept drift with periodic reconciliation |
| 2 | Keyword matching gives poor suggestions for ambiguous messages | Low | Show all templates grouped by category as fallback; keyword matching is a hint, not a gate |
| 3 | Staff ignore templates and continue writing manually | Low | UX: make templates prominent and one-click; track adoption via templateUsed metric |
| 4 | Prime internal links in templates are confusing when used in staff replies | Low | Links are valid Prime in-app paths — guests tap them in the Prime app. No adaptation needed. |
| 5 | Self-improvement loop generates noise without operator bandwidth to review | Low | Phase 1: observability-only (log). No active review process required until templates prove useful. |
| 6 | IT translations of template answers are lower quality than EN | Medium | Reuse existing IT translations from Homepage.json preset queries; have operator review IT text |
| 7 | Template picker adds visual clutter to the draft panel | Low | Collapsible panel; only shows for Prime threads; hidden when not useful |

## Open Questions

| # | Question | Why it matters | Needs |
|---|----------|---------------|-------|
| 1 | Should templates include the full answerComposer answers as-is, or should staff-facing versions be rewritten? | Current answers address the guest directly ("Use Booking Details to check...") — this tone works for staff sending to guests. Confirm with operator. | Operator input |
| 2 | Should templates be available for Prime broadcast threads too, or only Prime direct (support) threads? | Broadcast is promotional, templates are support-oriented. Likely direct-only, but confirm. | Operator input |
| 3 | Is the self-improvement loop (capturing manual replies as template candidates) needed in v1, or can it be Phase 2? | Reduces scope significantly if deferred. Core value is in surfacing existing answers. | Operator input |
| 4 | Should templates be selectable from a category-grouped list, or should the system auto-suggest based on the guest's latest message? | Auto-suggest is better UX but needs keyword matching. Category list is simpler. Both are feasible. | Operator input |

## Scope

### In Scope

- Template data file: extract answerComposer answers into a shared static JSON/TS module with EN + IT text, categories, keywords, and links
- Template picker component: new UI component in DraftReviewPanel that shows matching/browsable templates for Prime threads only
- Template selection: clicking a template populates the draft textarea and sets `templateUsed` identifier
- Draft save integration: extend save payload to pass `templateUsed` through to the draft record
- Unit tests for template matching logic
- Integration tests for draft flow with template selection

### Out of Scope (Phase 2)

- Self-improvement loop (capturing manual replies as template candidates)
- D1 database storage for templates
- Admin UI for managing templates
- LLM-based template suggestion (beyond keyword matching)
- Template analytics dashboard

### Boundary

Templates are static, code-deployed data. No runtime API calls to fetch templates. No database tables. The self-improvement loop is deferred pending operator confirmation.

## Scope Signal

Signal: right-sized
Rationale: The core feature (surfacing existing answerComposer answers as selectable templates in the DraftReviewPanel for Prime threads) is a contained UI addition with well-understood data. The template data already exists in a structured format. The draft model already has `templateUsed` plumbing. The self-improvement loop can be deferred to Phase 2 without reducing the core value. No database migrations, no new API endpoints (templates are static client-side data), and no cross-app coupling beyond extracting answer text.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Template data extraction | Yes — answerComposer.ts has 6 categories with structured answers + links | Answers are EN-only in code; IT versions needed | Create bilingual template data file |
| Draft UI integration | Yes — DraftReviewPanel has clear insertion point and existing templateUsed badge | Template picker component does not exist yet | Build new TemplatePicker component |
| Draft save flow | Yes — PUT draft route accepts plainText and templateUsed is tracked on the draft model | templateUsed is not currently passed from client to server on save | Extend save payload to include templateUsed |
| Channel adapter | Yes — Prime direct adapter has supportsDraftSave: true | No changes needed to adapter capabilities | None |
| Self-improvement loop | Partially — sent drafts with null templateUsed are observable | No capture mechanism exists | Phase 2 or simple logging in v1 |
| i18n | Yes — Homepage.json has EN + IT preset questions | answerComposer answers are EN-only | Create IT translations for template answers |

## Evidence Gap Review

### Gaps Addressed

1. Confirmed `templateUsed` field exists on InboxDraft type and is rendered in DraftReviewPanel badge — no new model fields needed.
2. Confirmed Prime draft save route only passes `plainText` — `templateUsed` is not currently in the save payload schema. The draft route `updateDraftPayloadSchema` (zod schema at draft/route.ts L34-41) would need a `templateUsed` field added, or the template tracking can be handled client-side only.
3. Confirmed the Prime channel adapter has `supportsDraftSave: true` and `supportsDraftRegenerate: false` — templates fill the "no auto-draft" gap.

### Confidence Adjustments

- Initial assumption that templates would need a database: downgraded. Static JSON is sufficient for v1 given the small template count (<20).
- Initial assumption that IT translations are a blocker: partially addressed. Homepage.json preset queries provide IT question text but not IT answer text. The answerComposer answer text needs translation.

### Remaining Assumptions

1. Staff will find template selection faster than writing from scratch (likely true given the answers are well-written).
2. The 6 answerComposer categories cover the most common Prime guest questions (supported by the 10 preset questions in Homepage.json covering the same topics).
3. Prime internal links (`/booking-details`, `/activities`, etc.) render as tappable links in Prime chat messages (supported by the `links` field in message objects, prime-review.server.ts L428).

## Evidence Audit

| Evidence Item | Source | Verified | Notes |
|---|---|---|---|
| answerComposer has 6 keyword-matched categories | `apps/prime/src/lib/assistant/answerComposer.ts` L47-136 | Yes | booking, extension (also booking category), experiences, food, bag_drop, transport + fallback |
| Each answer includes text + links array | `apps/prime/src/lib/assistant/answerComposer.ts` L3-13 | Yes | `AssistantAnswer` type: answer, category, answerType, links |
| Prime direct channel: supportsDraftRegenerate = false | `apps/reception/src/lib/inbox/channel-adapters.server.ts` L45 | Yes | Staff have no auto-draft — templates fill this gap |
| Prime direct channel: supportsDraftSave = true | `apps/reception/src/lib/inbox/channel-adapters.server.ts` L44 | Yes | Save flow works, just needs template content |
| InboxDraft type has templateUsed field | `apps/reception/src/services/useInbox.ts` L32 | Yes | `templateUsed: string | null` — already null for all Prime drafts |
| DraftReviewPanel renders templateUsed badge | `apps/reception/src/components/inbox/DraftReviewPanel.tsx` L240-243 | Yes | Conditional badge render when templateUsed is truthy |
| Draft save zod schema lacks templateUsed | `apps/reception/src/app/api/mcp/inbox/[threadId]/draft/route.ts` L34-41 | Yes | Only subject, recipientEmails, plainText, html in schema |
| EN + IT preset questions exist | `apps/prime/public/locales/{en,it}/Homepage.json` presetQueries | Yes | 10 questions in each language with full parity |
| answerComposer answers are EN-only | `apps/prime/src/lib/assistant/answerComposer.ts` L1 i18n-exempt marker | Yes | `PRIME-01 [ttl=2027-06-30]` — IT translations needed for templates |
| Prime draft save passes only plainText | `apps/reception/src/app/api/mcp/inbox/[threadId]/draft/route.ts` L113-115 | Yes | `savePrimeInboxDraft(threadId, { plainText })` |

## Confidence Inputs

| Input | Confidence | Rationale |
|---|---|---|
| Template data quality (answerComposer answers) | High | Answers are production-tested, guest-facing, concise, and include relevant links |
| DraftReviewPanel integration feasibility | High | Clear component structure, existing templateUsed plumbing, channel-awareness via capabilities |
| Static JSON storage approach | High | <20 templates, no runtime variability, matches existing codebase patterns |
| Keyword-based template matching | Medium | Works for clear-cut questions; may under-match for ambiguous or multi-topic messages. Category browsing mitigates this. |
| IT translation completeness | Medium | Question text exists in IT; answer text needs translation. Manageable scope (<10 answers). |
| Self-improvement loop deferral to Phase 2 | High | Core value is in surfacing existing knowledge, not in learning from manual replies |
| templateUsed save flow extension | High | Small schema change (one optional string field); no architectural risk |

**Overall confidence: High** — the feature builds on well-understood existing infrastructure with minimal new architecture.

## Analysis Readiness

- All key files read and documented with line references
- Architecture fully mapped: Prime Q&A engine, reception draft flow, channel adapters, existing template plumbing
- Storage decision made with evidence-based rationale (static JSON for v1)
- Scope explicitly bounded with Phase 2 deferrals
- 4 open questions identified for operator input, none blocking planning
- Engineering coverage matrix complete
- 7 risks identified with mitigations
- Critique completed with score 4.2/5.0, no critical findings

**Ready for analysis and planning.**
