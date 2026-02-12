# Email Autodraft System

How Brikette's email response pipeline works and how it improves over time.

## Overview

The system drafts replies to customer emails for Hostel Brikette using a three-stage deterministic pipeline exposed as MCP (Model Context Protocol) tools. An LLM orchestrates the pipeline during an email session, but the core stages — interpretation, composition, and quality gating — are code, not prompts. This means the system's behaviour is testable, auditable, and improvable without retraining anything.

```
Incoming email
     │
     ▼
┌─────────────┐    ┌─────────────────┐    ┌──────────────────┐
│  Stage 1    │    │    Stage 2       │    │    Stage 3       │
│  Interpret  │───▶│    Generate      │───▶│  Quality Gate    │
│             │    │                  │    │                  │
│ Regex-based │    │ BM25 template    │    │ Rules-based      │
│ parsing     │    │ ranking + HTML   │    │ validation       │
│             │    │ rendering        │    │                  │
└─────────────┘    └─────────────────┘    └──────────────────┘
     │                    │                        │
     │    Knowledge Base  │                        │
     │    ┌───────────┐   │                        │
     │    │ FAQ (29)  │◀──┘                        │
     │    │ Policies  │                            │
     │    │ Rooms     │                            │
     │    │ Pricing   │                            │
     │    └───────────┘                            │
     │                                             │
     ▼                                             ▼
 EmailActionPlan                            QualityResult
 (structured JSON)                          { passed, failed_checks, warnings }
```

## Stage 1: Interpretation (`draft_interpret`)

**Input:** Raw email body, optional subject, optional thread context.

**Output:** `EmailActionPlan` — a structured JSON object that every downstream stage consumes.

What it does:

1. **Thread normalization** — strips quoted replies, "On ... wrote:" headers, and forwarded-message markers so only the new content remains.

2. **Language detection** — keyword matching for Italian (`ciao`, `grazie`), Spanish (`hola`, `gracias`), and English (default). Returns `EN | IT | ES | UNKNOWN`.

3. **Intent extraction** — splits the text on `?` marks to find questions, runs regex patterns for requests (`please ...`, `can you ...`), and looks for confirmation words (`confirmed`, `yes`, `okay`).

4. **Agreement detection** — classifies whether the guest is accepting terms:
   - `confirmed` (90% confidence) — explicit phrases like "I agree", "accetto", "de acuerdo"
   - `likely` (60%) — agreement phrase plus a contrast word ("but", "however")
   - `unclear` (40%) — bare "yes" or "ok" without context
   - `none` (0%) — no agreement language, or negation detected ("don't agree")

   Conservative by design: the system never auto-confirms agreement. `likely` and `unclear` both set `requires_human_confirmation: true`.

5. **Scenario classification** — keyword-based categorisation into `payment`, `cancellation`, `policy`, `faq`, or `general`. Each category carries a confidence score.

6. **Workflow trigger detection** — flags prepayment, terms & conditions, and booking-monitor triggers based on keyword presence.

7. **Thread summary** (when thread context is provided) — extracts prior commitments from staff messages, identifies open/resolved questions, detects tone history, and resolves the guest name.

All of this is deterministic regex and string matching. No LLM call, no network dependency, no randomness.

## Stage 2: Composition (`draft_generate`)

**Input:** `EmailActionPlan`, optional subject, recipient name, prepayment step/provider.

**Output:** Draft (plain text + branded HTML), template metadata, knowledge sources, quality result.

What it does:

1. **Template selection** via BM25 full-text search:
   - Loads 18 pre-written templates from `data/email-templates.json` (9 categories: booking-issues, policies, transportation, check-in, access, payment, prepayment, cancellation, activities).
   - Builds a search index with boosted fields: `subject` (2x), `category` (1.5x), `body` (1x).
   - Expands the query with synonyms (`arrival` → `check-in`, `arrive`) and phrase expansions (`check in` → `check-in`, `arrival time`, `early arrival`).
   - Ranks candidates and applies thresholds: auto-select at 80%+, suggest at 50%+, none below.
   - **Hard rules override BM25** for `prepayment` and `cancellation` categories — these always resolve to the exact template for the step/provider.

2. **Knowledge loading** — maps the scenario category to knowledge URIs (`brikette://faq`, `brikette://policies`, etc.) and loads the relevant data. Also loads the draft guide and voice examples as context for the orchestrating LLM.

3. **Post-processing** — ensures the draft body has a signature and meets minimum word counts per category.

4. **HTML rendering** — wraps the plain text in Brikette's branded email template: header with hostel icon, body paragraphs with bold/link support, dual-owner signatures (Cristiana + Peter) with AVIF/PNG fallback, social footer (Instagram, TikTok, website), and booking CTA button when the `booking_monitor` trigger is active.

