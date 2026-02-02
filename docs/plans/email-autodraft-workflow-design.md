---
Type: Design-Doc
Status: Active
Domain: Business-Ops
Created: 2026-02-01
Last-updated: 2026-02-01
Card-ID: BRIK-ENG-0020
Feature-Slug: email-autodraft
---

# Email Autodraft Workflow Design

## Executive Summary

This document defines the complete workflow for Pete to process Brikette customer emails using Claude Code with MCP tools. Based on Pete's architectural decisions:

- **Primary interface:** Claude Code (CLI)
- **Workflow type:** Human-initiated (1-2x daily batch processing)
- **MCP server:** Comfortable running locally

## Pattern Recommendation: Pattern B (Claude Code + MCP Tools)

### Recommendation: **Pattern B** (Claude Code + MCP Tools)

### Rationale

| Factor | Pattern A (File-Based) | Pattern B (MCP Tools) | Winner |
|--------|------------------------|----------------------|--------|
| **Real-time feedback** | No - requires file sync cycles | Yes - immediate tool responses | B |
| **Setup complexity** | Medium - GAS export scripts, file watching | Medium - MCP server, Gmail OAuth | Tie |
| **Error handling** | Awkward - errors in separate files | Natural - inline error messages | B |
| **Maintenance** | Two systems (GAS + files) | One system (MCP server) | B |
| **Draft creation** | Two-step (write file, GAS creates) | One-step (tool creates directly) | B |
| **Context switching** | Higher - check files, then Claude Code | Lower - everything in Claude Code | B |
| **Knowledge base** | Files on disk | MCP resources (same files, better access) | B |
| **Extensibility** | Limited - new file formats needed | High - add new tools easily | B |
| **Existing patterns** | None | MCP server exists with 12+ tool modules | B |

**Key Decision Factor:** The existing MCP server infrastructure (`packages/mcp-server/`) provides proven patterns for tool development. Pattern B extends this infrastructure rather than creating a parallel file-based system.

