---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: 2026-03-12
Last-reviewed: 2026-03-12
Last-updated: 2026-03-12
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-prime-template-responses
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/reception-prime-template-responses/analysis.md
---

# Reception Prime Template Responses Plan

## Summary

Staff replying to Prime guest messages currently write every response from scratch, even for the six most common question categories already answered by the Prime Q&A engine (`answerComposer.ts`). This plan delivers a static TypeScript template module in the reception app with bilingual (EN/IT) template data, a TemplatePicker component in DraftReviewPanel gated to Prime threads, and the wiring to track which template was used when saving a draft. The approach is Option A (static TS module) from the analysis — no database, no migration, no cross-app coupling. Four tasks decompose the work: template data module, UI picker, draft save integration, and self-improvement signal capture.

## Active tasks
- [ ] TASK-01: Create template data module
- [ ] TASK-02: Add template picker to DraftReviewPanel
- [ ] TASK-03: Wire templateUsed tracking through draft save
- [ ] TASK-04: Self-improvement signal capture

## Goals
- Staff can select a template response when replying to common Prime guest questions, reducing reply time from minutes to seconds
- Template selection is tracked via the `templateUsed` field so adoption can be measured
- The architecture supports adding a self-improvement loop in a future phase without rework

## Non-goals
- Automated template management UI (Phase 2)
- LLM-based template suggestion beyond keyword matching (Phase 2)
- Self-improvement loop that promotes manual replies to templates (Phase 2)
- Template analytics dashboard (Phase 2)

## Constraints & Assumptions
- Constraints:
  - Prime direct channel has `supportsDraftRegenerate: false` — templates are the primary draft acceleration mechanism
  - The draft save zod schema (`updateDraftPayloadSchema`) currently lacks `templateUsed` — must be extended
  - `answerComposer.ts` answers are EN-only; IT translations must be created manually
  - Template count is small (<20) and changes infrequently
- Assumptions:
  - Staff will adopt templates when they are prominent and one-click (supported by high auto-draft adoption for email threads)
  - The 6 answerComposer categories cover the most common Prime guest questions (supported by the 10 preset questions in Homepage.json)
  - Prime internal links render as tappable links in Prime chat messages (supported by the `links` field in message objects)

## Inherited Outcome Contract

- **Why:** When guests message through Prime, staff have no pre-written answers to draw from. Every reply is written from scratch, even for common questions. The Prime app already has a rule-based Q&A agent with good answers and links, but that knowledge is not available to staff replying in the reception inbox. Making those answers available as templates means faster responses and consistently helpful answers.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Staff can select from template responses when replying to Prime messages, each giving a clear answer plus a link for more detail. When staff write a manual reply to a question no template covers, the system captures that as a candidate for a new template — building the knowledge base over time.
- **Source:** dispatch

## Analysis Reference
- Related analysis: `docs/plans/reception-prime-template-responses/analysis.md`
- Selected approach inherited:
  - Option A: Static TypeScript module in the reception app
  - Templates as a typed TS array derived from answerComposer's 6 categories
  - Template picker in DraftReviewPanel, channel-gated to Prime threads
  - `templateUsed` tracked through the existing draft plumbing
- Key reasoning used:
  - Dataset is small (<20 items), changes infrequently, derived from a stable production source
  - Existing `templateUsed` field on `InboxDraft` and badge in DraftReviewPanel mean tracking infrastructure already exists
  - No new failure modes: no API calls, no DB queries, no migrations
  - Option B (D1) over-engineered for dataset size; Option C (shared package) creates cross-app coupling for minimal benefit

## Selected Approach Summary
- What was chosen:
  - Static TypeScript module with bilingual template data, client-side keyword matching, and a TemplatePicker component
- Why planning is not reopening option selection:
  - Analysis evaluated all three options against 7 weighted criteria; Option A scored highest on time-to-value and implementation complexity (both High weight) while matching or exceeding on all other dimensions

