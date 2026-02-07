---
Type: Fact-Find
Outcome: Planning
Status: Draft
Domain: Automation
Created: 2026-02-01
Last-updated: 2026-02-01
Feature-Slug: email-autodraft-response-system
Related-Plan: docs/plans/email-autodraft-response-system-plan.md
Related-Card: docs/business-os/cards/BRIK-ENG-0020.user.md
Architecture-Pivot: Claude Max Subscription (2026-02-01)
---

# Email Autodraft Response System Fact-Find Brief

## Scope

### Summary

Build an automated email response system for Brikette customer inquiries that:
1. Monitors inbox for customer inquiries via Google Apps Script
2. Prepares structured email context for Claude processing
3. **Uses Pete's Claude Max subscription** (web/desktop app) instead of Claude API
4. Generates intelligent draft responses through conversational interface
5. Creates Gmail drafts for Pete to review and send

**Architecture Pivot (2026-02-01):** Pete wants to leverage his existing **Claude Max subscription** (claude.ai web/desktop access) rather than paying for Claude API usage. This fundamentally changes the architecture from automated API calls to a human-in-the-loop approach using Claude Desktop with MCP tools or Claude Code coordination.

### Goals

- Reduce email response time from hours to minutes (drafts available immediately)
- Handle 60-80% of inquiries with high-quality auto-drafts requiring minimal editing
- Drive customers to website booking (higher conversion, lower manual work)
- Ensure accurate, consistent responses based on website content
- **Leverage and improve existing Google Apps Script infrastructure**

### Non-goals

- Auto-sending emails (MVP is draft-only, Pete reviews all)
- Direct booking creation or holds from email
- Multi-language support beyond English (future phase)
- Learning from Pete's edits to improve drafts (future phase)
- Replacing existing booking/pre-arrival scripts (improve them instead)

### Constraints & Assumptions