**Future-proofing:** Pattern B positions for potential Claude Desktop integration (Pete's original MCP preference) with zero additional work. The same tools work in both Claude Code and Claude Desktop.

---

## Complete Workflow Design

### 1. Email Monitoring (GAS Side)

**Purpose:** Identify and queue emails that need Pete's attention.

#### Scanning Frequency
- **Every 30 minutes** during business hours (08:00-22:00 Italy time)
- Lightweight check: only marks emails as needing processing, does not process content
- Uses Gmail labels to track status

#### Gmail Label System
```
Brikette/
  Inbox/
    Needs-Processing   <- GAS adds this label to new customer inquiries
    Processing         <- Claude Code sets this when fetching
  Drafts/
    Ready-For-Review   <- Draft created, needs Pete's review
    Sent               <- Draft was sent (archive trigger)
```

#### Trigger Mechanism for Pete
- **Option 1 (Recommended):** Pete checks email count when starting `/process-emails`
- **Option 2 (Future):** Daily summary email at 09:00 and 17:00 with pending count
- **Option 3 (Future):** Slack/Discord notification when queue exceeds N emails

#### Email Data Structure (when fetched via MCP)
```typescript
interface PendingEmail {
  id: string;                    // Gmail message ID
  threadId: string;              // For thread context
  from: {
    name: string;
    email: string;
  };
  subject: string;
  receivedAt: string;            // ISO timestamp
  snippet: string;               // First 200 chars preview
  labels: string[];              // Gmail labels
  isReply: boolean;              // Part of existing thread
  threadLength: number;          // Messages in thread
}

interface EmailDetails extends PendingEmail {
  body: {
    plain: string;               // Plain text content
    html?: string;               // HTML if available
  };
  attachments: {
    filename: string;
    mimeType: string;
    size: number;
  }[];
  threadContext?: {              // Previous messages if reply
    messages: {
      from: string;
      date: string;
      snippet: string;
    }[];
  };
}
```

---

### 2. Claude Code Session (Pete's Side)

#### Starting a Session

Pete runs:
```bash
claude
```

Then uses the skill:
```
/process-emails
```

Or conversationally:
```
"Help me process customer emails for Brikette"
```

#### Session Flow

```
+-------------------+     +---------------------+     +------------------+
|  1. Check Queue   | --> |  2. Triage Display  | --> |  3. Process One  |
|  (auto on skill)  |     |  (summary table)    |     |  (or batch)      |
+-------------------+     +---------------------+     +------------------+
                                    |                          |
                                    v                          v
                          +---------------------+     +------------------+
                          |  Skip/Defer/Flag    |     |  Generate Draft  |
                          |  (user choice)      |     |  (with review)   |
                          +---------------------+     +------------------+
                                                               |
                                                               v
                                                      +------------------+
                                                      |  4. Create Draft |
                                                      |  (in Gmail)      |
                                                      +------------------+
                                                               |
                                                               v
                                                      +------------------+
                                                      |  5. Next Email   |
                                                      |  (or finish)     |
                                                      +------------------+
```

#### Presentation Format

**Queue Summary (shown first):**
```
## Pending Emails (5 total)

| # | From | Subject | Received | Type |
|---|------|---------|----------|------|
| 1 | maria@example.com | Availability June 15-18? | 2h ago | Inquiry |
| 2 | john@example.com | RE: Booking confirmation | 4h ago | Reply |
| 3 | test@spam.com | You've won! | 5h ago | Spam? |
| 4 | guest@hotel.com | Check-in time question | 1d ago | FAQ |
| 5 | agent@otas.com | Group booking inquiry | 1d ago | Complex |

Actions:
- "Process all" - work through queue in order
- "Process #1" - handle specific email
- "Skip #3" - mark as spam/not-customer
- "Defer #5" - move to end of queue
- "Done" - finish session
```

**Single Email Processing:**
```
## Email #1: Availability Inquiry

**From:** Maria Santos <maria@example.com>
**Subject:** Availability June 15-18?
**Received:** 2 hours ago

### Content:
> Hi there,
>
> I'm planning to visit Positano in June with my friend.
> Do you have availability for 2 beds in a female dorm
> from June 15-18 (3 nights)?
>
> Also, is breakfast included?
>
> Thanks,
> Maria

### Classification:
- **Type:** Availability inquiry
- **Priority:** Normal
- **Language:** English
- **Sentiment:** Positive/Neutral

### Relevant Knowledge:
- Female dorm available (Room 5-6: Superior, sea view)
- Breakfast: Included with direct booking, otherwise additional
- Check-in: 15:00-22:30

### Draft Response:

---
Subject: RE: Availability June 15-18?

Dear Maria,

Thank you for your interest in Hostel Brikette!

For your dates (June 15-18), I'd be happy to check availability for 2 beds
in our female dormitory. Our superior female dorm (Room 5-6) offers sea
views and a shared terrace - perfect for enjoying Positano's sunsets.

**Quick answers to your questions:**
- Breakfast is complimentary when you book directly through our website
- Check-in is from 15:00 to 22:30

To secure your beds at the best rate, you can book directly at:
[Website booking link]

If you have any other questions, I'm here to help!

Warm regards,
Peter & Cristiana
Hostel Brikette
---

Actions:
- "Create draft" - save to Gmail drafts (default)
- "Edit" - modify the response
- "Regenerate" - try a different approach
- "Skip" - don't respond to this email
- "Flag" - mark for manual handling later
```

#### Interaction Patterns

**One-by-One (Default):**
- Process emails individually with full review
- Pete can edit each draft before creation
- Best for complex or important emails

**Batch Mode:**
- Pete says "Process all FAQ-type emails"
- Claude generates drafts for matching emails
- Pete reviews summary, approves all at once
- Best for routine inquiries

**Mixed Mode:**
- Start with batch for simple emails
- Switch to one-by-one for complex ones
- "Process the availability inquiries in batch, then show me #5"

#### Skip/Defer Options

```
Skip options:
- "Skip - spam" (moves to spam, no draft)
- "Skip - not customer" (archive, no draft)
- "Skip - already handled" (archive, no draft)

Defer options:
- "Defer - need more info" (keeps in queue, adds note)
- "Defer - complex" (moves to end of queue)
- "Defer - urgent other task" (saves position for later)
```

#### Review and Editing

Pete can request changes:
```
"Make it more casual"
"Add information about parking"
"Mention the early check-in option"
"Shorter please"
"Include Italian greeting"
```

Claude regenerates the draft with the feedback.

---

### 3. Draft Creation (Output Side)

#### Draft Format

**Gmail Draft Properties:**
```typescript
interface DraftCreateRequest {
  emailId: string;           // Original email being replied to
  subject: string;           // RE: <original subject>
  body: {
    plain: string;           // Plain text version
    html: string;            // Branded HTML version (using EmailsConfig)
  };
  replyTo: string;           // Customer's email
  threadId?: string;         // For threading replies
  labels: string[];          // ["Brikette/Drafts/Ready-For-Review"]
}
```

**HTML Email Structure (reusing EmailsConfig):**
```html
<!-- Header with Brikette logo -->
<!-- Main content with blue scheme (inquiry response) -->
<!-- Signature block (both owners) -->
<!-- Footer with social links -->
```

#### MCP Tool for Draft Creation

```typescript
// packages/mcp-server/src/tools/gmail.ts
export const gmailTools = [
  {
    name: "gmail_list_pending",
    description: "List customer emails needing response",
    // Returns: PendingEmail[]
  },
  {
    name: "gmail_get_email",
    description: "Get full details for a specific email",
    inputSchema: {
      type: "object",
      properties: {
        emailId: { type: "string" },
        includeThread: { type: "boolean", default: true }
      },
      required: ["emailId"]
    },
    // Returns: EmailDetails
  },
  {
    name: "gmail_create_draft",
    description: "Create a draft reply to a customer email",
    inputSchema: {
      type: "object",
      properties: {
        emailId: { type: "string", description: "Email being replied to" },
        subject: { type: "string" },
        bodyPlain: { type: "string" },
        bodyHtml: { type: "string" }
      },
      required: ["emailId", "subject", "bodyPlain"]
    },
    // Returns: { draftId: string, success: true }
  },
  {
    name: "gmail_mark_processed",
    description: "Mark an email as processed (remove from queue)",
    inputSchema: {
      type: "object",
      properties: {
        emailId: { type: "string" },
        action: {
          type: "string",
          enum: ["drafted", "skipped", "spam", "deferred"]
        }
      },
      required: ["emailId", "action"]
    }
  }
];
```

#### What Happens After Draft Creation

1. **Immediate:** Draft appears in Pete's Gmail Drafts folder with label
2. **Pete's review:** Opens Gmail, reviews drafts, makes final edits if needed
3. **Sending:** Pete clicks Send in Gmail (human-in-loop maintained)
4. **Cleanup:** GAS script monitors sent emails, archives original inquiry

#### Cleanup and Archiving Process

**GAS Script (runs every 15 minutes):**
1. Check for sent emails that were previously drafts
2. Archive the original customer inquiry
3. Update labels: remove "Needs-Processing", add "Processed"
4. Maintain audit trail in spreadsheet (optional)

---

### 4. Knowledge Base Integration

#### Access Method: MCP Resources

The knowledge base is exposed as MCP resources, allowing Claude to access it naturally during conversation.

**Resource Definitions:**
```typescript
// packages/mcp-server/src/resources/brikette-knowledge.ts
export const briketteResources = [
  {
    uri: "brikette://faq",
    name: "Brikette FAQ",
    description: "29 frequently asked questions and answers",
    mimeType: "application/json"
  },
  {
    uri: "brikette://rooms",
    name: "Room Details",
    description: "Room types, amenities, views, and capacity",
    mimeType: "application/json"
  },
  {
    uri: "brikette://pricing/menu",
    name: "Bar and Breakfast Menu",
    description: "Current menu prices",
    mimeType: "application/json"
  },
  {
    uri: "brikette://guides",
    name: "Travel Guides",
    description: "Local area guides and recommendations",
    mimeType: "application/json"
  },
  {
    uri: "brikette://policies",
    name: "Hotel Policies",
    description: "Check-in/out, cancellation, age restrictions",
    mimeType: "application/json"
  }
];
```

#### Why Resources Over Tools

- **Automatic context:** Claude can reference resources without explicit tool calls
- **Rich content:** Resources return full structured data
- **Caching:** Resources are cacheable, tools are not
- **Pattern match:** Existing MCP server uses resources for schema/config

#### Caching Strategy

**In-memory cache (MCP server):**
```typescript
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: unknown; expires: number }>();

function getCachedResource(uri: string) {
  const cached = cache.get(uri);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  const data = loadResource(uri);
  cache.set(uri, { data, expires: Date.now() + CACHE_TTL });
  return data;
}
```

**Why 5 minutes:**
- FAQ/rooms/pricing rarely change during a session
- Short enough to pick up same-day updates
- Reduces file system reads

#### Content Sources (file paths)

| Resource | Source File(s) |
|----------|---------------|
| FAQ | `apps/brikette/src/locales/en/faq.json` |
| Rooms | `apps/brikette/src/locales/en/rooms.json` + `apps/brikette/src/config/rooms.ts` |
| Menu | `apps/brikette/src/data/menuPricing.ts` |
| Guides | `apps/brikette/src/locales/en/guides/*.json` |
| Policies | Derived from FAQ + config |

---

### 5. Error Handling

#### Gmail API Failures

**Scenario:** Gmail API is unavailable or rate-limited

**Handling:**
```
## Gmail API Error

Unable to fetch emails: Rate limit exceeded (429)

Options:
1. "Retry in 5 minutes" - wait and try again
2. "Continue offline" - work with cached emails (if any)
3. "Exit session" - end email processing

The Gmail API has rate limits. If this persists, try:
- Processing fewer emails per session
- Waiting 15 minutes before retrying
```

**MCP Tool Response:**
```typescript
{
  isError: true,
  content: [{
    type: "text",
    text: JSON.stringify({
      error: "GMAIL_RATE_LIMIT",
      message: "API rate limit exceeded",
      retryAfter: 300, // seconds
      cached: true,    // cached data available
      cachedAt: "2026-02-01T10:30:00Z"
    })
  }]
}
```

#### Draft Generation Issues

**Scenario:** Claude cannot generate a good response

**Handling:**
```
## Draft Generation Issue

I'm having trouble generating a response for this email because:
- The inquiry is about real-time availability (I don't have access)
- The request is in a language I don't fully support
- The email content is unclear or incomplete

Suggested actions:
1. "Flag for manual" - Pete handles this one directly
2. "Show template" - use a generic "we'll get back to you" response
3. "Clarify" - Pete provides additional context
```

**Fallback Templates:**
```typescript
const FALLBACK_TEMPLATES = {
  availability: `Thank you for your inquiry. For real-time availability and booking, please visit our website: [link]. If you have specific questions, reply to this email and we'll get back to you within 24 hours.`,

  unclear: `Thank you for contacting Hostel Brikette. Could you please provide more details about your inquiry so we can better assist you?`,

  complex: `Thank you for your message. Your inquiry requires additional attention, and we'll respond with a detailed answer within 24-48 hours.`
};
```

#### Mid-Session Bailout

**Scenario:** Pete needs to stop mid-session

**Handling:**
```
"I need to stop" or "Exit" or "Done for now"
```

**Response:**
```
## Session Paused

