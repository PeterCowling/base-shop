---
Type: Fact-Find
Outcome: Planning
Status: Complete
Domain: Automation
Created: 2026-02-02
Last-updated: 2026-02-02
Feature-Slug: email-autodraft-consolidation
Related-Plan: docs/plans/email-autodraft-consolidation-plan.md
Related-Card: docs/business-os/cards/BRIK-ENG-0020.user.md
Business-Unit: BRIK
---

# Email Autodraft Consolidation Fact-Find Brief

## Scope

### Summary

Consolidate the disparate email autodraft system components into a world-class draft generation system. This includes:

1. **Integrating existing components** - MCP tools, knowledge resources, workflow skill, email templates
2. **Improving Google Apps Scripts** - Enhance the booking-monitor and email generation scripts
3. **Professional email formatting** - Use GAS email templates as basis for rich HTML emails (signature images, colored backgrounds, logo)
4. **Prepayment workflow integration** - T&C opt-in process, agreement detection, chase sequences
5. **Mixed response handling** - Detect when guest responds "agree" but also asks questions
6. **Reception system unification** - Route reception app emails through unified system for audit trail and branding consistency
7. **Formal pipeline architecture** - Explicit interpretation → composition → quality gate stages
8. **State machine specification** - Formal label/workflow state transitions

### Goals

- Create cohesive draft generation that leverages ALL available context sources seamlessly
- Reduce time-to-quality-draft through better template matching and personalization
- Achieve consistent, high-quality responses that require minimal editing
- Enable intelligent context assembly from multiple knowledge sources
- Provide response quality comparable to Pete's hand-written emails
- Generate professional HTML emails matching existing GAS quality (dual signatures, logo, branded colors)
- Handle prepayment T&C workflow responses automatically (agree detection + question handling)
- Improve existing Google Apps Scripts as part of consolidation
- Unify reception app email generation with autodraft system for audit trail consistency

## Success Definition (Operationalizing "World Class")

"World class" is not a feeling—it requires **hard acceptance criteria by category** and **measurable failure definitions**.

### Category-Level Acceptance Targets

| Category | Acceptance Rate Target | Max Critical Error Rate | Notes |
|----------|----------------------|------------------------|-------|
| **FAQ** (breakfast, check-in, directions) | ≥85% sent without edit | <1% | High-volume, low-stakes |
| **Policy** (age, alcohol, pets, cancellation) | ≥75% sent without edit | <2% | Needs precise policy language |
| **Payment/Prepayment** (chase sequences, CC issues) | ≥70% sent without edit | <1% | Financial implications |
| **T&C Agreement Response** | ≥80% sent without edit | 0% for agreement detection | Must not false-positive |
| **Cancellation/Refund** | ≥60% sent without edit | <2% | High sensitivity, often needs personalization |
| **Complaint** | ≥50% sent without edit | <3% | Requires human judgment |
| **Multi-question** | ≥65% sent without edit | <2% | Must answer ALL questions |

### Measurable Success Metrics

**Primary Metrics:**
- **Acceptance rate by category** (% sent without any edit)
- **Minor edit rate** (spelling/grammar/personalization only)
- **Major edit rate** (content/tone/structure changes)
- **Critical error rate** (see failure definitions below)

**Efficiency Metrics:**
- **Time-to-draft** (seconds from email fetch to draft presented)
- **Time-to-send** (minutes from draft presented to email sent, including edits)
- **Emails processed per session**