## Fact-Find Support
- Supporting brief: `docs/plans/reception-prime-template-responses/fact-find.md`
- Evidence carried forward:
  - `answerComposer.ts` has 7 keyword-matching branches across 6 categories (L47-136), each returning structured `AssistantAnswer` objects
  - `InboxDraft` type has `templateUsed: string | null` (useInbox.ts L32); DraftReviewPanel renders badge when set (L240-243)
  - Prime direct channel: `supportsDraftRegenerate: false`, `supportsDraftSave: true` — templates fill the "no auto-draft" gap
  - Draft save zod schema (`updateDraftPayloadSchema`, draft/route.ts L34-41) lacks `templateUsed`
  - `savePrimeInboxDraft` only passes `plainText` (draft/route.ts L113-115)

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Create template data module with bilingual answers and keyword matching | 90% | M | Pending | - | TASK-02, TASK-04 |
| TASK-02 | IMPLEMENT | Add TemplatePicker component to DraftReviewPanel | 85% | M | Pending | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Wire templateUsed tracking through draft save | 90% | S | Pending | TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Self-improvement signal capture for manual replies | 85% | S | Pending | TASK-01, TASK-03 | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | TemplatePicker component: suggestion chips, category sections, search input, template badge | TASK-02 | Channel-gated to Prime threads only |
| UX / states | Three states: keyword-matched suggestions, category browsing (Browse all), empty state (no match) | TASK-02 | Empty state shows "No matching templates — browse all or type your reply" |
| Security / privacy | N/A — internal staff tool, hardcoded text, no user input injection | - | No new attack surface |
| Logging / observability / audit | `templateUsed` field on draft tracks adoption; null value signals manual reply; telemetry event for manual Prime replies | TASK-03, TASK-04 | Existing `recordInboxEvent` used for signal capture |
| Testing / validation | Unit tests for `matchTemplates` pure function; component tests for TemplatePicker; integration test for templateUsed in save payload | TASK-01, TASK-02, TASK-03 | Tests run in CI only per testing policy |
| Data / contracts | New `PrimeTemplate` type; `updateDraftPayloadSchema` extended with optional `templateUsed`; `InboxDraftUpdateInput` extended | TASK-01, TASK-03 | No DB migration needed |
| Performance / reliability | Client-side O(n) keyword scan over <20 items — instant; no network calls for template data | TASK-01 | Zero-latency template lookup |
| Rollout / rollback | Deploy new code; rollback = deploy previous version; no data to migrate or clean up | All | Single app deploy, no coordination |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Template data module and matching function |
| 2 | TASK-02 | TASK-01 | TemplatePicker component, depends on template types and data |
| 3 | TASK-03 | TASK-02 | Draft save wiring, depends on template selection being available |
| 4 | TASK-04 | TASK-01, TASK-03 | Signal capture depends on both template data (to detect absence) and save flow |

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| Staff reply to Prime guest questions | Staff opens a Prime thread in the reception inbox | 1. Staff opens Prime thread. 2. TemplatePicker shows keyword-matched suggestions based on latest inbound message. 3. Staff clicks a template to populate the textarea with answer text + formatted links. 4. Staff can edit the text before saving. 5. Staff clicks Save (templateUsed is recorded), then Send. Total time: ~30 seconds for template matches. | TASK-01, TASK-02, TASK-03 | If keyword matching gives poor suggestions, staff fall back to category browsing or manual typing. Rollback: deploy previous version. |
| Template-miss signal capture | Staff sends a Prime reply without selecting a template | 1. Draft is sent with `templateUsed: null`. 2. System logs a telemetry event (`prime_manual_reply`) with thread context (guest question snippet, detected category if any). 3. Event is queryable for periodic operator review to identify template gaps. | TASK-04 | No active review process in v1 — observability only. |

## Tasks

### TASK-01: Create template data module
- **Type:** IMPLEMENT
- **Deliverable:** `apps/reception/src/lib/inbox/prime-templates.ts` + unit tests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/lib/inbox/prime-templates.ts` (new), `[readonly] apps/prime/src/lib/assistant/answerComposer.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-04
- **Confidence:** 90%
  - Implementation: 92% - Pure data extraction from a well-understood source; typed array with no runtime dependencies
  - Approach: 90% - Static module is the simplest viable approach, validated in analysis
  - Impact: 88% - Templates are only useful if the picker (TASK-02) is built; standalone module has no user-facing effect