Progress saved:
- 3 emails processed (drafts created)
- 2 emails remaining in queue

The remaining emails will still be in your queue when you return.
Run `/process-emails` to continue.

Drafts created this session:
1. RE: Availability June 15-18? - Draft in Gmail
2. RE: Check-in time question - Draft in Gmail
3. RE: Breakfast options - Draft in Gmail

Remember to review and send these drafts in Gmail!
```

**State Persistence:**
- Queue position maintained via Gmail labels
- No session state stored in MCP server (stateless design)
- Pete can resume anytime with fresh context

---

## Skill Creation

### Recommendation: Yes - Create `/process-emails` Skill

**Rationale:**
- Provides consistent entry point for email workflow
- Encapsulates the MCP tool usage patterns
- Guides Pete through the workflow steps
- Can be enhanced over time

### Skill Design

**File:** `.claude/skills/process-emails/SKILL.md`

```markdown
---
name: process-emails
description: Process pending Brikette customer emails and generate draft responses
---

# Process Emails

Process customer emails for Hostel Brikette, generating intelligent draft responses using the knowledge base.

## When to Use

Run this skill when you want to process customer inquiry emails:
- Morning email triage (recommended: 09:00)
- Afternoon follow-up (recommended: 17:00)
- Ad-hoc when notified of urgent inquiry

