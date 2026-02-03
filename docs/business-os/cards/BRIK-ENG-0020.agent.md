---
Type: Card
Status: Active
Lane: In progress
Priority: P2
Owner: Pete
ID: BRIK-ENG-0020
Title: Email Autodraft Response System
Business: BRIK
Tags: [email, automation, AI, customer-service]
Created: 2026-02-01
Updated: 2026-02-02
Last-Progress: 2026-02-02
---

## Card: BRIK-ENG-0020

**Linked Idea:** `docs/business-os/ideas/worked/BRIK-OPP-0003.user.md`

**Current Lane:** In progress

**Executive Summary:**
Automate Brikette customer email responses by integrating Gmail API to generate intelligent drafts. System classifies inquiries, assembles context from website content and availability data, and creates drafts with accurate info and booking CTAs. Pete reviews all drafts before sending.

**Technical Scope:**
- Gmail API integration (monitor inbox, create drafts programmatically)
- LLM-based classification + draft generation (Claude API)
- Knowledge base: Brikette website content (guides, pricing, FAQ)
- Deploy as Cloudflare Worker (cron or webhook triggered)

**Fact-Finding Required:**

1. **Gmail API Access & Limits**
   - Method: Test Gmail API with Pete's workspace account
   - Evidence type: repo-diff (prototype code) + measurement (API quotas)
   - Questions:
     - Can we authenticate and access inbox via Gmail API?
     - Can we create draft messages programmatically?
     - What are rate limits and costs?
     - Webhook setup or polling approach?

2. **Inquiry Pattern Audit**
   - Method: Sample 50-100 recent customer emails, categorize by type/topic
   - Evidence type: customer-input (email data analysis)
   - Questions:
     - What are the 5-10 most common inquiry types?
     - What % of inquiries follow repeatable patterns?
     - What info is needed to answer each type (pricing, availability, directions, etc.)?
     - Are there complex inquiries that cannot be templated?

3. **Website Content Audit**
   - Method: Review Brikette website for completeness and accuracy
   - Evidence type: repo-diff (scan `apps/brikette/src/locales/en/guides/`)
   - Questions:
     - Does website have comprehensive info for common questions (pricing, availability, FAQ)?
     - Is content structured for programmatic access (JSON, markdown)?
     - What content is missing that customers frequently ask about?
     - How often does content need updating (pricing, availability)?