- **Acceptance:**
  - `PrimeTemplate` type exported with fields: `id`, `category`, `keywords`, `answer: { en: string; it: string }`, `links: { label: string; href: string }[]`
  - 7 template entries populated from answerComposer's branches (booking, extension, experiences, food, bag_drop, transport, general fallback excluded)
  - `matchTemplates(query: string): PrimeTemplate[]` exported — returns templates ranked by keyword match count, descending
  - `allTemplates(): PrimeTemplate[]` exported — returns all templates grouped by category
  - IT translations provided for all 7 answer texts
  - All exported functions are pure (no side effects, no external dependencies)
- **Engineering Coverage:**
  - UI / visual: N/A - Data module, no UI
  - UX / states: N/A - Data module, no UI
  - Security / privacy: N/A - Hardcoded text, no user input injection
  - Logging / observability / audit: N/A - Data module, no runtime logging
  - Testing / validation: Required - Unit tests for `matchTemplates` covering: exact keyword match, partial match, multi-keyword ranking, no-match returns empty array, case insensitivity, empty input
  - Data / contracts: Required - `PrimeTemplate` type definition; template data array; pure function signatures
  - Performance / reliability: Required - O(n) scan over <20 items; verify no accidental regex or heavy string operations
  - Rollout / rollback: N/A - No standalone rollout effect
- **Validation contract (TC-XX):**
  - TC-01: `matchTemplates("how do I check in")` -> returns booking template(s) as first result
  - TC-02: `matchTemplates("bus to positano")` -> returns transport template as first result
  - TC-03: `matchTemplates("breakfast options")` -> returns food template
  - TC-04: `matchTemplates("random gibberish xyz")` -> returns empty array
  - TC-05: `matchTemplates("")` -> returns empty array
  - TC-06: `matchTemplates("CHECK IN")` -> same result as lowercase (case insensitive)
  - TC-07: `matchTemplates("extend my booking and check activities")` -> returns multiple templates, ranked by match count
  - TC-08: `allTemplates()` -> returns all 7 templates, each with non-empty `answer.en` and `answer.it`
  - TC-09: Every template has at least one link with non-empty `label` and `href`
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: Verified answerComposer.ts has 7 branches (L47-136), each with answer text, category, and links array
  - Validation artifacts: answerComposer.ts read in full; all 6 categories confirmed; link structure confirmed
  - Unexpected findings: The "extension" branch also uses category `booking` — treat as a separate template with its own keywords but same category label
- **Scouts:** Verify that all Prime internal links (`/booking-details`, `/activities`, etc.) are valid Prime app routes — confirmed via answerComposer's ALLOWLISTED_HOSTS and path-only links
- **Edge Cases & Hardening:**
  - Empty query returns empty array (not all templates)
  - Keywords with special regex characters are matched as literal strings (use `includes`, not regex)
  - Template with overlapping keywords across categories: return all matches, ranked by hit count
- **What would make this >=90%:**
  - IT translation review by operator (currently at 90% because translations are agent-generated)
- **Rollout / rollback:**
  - Rollout: Deploy with reception app
  - Rollback: Deploy previous version — no data to clean up
- **Documentation impact:**
  - None — internal module
- **Notes / references:**
  - Source data: `apps/prime/src/lib/assistant/answerComposer.ts` L47-136
  - IT translation reference: `apps/prime/public/locales/it/Homepage.json` preset questions

