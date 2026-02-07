---
Type: User-Guide
Status: Active
Created: 2026-02-01
Last-Updated: 2026-02-02
Card-ID: BRIK-ENG-0020
---

# Brikette Email Workflow Guide

This guide explains how to use Claude Code to process customer emails for Hostel Brikette.

## Quick Start

### 1. Start Claude Code

```bash
claude
```

### 2. Process Emails

Run the skill:
```
/process-emails
```

Or ask conversationally:
```
Help me process customer emails for Brikette
```

### 3. Review and Approve

Claude will show you pending emails and generate draft responses. You can:
- **Approve** - Create the draft in Gmail
- **Edit** - Request changes to the draft
- **Skip** - Don't respond to this email
- **Defer** - Save for later

### 4. Send from Gmail

Open Gmail, review your drafts, and send.

---

## Daily Workflow Suggestions

### Morning Triage (09:00)
1. Run `/process-emails`
2. Process availability inquiries first (time-sensitive)
3. Handle FAQ-type questions in batch
4. Defer complex inquiries for afternoon

### Afternoon Follow-up (17:00)
1. Run `/process-emails` for new emails
2. Handle deferred complex inquiries
3. Review and send all drafts

### Peak Season Adjustment
During busy periods, consider:
- 3x daily sessions (morning, afternoon, evening)
- Batch process by email type
- Use "Process all FAQ emails" for efficiency

---

## Interaction Examples

### Processing a Single Email

```
You: Process #1

Claude: ## Email #1: Availability Inquiry

**From:** Maria Santos <maria@example.com>
**Subject:** Availability June 15-18?
...

### Draft Response:

Dear Maria,

Thank you for your interest in Hostel Brikette!
...

Actions: [Create draft] [Edit] [Regenerate] [Skip]
```

### Requesting Changes

```
You: Make it shorter and more casual

Claude: Here's the revised draft:

Hey Maria!

Thanks for reaching out! For June 15-18...
...

Actions: [Create draft] [Edit] [Regenerate] [Skip]
```

### Batch Processing

```
You: Process all FAQ-type emails

Claude: Processing 4 FAQ emails...

1. Check-in time question -> Draft created
2. Breakfast included? -> Draft created
3. Pet policy -> Draft created
4. Luggage storage -> Draft created

4 drafts created. Review them in Gmail.
```

### Skipping Spam

```
You: Skip #3 - spam

Claude: Email #3 marked as spam and removed from queue.
```

---

## Knowledge Base

Claude has access to Brikette's knowledge base:

| Resource | What It Contains |
|----------|------------------|
| FAQ | 29 common questions and answers |
| Rooms | Room types, amenities, views, capacity |
| Menu | Bar and breakfast prices |
| Policies | Check-in/out, age restrictions, cancellation |

You can reference these in your requests:
```
"Include the parking information from FAQ"
"Mention the sea view rooms"
"Add breakfast prices"
```

---

## Troubleshooting

### "Gmail API Error"

The Gmail API may be rate-limited. Wait 5 minutes and try again.

### "Cannot generate good response"

For complex inquiries Claude cannot handle:
1. Flag for manual handling
2. Use a fallback template
3. Provide additional context

### "MCP server not running"

Ensure the MCP server is started:
```bash
cd packages/mcp-server && pnpm start
```

### Drafts not appearing in Gmail

1. Check Gmail's Drafts folder
2. Look for the "Brikette/Drafts/Ready-For-Review" label
3. Verify MCP server logs for errors

---

## Tips for Best Results

### Be Specific About Tone
```
"More formal please"
"Casual and friendly"
"Match the customer's language style"
```

### Reference Knowledge Base
```
"Include FAQ about parking"
"Add room 7 details"
"Mention breakfast prices"
```

### Handle Edge Cases
```
"This is a complaint - acknowledge their frustration"
"They're asking about a group booking - flag as complex"
"Non-English email - generate response in English with note"
```

---

## Email Classification Types

Claude classifies emails to help with processing:

| Type | Description | Typical Action |
|------|-------------|----------------|
| Availability | Asking about room availability | Direct to website booking |
| FAQ | Common question from knowledge base | Use FAQ answer |
| Pricing | Menu or room price question | Include specific prices |
| Directions | How to get to the hostel | Link to guides |
| Booking Issue | Problem with existing booking | Flag for careful handling |
| Complex | Multi-part or unusual request | Process one-by-one |
| Spam | Not a customer inquiry | Skip |