4. **Baseline Metrics**
   - Method: Track email volume and response workflow for 1 week
   - Evidence type: measurement
   - Metrics to gather:
     - Emails per day (customer inquiries only, exclude spam/transactional)
     - Current average response time (receipt → Pete's reply sent)
     - Time spent per email (read, research, compose, send)
     - Total email workload per week (hours)

5. **Legal/Privacy Review**
   - Method: Consult legal or research auto-response compliance
   - Evidence type: legal
   - Questions:
     - Are AI-generated drafts considered binding offers? (likely no, since Pete reviews)
     - GDPR compliance: can we process customer emails with external LLM API?
     - Need disclaimers in auto-generated content?
     - Data retention policy for email content and drafts?

**Evidence to Gather:**
- **Repo-diff:** Gmail API prototype, website content structure analysis
- **Customer-input:** Email pattern audit (50-100 samples)
- **Measurement:** Baseline email metrics (volume, time, response time)
- **Legal:** Privacy/compliance review for auto-draft system

**Transition Criteria:**

**Inbox → Fact-finding:**
- Trigger: Pete moves card to Fact-finding lane
- Requirements: None (ready to start gathering evidence)

**Fact-finding → Planned:**
- Evidence gathered: All 5 fact-finding questions answered
- Technical feasibility: Gmail API access confirmed, no blocking issues
- Business case validated: Inquiry patterns show ≥60% can be templated
- Risks assessed: Legal/privacy review complete, no blockers
- Outcome: Create implementation plan with acceptance criteria

**Fact-finding → Parked/Rejected:**
- If Gmail API is blocked or too expensive
- If inquiry patterns are too unique/complex to template
- If legal/privacy risks are too high
- If time savings don't justify development cost

**Planned → In progress:**
- Plan approved by Pete
- Prerequisites met: Gmail API access configured, sample emails analyzed
- Resources allocated: development time scheduled

**Dependencies:**
- Gmail workspace API access (likely available, needs confirmation)
- Website content up-to-date (ongoing dependency for accuracy)
- Claude API access (already available via platform-core)

**Risks:**
- Gmail API rate limits or policy changes (mitigation: monitor usage, implement backoff)
- Draft quality issues (mitigation: Pete reviews all drafts, iterate on prompts)
- Customer resistance to self-service (mitigation: measure conversion, adjust messaging)
- Content staleness (mitigation: add disclaimers, implement freshness checks)

**Success Metrics (once implemented):**
- Draft generation rate: ≥80% of inquiries receive auto-draft
- Draft quality: ≥90% sent without edits
- Response time: drafts available within 5 minutes of email receipt
- Time savings: email workload reduced ≥50%
- Conversion: website booking rate increases (measure delta)

**Implementation Notes:**
- Start simple: polling Gmail API every 5 min (not webhooks) for MVP
- Use existing `packages/platform-core/src/ai/` utilities for LLM calls
- Store knowledge base as JSON files (no database for MVP)
- Deploy on Cloudflare Workers (aligns with platform infra)
- Monitor costs: Gmail API + Claude API calls per draft

**Phase Boundary:**
- MVP: Auto-draft only, Pete reviews/sends all drafts
- Post-MVP: Learn from edits, auto-prioritize, multi-language, booking holds
- Out of scope: Auto-send, payment processing, full booking automation

---

## Fact-Finding: Email Generation Patterns (from Booking Monitor)

**Source:** Analysis of `apps/brikette-scripts/src/booking-monitor/` scripts (2026-02-01)

### Existing Email Automation Architecture

The Booking Monitor system already implements sophisticated email automation. Key components:

| File | Purpose |
|------|---------|
| `_RunBookingMonitor.gs` | Entry point, config, trigger function |
| `_BookingUtilities.gs` | Parse incoming booking emails, extract structured data |
| `_BookingImporterEmail.gs` | Generate HTML + plain text welcome emails |
| `_EmailsHelper.gs` | Formatting utilities, room details, booking source detection |
| `_EmailsConfig.gs` | Color schemes, branding assets, header/footer/signature templates |

### Key Patterns for Autodraft System

**1. Dual-Format Email Generation**
System generates both HTML and plain text versions of every email. Gmail API supports both via `textContent` and `htmlContent` fields. The autodraft system should follow this pattern.

**2. Conditional Content Blocks**
The "Action Required" block appears only for specific booking types:
```javascript
if (isNonRefund && !isTenDigits) {
  // Include Action Required block
}
```
This pattern extends naturally to:
- Language-specific content
- Inquiry type-specific sections
- Urgency-based formatting

**3. Structured Data Tables**
Welcome emails use HTML tables with alternating row colors:
```html
<tr style="background-color:#FFF6A3;">...</tr>  <!-- highlight -->
<tr style="background-color:#FFF9C4;">...</tr>  <!-- normal -->
```
Useful for pricing breakdowns, availability summaries, FAQ responses.

**4. External Service Integration**
"Digital Assistant" links demonstrate embedding external URLs:
```javascript
occupantLinks.forEach((linkObj) => {
  html += `<a href="${linkObj.url}">${linkObj.label}</a>`;
});
```
Autodraft can similarly include booking links, website deep links, etc.

**5. Cached Lookups**
Room details use in-memory caching:
```javascript
const roomDescCache = {};
if (roomDescCache[rn]) return roomDescCache[rn];
// ... compute and cache
```
Autodraft should cache: website content, FAQ answers, pricing.

### Business Logic Discovered

**Booking Source Detection:**
- 10-digit code → Booking.com
- 6-digit code → Website
- Other formats → Hostelworld

**Payment Terms Logic:**
- Booking.com + Refundable: "Payment can be made before or during check-in"
- Booking.com + Non-refundable: "Pre-paid and non-refundable"
- Other + Refundable: "Payment is due upon arrival"
- Other + Non-refundable: "Pre-paid and non-refundable"

**Hostelworld Commission:**
- Codes starting with `7763-` get 15% deducted (commission)
- Calculation: `netTotal = total - (total / 1.1 * 0.15)`

**Room Inventory (for availability inquiries):**
| Room | Type | Beds | View |
|------|------|------|------|
| 3-4 | Value dorm | 8 beds | No view |
| 5-6 | Superior dorm | 6-7 beds | Sea view, terrace |
| 7 | Double (private) | 1 double | Sea view, terrace |
| 8 | Garden dorm | 2 beds | Garden view |
| 9-10 | Premium dorm | 3-6 beds | No view |
| 11-12 | Superior dorm | 6 beds | Sea view terrace |

### Captured Components

All 5 booking monitor files are now in the repo:
- `_RunBookingMonitor.gs` - Entry point and trigger
- `_BookingUtilities.gs` - Email parsing
- `_BookingImporterEmail.gs` - Email generation
- `_EmailsHelper.gs` - Formatting utilities
- `_EmailsConfig.gs` - **Branding and templates** (captured 2026-02-01)

### Still Missing (lower priority)

1. **Gmail send logic** - How emails are actually sent (may be in full `_RunBookingMonitor.gs`)
2. **Spreadsheet/database integration** - References suggest additional storage

### EmailsConfig Details (for Autodraft Reuse)

The `_EmailsConfig.gs` file provides a complete email branding system:

**Color Schemes (extensible):**
```javascript
ColorSchemes: {
  yellow: { bgColourHeader: "#ffc107", bgColourMain: "#fff3cd", ... }
  // Can add: blue, green, etc. for different email types
}
ActivityColors: { 1: "yellow" }  // Maps activity types to schemes
```

**AVIF Fallback Pattern:**
```javascript
getAvifFallbackImage(avifUrl, pngUrl, altText, styleStr)
// Returns <picture> with AVIF source + PNG fallback
```

**Template Generators:**
- `generateHeader(styles)` - Branded header with hostel name and logo
- `generateSignature(styles)` - Dual-owner signature block (handwritten signatures)
- `generateFooter(styles)` - Terms link + social media icons (Instagram, TikTok)

**Brand Assets:**
- Owner signature images (Cristiana + Peter) in PNG/AVIF
- Hostel logo icon in PNG/AVIF
- Social media icons in PNG/AVIF
- URLs: hostel website, Instagram, TikTok, terms and conditions

### Implications for Autodraft Design

1. **Reuse existing patterns**: Don't reinvent email generation; extend the booking monitor approach
2. **Consider Google Apps Script**: Current system runs on GAS, not Cloudflare. May be simpler to extend GAS than migrate
3. **Knowledge base structure**: Room details pattern suggests JSON lookup tables work well
4. **Mobile-responsive**: Current emails use viewport meta tag and inline styles; maintain this

### Autodraft Recommendations (EmailsConfig Reuse Analysis)

**1. Should new emails use the same branding?**
- **Yes** - Reuse `EmailsConfig` directly for brand consistency
- Same header (hostel name + logo), signature (both owners), footer (social links)
- Guests who received booking confirmation will recognize inquiry responses
- Maintains professional/personal touch with handwritten signatures

**2. How can autodraft reuse EmailsConfig?**
- Import `EmailsConfig` object directly (GAS) or extract to shared module (Workers)
- Call same generators: `generateHeader()`, `generateSignature()`, `generateFooter()`
- Use `getStyles()` for consistent CSS-in-JS approach
- Reference same brand assets (images, URLs)

**3. Could color schemes differentiate email types?**
- **Yes** - Extend `ColorSchemes` with new palettes:
  ```javascript
  ColorSchemes: {
    yellow: { ... },  // Booking confirmations (existing)
    blue: {           // Inquiry responses (new)
      bgColourHeader: "#2196F3",
      bgColourMain: "#E3F2FD",
      bgColourSignature: "#BBDEFB",
      bgColourFooter: "#E3F2FD",
      textColourMain: "#0D47A1"
    },
    green: {          // Availability confirmations (new)
      bgColourHeader: "#4CAF50",
      bgColourMain: "#E8F5E9",
      ...
    }
  }
  ActivityColors: {
    1: "yellow",      // Booking confirmation
    2: "blue",        // Inquiry response (new)
    3: "green"        // Availability confirmation (new)
  }
  ```
- Visual differentiation helps guests identify email type at a glance
- Maintains brand cohesion while providing context

**4. Should AVIF fallback pattern be used in autodraft emails?**
- **Yes** - Use `getAvifFallbackImage()` for all images
- Benefits:
  - Smaller file sizes (AVIF is ~50% smaller than PNG)
  - Faster email load times
  - Graceful degradation for older email clients
- Already tested and working in booking confirmation emails

### Architecture Question

**Should autodraft extend GAS or use Cloudflare Workers?**

| Approach | Pros | Cons |
|----------|------|------|
| Extend GAS | Already integrated with Gmail, proven patterns, single codebase, reuse EmailsConfig directly | GAS execution limits, harder to version control, no Claude SDK |
| Cloudflare Worker | Modern stack, TypeScript, better monitoring, Claude SDK | Separate system, need Gmail OAuth, more infrastructure |
| Hybrid | GAS for Gmail access + email gen, Worker for LLM calls | Complexity, two systems to maintain |

**Updated Recommendation:**
With `EmailsConfig` now captured, the **Hybrid approach** becomes more attractive:
- GAS handles Gmail monitoring, email generation (reusing `EmailsConfig`), and draft creation
- Cloudflare Worker handles LLM classification and response generation via Claude API
- GAS calls Worker via `UrlFetchApp.fetch()` for Claude processing
- This preserves proven email patterns while adding modern LLM capabilities