- Constraints:
  - Must use Google Apps Script (Pete's existing script infrastructure)
  - Must work within Apps Script execution time limits (6 min for consumer, 30 min for Workspace)
  - All drafts require manual review before sending
  - Must comply with GDPR for processing customer email content
  - **Uses Claude Max subscription (not API)** - Pete initiates Claude interactions
  - Cost-conscious: leverage existing Max subscription, no per-request API costs

- Assumptions:
  - Existing Google Apps Scripts for booking/pre-arrival emails provide proven patterns
  - Website content is comprehensive enough to answer most common inquiries
  - Most inquiries follow repeatable patterns (validation needed via email audit)
  - Pete is willing to initiate email drafting sessions (not fully automated)
  - Claude Desktop MCP tools can provide seamless Gmail integration
  - Scripts can be enhanced incrementally without breaking existing functionality

## Architecture Pivot: Claude Max Subscription

### Context

The original plan assumed Claude API calls from Google Apps Script via UrlFetchApp. Pete has indicated he wants to use his **Claude Max subscription** (claude.ai web access + Claude Desktop app) instead of paying for API usage.

This changes the system from **fully automated** to **human-initiated with tool assistance**.

### Architectural Options Analysis

#### Option 1: MCP Server Integration (RECOMMENDED)

**Description:** Claude Desktop connects to a custom MCP server that provides Gmail tools. Pete uses Claude Desktop to process emails conversationally, with tools fetching email data and creating drafts.

**Workflow:**
1. Pete opens Claude Desktop (connected to Gmail MCP server)
2. Pete asks: "Show me pending customer emails"
3. Claude calls `email_list_pending` tool, displays email summaries
4. Pete selects email: "Draft a response to email #3"
5. Claude calls `email_get_details` for full context + knowledge base
6. Claude generates response draft, presents for review
7. Pete approves (optionally edits)
8. Claude calls `email_create_draft` to save in Gmail

**Pros:**
- Uses Max subscription (no API costs)
- Seamless tool integration - no copy/paste
- Conversational workflow - can iterate on drafts
- Pete maintains full control over every draft
- Knowledge base can be exposed as MCP resource
- Can batch process multiple emails in one session

**Cons:**
- Requires Pete to initiate each session
- Not automated monitoring (no alerts)
- Requires running local MCP server
- Initial setup complexity

**Implementation:**
- Extend existing `packages/mcp-server/` with email tools
- Tools connect to Gmail via Apps Script endpoints or Gmail API
- Knowledge base exposed as MCP resource

**Effort:** Medium (extend existing MCP server)
**Automation Level:** Low (human-initiated)
**Quality Control:** High (Pete reviews everything)

---

#### Option 2: Claude Code Coordination (STRONG ALTERNATIVE)

**Description:** Google Apps Script prepares email context as files. Pete uses Claude Code (this CLI!) to process emails and generate drafts. Claude Code writes drafts back via Apps Script.

**Workflow:**
1. GAS monitors inbox, writes pending emails to `data/pending-emails.json`
2. Pete runs Claude Code: "Help me draft responses to pending emails"
3. Claude Code reads email file, loads knowledge base
4. Claude Code generates drafts, writes to `data/draft-responses.json`
5. GAS picks up drafts and creates Gmail drafts
6. Pete reviews and sends from Gmail

**Pros:**
- Uses Max subscription (Claude Code uses same subscription)
- File-based integration is simple and robust
- Full access to codebase knowledge (existing patterns, content)
- Can leverage existing MCP server tools
- Batch processing is natural

**Cons:**
- Requires Pete to run Claude Code
- File-based sync requires GAS cron for monitoring
- Not real-time (latency between steps)
- Two-step draft creation (file then Gmail)

**Implementation:**
- GAS writes pending emails to JSON file (could be in repo or cloud storage)
- Claude Code reads and processes
- GAS watches for draft files and creates Gmail drafts

**Effort:** Low-Medium
**Automation Level:** Low (human-initiated)
**Quality Control:** High

---

#### Option 3: Batch Processing Interface

**Description:** GAS creates daily/hourly batch files with pending emails. Pete reviews batch in Claude (web or Code), generates all responses in one session, system creates drafts.

**Workflow:**
1. GAS runs on schedule, creates `email-batch-2026-02-01.md` with all pending inquiries
2. Pete receives notification (email or Slack) that batch is ready
3. Pete opens Claude web, pastes batch file
4. Claude generates all responses in one session
5. Pete copies responses to structured format
6. GAS parses and creates individual drafts

**Pros:**
- Efficient batch processing
- Uses Max subscription
- Works with Claude web (no setup needed)
- Good for predictable volume

**Cons:**
- Manual copy/paste required
- Not real-time
- Batch must be small enough for context window
- Two-step manual process

**Effort:** Low
**Automation Level:** Very Low
**Quality Control:** High

---

#### Option 4: Structured Summary + Manual Paste

**Description:** GAS creates structured email summary. Pete copies to Claude web/desktop, gets response, pastes back.

**Workflow:**
1. GAS monitors inbox, creates structured summary document
2. Pete copies summary to Claude web
3. Claude generates response
4. Pete copies response back, GAS creates draft

**Pros:**
- Simplest implementation
- Uses Max subscription
- No additional setup

**Cons:**
- High manual effort (multiple copy/paste per email)
- Error-prone (copy errors, format issues)
- Not scalable
- Poor UX

**Effort:** Very Low
**Automation Level:** Very Low
**Quality Control:** Medium (error-prone)

---

#### Option 5: Hybrid Human-in-Loop

**Description:** GAS monitors and classifies emails using simple rules (no AI). Creates "draft prompts" for each email. Pete reviews prompts with Claude when convenient, generates responses, system creates drafts.

**Workflow:**
1. GAS monitors inbox, classifies with simple keyword rules
2. GAS creates "draft prompt" documents (structured context for each email)
3. Pete gets notification when prompts are ready
4. Pete processes prompts with Claude (MCP or Code)
5. System creates drafts from responses

**Pros:**
- Flexible timing
- Uses Max subscription
- Simple classification (no Claude needed)
- Pete chooses when to process

**Cons:**
- Rule-based classification may miss nuances
- Still requires Pete's active participation
- Two-step process

**Effort:** Medium
**Automation Level:** Low
**Quality Control:** High

---

### Recommended Approaches

**Tier 1 - Best Options:**

1. **MCP Server Integration** - Best balance of automation and control
   - Seamless UX with Claude Desktop
   - Existing MCP server can be extended
   - Natural conversational workflow

2. **Claude Code Coordination** - Strong alternative, simpler setup
   - File-based is robust and simple
   - Full codebase context available
   - Already using Claude Code

**Tier 2 - Acceptable Options:**

3. **Batch Processing** - Good for high-volume days
   - Can be combined with Tier 1 approaches
   - Useful as fallback

**Not Recommended:**

4. **Structured Summary + Manual Paste** - Too much friction
5. **Hybrid Human-in-Loop** - Adds complexity without clear benefit over Tier 1

### Decision Framework

**Questions to Resolve:**

1. **Preferred Claude interface?**
   - Claude Desktop (supports MCP) -> Option 1
   - Claude Code (this CLI) -> Option 2
   - Claude web (no setup) -> Option 3

2. **Acceptable manual involvement?**
   - Initiate 1-2x daily, process batch -> Options 1, 2, 3
   - Real-time processing required -> Need API (original plan)

3. **Local server comfort level?**
   - Comfortable running local MCP server -> Option 1
   - Prefer file-based -> Option 2

4. **Notification preference?**
   - Email alerts when inquiries arrive -> GAS can send
   - Check periodically -> Simpler implementation

### MCP Server Design (If Option 1 Selected)

**Proposed Tools:**

```typescript
// Email listing and filtering
email_list_pending: {
  description: "List pending customer emails requiring response",
  input: { label?: string, limit?: number, since?: string }
  output: { emails: EmailSummary[] }
}

email_get_details: {
  description: "Get full email content and suggested knowledge base context",
  input: { emailId: string }
  output: { email: EmailFull, suggestedContext: string[] }
}

// Draft management
email_create_draft: {
  description: "Create a draft response in Gmail",
  input: {
    replyToEmailId: string,
    subject: string,
    body: string,
    cc?: string[]
  }
  output: { draftId: string, success: boolean }
}

email_update_draft: {
  description: "Update an existing draft",
  input: { draftId: string, body: string }
  output: { success: boolean }
}

// Knowledge base access
knowledge_search: {
  description: "Search Brikette knowledge base for relevant information",
  input: { query: string, categories?: string[] }
  output: { results: KnowledgeItem[] }
}

knowledge_get_faq: {
  description: "Get FAQ items",
  input: { category?: string }
  output: { items: FAQ[] }
}

knowledge_get_pricing: {
  description: "Get current pricing information",
  input: { type: 'rooms' | 'menu' | 'all' }
  output: { pricing: PricingData }
}
```

**MCP Resources:**

```typescript
// Expose knowledge base as resources
"brikette://faq" -> FAQ content
"brikette://rooms" -> Room information
"brikette://pricing" -> Current pricing
"brikette://guides/{slug}" -> Travel guides
```

**Architecture:**

```
Claude Desktop
    |
    v
MCP Server (packages/mcp-server)
    |
    +---> Gmail API / Apps Script endpoint (email tools)
    |
    +---> Local files / DB (knowledge base tools)
```

**Setup Required:**
1. Extend `packages/mcp-server` with email tools module
2. Create Gmail API credentials OR Apps Script bridge endpoint
3. Configure Claude Desktop to connect to MCP server
4. Export knowledge base content for MCP resource access

## Repo Audit (Current State)

### Entry Points

**Existing Google Apps Script infrastructure (external to repo):**
- Booking response script - Responds when guests book
- Pre-arrival email script - Generates timed pre-arrival emails
- These scripts represent **proven patterns** for email automation that can be improved

**Related patterns in codebase:**

- `apps/prime/src/lib/messaging/triggers.ts` - Messaging event types and Zod schemas for pre-arrival flow
- `apps/prime/src/lib/messaging/emailData.ts` - Email data helpers for guest email templates
- `packages/email/src/templates.ts` - Email template rendering infrastructure
- `packages/email-templates/` - Marketing email template components

### Key Modules / Files

**Email Infrastructure (existing in codebase):**
- `packages/email/src/sendEmail.ts` - Gmail SMTP sending via nodemailer, uses `GMAIL_USER`/`GMAIL_PASS` env vars
- `packages/email/src/providers/index.ts` - Email provider abstraction (sendgrid, resend, smtp)
- `packages/email/src/templates.ts` - Template rendering with variable substitution
- `packages/platform-core/src/services/emailService.ts` - Email service interface

**AI/LLM Integration (existing):**
- `apps/brikette/scripts/translate-guides.ts` - **Established Anthropic Claude integration pattern**
  - Uses `@anthropic-ai/sdk` (already in brikette dependencies)
  - Model: `claude-sonnet-4-20250514`
  - Rate limiting with 1s pauses between requests
  - JSON output validation pattern
  - Environment: `ANTHROPIC_API_KEY`
- `packages/lib/src/generateMeta.ts` - OpenAI integration pattern (alternative)

**Pre-arrival Messaging Infrastructure:**
- `apps/prime/src/lib/messaging/triggers.ts` - Event types: `booking.confirmed`, `arrival.7days`, `arrival.48hours`, `arrival.morning`
- `apps/prime/src/lib/messaging/emailData.ts` - `getPreArrivalEmailData()`, `getArrivalDayEmailData()` helpers
- These patterns show **established email automation conventions**

**Brikette Website Content (knowledge base sources):**
- `apps/brikette/src/locales/en/faq.json` - FAQ data (29 items, structured Q&A format)
- `apps/brikette/src/locales/en/rooms.json` - Room information and amenities
- `apps/brikette/src/data/menuPricing.ts` - Bar and breakfast menu pricing data
- `apps/brikette/src/locales/en/guides/` - Travel guides content (12+ files)
- `apps/brikette/src/config/rooms.ts` - Room configuration
- `apps/brikette/src/config/hotel.ts` - Hotel configuration

**MCP Server (potential coordination layer):**
- `packages/mcp-server/` - Existing MCP server for shop data access
- Could be extended to provide email/draft management tools
- See `docs/plans/mcp-server-implementation-plan.md` for patterns

### Patterns & Conventions Observed

- **Google Apps Script pattern** (to be documented from existing scripts):
  - Timed triggers for scheduled email checks
  - GmailApp API for reading inbox and creating drafts
  - UrlFetchApp for external API calls (Claude)
  - PropertiesService for storing state/config
  - HtmlService for email HTML generation
  - Evidence: Existing booking response and pre-arrival scripts (external)

- **Anthropic SDK pattern** (for reference, Apps Script will use raw API):
  - Direct SDK instantiation with API key from env
  - Low temperature (0.3) for consistent outputs
  - JSON output with validation
  - Rate limiting between API calls
  - Evidence: `apps/brikette/scripts/translate-guides.ts`

- **Pre-arrival messaging pattern:**
  - Event-driven with typed payloads (Zod schemas)
  - Firebase queue for message processing
  - Separate data helpers from sending logic
  - Evidence: `apps/prime/src/lib/messaging/`

- **Email template pattern:**
  - HTML templates with variable substitution
  - Zod validation for template inputs
  - Evidence: `packages/email/src/templates.ts`

### Data & Contracts

- Types/schemas:
  - FAQ: `{ items: Array<{ id, question, answer }> }`
  - Room amenities: `{ detail: { common, double_room, room_11, room_12 } }`
  - Menu pricing: TypeScript const objects with price numbers
  - Messaging payloads: Zod schemas in `apps/prime/src/lib/messaging/triggers.ts`

- Persistence (for new system):
  - Google Apps Script PropertiesService for processed email markers
  - Gmail API (via GmailApp) for inbox monitoring and draft creation
  - No database required for MVP

- API/event contracts:
  - Claude Messages API via UrlFetchApp (from Apps Script)
  - Gmail API via GmailApp (native to Apps Script)

### Dependency & Impact Map

- Upstream dependencies:
  - Google Apps Script runtime (existing)
  - Claude API via HTTP/UrlFetchApp (new)
  - Brikette website content files (existing)

- Downstream dependents:
  - None (new isolated feature)

- Likely blast radius:
  - Low - this is a new feature added to existing script infrastructure
  - Opportunity to improve existing booking/pre-arrival scripts
  - Does not modify existing codebase functionality
  - Only reads website content (does not modify)

### Tests & Quality Gates

- Existing tests:
  - `packages/email/__tests__/` - Extensive email testing patterns
  - `apps/prime/src/lib/messaging/` - No tests for messaging infrastructure yet

- Gaps:
  - Google Apps Script testing patterns not established in repo
  - Claude API mocking for Apps Script not established
  - Email classification accuracy testing not established
  - Draft quality evaluation framework not established

- Commands/suites:
  - `pnpm test` - Run all tests
  - Google Apps Script: Test via Apps Script editor debugger

### Recent Git History (Targeted)

- `apps/prime/src/lib/messaging/` - Pre-arrival messaging infrastructure
- `apps/brikette/scripts/translate-guides.ts` - Recently added (2026-01-31) Claude integration
- `docs/historical/plans/prime-pre-arrival-plan.md` - Historical context for email triggers

## External Research (If needed)

### Google Apps Script

- **GmailApp** provides:
  - `GmailApp.getInboxThreads()` - Get inbox threads
  - `GmailApp.createDraft()` - Create draft email
  - `GmailApp.search()` - Search with Gmail query syntax
  - `thread.markRead()` - Mark messages as read
  - No OAuth setup needed (runs under script owner's account)

- **UrlFetchApp** for Claude API:
  ```javascript
  UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    headers: {
      'x-api-key': PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY'),
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    payload: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  ```

- **Triggers:**
  - Time-driven triggers (every 5 min, hourly, daily)
  - `ScriptApp.newTrigger().timeBased().everyMinutes(5).create()`
  - Execution quota: 6 hrs/day for consumer, 90 min single execution for Workspace

- **PropertiesService:**
  - Store API keys, configuration, processed email IDs
  - Script properties persist across executions

### Claude API from Apps Script

- Direct HTTP calls via UrlFetchApp
- No SDK needed (simpler than Node.js integration)
- Response parsing: `JSON.parse(response.getContentText())`
- Error handling: Check response code before parsing

### MCP Server Coordination (Optional Enhancement)

- Existing MCP server at `packages/mcp-server/` could be extended
- Potential tools:
  - `email_draft_list` - List pending drafts
  - `email_draft_review` - View draft content
  - `email_template_list` - List response templates
- Would enable Claude Code to assist with draft review/editing
- See `docs/plans/mcp-server-implementation-plan.md` for implementation patterns

## Questions

### Resolved

- Q: Is there an existing Claude/Anthropic integration in the codebase?
  - A: Yes, `apps/brikette/scripts/translate-guides.ts` uses `@anthropic-ai/sdk` with established patterns
  - Evidence: `apps/brikette/package.json` includes `"@anthropic-ai/sdk": "^0.32.1"`
  - Note: Apps Script will use raw HTTP API via UrlFetchApp instead

- Q: What email infrastructure exists?
  - A: Outbound email via nodemailer/Gmail SMTP, plus SendGrid/Resend providers for campaigns
  - Evidence: `packages/email/src/sendEmail.ts`, `packages/email/src/providers/`
  - Note: Existing Google Apps Scripts handle booking/pre-arrival emails separately

- Q: What Brikette content is available for the knowledge base?
  - A: FAQ (29 items), room details, menu pricing, travel guides - all in structured JSON/TS format
  - Evidence: `apps/brikette/src/locales/en/faq.json`, `apps/brikette/src/data/menuPricing.ts`

- Q: What is the preferred technical approach?
  - A: **Google Apps Script** instead of Gmail API
  - Rationale: Existing proven scripts for booking/pre-arrival emails, simpler auth, opportunity to improve existing automation
  - Evidence: Pete's architectural guidance (2026-02-01)

- Q: What messaging patterns exist in the codebase?
  - A: Pre-arrival messaging with event types, Zod schemas, and data helpers
  - Evidence: `apps/prime/src/lib/messaging/triggers.ts`, `apps/prime/src/lib/messaging/emailData.ts`

### Open (User Input Needed)

- Q: **Where are the existing Google Apps Scripts located?**
  - **PARTIALLY RESOLVED** (2026-02-01): Found 4 deployed Apps Script endpoints in `apps/reception/`:
    - **Booking Email Script:** `AKfycbz236VUyVFKEKkJF8QaiL_h9y75XuwWsl82-xfWepZwv1-gBroOr5S4t_og4Fvl4caW` (useBookingEmail.ts)
    - **Guest Email Script:** `AKfycbzEPvmqFeK1wW8VAid-cs6dhlQ49QDDOQR48whSU_jRQkbTQiNN38yjZSUVu9gYvlIx` (useEmailGuest.ts)
    - **Alloggiati Script:** `AKfycbxemYj6vv2k8qDyF3QieAfCujnlUeHMMKriYV8lkhLiHVvb7FnjTpwRTtF-Uo9-VT9UVQ` (alloggiatiService.ts)
    - **Statistics/Test Script:** `AKfycbwzKYZ0FxoAgSlt98OruRKSaW8OAe4Ug3e1VZ2YGEttgWrRZyAWX8VRHG3Abf_OrXGM` (Statistics.tsx)
  - **Remaining action:** Open script.google.com, navigate to each script by deployment ID, document code structure
  - **Security note:** These URLs are flagged in security audit (docs/security-audit-2026-01.md) as "Hardcoded Google Apps Script URLs" - should be moved to env vars

- Q: **What is the current state of the existing scripts?**
  - **PARTIALLY RESOLVED** (2026-02-01): Observed patterns from calling code:
    - **Call pattern:** HTTP GET via `fetch()` or JSONP via `<script>` tag injection
    - **Data format:** Query params (bookingRef, occupantRecord, testMode, callback)
    - **Response format:** Plain text or JSONP-wrapped JSON (Zod-validated in alloggiatiService.ts)
    - **Triggers:** Called on-demand from UI (not time-based triggers visible)
  - **Remaining action:** Access actual script source to document internal logic, data sources, and email formatting

- Q: **Should templates live in Gmail or be script-generated?**
  - **RESOLVED** (2026-02-01): Script-based generation is the established pattern
  - Evidence: Existing scripts return text/JSONP, no Gmail canned responses observed
  - Evidence: `packages/email/src/templates.ts` shows template rendering with variable substitution pattern
  - **Decision:** Use script-based HTML generation (consistent with existing patterns)

- Q: **What is the baseline email volume and pattern distribution?**
  - **DEFERRED TO INVESTIGATE** (2026-02-01): Will validate during planning phase
  - **Decision:** Proceed to planning with INVESTIGATE task for baseline metric collection
  - **Rationale:**
    - Business case is strong based on qualitative assessment
    - Metric collection can run in parallel with initial development
    - INVESTIGATE task will validate assumptions before heavy investment
  - **Action:** Create INVESTIGATE task in plan for 1-week baseline tracking

- Q: **What is the GDPR/privacy position on processing email content via external LLM?**
  - **RESOLVED** (2026-02-01): Anthropic DPA covers customer email processing
  - **Decision:** Pete accepts that Anthropic's Data Processing Agreement provides adequate GDPR coverage
  - **Rationale:**
    - Existing Claude integration already processes content via Anthropic API
    - Anthropic DPA includes standard data protection provisions
    - Email drafts are reviewed by human (Pete) before sending
    - No automated decision-making without human oversight
  - **Evidence:** Pete's fast-track decision (2026-02-01)

- Q: **How should MCP server integration work (if at all)?**
  - **RESOLVED** (2026-02-01): Start with Option A (standalone Apps Script MVP)
  - Rationale:
    - Existing pattern is standalone scripts called via HTTP
    - MCP server (`packages/mcp-server/`) is shop-data focused, not email-focused
    - Adding MCP coordination adds complexity without clear MVP benefit
  - **Decision:** Standalone Apps Script for MVP, consider MCP enhancement in future phase

## Confidence Inputs (for /plan-feature)

- **Implementation:** 70% (adjusted for architecture pivot)
  - Strong: **Existing MCP server infrastructure** (`packages/mcp-server/`) with established patterns
  - Strong: Website content well-structured for knowledge base
  - Strong: Existing Apps Script patterns for Gmail integration
  - Strong: Claude Desktop MCP support is well-documented
  - Moderate: Gmail API credentials and OAuth setup needed for MCP tools
  - Weak: Haven't tested Gmail MCP tools end-to-end yet
  - Weak: MCP server Gmail integration not yet prototyped
  - To reach 85%: Prototype email_list tool with Gmail API, test Claude Desktop connection
  - To reach 95%: Complete working prototype of full email workflow

- **Approach:** 75% (adjusted for Claude Max vs API)
  - Strong: **MCP Server approach leverages existing infrastructure**
  - Strong: Claude Desktop + MCP is Anthropic's recommended integration pattern
  - Strong: Human-in-loop ensures quality control on every draft
  - Strong: No API costs - uses existing Max subscription
  - Moderate: Requires Pete to initiate sessions (not fully automated)
  - Weak: Haven't validated Pete's preferred workflow (MCP vs Code vs web)
  - To reach 90%: Get Pete's decision on preferred interface, prototype chosen approach
  - To reach 95%: Run pilot week with real emails, measure time savings

- **Impact:** 65% (slightly improved - clearer cost savings)
  - Strong: Isolated new feature with low blast radius
  - Strong: **Zero incremental AI costs** (uses Max subscription)
  - Strong: Extends existing MCP server rather than building from scratch
  - Strong: Pete maintains full control - high quality assurance
  - Moderate: Less automated than original plan (human-initiated)
  - Weak: Business case not validated (email volume, response time baseline unknown)
  - To reach 75%: Complete baseline metrics collection (email volume, time spent)
  - To reach 90%: Run pilot with real emails, measure actual time savings vs manual

## Planning Constraints & Notes

- Must-follow patterns:
  - **Use Claude Max subscription** (not Claude API)
  - Extend existing MCP server (`packages/mcp-server/`) for email tools
  - Use Gmail API or Apps Script bridge for email access
  - Follow existing MCP tool patterns (Zod validation, error handling)
  - Knowledge base exposed as MCP resources

- Rollout/rollback expectations:
  - Feature flag in MCP server to enable/disable email tools
  - Gradual rollout: start with email listing, then add draft creation
  - Rollback: disable email tools in MCP server config

- Observability expectations:
  - MCP server logs for tool invocations
  - Track emails processed per session
  - Monitor draft quality (Pete feedback loop)
  - No API cost monitoring needed (Max subscription)

## Suggested Task Seeds (Non-binding)

### If MCP Server Approach (Recommended):
1. **Gmail API Setup** - Create OAuth credentials, configure Gmail API access
2. **MCP Email Tools Module** - Create `packages/mcp-server/src/tools/email.ts` with email_list, email_get tools
3. **MCP Draft Tools** - Add email_create_draft, email_update_draft tools
4. **Knowledge Base Resources** - Expose FAQ, rooms, pricing as MCP resources
5. **Knowledge Search Tool** - Add knowledge_search tool for context retrieval
6. **Claude Desktop Config** - Configure Claude Desktop to connect to extended MCP server
7. **End-to-End Test** - Test full workflow: list emails -> get details -> draft response -> create draft

### If Claude Code Approach (Alternative):
1. **GAS Email Export** - Script to export pending emails to JSON file
2. **Draft Import Script** - GAS to read draft JSON and create Gmail drafts
3. **Knowledge Base Prep** - Format knowledge base for Claude Code context
4. **Workflow Script** - Claude Code prompt/workflow for email processing
5. **File Sync Setup** - Configure file storage and sync mechanism

### Common Tasks (Either Approach):
1. **Baseline Metrics** - INVESTIGATE task: track email volume for 1 week
2. **Email Pattern Audit** - Review 50+ emails to validate inquiry categories
3. **Response Templates** - Define response patterns for common inquiry types
4. **Quality Criteria** - Define draft quality evaluation checklist

## Existing Infrastructure Analysis

### Google Apps Script Patterns (Discovered from Codebase)

**Evidence from `apps/reception/` (2026-02-01 audit):**

**1. Booking Email Script** (`useBookingEmail.ts`):
- **Deployment ID:** `AKfycbz236VUyVFKEKkJF8QaiL_h9y75XuwWsl82-xfWepZwv1-gBroOr5S4t_og4Fvl4caW`
- **Call pattern:** HTTP GET with query params (`bookingRef`, `recipients`, `occupant[]`)
- **Data sources:** Firebase (`FIREBASE_BASE_URL/bookings/`, `/guestsDetails/`)
- **Response:** Plain text (success/failure message)
- **Trigger:** On-demand from UI button

**2. Guest Email Script** (`useEmailGuest.ts`):
- **Deployment ID:** `AKfycbzEPvmqFeK1wW8VAid-cs6dhlQ49QDDOQR48whSU_jRQkbTQiNN38yjZSUVu9gYvlIx`
- **Call pattern:** HTTP GET with query param (`bookingRef`)
- **Response:** Plain text
- **Feature:** Has `enableEmail` toggle to disable actual sending

**3. Alloggiati Script** (`alloggiatiService.ts`):
- **Deployment ID:** `AKfycbxemYj6vv2k8qDyF3QieAfCujnlUeHMMKriYV8lkhLiHVvb7FnjTpwRTtF-Uo9-VT9UVQ`
- **Call pattern:** JSONP (`callback` param) for cross-origin support
- **Data format:** `||`-delimited occupant records
- **Response:** JSONP-wrapped JSON with `resultDetails` array
- **Validation:** Full Zod schema for response (`GASResponseSchema`)
- **Feature:** `testMode` toggle for development

**4. Statistics/Test Script** (`Statistics.tsx`):
- **Deployment ID:** `AKfycbwzKYZ0FxoAgSlt98OruRKSaW8OAe4Ug3e1VZ2YGEttgWrRZyAWX8VRHG3Abf_OrXGM`
- **Call pattern:** HTTP GET with hardcoded `bookingRef`
- **Response:** Plain text

**Key Patterns Observed:**
- Scripts deployed as web apps (URL path `/exec`)
- GET method preferred (query params for simple data)
- JSONP for structured responses needing cross-origin
- Zod validation on client side for type safety
- No authentication on script endpoints (flagged in security audit)
- Test modes/toggles built into calling code

**Remaining Unknown (requires script source access):**
- Script trigger types (time-based vs on-demand only)
- Internal email formatting logic (HTML generation)
- Data write patterns (how scripts create drafts)
- Error handling and retry logic
- Pre-arrival email timing logic

### Integration Architecture Options (Claude Max Based)

**Option A: MCP Server + Claude Desktop (RECOMMENDED)**
```
Claude Desktop (Max subscription)
        |
        v
MCP Server (packages/mcp-server)
        |
        +---> Gmail API (email tools)
        |         ├── email_list_pending
        |         ├── email_get_details
        |         ├── email_create_draft
        |         └── email_update_draft
        |
        +---> Knowledge Base (resources)
                  ├── brikette://faq
                  ├── brikette://rooms
                  ├── brikette://pricing
                  └── brikette://guides/*
```

**Option B: Claude Code + File-Based**
```
Google Apps Script           File Storage          Claude Code
├── Email Export     →      pending.json     →    Read & Process
├── Draft Import     ←      drafts.json      ←    Generate Drafts
└── Notification     →      (email/slack)    →    Alert Pete
```

**Option C: Batch Processing (Fallback)**
```
Google Apps Script           Claude Web           Gmail
├── Batch Export     →      (manual paste)   →   Pete copies responses
└── Draft Creation   ←      (manual copy)    ←   from Claude
```

**Recommendation:** Start with **Option A (MCP Server)** as primary approach. Use Option B (Claude Code) as fallback or for development testing. Option C only as emergency fallback.

## Planning Readiness

- Status: **Ready-for-planning** (fast-tracked 2026-02-01)
- **Architecture pivot:** Claude Max subscription instead of Claude API (2026-02-01)
- Previous blockers resolved:
  1. **GDPR/privacy position:** RESOLVED - Anthropic DPA accepted as sufficient coverage
  2. **Baseline metrics:** DEFERRED - Will validate via INVESTIGATE task in plan
  3. **AI cost model:** RESOLVED - Using Max subscription eliminates per-request costs

- Non-blocking items (can resolve during planning):
  - **Pete's preferred interface** (Claude Desktop vs Claude Code vs web)
  - Gmail API credentials setup
  - MCP server email tools prototype

- **Fast-track approved** (2026-02-01):
  - Pete accepted GDPR position (Anthropic DPA covers customer email processing)
  - Baseline metrics deferred to INVESTIGATE task in plan
  - Architecture pivoted to Claude Max subscription

- **Decision needed from Pete:**
  1. **Preferred Claude interface?** Claude Desktop (MCP) vs Claude Code vs Claude web
  2. **Acceptable workflow?** Human-initiated sessions vs fully automated
  3. **Local server comfort?** Willing to run MCP server locally?

- **Next steps:**
  1. Get Pete's decision on preferred interface and workflow
  2. Prototype chosen approach (MCP tools or Claude Code workflow)
  3. Run `/plan-feature` to create implementation plan
  4. Include INVESTIGATE task for baseline metric validation

---

**Note:** The architectural shift from Gmail API to Google Apps Script significantly de-risks implementation by leveraging proven infrastructure. The existing booking response and pre-arrival email scripts provide a foundation that can be improved as part of this work rather than building from scratch.

**Key Insight:** This project is now positioned as an **enhancement to existing automation** rather than a greenfield build, which increases confidence and reduces risk.

---

## Existing Script Source Code Analysis

**Status:** Awaiting script source code from Pete

### Scripts to Analyze

Based on deployment IDs discovered in `apps/reception/`:

| Script | Deployment ID | Purpose | Source File |
|--------|---------------|---------|-------------|
| **Booking Email** | `AKfycbz236VUyVFKEKkJF8QaiL_h9y75XuwWsl82-xfWepZwv1-gBroOr5S4t_og4Fvl4caW` | Sends app-link emails to guests | `useBookingEmail.ts` |
| **Guest Email** | `AKfycbzEPvmqFeK1wW8VAid-cs6dhlQ49QDDOQR48whSU_jRQkbTQiNN38yjZSUVu9gYvlIx` | Sends email to guest by booking ref | `useEmailGuest.ts` |
| **Alloggiati** | `AKfycbxemYj6vv2k8qDyF3QieAfCujnlUeHMMKriYV8lkhLiHVvb7FnjTpwRTtF-Uo9-VT9UVQ` | Submits occupant records (JSONP) | `alloggiatiService.ts` |
| **Statistics** | `AKfycbwzKYZ0FxoAgSlt98OruRKSaW8OAe4Ug3e1VZ2YGEttgWrRZyAWX8VRHG3Abf_OrXGM` | Statistics/test endpoint | `Statistics.tsx` |

### Analysis Framework

Once script source code is received, analyze for:

1. **Email Formatting Patterns**
   - HTML generation approach (template literals, HtmlService, etc.)
   - Variable substitution patterns
   - Styling approach (inline CSS, etc.)
   - Link generation (booking CTAs, app links)

2. **Trigger Mechanisms**
   - Time-based triggers (ScriptApp.newTrigger)
   - Event-based triggers
   - On-demand via HTTP GET/POST

3. **Data Sources and APIs**
   - Firebase data access patterns
   - External API calls (UrlFetchApp)
   - PropertiesService usage for config/state

4. **Template/Formatting Approaches**
   - Template structure and organization
   - Dynamic content insertion
   - Multi-recipient handling

5. **Error Handling Patterns**
   - Try/catch structure
   - Error response formats
   - Logging approach (console.log, Logger.log)

### Source Code (To Be Added)

_Pete will provide script source code via one of:_
- Option A: Paste code directly in chat
- Option B: Share script.google.com URLs
- Option C: Export as .gs files

---