### TASK-02: Add TemplatePicker component to DraftReviewPanel
- **Type:** IMPLEMENT
- **Deliverable:** `apps/reception/src/components/inbox/TemplatePicker.tsx` (new), modifications to `DraftReviewPanel.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/reception/src/components/inbox/TemplatePicker.tsx` (new), `apps/reception/src/components/inbox/DraftReviewPanel.tsx`, `[readonly] apps/reception/src/lib/inbox/prime-templates.ts`, `[readonly] apps/reception/src/services/useInbox.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 85%
  - Implementation: 85% - New component in well-understood panel; clear insertion point above textarea; requires keyboard navigation and i18n language selection
  - Approach: 90% - Analysis confirms DraftReviewPanel has the right structure and existing templateUsed badge
  - Impact: 85% - Primary user-facing value delivery; UX quality determines adoption
- **Acceptance:**
  - TemplatePicker renders in DraftReviewPanel when `thread.channel` starts with `prime_` (Prime direct and Prime broadcast)
  - TemplatePicker does NOT render for email threads
  - Auto-suggest mode: on thread load, `matchTemplates` runs against the latest inbound message content; matching templates shown as clickable chips
  - Browse mode: "Browse all" button shows all templates grouped by category
  - Search mode: typing in a search input filters templates via `matchTemplates`
  - Clicking a template populates the `plainText` textarea state with the template answer text + formatted links (e.g., "Booking details: /booking-details")
  - Language selection: uses thread locale if detectable, defaults to EN; staff can toggle EN/IT
  - Template badge: when a template is selected, its ID is stored in local component state for pass-through to save
  - Clicking a different template replaces the textarea content
  - Staff can edit the textarea after template insertion (normal behaviour)
  - Empty state: when no templates match, show "No matching templates" with a prompt to browse all or type manually
  - **Expected user-observable behavior:**
    - [ ] Prime thread open -> template suggestions appear above textarea
    - [ ] Click template -> textarea populated with answer text and links
    - [ ] "Browse all" -> grouped template list visible
    - [ ] Type in search -> filtered suggestions update in real time
    - [ ] Email thread open -> no template picker visible
- **Engineering Coverage:**
  - UI / visual: Required - New TemplatePicker component with chips, category headers, search input; matches existing DraftReviewPanel styling (rounded-xl borders, surface-2 bg, foreground text)
  - UX / states: Required - Three states: suggestions (keyword match), browse (all by category), empty (no match). Loading state not needed (client-side data). Error state not needed (no network calls).
  - Security / privacy: N/A - Rendering hardcoded text, no user input processed server-side
  - Logging / observability / audit: N/A - UI component; tracking handled in TASK-03
  - Testing / validation: Required - Component tests: renders for Prime thread, hidden for email thread, clicking template populates textarea callback, empty state when no match, browse mode shows all templates
  - Data / contracts: Required - TemplatePicker props: `{ templates: PrimeTemplate[]; onSelect: (template: PrimeTemplate, locale: 'en' | 'it') => void; latestInboundText: string | null }`
  - Performance / reliability: N/A - Static client-side rendering, <20 items
  - Rollout / rollback: N/A - Contained in reception deploy
- **Validation contract (TC-XX):**
  - TC-01: Render DraftReviewPanel with Prime direct thread -> TemplatePicker visible
  - TC-02: Render DraftReviewPanel with email thread -> TemplatePicker NOT in DOM
  - TC-03: Latest inbound message contains "check in" -> booking template chip visible
  - TC-04: Click booking template chip -> `onSelect` called with booking template and current locale
  - TC-05: Click "Browse all" -> all 7 templates visible grouped by category
  - TC-06: Type "breakfast" in search input -> food template visible, others hidden
  - TC-07: Latest inbound message is "hello" (no keyword match) -> empty state message shown
  - TC-08: Keyboard: Tab focuses search input, arrow keys navigate template chips, Enter selects
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - Checks run: Read DraftReviewPanel.tsx in full; confirmed insertion point between notices (L253-271) and textarea (L318-331); confirmed channel capabilities available via `threadDetail.thread.capabilities`
  - Validation artifacts: DraftReviewPanel.tsx L231-480 read; channel-adapters.server.ts confirmed `prime_direct` and `prime_broadcast` channels
  - Unexpected findings: DraftReviewPanel's `onSave` callback accepts `{ subject?, recipientEmails?, plainText, html? }` — `templateUsed` is NOT in the callback signature. TASK-03 must extend this.
- **Scouts:** Confirm `threadDetail.messages` array has the latest inbound message accessible — confirmed: messages are in chronological order, last element with `direction: "inbound"` is the latest guest message
- **Edge Cases & Hardening:**
  - Thread with no inbound messages (staff-initiated): show browse mode only, no auto-suggest
  - Thread with very long inbound message: `matchTemplates` operates on full text, which is fine for keyword scanning
  - Rapid template switching: each click replaces textarea content entirely (no append)
- **What would make this >=90%:**
  - Operator feedback on visual design after first deploy
  - Keyboard navigation tested with screen reader
- **Rollout / rollback:**
  - Rollout: Deploy with reception app
  - Rollback: Deploy previous version
- **Documentation impact:**
  - None — internal component
- **Notes / references:**
  - Insertion point: DraftReviewPanel.tsx, between the notices block (L253-271) and the textarea block (L318-331)
  - Post-build QA: run `lp-design-qa` on DraftReviewPanel route, run `tools-ui-contrast-sweep`, run `tools-ui-breakpoint-sweep`; auto-fix Critical/Major findings

### TASK-03: Wire templateUsed tracking through draft save
- **Type:** IMPLEMENT
- **Deliverable:** Modifications to draft save route, client save function, and DraftReviewPanel
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/app/api/mcp/inbox/[threadId]/draft/route.ts`, `apps/reception/src/services/useInbox.ts`, `apps/reception/src/components/inbox/DraftReviewPanel.tsx`
- **Depends on:** TASK-02
- **Blocks:** TASK-04
- **Confidence:** 90%
  - Implementation: 92% - One optional field added to zod schema, threaded through existing save path
  - Approach: 90% - Extends existing plumbing; `templateUsed` field already on `InboxDraft` type
  - Impact: 88% - Enables adoption measurement; low standalone user visibility