## Prerequisites

- MCP server running locally with Gmail tools enabled
- Gmail API credentials configured
- Network access to Gmail API

## Workflow

### 1. Check Email Queue

Use the `gmail_list_pending` tool to fetch pending emails:

```
Checking your email queue...
```

If no pending emails, inform the user and offer to exit.

### 2. Display Queue Summary

Present emails in a table format:
- Email number (for reference)
- From (sender name/email)
- Subject
- Time received
- Detected type (Inquiry/FAQ/Reply/Complex/Spam?)

### 3. Triage Options

Offer the user options:
- "Process all" - work through entire queue
- "Process #N" - handle specific email
- "Skip #N" - mark as spam/not-customer
- "Defer #N" - move to end of queue
- "Done" - end session

### 4. Process Email

For each email being processed:

1. **Fetch details** using `gmail_get_email`
2. **Load knowledge base** via MCP resources:
   - `brikette://faq` - for common questions
   - `brikette://rooms` - for room inquiries
   - `brikette://pricing/menu` - for price questions
   - `brikette://policies` - for policy questions
3. **Classify** the email (type, urgency, sentiment)
4. **Generate** draft response
5. **Present** to user with edit options

### 5. Create Draft

After user approval (or edit):
- Use `gmail_create_draft` to create the draft in Gmail
- Use `gmail_mark_processed` to update the queue
- Move to next email or show updated queue