5. **Inline quality check** — calls Stage 3 automatically and includes the result in the output.

## Stage 3: Quality Gate (`draft_quality_check`)

**Input:** `EmailActionPlan` + draft candidate (plain + HTML).

**Output:** `{ passed: boolean, failed_checks: string[], warnings: string[], confidence: number }`.

Six hard checks (any failure = `passed: false`):

| Check | Rule |
|-------|------|
| `unanswered_questions` | Every question keyword from the action plan must appear in the draft body |
| `prohibited_claims` | Draft must not contain "availability confirmed", "we will charge now", etc. |
| `missing_plaintext` | Plain text body must be non-empty |
| `missing_html` | HTML body must be non-empty |
| `missing_signature` | Body must contain "Hostel Brikette", "Brikette", or "Best regards" |
| `missing_required_link` | If `booking_monitor` trigger is active, body must contain a URL |
| `contradicts_thread` | Draft must not negate keywords from prior staff commitments in the thread |

Two soft warnings:

| Warning | Rule |
|---------|------|
| `language_mismatch` | Draft language doesn't match the detected guest language |
| `length_out_of_range` | Word count outside 80% to 120% of the category target (e.g., FAQ = 50–100 words) |

Confidence = `(total_checks - failed_checks) / total_checks`.

## Gmail Label State Machine

The system manages email lifecycle through Gmail labels:

```
                    ┌──────────────────┐
                    │ Needs-Processing │  ← Incoming
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────────┐
              ▼              ▼                   ▼
     ┌────────────┐  ┌─────────────┐   ┌──────────────┐
     │  Drafted   │  │ Acknowledged│   │  Promotional │
     └─────┬──────┘  └─────────────┘   └──────────────┘
           │
           ▼
  ┌────────────────┐
  │ Ready-For-     │  → Human reviews in Gmail
  │ Review         │
  └────────┬───────┘
           │
           ▼
     ┌──────────┐
     │  Sent    │
     └──────────┘
```

Special workflow branches:
- **Deferred** — complex emails parked for later
- **Awaiting-Agreement** → **Agreement-Received** — T&C acceptance flow
- **Prepayment-Chase-1/2/3** — three-step payment reminder escalation

## Knowledge Base (MCP Resources)

Seven resources served by the MCP server, each with a 5-minute cache:

| URI | Source | Content |
|-----|--------|---------|
| `brikette://faq` | `apps/brikette/src/locales/en/faq.json` | 29 FAQ items |
| `brikette://rooms` | Hardcoded in resource handler | Room types, beds, amenities |
| `brikette://pricing/menu` | Hardcoded in resource handler | Bar and breakfast prices |
| `brikette://policies` | `apps/brikette/src/locales/en/faq.json` (filtered) | Check-in/out, age, pets, cancellation |
| `brikette://draft-guide` | `data/draft-guide.json` | Length calibration, content rules, tone triggers |
| `brikette://voice-examples` | `data/voice-examples.json` | Good/bad examples per scenario, phrases to use/avoid |
| `brikette://email-examples` | `data/email-examples.json` | 35 annotated classification examples with reasoning |

The FAQ and policies resources pull from the same JSON that powers the Brikette website, so the knowledge base stays in sync with what guests see online.

## How the System Improves Over Time

The system has five improvement vectors, ordered from most mechanical to most architectural:

### 1. Template Library (data/email-templates.json)

**What it is:** 18 pre-written response templates covering 9 categories.

**How it improves:** When Pete reviews a generated draft and rewrites a better version, that rewrite can be added as a new template or replace an existing one. The BM25 ranker automatically picks the best match — no code changes needed.

**Governance:** The template linter (`scripts/lint-templates.ts`) enforces quality rules:
- Links in templates are live (HTTP HEAD check)
- No placeholder text left in (`{name}`, `[date]`, etc.)
- Policy-category templates contain keywords that actually appear in the policy data
- Templates have required fields (subject, body, category)

Run `pnpm --filter @acme/mcp-server lint-templates` to validate.

### 2. Voice Examples (data/voice-examples.json)

**What it is:** Per-scenario examples of good and bad phrasing, preferred/avoided phrases, and tone guidance.

**How it improves:** When the LLM orchestrator composes a draft that doesn't match Brikette's voice, Pete's edits reveal what "right" sounds like. Those corrections can be distilled into new `good_examples` or `phrases_to_avoid` entries. The orchestrating LLM reads these examples as context when composing, so adding a single example shifts all future drafts for that scenario.

### 3. Classification Examples (data/email-examples.json)

**What it is:** 35 annotated email examples with category, classification reasoning, and ambiguity flags.

**How it improves:** When the system misclassifies an email (e.g., treating a cancellation as a policy question), the misclassified email becomes a new example with the correct label and reasoning. The orchestrating LLM uses these examples for few-shot classification, so each new example reduces future misclassification for that pattern.