---

## Session Commands

| Command | Effect |
|---------|--------|
| `/process-emails` | Start email processing session |
| "Process all" | Work through entire queue |
| "Process #N" | Handle specific email |
| "Skip #N" | Remove without response |
| "Skip #N - spam" | Mark as spam |
| "Defer #N" | Move to end of queue |
| "Done" | End session |

---

## After Processing

1. **Review Drafts in Gmail**
   - Open Gmail Drafts folder
   - Check for "Ready-For-Review" label
   - Make final edits if needed

2. **Send Emails**
   - Click Send in Gmail
   - Drafts are your responsibility to send

3. **Cleanup**
   - GAS script automatically archives processed emails
   - Labels are updated automatically

---

## FAQ

**Q: Can Claude send emails automatically?**
A: No. Claude only creates drafts. You must review and send manually.

**Q: What if I need to stop mid-session?**
A: Say "Done" or just close Claude Code. Your queue position is saved via Gmail labels.

**Q: Can I process emails from my phone?**
A: Not currently. Claude Code requires a terminal.

**Q: What languages does Claude support?**
A: Claude can read emails in many languages but generates responses in English. Multi-language generation is planned for a future phase.

**Q: Where are my drafts stored?**
A: In your Gmail Drafts folder with the "Brikette/Drafts/Ready-For-Review" label.

---

## Gmail Label Setup

The email workflow uses a Gmail label hierarchy to track processing state. This is a one-time setup.

### Label Hierarchy

```
Brikette/
  Inbox/
    Needs-Processing    <- New customer inquiries awaiting response
    Processing          <- Currently being processed by Claude
  Drafts/
    Ready-For-Review    <- Draft created, needs your review
    Sent                <- Draft was sent (archive trigger)
```

### Setup Instructions

1. **Open Gmail Settings**
   - Go to Gmail (mail.google.com)
   - Click the gear icon (top right)
   - Select "See all settings"
   - Click the "Labels" tab

2. **Create Parent Label**
   - Scroll to bottom of label list
   - Click "Create new label"
   - Enter: `Brikette`
   - Click "Create"

3. **Create Inbox Sub-Labels**
   - Click "Create new label"
   - Enter: `Inbox`
   - Check "Nest label under:" and select `Brikette`
   - Click "Create"
   - Repeat for:
     - `Needs-Processing` (nested under `Brikette/Inbox`)
     - `Processing` (nested under `Brikette/Inbox`)

4. **Create Drafts Sub-Labels**
   - Click "Create new label"
   - Enter: `Drafts`
   - Check "Nest label under:" and select `Brikette`
   - Click "Create"
   - Repeat for:
     - `Ready-For-Review` (nested under `Brikette/Drafts`)
     - `Sent` (nested under `Brikette/Drafts`)

5. **Verify Structure**
   - In the left sidebar, expand `Brikette`
   - You should see:
     ```
     Brikette
       Inbox
         Needs-Processing
         Processing
       Drafts
         Ready-For-Review
         Sent
     ```

### Label Purposes

| Label | Purpose | Applied By | Removed By |
|-------|---------|------------|------------|
| `Brikette/Inbox/Needs-Processing` | Customer inquiry awaiting response | GAS monitor script (automatic) | MCP tool when processing starts |
| `Brikette/Inbox/Processing` | Email currently being handled | MCP tool when fetching email | MCP tool when draft created |
| `Brikette/Drafts/Ready-For-Review` | Draft ready for Pete to review | MCP tool when draft created | GAS script when draft sent |
| `Brikette/Drafts/Sent` | Response was sent (for archival) | GAS script when draft sent | Never (archive marker) |

### Label Colors (Optional)

For visual clarity, you can assign colors:
- `Needs-Processing`: Yellow (attention needed)
- `Processing`: Blue (in progress)
- `Ready-For-Review`: Green (action available)
- `Sent`: Gray (archived)

To set colors:
1. Hover over the label in the sidebar
2. Click the three dots
3. Select "Label color"
4. Choose your preferred color

### Troubleshooting Labels

**Labels not appearing in sidebar:**
- Check Settings > Labels and ensure "Show in label list" is enabled

**Nested labels not working:**
- Gmail requires the parent label to exist before creating nested labels
- Delete and recreate in the correct order if needed

**GAS script not applying labels:**
- Verify the GAS script has correct label names (case-sensitive)
- Check GAS execution logs for errors