### 6. Session Summary

When user says "Done" or queue is empty:
- Show summary of actions taken
- List drafts created (remind to review in Gmail)
- Show remaining queue count

## Interaction Patterns

### Edit Requests
User can request changes:
- "Make it shorter"
- "More formal tone"
- "Add parking information"
- "Include Italian greeting"

Regenerate the draft incorporating feedback.

### Skip/Defer
- "Skip - spam" → mark as spam, no draft
- "Skip - not customer" → archive without response
- "Defer" → keep in queue for later

### Batch Processing
- "Process all FAQ emails" → batch similar emails
- "Show complex ones only" → filter queue

## Quality Checks

Before creating each draft:
- [ ] Response addresses the customer's specific question
- [ ] Tone is warm and professional
- [ ] Information is accurate (from knowledge base)
- [ ] Call-to-action included (booking link if appropriate)
- [ ] Signature block included

## Common Scenarios

### Availability Inquiry
- Cannot check real-time availability
- Direct to website booking
- Mention room types that might suit their needs

### Price Question
- Use menu pricing data
- Clarify breakfast inclusion policy
- Mention direct booking benefits

### Directions/Location
- Provide standard directions
- Link to guides for more detail
- Mention luggage storage

### Policy Questions
- Use FAQ data
- Be specific about times/rules
- Offer flexibility where possible

## Error Handling

### Gmail API Error
Inform user, offer retry or offline options.

### Cannot Generate Good Response
Flag for manual handling, offer fallback template.

### Session Interruption
Save progress, provide summary, allow resume later.
```

---

## MCP Server Design

### New Tool Module: `packages/mcp-server/src/tools/gmail.ts`

```typescript
import { z } from "zod";
import { errorResult, jsonResult } from "../utils/validation.js";

// Gmail API client (configured with OAuth)
import { gmail } from "../clients/gmail.js";

const listPendingSchema = z.object({
  limit: z.number().min(1).max(50).default(20),
});

const getEmailSchema = z.object({
  emailId: z.string().min(1),
  includeThread: z.boolean().default(true),
});

const createDraftSchema = z.object({
  emailId: z.string().min(1),
  subject: z.string().min(1),
  bodyPlain: z.string().min(1),
  bodyHtml: z.string().optional(),
});

