---
Type: Card
Status: Active
Lane: Inbox
Priority: P2
Owner: Pete
ID: BRIK-ENG-0020
Title: Email Autodraft Response System
Business: BRIK
Tags: [email, automation, AI, customer-service]
Created: 2026-02-01
Updated: 2026-02-01
---

## Card: BRIK-ENG-0020

**Linked Idea:** `docs/business-os/ideas/worked/BRIK-OPP-0003.user.md`

**Current Lane:** Inbox

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