**Quality Metrics:**
- **Thread coherence rate** (doesn't contradict prior messages)
- **Question coverage rate** (all explicit questions answered)
- **Template match accuracy** (correct template selected)

### Critical Error Definitions (Must Prevent)

| Error Type | Definition | Acceptable Rate |
|------------|------------|-----------------|
| **Hallucinated policy** | States policy that doesn't exist or is wrong | 0% |
| **Wrong pricing** | Incorrect price quoted | 0% |
| **Wrong deadline** | Incorrect date/time stated (check-in, payment deadline) | 0% |
| **False promise** | Commits to something we can't deliver | 0% |
| **Wrong language** | Responds in different language than guest wrote | <1% |
| **Missed agreement** | Failed to detect "agree" in response (false negative) | <5% |
| **False agreement** | Detected "agree" when none present (false positive) | 0% |
| **Ignored thread context** | Contradicts prior message in thread | <2% |
| **Missed question** | Failed to answer explicit question in email | <5% |
| **Prohibited claim** | Says "availability confirmed" or similar | 0% |
| **Internal leak** | Includes internal notes/instructions in draft | 0% |

### Baseline Measurement Required

**Before claiming confidence, measure current state:**
1. Sample 50 threads from last 3 months
2. Classify by category
3. Measure current editing time
4. Identify top 10 failure modes causing edits
5. Document template coverage gaps

**Validation checkpoint:** TASK-00 must complete before implementation confidence can exceed 80%.

### Non-goals

- Automated sending (drafts only, Pete reviews all)
- Real-time availability checking (continue directing to website)
- Multi-language auto-detection and translation (future phase)
- Learning from Pete's edits (future phase)
- Replacing the existing MCP tools architecture (enhance, don't replace)

### Constraints & Assumptions

- Constraints:
  - Must use existing MCP tools infrastructure (`packages/mcp-server`)
  - Must maintain Gmail label workflow for state management
  - Human review required for all drafts before sending
  - Leverage Claude Max subscription (no additional API costs)
  - Professional email HTML must match quality of existing GAS-generated emails

- Assumptions:
  - Current email templates (18) cover ~70% of scenarios
  - MCP resources provide accurate, up-to-date information
  - The `/process-emails` skill workflow is sound, needs richer context
  - GAS email formatting patterns (`_EmailsConfig.gs`) can be ported to MCP server

## Repo Audit: Current State Analysis

### Component Inventory

**0. Google Apps Scripts** (`apps/brikette-scripts/`)

Four active GAS deployments with sophisticated email generation:

| Script | Purpose | Key Features |
|--------|---------|--------------|
| **Booking Monitor** | Scans Gmail for bookings, generates welcome emails | T&C opt-in block, professional HTML |
| **Guest Email** | Guest communications | Planned integration |
| **Alloggiati** | Italian guest registration | JSONP response format |
| **Statistics** | Analytics/monitoring | Test endpoint |

**Key Files:**
- `_EmailsConfig.gs` - Professional email templates with:
  - Dual owner signatures (Cristiana + Peter) as images
  - Hostel logo with AVIF fallback
  - Color schemes (yellow activity)
  - Social links (Instagram, TikTok, Website)
  - T&C link footer
- `_BookingImporterEmail.gs` - Welcome email generation with:
  - T&C opt-in "Action Required" block (48-hour deadline)
  - Conditional logic: skips for Booking.com (10-digit codes)
  - Rich booking details table
  - Room information tables
  - Digital assistant links per occupant

**Gap:** These scripts generate excellent professional emails, but the MCP server uses a simpler template (`email-template.ts`). Need to port GAS formatting quality.

**7. Reception App Email System** (`apps/reception/`)

The reception app has a sophisticated email workflow that should be unified:

**Activity Code State Machine:**
```
Code 1: BOOKING_CREATED (initial)
    ↓
Code 2: FIRST_REMINDER (T&C chase #1)
    ↓
Code 3: SECOND_REMINDER (T&C chase #2)
    ↓
Code 4: AUTO_CANCEL_NO_TNC (cancelled)
    or
Code 21: AGREED_NONREFUNDABLE_TNC (agreement received)
```

**Key Files:**
- `useEmailProgressData.ts` - Filters eligible occupants, tracks state
- `useEmailProgressActions.ts` - Manages state transitions (logNextActivity, logConfirmActivity)
- `EmailProgressLists.tsx` - Staff dashboard for managing email sequences
- `useBookingEmail.ts` - Sends booking confirmation via GAS
- `emailConstants.ts` - Configuration (Firebase URLs, link prefixes)

**Integration Opportunity:**
- Route reception emails through unified MCP tools for:
  - Consistent audit trail (activity codes + Gmail labels unified)
  - Branded template consistency (same HTML generation)
  - Agreement detection shared with email autodraft
- Replace direct GAS calls with MCP tool calls where appropriate

**Gap:** Reception emails are generated separately from autodraft system. No shared template engine, no unified audit trail, no shared agreement detection.

**1. Gmail MCP Tools** (`packages/mcp-server/src/tools/gmail.ts` ~680 lines)
- `gmail_list_pending` - List emails with Needs-Processing label
- `gmail_get_email` - Fetch full email with thread context
- `gmail_create_draft` - Create threaded draft reply
- `gmail_mark_processed` - Update label state
- **Quality:** Production-ready, well-structured with Zod validation
- **Gap:** No contextual pre-fetching of knowledge based on email content

**2. Gmail Client** (`packages/mcp-server/src/clients/gmail.ts`)
- OAuth2 authentication flow
- Token refresh handling
- Credential management
- **Quality:** Working, handles auth edge cases
- **Gap:** None identified

**3. Brikette Knowledge Resources** (`packages/mcp-server/src/resources/brikette-knowledge.ts` ~350 lines)
- `brikette://faq` - 29 FAQ items
- `brikette://rooms` - Room types, amenities, pricing
- `brikette://pricing/menu` - Bar and breakfast menus
- `brikette://policies` - Derived from FAQ (check-in, age, etc.)
- **Quality:** Good, 5-minute caching, hardcoded room/pricing data
- **Gap:** No semantic search/matching capability

**4. Email Templates** (`packages/mcp-server/data/email-templates.json` - 18 templates)
- Categories: check-in (4), access (2), transportation (1), payment (1), prepayment (5), cancellation (2), policies (2), activities (1)
- **Quality:** Real templates from Pete's sent emails
- **Gap:** Templates exist as static data, no intelligent matching or personalization engine

**5. Workflow Skill** (`.claude/skills/process-emails/SKILL.md` ~500 lines)
- Complete classification guide
- Decision tree for email types
- Draft guidelines and quality checks
- Template reference documentation
- **Quality:** Comprehensive documentation
- **Gap:** Relies on Claude's general reasoning rather than structured retrieval

**6. HTML Email Generation** (`packages/mcp-server/src/utils/email-template.ts`)
- Branded email wrapper with Brikette styling
- Responsive design for mobile
- **Quality:** Working, matches existing email branding
- **Gap:** None identified

### Architecture Diagram (Current)

```
                     /process-emails Skill
                            |
                            v
    +---------------------------------------------------+
    |                  Claude Code                       |
    |  (general reasoning about email + manual lookup)   |
    +---------------------------------------------------+
            |                |                |
            v                v                v
    gmail_list_pending  gmail_get_email  gmail_create_draft
            |                |                |
            v                v                v
    +---------------------------------------------------+
    |              Gmail API (via MCP Server)            |
    +---------------------------------------------------+

    Knowledge Resources (loaded on demand, separately):
    - brikette://faq
    - brikette://rooms
    - brikette://pricing/menu
    - brikette://policies

    Templates (referenced in skill doc, not integrated):
    - packages/mcp-server/data/email-templates.json
```

### Target Architecture: Three-Stage Pipeline

A world-class system requires a **repeatable pipeline** with **strong structured outputs**, not a single "LLM does everything" blob.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STAGE 1: INTERPRETATION                              │
│                    (Deterministic + Light LLM Assistance)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Input: Raw email + thread history                                           │
│                                                                              │
│  Substeps:                                                                   │
│  1. Thread normalization (strip quoted text, isolate new message)           │
│  2. Language detection                                                       │
│  3. Intent extraction (questions[], requests[], confirmations[])            │
│  4. Agreement detection (with confidence + evidence spans)                  │
│  5. Workflow trigger identification (prepayment, T&C, booking-monitor)      │
│  6. Scenario classification with confidence                                 │
│                                                                              │
│  Output: EmailActionPlan (structured JSON)                                  │
│  {                                                                          │
│    intents: Intent[],                                                       │
│    required_actions: Action[],                                              │
│    knowledge_topics: string[],                                              │
│    template_candidates: TemplateMatch[],                                    │
│    tone_profile: ToneProfile,                                               │
│    must_include: string[],                                                  │
│    must_avoid: string[],                                                    │
│    thread_context: ThreadSummary,                                           │
│    agreement_status: 'confirmed' | 'likely' | 'unclear' | 'none',          │
│    workflow_triggers: WorkflowTrigger[]                                     │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STAGE 2: COMPOSITION                                 │
│                        (Creative LLM Layer)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Input: EmailActionPlan + assembled knowledge context                        │
│                                                                              │
│  Substeps:                                                                   │
│  1. Template selection (or "no template, generate fresh")                   │
│  2. Knowledge retrieval (only relevant subset)                              │
│  3. Draft generation following Draft Quality Framework rules                │
│  4. Render both plaintext AND HTML versions                                 │
│                                                                              │
│  Output: DraftCandidate                                                     │
│  {                                                                          │
│    subject: string,                                                         │
│    body_plain: string,                                                      │
│    body_html: string,                                                       │
│    answered_questions: string[],                                            │
│    template_used: string | null,                                            │
│    knowledge_sources: string[]                                              │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STAGE 3: QUALITY GATE                                │
│                    (Rules-Based + Optional LLM Check)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  Input: EmailActionPlan + DraftCandidate                                    │
│                                                                              │
│  Checks (rules-based):                                                      │
│  ☐ Every extracted question has an answer section                          │
│  ☐ Length within scenario target (±20%)                                    │
│  ☐ Required links present (booking CTA if scenario mandates)               │
│  ☐ No prohibited claims ("availability confirmed", "we will charge now")   │
│  ☐ Does not include internal notes or instructions                         │
│  ☐ Signature block present                                                 │
│  ☐ Does not contradict thread context                                      │
│  ☐ Language matches detected language                                       │
│  ☐ HTML is valid and includes plaintext alternative                        │
│                                                                              │
│  Checks (optional LLM pass):                                                │
│  ☐ Tone matches tone_profile                                               │
│  ☐ No hallucinated policy details                                          │
│  ☐ Professional and warm, not scolding                                     │
│                                                                              │
│  Output: QualityResult                                                      │
│  {                                                                          │
│    passed: boolean,                                                         │
│    failed_checks: string[],                                                 │
│    warnings: string[],                                                      │
│    confidence: number                                                       │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────┴───────────────┐
                    │                               │
              [PASSED]                        [FAILED]
                    │                               │
                    ▼                               ▼
          Present draft to Pete           Show failures + option to
          for final review                regenerate or flag for manual
```

**Why Three Stages Matter:**
- **Debuggable:** Can inspect EmailActionPlan to understand interpretation
- **Improvable:** Can improve weak stage independently (e.g., better template matching)
- **Measurable:** Can track accuracy at each stage
- **Governable:** Quality gate enforces rules regardless of LLM behavior

### Formal State Machine Specification

Email processing requires a **formal state machine** to prevent duplicate processing, ensure correct workflow transitions, and maintain audit trail.

#### Gmail Label State Machine

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        GMAIL LABEL TAXONOMY                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Brikette/                                                                   │
│  ├── Inbox/                                                                  │
│  │   ├── Needs-Processing      (NEW: email requires attention)              │
│  │   ├── Processing            (IN-PROGRESS: being worked on)               │
│  │   ├── Awaiting-Agreement    (BLOCKED: waiting for T&C reply)             │
│  │   └── Deferred              (PAUSED: moved to end of queue)              │
│  ├── Drafts/                                                                 │
│  │   ├── Ready-For-Review      (draft created, needs Pete)                  │
│  │   └── Sent                  (archive trigger)                            │
│  ├── Processed/                                                              │
│  │   ├── Drafted               (response sent)                              │
│  │   ├── Acknowledged          (no response needed)                         │
│  │   └── Skipped               (not customer/irrelevant)                    │
│  ├── Workflow/                                                               │
│  │   ├── Prepayment-Chase-1    (first payment attempt failed)               │
│  │   ├── Prepayment-Chase-2    (second attempt failed)                      │
│  │   ├── Prepayment-Chase-3    (final attempt pending)                      │
│  │   └── Agreement-Received    (T&C confirmed)                              │
│  ├── Promotional               (marketing, archived for batch)              │
│  └── Spam                      (marked spam)                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### State Transitions (Allowed)

| From State | To State | Trigger | Action |
|------------|----------|---------|--------|
| Needs-Processing | Processing | Tool fetches email | Lock for processing |
| Processing | Drafted | Draft created | Create draft, remove Processing |
| Processing | Acknowledged | Informational email | Note info, remove Processing |
| Processing | Skipped | Not customer | Archive, remove Processing |
| Processing | Awaiting-Agreement | T&C email sent | Add Awaiting-Agreement |
| Processing | Deferred | User defers | Keep in queue, remove Processing |
| Processing | Spam | Spam detected | Move to spam |
| Awaiting-Agreement | Agreement-Received | "Agree" detected | Trigger payment workflow |
| Awaiting-Agreement | Prepayment-Chase-1 | 24h no response | Send chase #1 |
| Prepayment-Chase-1 | Prepayment-Chase-2 | 24h no response | Send chase #2 |
| Prepayment-Chase-2 | Prepayment-Chase-3 | 24h no response | Send final warning |
| Prepayment-Chase-3 | (cancelled) | 24h no response | Cancel booking |

#### Reception Activity Code Alignment

Unified with reception app activity codes:

| Activity Code | Meaning | Gmail Label Equivalent |
|--------------|---------|----------------------|
| 1 | BOOKING_CREATED | Awaiting-Agreement |
| 2 | FIRST_REMINDER | Prepayment-Chase-1 |
| 3 | SECOND_REMINDER | Prepayment-Chase-2 |
| 4 | AUTO_CANCEL_NO_TNC | (cancelled, remove all) |
| 21 | AGREED_NONREFUNDABLE_TNC | Agreement-Received |
| 5/6/7/8 | Payment attempts | Prepayment-Chase-N |

#### Race Condition Prevention

- **Lock mechanism:** When gmail_get_email is called, immediately transition to "Processing" label
- **Idempotency:** Check label before processing; if already Processing, return "being processed"
- **Timeout:** If Processing for >30 minutes without completion, auto-release lock

### Prepayment T&C Workflow (Enhanced)

The booking-monitor script implements a sophisticated T&C opt-in workflow:

**Trigger Conditions:**
- Non-refundable booking (payment terms include "non-refundable")
- NOT from Booking.com (reservation code is NOT 10 digits)
- Booking.com handles their own T&C process

**Workflow:**
1. Welcome email includes "Action Required" block asking guest to reply "Agree" within 48 hours
2. If no response: chase emails at 24h, 36h
3. If "agree" response: start payment processing
4. If payment fails: 3-attempt chase sequence (templates exist in email-templates.json)

**Current State:**
- T&C opt-in block exists in `_BookingImporterEmail.gs` (lines 53-77)
- Prepayment chase templates exist in `email-templates.json` (5 templates)
- Activity tracking in `usePrepaymentData.ts` with codes 5/6/7/8/21

**Gap - Not Yet Integrated:**
- Agreement detection (looking for "agree" in responses) - needs MCP tool
- Mixed response handling (guest says "agree" AND asks questions)
- Chase automation is not connected to email processing workflow

### Agreement Detection Specification (High-Stakes)

Agreement detection triggers payment processing, so **false positives are expensive**.

**Required Output Structure:**
```typescript
interface AgreementDetection {
  status: 'confirmed' | 'likely' | 'unclear' | 'none';
  confidence: number; // 0-100
  evidence_spans: {
    text: string;
    position: 'new_message' | 'quoted' | 'signature';
    is_negated: boolean;
  }[];
  requires_human_confirmation: boolean;
  detected_language: string;
  additional_content: boolean; // has questions/requests beyond agreement
}
```

**Detection Scope:**
- **MUST scope to new message content only** (exclude quoted thread, signatures)
- **MUST handle language variants:** "Agree", "I agree", "Agreed", "Accetto" (IT), "De acuerdo" (ES)
- **MUST detect negations:** "I don't agree", "I cannot agree", "I agree but..." → status: 'unclear'
- **MUST detect ambiguity:** "Yes" alone is NOT agreement without context → status: 'unclear'

**Confidence Thresholds:**
| Status | Confidence | Action |
|--------|------------|--------|
| confirmed | ≥95% | Auto-flag for payment processing |
| likely | 70-94% | Present to Pete with evidence |
| unclear | 40-69% | Require human review |
| none | <40% | No agreement detected |

**Mixed Response Handling:**
```
Guest replies: "Agree. Also, what time is breakfast served?"
```
Output:
```json
{
  "status": "confirmed",
  "confidence": 98,
  "evidence_spans": [{"text": "Agree", "position": "new_message", "is_negated": false}],
  "requires_human_confirmation": false,
  "additional_content": true
}
```
**Action:** Flag agreement-received AND generate draft response for breakfast question.

### Gap Analysis

| Component | Current State | World-Class State | Gap |
|-----------|--------------|-------------------|-----|
| Email Fetching | Working | Working | None |
| Classification | Manual reasoning | Structured + examples | Missing pattern bank |
| Template Selection | Manual lookup | Auto-matched by scenario | No matching engine |
| Knowledge Assembly | Load all, filter manually | Load relevant subset | No semantic retrieval |
| Personalization | Generic salutation | Guest history context | No CRM integration |
| Draft Quality | Good | Excellent (matches Pete's voice) | Missing voice/tone guide |
| Response Time | ~30s per email | ~10s per email | Context switching overhead |
| **Email HTML Quality** | Basic template | Professional GAS-level | Port GAS formatting |
| **T&C Agreement Detection** | Manual | Auto-detect "agree" | New tool needed |
| **Mixed Response Handling** | Not supported | Split agree + question | New workflow needed |
| **Prepayment Chase** | Manual templates | Integrated workflow | Connect to MCP |

### Key Observations

**1. Templates are underutilized**
The 18 templates in `email-templates.json` represent Pete's actual responses, but Claude must manually reason about when to use them. No structured matching.

**2. Knowledge is siloed**
Each MCP resource (`brikette://faq`, `brikette://rooms`, etc.) loads independently. There's no concept of "assemble the right context for THIS email."

**3. Classification lacks examples**
The skill has a good decision tree, but Claude sees new emails without examples of similar past emails and their correct classifications.

**4. No voice/tone reference**
Pete's communication style is implicit in templates, but not explicitly captured for Claude to learn from.

**5. Thread context underused**
`gmail_get_email` returns thread context, but there's no guidance on using previous exchanges to inform the response.

**6. No Draft Quality Framework**
Critical gap: The skill lacks explicit guidance on:
- **Length calibration** - How much to include based on scenario type
- **Content selection** - What to include vs. omit, how to decide relevance
- **Information ordering** - Beyond skeleton, how to order within sections
- **Format decisions** - When to use text vs. hyperlinks vs. lists
- **Tone variations** - How to adjust tone for different situations

### Draft Quality Framework Gap Analysis

Analyzing the 18 templates reveals **implicit patterns** that should be **explicit guidance**:

**Length Rules (extracted from templates):**
| Scenario Type | Target Length | Example |
|--------------|---------------|---------|
| Simple FAQ | 50-100 words | "Out of hours check-in" |
| Standard inquiry | 100-150 words | "Transportation to Hostel" |
| Policy explanation | 150-250 words | "Alcohol Policy" |
| Complex/sensitive | 300+ words | "Non-Refundable Cancellation" |

**Content Selection Rules (extracted):**
- ALWAYS: Direct answer to their specific question
- ALWAYS: Self-service links that preempt predictable follow-ups
- IF POLICY: Include the "why" (builds compliance through understanding)
- IF NEGATIVE: Acknowledge first, then explain
- NEVER: Information unrelated to their question
- NEVER: Details available via linked resources

**Information Ordering (extracted):**
1. Acknowledge/thank (always first)
2. Direct answer (immediately after - don't bury the answer)
3. Context/explanation (why or how)
4. Self-service links (offload follow-ups)
5. Required action (what they must do)
6. Forward-looking close (looking forward to seeing you)

**Format Decision Tree (extracted):**
```
Is it detailed instructions (>2 sentences to explain)?
├─ Yes → Link to Google Doc or website
└─ No → Is it a list of options/steps?
         ├─ Sequential steps → Numbered list
         ├─ Parallel options → Bullet points
         └─ Single fact → Inline text
```

**Tone Variation Triggers (extracted):**
| Trigger | Tone Adjustment |
|---------|-----------------|
| Payment issue | Firm but polite, clear consequences, offer solutions |
| Policy violation | Direct, reference rules, state consequences |
| Cancellation request | Empathetic opening → policy explanation |
| Complaint | Acknowledge frustration → apologize → solution |
| Happy path inquiry | Warm, efficient, minimal |
| Complex multi-question | Thorough, organized (numbered/sectioned) |

**Quality Metrics (missing, need to define):**
- Does it answer the specific question asked? (not a generic response)
- Is the length appropriate for scenario type?
- Are follow-up questions preempted with self-service links?
- Is tone calibrated to the situation?
- Would Pete send this without editing? (ultimate test)

## Evidence: What "World-Class" Looks Like

### From GAS Professional Email Formatting

The `_EmailsConfig.gs` and `_BookingImporterEmail.gs` files show what professional Brikette emails look like:

**Visual Elements (from `_EmailsConfig.gs`):**
```javascript
// Dual signature with images
criSignImg: "https://drive.google.com/uc?export=view&id=1rui6txmiCVQyjHjeeIy2mhBkVy8SUWoT"
peteSignImg: "https://drive.google.com/uc?export=view&id=1I5JmosQCGJaZ8IhelaIMHGoRajdggRAv"

// Logo with AVIF fallback for modern clients
hostelIconImg: "https://drive.google.com/uc?export=view&id=10tnNnRPv_Pkyd8Dpi0ZmA7wQuJbqyMxs"
hostelIconImgAvif: "https://drive.google.com/uc?export=view&id=1GRga7agHHKy8e_qaGdMIDi8k9GvEyAaM"

// Branded color scheme (yellow activity)
bgColourHeader: "#ffc107"   // Amber
bgColourMain: "#fff3cd"     // Light yellow
textColourMain: "#856404"   // Dark amber
```

**Signature Block Structure:**
- "With warm regards," text
- Side-by-side layout: Cristiana (left) + Peter (right)
- Handwritten signature images
- Name + "Owner" title

**Social Links Footer:**
- Instagram icon + link
- Hostel website icon + link
- TikTok icon + link
- T&C link in footer text

**T&C Opt-In Block (from `_BookingImporterEmail.gs`):**
```html
<div style="background-color:#ffffff; padding:15px;">
  <strong style="font-size:16px;">Action Required</strong>
  <p><strong><u>Please reply with "Agree" within 48 hours.</u></strong></p>
  <p>If we do not receive agreement within this time, we won't be able to hold your booking.</p>
  <p>Replying agree confirms your agreement with our <a href="...">terms and conditions</a>...</p>
</div>
```

**Current MCP Email Template Gap:**
The `email-template.ts` in MCP server uses simpler formatting:
- No signature images (text only)
- No logo
- Basic color scheme (deep blue primary)
- No AVIF fallback
- No social links with icons

**CORRECTION:** Earlier the brief stated "email-template.ts Gap: None identified" - this was incorrect. There IS a significant gap between MCP template quality and GAS template quality.

### Email Deliverability Requirements (Beyond "Pretty HTML")

World-class email formatting is not just styling—it's a **client compatibility and deliverability problem**.

**Required Capabilities:**

| Requirement | Current State | Target State |
|-------------|--------------|--------------|
| **Multipart/alternative** | HTML only | Both plaintext AND HTML in every draft |
| **Dark mode** | Not handled | CSS prefers-color-scheme or safe fallbacks |
| **Remote images** | Drive URLs | Alt text + graceful fallback if blocked |
| **Client compatibility** | Untested | Test on Gmail, Outlook, Apple Mail, mobile |
| **CSS constraints** | Modern CSS | Table-based layout for legacy clients |
| **Accessibility** | Not considered | Readable contrast, semantic structure |
| **Link reliability** | Google Docs links | Validate links, fallback text if link fails |

**Image Hosting Consideration:**
- Signatures/logos hosted on Google Drive can be blocked by email clients
- Need robust alt text: `alt="Cristiana Marzano Cowling, Owner - Hostel Brikette"`
- Consider fallback to text-based signature if images fail to load

**Testing Matrix:**
Before declaring HTML "production ready," test rendering in:
- Gmail (web + mobile)
- Outlook (desktop + web + mobile)
- Apple Mail (desktop + iOS)
- With images blocked
- In dark mode

### From Email Templates Analysis

Examining the 18 templates reveals Pete's consistent patterns:

**Opening patterns:**
- "Dear Guest," / "Dear [Name],"
- "Thank you for your email." / "Thanks for reaching out."
- Acknowledgment of situation

**Closing patterns:**
- "We look forward to seeing you at the hostel."
- "Best regards," / "Warm regards,"
- Signature: "Peter Cowling, Owner"

**Information structure:**
- Direct answer first
- Bullet points for multiple items
- Links to resources (digital assistant, Google Docs guides)
- Clear call-to-action

**Tone markers:**
- Professional but warm
- Empathetic for negative situations
- Firm but polite for policy enforcement
- Solution-oriented

### From Existing MCP Resources

The knowledge base is comprehensive:
- FAQ: 29 items covering most common questions
- Rooms: Detailed occupancy, amenities, pricing
- Policies: Check-in/out, age, pets, payment methods
- Menu: Complete bar and breakfast pricing

**Missing knowledge:**
- Seasonal pricing variations
- Current availability (appropriately directs to website)
- Special events/promotions
- Local recommendations beyond Path of Gods

### Thread Context Mechanisms (Required for World Class)

"Thread context underused" means we need **explicit handling**, not just data availability.

**ThreadSummary Structure (output from interpretation stage):**
```typescript
interface ThreadSummary {
  prior_commitments: string[];      // Things we promised ("breakfast is included")
  open_questions: string[];         // Questions from guest not yet answered
  resolved_questions: string[];     // Questions already answered in thread
  tone_history: 'formal' | 'casual' | 'mixed';
  guest_name: string;
  language_used: string;
  previous_response_count: number;
}
```

**Rules for Thread-Aware Drafting:**
1. **Don't repeat answers:** If guest asked something already answered, refer to prior answer + link
2. **Don't contradict:** Must not say something incompatible with prior commitment
3. **Maintain tone:** If thread has been casual, stay casual
4. **Pick up unresolved:** If guest asked 3 questions, answer all 3 (number them)
5. **Acknowledge returning:** "Thanks for getting back to us" if this is a follow-up

**Example Failure Mode:**
```
Thread: Guest asked about breakfast yesterday, we answered "included with direct booking"
Today: Guest asks about check-in time
BAD: "Breakfast is included..." (repeating)
GOOD: "Check-in is from 3pm. As mentioned previously, breakfast is included with your direct booking."
```

### Knowledge and Template Governance

World-class systems have **content governance**, not just content.

**Current State (Problems):**
- Knowledge is hardcoded in `brikette-knowledge.ts`
- Templates are static JSON
- No versioning
- No review process
- No validation that templates match current policies

**Required Governance:**

| Aspect | Current | Required |
|--------|---------|----------|
| **Source of truth** | Multiple files | Single canonical source per content type |
| **Versioning** | None | Git-tracked with change history |
| **Review process** | None | PR review for template/policy changes |
| **Link validation** | None | Automated check that all URLs resolve |
| **Placeholder validation** | None | Lint: no unfilled `{placeholder}` in templates |
| **Policy consistency** | None | Test: templates must not contradict `brikette://policies` |
| **Update procedure** | Manual | Documented runbook for content updates |

**Governance Tasks (add to plan):**
- TASK: Create template linter (valid links, no placeholders, policy consistency)
- TASK: Document content update procedure
- TASK: Add template tests to CI

### Retrieval Architecture (Beyond Keyword Matching)

"Keyword matching" is Phase 1 prototype, not world class.

**Retrieval Requirements:**

| Requirement | Why | Approach |
|-------------|-----|----------|
| **Hard rules for high-stakes** | Prepayment/cancellation MUST use correct template | Rule-based scenario detectors |
| **Similarity for general** | "What time breakfast" ≈ "When is breakfast served" | Lexical BM25 or TF-IDF |
| **Evidence-driven** | "Picked template X because email contains {signals}" | Return matching evidence |
| **Multi-candidate** | Ambiguous cases should surface options | Return top-3 with confidence |

**Hybrid Ranker Design:**
```
1. Run scenario detectors (high-stakes flows):
   - Prepayment keywords → prepayment templates (forced)
   - Cancellation keywords → cancellation templates (forced)
   - Policy violation keywords → policy templates (forced)

2. If no forced match, run similarity search:
   - BM25 over templates + FAQ items
   - Phrase dictionaries + synonym tables
   - Return top-3 candidates with scores

3. Apply confidence threshold:
   - >80% confidence → auto-select
   - 50-80% → present options to composition stage
   - <50% → "no template, generate fresh"
```

**Local Retrieval (No External API):**
Since we're cost-constrained (no external embedding API), use:
- BM25/TF-IDF over templates + FAQ items
- Phrase dictionaries (synonym expansion)
- Structured scenario detectors for certain categories
- Can be implemented in TypeScript with libraries like `wink-bm25-text-search`

### Security, Privacy, and Data Handling

Even "draft only" systems process guest PII and need to be safe-by-default.

**Data Classification:**

| Data Type | Sensitivity | Handling |
|-----------|-------------|----------|
| Guest email address | PII | Never log in plaintext |
| Guest name | PII | Can log first name only |
| Booking reference | Business | Can log |
| Email body | PII | Never persist beyond session |
| Draft content | Business | Store only in Gmail draft |
| Activity codes | Business | Log freely |

**Logging Policy:**
```typescript
// GOOD: Safe logging
log.info('Processing email', {
  emailId: redact(emailId),
  scenario: classification,
  templateUsed: templateId
});

// BAD: PII exposure
log.info('Processing email from', { email: guestEmail, body: emailBody });
```

**Data Retention:**
- MCP server: Stateless, no persistence of email content
- Gmail labels: Maintained for workflow state
- Activity codes: Persisted in Firebase (existing)
- Drafts: Persisted in Gmail only
- Session cache: Cleared after session ends

**Prompt Injection Mitigation:**
Guests can include adversarial text in emails. Mitigations:
- Email content passed as data, not as instructions
- Structured EmailActionPlan prevents instruction injection
- Quality gate checks for prohibited outputs

**GDPR Compliance:**
- Email content processed under Anthropic DPA (confirmed)
- Drafts reviewed by human before sending
- No automated decision-making without oversight
- Guest can request data deletion (handled via existing processes)

## Questions

### Resolved

- Q: Are the MCP tools working correctly?
  - A: Yes, full implementation in gmail.ts with proper error handling
  - Evidence: Code review of ~680 lines, Zod validation, auth handling

- Q: Is the knowledge base comprehensive?
  - A: Yes, 4 resources covering FAQ, rooms, pricing, policies
  - Evidence: brikette-knowledge.ts loads from actual app data

- Q: Are email templates available?
  - A: Yes, 18 templates in 9 categories extracted from Pete's emails
  - Evidence: email-templates.json with category metadata

- Q: What's the current workflow?
  - A: Documented in /process-emails skill with classification guide
  - Evidence: SKILL.md ~500 lines of workflow documentation

### Open (User Input Needed)

None - all components are available, consolidation is the work.

## Confidence Inputs (for /plan-feature)

**Note:** Confidence cannot exceed 80% until TASK-00 (baseline measurement) is complete.

- **Implementation:** 70% (provisional, pending baseline)
  - Strong: MCP architecture is extensible
  - Strong: GAS email formatting code exists to port
  - Strong: Reception activity code system is production-proven
  - Moderate: Three-stage pipeline is a new pattern for this codebase
  - Moderate: Agreement detection requires careful multi-language handling
  - Weak: Thread context handling is novel
  - Weak: Hybrid retrieval needs evaluation against real emails
  - **Blocker:** No quantified baseline yet
  - What would raise to 85%: Complete TASK-00 baseline measurement
  - What would raise to 95%: Integration test with 50+ real emails meeting category targets

- **Approach:** 75% (provisional)
  - Strong: Three-stage pipeline is industry best practice
  - Strong: State machine prevents race conditions (proven pattern)
  - Strong: Quality gate ensures consistent output
  - Moderate: Governance adds process overhead
  - Moderate: Reception integration is additional scope
  - Weak: Template coverage assumption (70%) is unvalidated
  - What would raise to 90%: Baseline confirms template coverage and failure modes
  - What would raise to 95%: Pilot meets category acceptance targets

- **Impact:** 80%
  - Strong: Unified system improves audit trail
  - Strong: Professional formatting improves brand perception
  - Strong: State machine reduces manual workflow tracking
  - Strong: Quality gate prevents critical errors
  - Moderate: Reception integration adds value but also risk
  - Moderate: Thread context handling addresses major quality gap
  - What would raise to 95%: Pilot measures time savings + acceptance rates

## Planning Constraints & Notes

- Must-follow patterns:
  - Three-stage pipeline: Interpretation → Composition → Quality Gate
  - Extend existing MCP tools, don't replace
  - Gmail labels implement state machine (formal transitions only)
  - Maintain human-in-loop (draft-only, Pete reviews all)
  - Use TypeScript with Zod validation (existing pattern)
  - Multipart/alternative emails (plaintext + HTML always)
  - Agreement detection: 0% false positive tolerance
  - No PII in logs

- Rollout expectations:
  - **Phase 0: Baseline** (TASK-00) - REQUIRED before implementation
  - Phase 1: Pipeline Architecture (TASK-01-03) - Core infrastructure
  - Phase 2: Draft Quality Framework (TASK-04-05) - Quality foundation
  - Phase 3: Email Formatting & Deliverability (TASK-06-07) - Visual quality
  - Phase 4: State Machine & Workflow (TASK-08-10) - Automation
  - Phase 5: Template Intelligence (TASK-11-12) - Efficiency
  - Phase 6: Composition & Integration (TASK-13-14) - Bring it together
  - Phase 7: Governance & Security (TASK-15-16) - Sustainability
  - Phase 8: Reception Integration (TASK-17) - Unification
  - Phase 9: Validation (TASK-18-19) - Measurement
  - Rollback: Each phase can roll back independently

- Observability expectations:
  - **Per-stage metrics:** Interpretation accuracy, composition quality, gate pass rate
  - **Category acceptance rates** (per Success Definition)
  - **Critical error rate** (must be 0% for certain errors)
  - **Time-to-draft** and **time-to-send**
  - **Agreement detection accuracy** (precision + recall by confidence level)
  - **Thread coherence rate** (no contradictions)
  - **Template match evidence** (why was this template selected?)

## Suggested Task Seeds (Non-binding)

### Phase 0: Baseline Measurement (REQUIRED FIRST)

**TASK-00: Establish Baseline Metrics**
- Type: INVESTIGATE
- Effort: M
- **Must complete before any implementation**
- Sample 50 threads from last 3 months
- Classify by category (FAQ, policy, payment, cancellation, complaint, multi-question)
- Measure current average editing time per category
- Identify top 10 failure modes causing edits
- Document template coverage gaps
- **Output:** Baseline report with quantified current state
- **Blocks:** All implementation tasks until complete

### Phase 1: Pipeline Architecture (Core Infrastructure)

**TASK-01: Implement Interpretation Stage Tool**
- Type: IMPLEMENT
- Effort: L
- Create `draft_interpret` MCP tool that produces EmailActionPlan:
  - Thread normalization (strip quotes, isolate new message)
  - Language detection
  - Intent extraction (questions[], requests[], confirmations[])
  - Agreement detection (with confidence + evidence spans)
  - Workflow trigger identification
  - Scenario classification
- **Output:** Structured EmailActionPlan JSON (not prose)
- **Critical:** This stage must be deterministic/inspectable

**TASK-02: Implement Thread Context Summarizer**
- Type: IMPLEMENT
- Effort: M
- Create `draft_summarize_thread` MCP tool:
  - Extract prior_commitments[]
  - Extract open_questions[] and resolved_questions[]
  - Detect tone_history
  - **Rule:** Must not contradict prior thread content
- Integrates with TASK-01 interpretation stage

**TASK-03: Implement Quality Gate Tool**
- Type: IMPLEMENT
- Effort: M
- Create `draft_quality_check` MCP tool:
  - Rules-based checks (see specification in architecture section)
  - Every question answered? Length appropriate? Required links present?
  - No prohibited claims? No internal notes leaked?
  - **Returns:** QualityResult with passed/failed checks
- Must run AFTER composition, BEFORE presenting to Pete

### Phase 2: Draft Quality Framework

**TASK-04: Create Draft Quality Framework Resource**
- Type: IMPLEMENT
- Effort: M
- Create `brikette://draft-guide` MCP resource with:
  - Length calibration by scenario type
  - Content selection rules
  - Information ordering rules
  - Format decision tree (text vs links vs lists)
  - Tone variation triggers
  - Quality checklist
- **Source:** Extract patterns from 18 templates + GAS scripts
- **Affects:** `packages/mcp-server/src/resources/`

**TASK-05: Voice/Tone Reference with Examples**
- Type: IMPLEMENT
- Effort: M
- Create `brikette://voice-examples` resource:
  - 5+ annotated examples per scenario type
  - "Good" vs "Bad" draft comparisons
  - Pete's specific phrases (extracted from templates)
  - Phrases to avoid
  - Tone calibration examples

### Phase 3: Professional Email Formatting & Deliverability

**TASK-06: Port GAS Email Formatting to MCP**
- Type: IMPLEMENT
- Effort: M
- Port `_EmailsConfig.gs` patterns:
  - Dual signature block (images with alt text)
  - Hostel logo with AVIF fallback
  - Color schemes
  - Social links footer
- **Must output multipart/alternative (plaintext + HTML)**
- **Affects:** `packages/mcp-server/src/utils/email-template.ts`

**TASK-07: Email Deliverability Testing**
- Type: INVESTIGATE
- Effort: S
- Test HTML rendering in:
  - Gmail (web + mobile)
  - Outlook (desktop + web)
  - Apple Mail
  - With images blocked
  - In dark mode
- Document compatibility issues and fixes
- **Depends:** TASK-06

### Phase 4: State Machine & Workflow

**TASK-08: Implement Label State Machine**
- Type: IMPLEMENT
- Effort: M
- Implement Gmail label transitions per specification
- Add lock mechanism (Processing label = locked)
- Prevent race conditions (check before processing)
- Align with reception activity codes
- **Affects:** `packages/mcp-server/src/tools/gmail.ts`

**TASK-09: Enhanced Agreement Detection**
- Type: IMPLEMENT
- Effort: M
- Create `draft_detect_agreement` per specification:
  - Scope to new message only (exclude quotes/signatures)
  - Multi-language support (EN, IT, ES minimum)
  - Negation detection
  - Confidence levels (confirmed/likely/unclear/none)
  - Evidence spans
- **Critical:** False positive rate must be 0%

**TASK-10: Prepayment Chase Integration**
- Type: IMPLEMENT
- Effort: M
- Connect prepayment templates to workflow
- Integrate with reception activity codes (1→2→3→4 or →21)
- Auto-select template based on chase number
- Trigger appropriate Firebase activity logging

### Phase 5: Template Intelligence & Retrieval

**TASK-11: Hybrid Template Ranker**
- Type: IMPLEMENT
- Effort: L
- Implement retrieval architecture:
  - Hard rules for high-stakes (prepayment, cancellation → forced templates)
  - BM25/TF-IDF similarity for general matching
  - Phrase dictionaries + synonyms
  - Return top-3 candidates with confidence + evidence
- **No external API required** (local implementation)

**TASK-12: Classification Examples Resource**
- Type: IMPLEMENT
- Effort: S
- Create `brikette://email-examples` with 30+ classified examples
- Include edge cases and ambiguous scenarios
- Annotate with correct classification reasoning

### Phase 6: Composition & Integration

**TASK-13: Enhanced Draft Generation**
- Type: IMPLEMENT
- Effort: L
- Create `draft_generate` composition tool:
  - Input: EmailActionPlan from TASK-01
  - Uses template ranker from TASK-11
  - Applies draft guide rules from TASK-04
  - Generates both plaintext AND HTML
  - Runs quality gate from TASK-03
- **This is the "creative" LLM layer**

**TASK-14: Update Process-Emails Skill**
- Type: IMPLEMENT
- Effort: M
- Update skill to use three-stage pipeline
- Reference draft quality framework
- Add agreement detection workflow
- Add mixed response handling
- Include quality gate in workflow

### Phase 7: Governance & Security

**TASK-15: Template Governance & Linting**
- Type: IMPLEMENT
- Effort: S
- Create template linter:
  - Validate all links resolve
  - No unfilled {placeholder}
  - Templates consistent with brikette://policies
- Add to CI pipeline
- Document content update procedure

**TASK-16: Security & Logging Review**
- Type: INVESTIGATE
- Effort: S
- Audit logging for PII exposure
- Verify no email body persistence
- Document data handling policy
- Review prompt injection mitigations

### Phase 8: Reception Integration

**TASK-17: Reception Email Routing**
- Type: IMPLEMENT
- Effort: M
- Route reception app emails through MCP tools:
  - Use shared template engine (TASK-06)
  - Unified audit trail (Gmail labels + activity codes)
  - Shared agreement detection (TASK-09)
- **Affects:** `apps/reception/src/services/`

### Phase 9: Validation

**TASK-18: Integration Testing (Expanded)**
- Type: INVESTIGATE
- Effort: L
- Test with 50+ real emails (from TASK-00 sample):
  - All category types
  - Multi-question emails
  - Thread replies (test context handling)
  - Prepayment scenarios
  - Mixed responses (agree + question)
- Measure against success criteria per category
- **Must achieve category targets before declaring complete**

**TASK-19: Pilot Measurement**
- Type: INVESTIGATE
- Effort: M
- Track metrics during first two weeks:
  - Acceptance rate by category (vs targets)
  - Critical error rate
  - Time-to-draft and time-to-send
  - Agreement detection accuracy
  - Thread coherence rate
- **Success criteria:** Meet category acceptance targets from Success Definition

## Efficiency vs. Effectiveness Analysis

The task seeds are designed to deliver **both** efficiency (speed) and effectiveness (quality):

### Efficiency Tasks (Reduce Time-to-Draft)
| Task | Efficiency Gain |
|------|-----------------|
| TASK-04: Template Matching | Auto-select template instead of manual search |
| TASK-06: Agreement Detection | Auto-detect instead of manual reading |
| TASK-09: Context Assembly | Load only relevant knowledge, not all |
| TASK-10: Enhanced Draft Generation | Single tool call vs. multiple steps |

### Effectiveness Tasks (Improve Draft Quality)
| Task | Quality Gain |
|------|--------------|
| TASK-01: Draft Quality Framework | Explicit rules for length/content/format/tone |
| TASK-02: Voice/Tone Examples | Calibrate to Pete's actual style |
| TASK-03: Professional Formatting | Match GAS email visual quality |
| TASK-05: Classification Examples | Better categorization = better response |

### Both Efficiency AND Effectiveness
| Task | Dual Benefit |
|------|--------------|
| TASK-07: Mixed Response Handler | Faster (auto-detect) AND better (handle both agree + question) |
| TASK-08: Prepayment Chase | Faster (auto-select) AND accurate (right template for attempt #) |
| TASK-11: Skill Update | Faster workflow AND quality checks built-in |

### Success Metrics (from TASK-14)
- **Efficiency:** Drafts per session, time per email
- **Effectiveness:** Acceptance rate (>70% without edit), edit type distribution

The key insight: **Quality frameworks (TASK-01, 02) come FIRST** because without explicit rules, Claude will make inconsistent decisions no matter how fast the tools are.

## Planning Readiness

- Status: **Complete** (plan created 2026-02-02)
- All components exist and are documented
- Clear gap analysis identifies specific improvements
- Draft quality framework addresses length/content/format/tone questions
- Task seeds balance efficiency AND effectiveness
- **Plan created:** `docs/plans/email-autodraft-consolidation-plan.md`
- **Next step:** `/build-feature email-autodraft-consolidation` (start with TASK-00)