const markProcessedSchema = z.object({
  emailId: z.string().min(1),
  action: z.enum(["drafted", "skipped", "spam", "deferred"]),
});

export const gmailTools = [
  {
    name: "gmail_list_pending",
    description: "List customer emails in the Brikette inbox that need responses",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max emails to return (1-50)", default: 20 },
      },
    },
  },
  {
    name: "gmail_get_email",
    description: "Get full details of a specific email including thread context",
    inputSchema: {
      type: "object",
      properties: {
        emailId: { type: "string", description: "Gmail message ID" },
        includeThread: { type: "boolean", description: "Include thread history", default: true },
      },
      required: ["emailId"],
    },
  },
  {
    name: "gmail_create_draft",
    description: "Create a draft reply to a customer email in Gmail",
    inputSchema: {
      type: "object",
      properties: {
        emailId: { type: "string", description: "Original email ID to reply to" },
        subject: { type: "string", description: "Email subject (usually RE: original)" },
        bodyPlain: { type: "string", description: "Plain text email body" },
        bodyHtml: { type: "string", description: "HTML email body (optional)" },
      },
      required: ["emailId", "subject", "bodyPlain"],
    },
  },
  {
    name: "gmail_mark_processed",
    description: "Mark an email as processed, updating its queue status",
    inputSchema: {
      type: "object",
      properties: {
        emailId: { type: "string", description: "Gmail message ID" },
        action: {
          type: "string",
          enum: ["drafted", "skipped", "spam", "deferred"],
          description: "How the email was handled"
        },
      },
      required: ["emailId", "action"],
    },
  },
] as const;

// Tool names for routing
const gmailToolNames = new Set(gmailTools.map((t) => t.name));

export async function handleGmailTool(name: string, args: unknown) {
  try {
    switch (name) {
      case "gmail_list_pending": {
        const { limit } = listPendingSchema.parse(args);
        const emails = await gmail.listPendingEmails(limit);
        return jsonResult({
          emails,
          total: emails.length,
          hasMore: emails.length === limit,
        });
      }

      case "gmail_get_email": {
        const { emailId, includeThread } = getEmailSchema.parse(args);
        const email = await gmail.getEmailDetails(emailId, includeThread);
        if (!email) {
          return errorResult(`Email not found: ${emailId}`);
        }
        return jsonResult(email);
      }

      case "gmail_create_draft": {
        const { emailId, subject, bodyPlain, bodyHtml } = createDraftSchema.parse(args);
        const draft = await gmail.createDraft({
          replyTo: emailId,
          subject,
          bodyPlain,
          bodyHtml,
        });
        return jsonResult({
          success: true,
          draftId: draft.id,
          message: "Draft created successfully",
        });
      }

      case "gmail_mark_processed": {
        const { emailId, action } = markProcessedSchema.parse(args);
        await gmail.markProcessed(emailId, action);
        return jsonResult({
          success: true,
          message: `Email marked as ${action}`,
        });
      }

      default:
        return errorResult(`Unknown gmail tool: ${name}`);
    }
  } catch (error) {
    return errorResult(formatError(error));
  }
}
```

### New Resource Module: `packages/mcp-server/src/resources/brikette-knowledge.ts`

```typescript
import { readFile } from "fs/promises";
import { resolve } from "path";

const BRIKETTE_ROOT = resolve(__dirname, "../../../../apps/brikette/src");

// Cache for knowledge base content
const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function loadCached<T>(uri: string, loader: () => Promise<T>): Promise<T> {
  const cached = cache.get(uri);
  if (cached && cached.expires > Date.now()) {
    return cached.data as T;
  }
  const data = await loader();
  cache.set(uri, { data, expires: Date.now() + CACHE_TTL });
  return data;
}