- **Acceptance:**
  - `updateDraftPayloadSchema` extended with `templateUsed: z.string().optional()`
  - `InboxDraftUpdateInput` type extended with `templateUsed?: string`
  - `DraftReviewPanel.onSave` callback signature extended with `templateUsed?: string`
  - When staff selects a template in TemplatePicker and clicks Save, `templateUsed` is included in the PUT payload
  - For Prime threads: `savePrimeInboxDraft` receives and stores `templateUsed` on the draft record
  - For email threads: no change (templateUsed is not set)
  - Existing `templateUsed` badge in DraftReviewPanel continues to render correctly after save
- **Engineering Coverage:**
  - UI / visual: N/A - No visual changes beyond existing badge
  - UX / states: N/A - Save flow unchanged from user perspective
  - Security / privacy: N/A - Optional string field on internal API
  - Logging / observability / audit: Required - `templateUsed` value persisted on draft record; visible in existing draft event telemetry
  - Testing / validation: Required - Integration test: save with templateUsed -> draft record has templateUsed set; save without templateUsed -> draft record has null
  - Data / contracts: Required - Zod schema extension; TypeScript type extension; API payload contract change (backward compatible — field is optional)
  - Performance / reliability: N/A - One additional optional field in JSON payload
  - Rollout / rollback: N/A - Backward compatible; old clients send no templateUsed, new clients send it optionally
- **Validation contract (TC-XX):**
  - TC-01: PUT `/api/mcp/inbox/{primeThreadId}/draft` with `{ plainText: "...", templateUsed: "booking" }` -> 200 OK, draft has templateUsed = "booking"
  - TC-02: PUT `/api/mcp/inbox/{primeThreadId}/draft` with `{ plainText: "..." }` (no templateUsed) -> 200 OK, draft has templateUsed = null
  - TC-03: PUT `/api/mcp/inbox/{emailThreadId}/draft` with `{ subject: "...", recipientEmails: [...], plainText: "...", templateUsed: "booking" }` -> 200 OK (field accepted but may not be stored for email path — acceptable)
  - TC-04: DraftReviewPanel badge shows "booking" after saving with `templateUsed: "booking"`
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):** None required (S effort)
- **Scouts:** Verify `savePrimeInboxDraft` signature accepts additional fields — confirmed: `savePrimeInboxDraft(threadId, { plainText }, uid)` at draft/route.ts L113-115; the second argument object needs extension
- **Edge Cases & Hardening:**
  - Staff edits textarea after selecting template, then saves: `templateUsed` still reflects the selected template (captures intent, not final content)
  - Staff clears textarea completely after selecting template: save validation requires non-empty plainText (existing behaviour), so this path hits validation error before templateUsed matters