Ambiguous examples (`is_ambiguous: true`) are especially valuable — they teach the system where category boundaries blur.

### 4. Quality Gate Rules (draft-quality-check.ts)

**What it is:** Six hard checks and two soft warnings that catch common draft failures.

**How it improves:** Each check is independently testable. When a new failure pattern emerges in production (e.g., drafts accidentally promising specific room assignments), a new check function is added to `runChecks()`. The check immediately catches all future instances across all categories.

The quality gate also functions as a feedback signal. When the pass rate for a particular scenario is consistently low, it indicates the templates or voice examples for that category need attention.

### 5. Draft Guide (data/draft-guide.json)

**What it is:** Structural rules for drafts — length ranges per category, content rules (always/if/never), information ordering, format decision tree, tone triggers.

**How it improves:** Length calibration values can be tuned based on what Pete actually sends vs. what the system generates. If FAQ responses are consistently too long, narrowing the `faq.max_words` value from 100 to 80 causes the quality gate to flag oversized drafts.

The `content_rules.never` array directly feeds the prohibited claims check — adding a phrase here immediately makes it a hard failure.

## Improvement Cycle in Practice

```
1. Process emails session
   │
   ▼
2. Pete reviews drafts in Gmail
   │
   ├─ Draft is good → Send as-is (no action needed)
   │
   ├─ Draft needs edits → Edit and send
   │   │
   │   └─ Capture the edit:
   │       ├─ Better wording? → Update voice-examples.json
   │       ├─ Wrong template? → Add/update email-templates.json
   │       ├─ Wrong category? → Add email-examples.json entry
   │       └─ Structural issue? → Update draft-guide.json
   │
   └─ Draft is wrong → Flag for manual handling
       │
       └─ Diagnose the failure:
           ├─ Interpretation wrong? → Check regex patterns in draft-interpret.ts
           ├─ Quality gate missed it? → Add new check to draft-quality-check.ts
           └─ New scenario type? → Add template + examples + voice entries
```

Each correction feeds back into the data files. The next session benefits immediately — no redeployment, no retraining, no configuration changes. Just edit a JSON file and commit.

## Testing

The pipeline has comprehensive automated testing:

- **Unit tests** for each stage: `draft-interpret.test.ts`, `draft-generate.test.ts`, `draft-quality-check.test.ts`
- **Integration tests** (`pipeline-integration.test.ts`): 41 test cases running real emails through all three stages with 28 anonymized fixtures covering FAQ, policy, payment, cancellation, agreement, prepayment, Italian, and system notifications
- **Template linting** (`template-lint.test.ts`): validates template structure, links, and policy consistency
- **Ranker tests** (`template-ranker.test.ts`): validates BM25 scoring, synonym expansion, and hard-rule overrides
- **Voice/example tests** (`voice-examples.test.ts`, `email-examples.test.ts`): schema validation for the data files

Run all tests: `pnpm --filter @acme/mcp-server test`

## File Map

```
packages/mcp-server/
├── src/
│   ├── index.ts                    # MCP server entry (stdio transport)
│   ├── server.ts                   # Tool/resource routing
│   ├── tools/
│   │   ├── draft-interpret.ts      # Stage 1: Email → EmailActionPlan
│   │   ├── draft-generate.ts       # Stage 2: ActionPlan → Draft
│   │   ├── draft-quality-check.ts  # Stage 3: Draft → QualityResult
│   │   ├── gmail.ts                # Gmail API operations
│   │   └── booking-email.ts        # Booking confirmation emails
│   ├── resources/
│   │   ├── brikette-knowledge.ts   # FAQ, rooms, pricing, policies
│   │   ├── draft-guide.ts          # Draft quality framework
│   │   ├── voice-examples.ts       # Tone/voice examples
│   │   └── email-examples.ts       # Classification examples
│   ├── utils/
│   │   ├── template-ranker.ts      # BM25 template matching
│   │   ├── template-lint.ts        # Template governance rules
│   │   ├── email-template.ts       # Branded HTML generation
│   │   ├── email-mime.ts           # MIME encoding for Gmail API
│   │   ├── workflow-triggers.ts    # Prepayment chase workflow
│   │   └── validation.ts           # Zod + error formatting
│   └── __tests__/                  # 13 test suites
├── data/
│   ├── email-templates.json        # 18 response templates (9 categories)
│   ├── draft-guide.json            # Length/content/tone rules
│   ├── voice-examples.json         # Good/bad phrasing per scenario
│   └── email-examples.json         # 35 annotated classification examples
└── scripts/
    ├── lint-templates.ts           # Template governance linter
    ├── test-draft-generate.ts      # Manual draft testing
    ├── run-integration-test.ts     # E2E workflow testing
    └── collect-baseline-sample.ts  # Baseline data collection
```