export const briketteResources = [
  {
    uri: "brikette://faq",
    name: "Brikette FAQ",
    description: "Frequently asked questions about Hostel Brikette (29 items)",
    mimeType: "application/json",
  },
  {
    uri: "brikette://rooms",
    name: "Room Details",
    description: "Room types, amenities, views, and bed configurations",
    mimeType: "application/json",
  },
  {
    uri: "brikette://pricing/menu",
    name: "Menu Pricing",
    description: "Current bar and breakfast menu with prices",
    mimeType: "application/json",
  },
  {
    uri: "brikette://policies",
    name: "Hotel Policies",
    description: "Check-in/out times, age restrictions, cancellation policies",
    mimeType: "application/json",
  },
];

export async function handleBriketteResource(uri: string) {
  switch (uri) {
    case "brikette://faq": {
      const data = await loadCached(uri, async () => {
        const content = await readFile(
          resolve(BRIKETTE_ROOT, "locales/en/faq.json"),
          "utf-8"
        );
        return JSON.parse(content);
      });
      return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(data) }] };
    }

    case "brikette://rooms": {
      const data = await loadCached(uri, async () => {
        const rooms = await readFile(
          resolve(BRIKETTE_ROOT, "locales/en/rooms.json"),
          "utf-8"
        );
        const config = await import(resolve(BRIKETTE_ROOT, "config/rooms.ts"));
        return { rooms: JSON.parse(rooms), config: config.default };
      });
      return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(data) }] };
    }

    case "brikette://pricing/menu": {
      const data = await loadCached(uri, async () => {
        const pricing = await import(resolve(BRIKETTE_ROOT, "data/menuPricing.ts"));
        return {
          bar: pricing.barMenuPrices,
          breakfast: pricing.breakfastMenuPrices,
        };
      });
      return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(data) }] };
    }

    case "brikette://policies": {
      // Derived from FAQ and config
      const data = await loadCached(uri, async () => {
        const faqContent = await readFile(
          resolve(BRIKETTE_ROOT, "locales/en/faq.json"),
          "utf-8"
        );
        const faq = JSON.parse(faqContent);
        // Extract policy-related FAQ items
        const policyKeywords = ["check-in", "check-out", "age", "cancel", "pet", "child"];
        const policies = faq.items.filter((item: { question: string }) =>
          policyKeywords.some((kw) => item.question.toLowerCase().includes(kw))
        );
        return { policies };
      });
      return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(data) }] };
    }

    default:
      throw new Error(`Unknown Brikette resource: ${uri}`);
  }
}
```

---

## Task Seeds for `/plan-feature`

### Phase 1: Infrastructure Setup

**TASK-01: Gmail OAuth Setup**
- Type: IMPLEMENT
- Effort: M
- Affects: `packages/mcp-server/src/clients/gmail.ts`, environment configuration
- Description: Set up Gmail API OAuth2 credentials for the MCP server. Create service account or OAuth flow for Pete's Gmail account.
- Acceptance: Can authenticate and list emails from Pete's Gmail

**TASK-02: Create Gmail MCP Tools**
- Type: IMPLEMENT
- Effort: M
- Affects: `packages/mcp-server/src/tools/gmail.ts`, `packages/mcp-server/src/tools/index.ts`
- Description: Implement the four Gmail tools (list_pending, get_email, create_draft, mark_processed)
- Depends: TASK-01
- Acceptance: All tools work with real Gmail API

**TASK-03: Create Brikette Knowledge Resources**
- Type: IMPLEMENT
- Effort: S
- Affects: `packages/mcp-server/src/resources/brikette-knowledge.ts`, `packages/mcp-server/src/resources/schema.ts`
- Description: Expose FAQ, rooms, menu pricing, and policies as MCP resources
- Acceptance: Resources load correctly and cache appropriately

### Phase 2: Gmail Label System

**TASK-04: Create Gmail Labels**
- Type: IMPLEMENT
- Effort: S
- Affects: Gmail configuration (manual setup + GAS script)
- Description: Create the Brikette label hierarchy in Gmail and document the setup
- Acceptance: Label structure exists and is documented

**TASK-05: GAS Email Monitor Script**
- Type: IMPLEMENT
- Effort: M
- Affects: `apps/brikette-scripts/src/email-monitor/`
- Description: Create GAS script that monitors inbox and applies "Needs-Processing" label
- Acceptance: New customer emails get labeled within 30 minutes

### Phase 3: Claude Code Integration

**TASK-06: Create Process-Emails Skill**
- Type: IMPLEMENT
- Effort: M
- Affects: `.claude/skills/process-emails/SKILL.md`
- Description: Create the skill file with complete workflow documentation
- Acceptance: Skill works end-to-end with MCP tools

**TASK-07: Email Classification Prompts**
- Type: IMPLEMENT
- Effort: S
- Affects: Part of skill file, possibly separate prompt templates
- Description: Define prompts for email classification and draft generation
- Acceptance: Classification is accurate for common email types

### Phase 4: Draft Generation

**TASK-08: HTML Email Template Integration**
- Type: IMPLEMENT
- Effort: S
- Affects: `packages/mcp-server/src/utils/email-template.ts`
- Description: Port EmailsConfig patterns to generate branded HTML drafts
- Depends: TASK-02
- Acceptance: HTML drafts match existing booking email branding

### Phase 5: Testing and Validation

**TASK-09: End-to-End Workflow Test**
- Type: INVESTIGATE
- Effort: M
- Description: Test complete workflow with real emails (small batch)
- Depends: TASK-01 through TASK-08
- Acceptance: Process 5 real emails successfully

**TASK-10: Baseline Metrics Collection**
- Type: INVESTIGATE
- Effort: S
- Description: Collect baseline email metrics during initial use
- Depends: TASK-09
- Acceptance: Documented baseline for future comparison

---

## Documentation Updates Required

### 1. Update Fact-Find Brief

**File:** `docs/business-os/cards/BRIK-ENG-0020/fact-finding.user.md`

**Add section:**
```markdown
### 7. Claude Interface Decision
**Question:** Which Claude interface should Pete use?