- **What would make this >=90%:**
  - Confirming the Prime API at the other end accepts and stores the `templateUsed` field (if not, client-side tracking via the DraftReviewPanel badge is sufficient)
- **Rollout / rollback:**
  - Rollout: Deploy with reception app; backward compatible
  - Rollback: Deploy previous version; templateUsed field simply not sent
- **Documentation impact:**
  - None
- **Notes / references:**
  - Schema location: draft/route.ts L34-41
  - Client type: useInbox.ts L181-186 (`InboxDraftUpdateInput`)

### TASK-04: Self-improvement signal capture for manual replies
- **Type:** IMPLEMENT
- **Deliverable:** Telemetry event logging when Prime drafts are sent without a template
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/app/api/mcp/inbox/[threadId]/send/route.ts`, `[readonly] apps/reception/src/lib/inbox/telemetry.server.ts`
- **Depends on:** TASK-01, TASK-03
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 88% - Uses existing `recordInboxEvent` infrastructure; one conditional check on send
  - Approach: 85% - Telemetry-only approach is lightweight; no management UI needed
  - Impact: 82% - Value is deferred until operator reviews telemetry to identify template gaps
- **Acceptance:**
  - When a Prime thread draft is sent with `templateUsed === null`, a telemetry event `prime_manual_reply` is recorded
  - Event metadata includes: thread ID, guest question snippet (last inbound message, truncated to 200 chars), detected category (from `matchTemplates` if any partial match), timestamp
  - When a Prime thread draft is sent with `templateUsed !== null`, no additional event is recorded (the existing `draft_sent` event already captures templateUsed)
  - Event uses existing `recordInboxEvent` function — no new infrastructure
  - No management UI, no JSONL file, no D1 table — telemetry events are queryable via existing event log
- **Engineering Coverage:**
  - UI / visual: N/A - Backend telemetry only
  - UX / states: N/A - No user-facing change
  - Security / privacy: N/A - Internal telemetry, no PII beyond thread ID
  - Logging / observability / audit: Required - New event type `prime_manual_reply` logged via existing `recordInboxEvent`
  - Testing / validation: Required - Unit test: send Prime draft with null templateUsed -> `recordInboxEvent` called with `prime_manual_reply`; send with templateUsed set -> no extra event
  - Data / contracts: Required - New event type string `prime_manual_reply`; metadata schema: `{ guestQuestionSnippet: string; detectedCategory: string | null }`
  - Performance / reliability: N/A - One additional DB write on send, non-blocking
  - Rollout / rollback: N/A - Additive telemetry; rollback simply stops logging new events
- **Validation contract (TC-XX):**
  - TC-01: Send Prime draft with `templateUsed: null` -> `recordInboxEvent` called with eventType `prime_manual_reply`
  - TC-02: Send Prime draft with `templateUsed: "booking"` -> no `prime_manual_reply` event recorded
  - TC-03: Send email draft with `templateUsed: null` -> no `prime_manual_reply` event recorded (email-only)
  - TC-04: Event metadata contains `guestQuestionSnippet` truncated to 200 chars
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):** None required (S effort)
- **Scouts:** Verify `recordInboxEvent` signature supports arbitrary metadata — confirmed: it accepts `metadata: Record<string, unknown>` as the last argument
- **Edge Cases & Hardening:**
  - Thread with no inbound messages: `guestQuestionSnippet` is empty string
  - Very long inbound message: truncate to 200 chars to keep event metadata compact
  - `recordInboxEvent` failure: non-blocking; send succeeds even if telemetry write fails (existing pattern in the send route)
- **What would make this >=90%:**
  - Operator confirms they will review `prime_manual_reply` events periodically
- **Rollout / rollback:**
  - Rollout: Deploy with reception app
  - Rollback: Deploy previous version; events stop being logged
- **Documentation impact:**
  - None
- **Notes / references:**
  - Telemetry function: `apps/reception/src/lib/inbox/telemetry.server.ts`
  - Send route: `apps/reception/src/app/api/mcp/inbox/[threadId]/send/route.ts`

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| IT translation quality lower than EN | Medium | Low | Agent-generated translations reviewed by operator before merge; Homepage.json IT preset questions used as reference |
| Template answers drift from answerComposer over time | Medium | Low | Acceptable for v1; periodic reconciliation; Phase 2 D1 could unify |
| Prime draft save API may not accept templateUsed | Low | Low | Client-side tracking via badge is fallback; templateUsed visible in DraftReviewPanel regardless |
| Keyword matching gives poor suggestions for ambiguous messages | Low | Low | Category browsing is the fallback; keyword matching is a hint, not a gate |
| Staff ignore templates and continue writing manually | Low | Medium | Templates are prominent and one-click; adoption tracked via templateUsed metric |

## Observability
- Logging: `templateUsed` field on every saved draft; `prime_manual_reply` event for manual replies
- Metrics: Ratio of template-used vs manual Prime drafts (queryable from existing event log)
- Alerts/Dashboards: None in v1 — periodic operator review of telemetry

## Acceptance Criteria (overall)
- [ ] TemplatePicker visible in DraftReviewPanel for Prime direct threads
- [ ] TemplatePicker NOT visible for email threads
- [ ] Clicking a template populates the textarea with bilingual answer text + links
- [ ] Saving a draft after template selection includes `templateUsed` in the save payload
- [ ] `templateUsed` badge displays correctly after save
- [ ] Sending a manual Prime reply (no template) logs a `prime_manual_reply` telemetry event
- [ ] All unit and integration tests pass in CI
- [ ] Typecheck and lint pass

## Decision Log
- 2026-03-12: Selected Option A (static TS module) per analysis recommendation. No D1, no shared package, no cross-app coupling.
- 2026-03-12: Self-improvement loop scoped to telemetry-only for v1. Full candidate promotion deferred to Phase 2.
- 2026-03-12: Templates available for both Prime direct and Prime broadcast threads (not gated to direct-only). Broadcast threads may benefit from template answers for audience engagement replies.
- 2026-03-12: Auto-suggest + Browse all both included. Auto-suggest based on latest inbound message; Browse all as fallback.
- 2026-03-12: IT translations produced by agent, operator review before merge.

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Create template data module | Yes | None — answerComposer.ts verified with 7 branches, all categories and link structures confirmed | No |
| TASK-02: Add TemplatePicker to DraftReviewPanel | Yes | [Minor] DraftReviewPanel `onSave` callback does not include `templateUsed` — requires TASK-03 to extend the signature before template selection can be persisted | No — TASK-03 is sequenced after TASK-02; TemplatePicker can set local state and textarea content without save integration |
| TASK-03: Wire templateUsed through draft save | Yes | None — `updateDraftPayloadSchema` location confirmed (L34-41), `savePrimeInboxDraft` call site confirmed (L113-115), `InboxDraftUpdateInput` type confirmed (useInbox.ts L181-186) | No |
| TASK-04: Self-improvement signal capture | Yes | None — `recordInboxEvent` exists and accepts arbitrary metadata; send route pattern confirmed | No |

## Overall-confidence Calculation
- TASK-01: 90% * 2 (M) = 180
- TASK-02: 85% * 2 (M) = 170
- TASK-03: 90% * 1 (S) = 90
- TASK-04: 85% * 1 (S) = 85
- Sum weights: 2 + 2 + 1 + 1 = 6
- Overall-confidence = (180 + 170 + 90 + 85) / 6 = 87.5% -> 88%