**Decision:** ✅ **RESOLVED** (2026-02-01)
- **Interface:** Claude Code (CLI)
- **Workflow:** Human-initiated (1-2x daily batch processing)
- **MCP:** Comfortable running MCP server locally

**Architecture Pattern:** Pattern B (Claude Code + MCP Tools)
- Extends existing MCP server infrastructure
- Gmail tools for email operations
- Knowledge base as MCP resources
- Custom `/process-emails` skill
```

### 2. Update Agent Card

**File:** `docs/business-os/cards/BRIK-ENG-0020.user.md`

**Update Lane:** `Ready-for-planning` -> Include workflow design reference
**Update scope section** with Claude Code approach
**Add reference** to this workflow design document

### 3. Create User Guide

**File:** `docs/guides/brikette-email-workflow.md`

**Contents:**
- Quick start (how to run `/process-emails`)
- Prerequisites (MCP server setup)
- Daily workflow suggestions
- Troubleshooting common issues
- FAQ for the workflow itself

---

## Open Questions (All Resolved)

| Question | Status | Resolution |
|----------|--------|------------|
| Which Claude interface? | Resolved | Claude Code |
| Human-initiated or automated? | Resolved | Human-initiated |
| Comfortable with MCP server? | Resolved | Yes |
| Pattern A or B? | Resolved | Pattern B (MCP Tools) |
| Create skill? | Resolved | Yes - `/process-emails` |

---

## Next Steps

1. **Immediate:** Update fact-find and agent card with resolved decisions
2. **Then:** Run `/plan-feature` using this design as input
3. **Build order:** Tasks 01-03 (infrastructure) -> 04-05 (Gmail setup) -> 06-08 (integration) -> 09-10 (validation)

---

## Appendix: Alternative Approaches Considered

### Pattern A: File-Based (Not Chosen)

Would have required:
- GAS script to export emails to JSON files
- File watcher or manual sync
- Separate GAS script to import drafts
- Two file formats to maintain

Rejected because:
- More moving parts
- Slower feedback loop
- Less natural Claude Code experience
- Does not leverage existing MCP infrastructure

### Fully Automated (Not Chosen)

Would have required:
- Background service monitoring emails
- Automatic draft generation without Pete
- Risk of incorrect responses

Rejected because:
- Pete wants human-in-loop for quality control
- Customer relationships are personal (Brikette brand)
- Legal concerns with auto-send
