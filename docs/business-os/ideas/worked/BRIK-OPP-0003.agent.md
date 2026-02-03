---
Type: Idea
ID: BRIK-OPP-0003
Business: BRIK
Owner: Pete
Status: Worked
Card-ID: BRIK-ENG-0020
Created-Date: 2026-02-01
Last-Updated: 2026-02-01
---

## Idea: Email Autodraft Response System for Customer Inquiries

**Business Context:**
- Product: Brikette (accommodation booking, guide services)
- Current state: Manual email responses for all customer inquiries
- Pain point: Time-consuming, doesn't scale, many repetitive questions
- Customer journey gap: Customers email instead of using website self-service

**Value Proposition:**
- Reduce email response time: hours → minutes (auto-draft immediately available)
- Scale customer support without additional headcount
- Reduce Pete's email workload by 50%+ (free time for high-value work)
- Drive customers to website booking (higher conversion, less manual work)
- Ensure consistent, accurate information across all responses

**Technical Approach:**

1. **Gmail Integration (Gmail API)**
   - Monitor inbox via Gmail API webhooks or polling
   - Create draft responses programmatically using Gmail API
   - Preserve Gmail native workflow (Pete reviews in normal Gmail interface)

2. **AI Classification + Generation**
   - LLM-based email classification: booking inquiry, pricing, availability, general info, support issue
   - Context assembly:
     - Email content + thread history
     - Relevant website content (RAG/vector search on Brikette guides, pricing pages)
     - Current availability data (if available)
     - Standard response templates
   - Generate contextual draft with:
     - Direct answer to question
     - Links to website pages (not app deep links, website is public)
     - CTA: "Book online at [link]" or "Check real-time availability at [link]"
     - Pricing info if requested (with caveat to check website)

3. **Knowledge Base**
   - Index: `apps/brikette/src/locales/en/guides/**/*.json` (guide content)
   - Index: pricing pages, FAQ pages (scrape or manual entry for MVP)
   - Availability: manual input or basic integration with booking system
   - Response templates: store in database or config file

4. **Data Model**
   - Store email metadata: Gmail message ID, classification, draft generated timestamp
   - Track draft acceptance rate (sent without edits vs. edited vs. discarded)
   - Store Pete's edits for future learning (Phase 2)

5. **Integration Points**
   - Gmail API: Node SDK (`googleapis` npm package)
   - LLM: Claude API (use platform-core auth utilities)
   - Vector search: Consider Cloudflare Vectorize or simple text matching for MVP
   - Deploy: Cloudflare Worker or serverless function (cron or webhook triggered)

**Evidence Needed (Fact-finding phase):**

1. **Gmail API feasibility**
   - Method: Test Gmail API access with Pete's workspace account
   - Evidence type: repo-diff (prototype code) + measurement (API limits)
   - Questions: Can we access inbox? Create drafts? Set up webhooks?

2. **Inquiry pattern audit**
   - Method: Sample 50-100 recent customer emails, categorize by type
   - Evidence type: customer-input (email data)
   - Questions: What are most common inquiry types? Can we template 80%?

3. **Website content readiness**
   - Method: Audit Brikette website for completeness (pricing, availability, FAQ)
   - Evidence type: repo-diff (scan existing content)
   - Questions: Is website content sufficient to answer common questions? What's missing?

4. **Baseline measurement**
   - Method: Track email volume, response time, time spent on email (1 week sample)
   - Evidence type: measurement
   - Questions: How many emails/day? Current avg response time? Time cost?

5. **Legal/compliance check**
   - Method: Review auto-generated content liability (are drafts binding offers?)
   - Evidence type: legal
   - Questions: Any legal risk with AI-generated drafts? Need disclaimers?

**Dependencies:**
- Gmail workspace with API access (likely already available)
- Website content must be accurate and up-to-date (manual process for now)
- LLM API access (platform already uses Claude API)
- No blocking technical dependencies

**Risks:**
- **Gmail API limits:** Google may rate-limit or restrict API usage
  - Mitigation: Start with low volume, monitor limits, implement exponential backoff
- **Draft quality:** AI may generate inaccurate or inappropriate responses
  - Mitigation: Pete reviews all drafts (MVP is draft-only, not auto-send)
- **Customer resistance:** Customers may ignore website links and expect email booking
  - Mitigation: Measure booking conversion before/after, adjust messaging
- **Content staleness:** Website info becomes outdated, drafts provide wrong info
  - Mitigation: Add "verify on website" disclaimer, implement content freshness checks
- **Privacy/compliance:** Email data handling, AI processing of customer info
  - Mitigation: Legal review, ensure GDPR compliance, add privacy disclaimers

**Success Metrics:**
- Draft generation rate: ≥80% of customer inquiries receive auto-draft
- Draft quality: ≥90% sent without edits (low edit rate = high quality)
- Response time: drafts available within 5 minutes of email receipt
- Time savings: Pete's email workload reduced by ≥50%
- Conversion: website booking rate increases (measure before/after)
- Customer satisfaction: response time satisfaction improves (survey or proxy metric)

**Phase Boundary:**
- MVP (Phase 1): Auto-draft generation only, Pete reviews/sends all drafts
- Phase 2: Learning from edits, auto-prioritization, multi-language, booking holds
- Out of scope for MVP: Auto-send (too risky), booking creation, payment processing

**Implementation Notes:**
- Prefer simple approach for MVP: polling Gmail API every 5 minutes vs. webhooks
- Use existing Claude API integration from `packages/platform-core/src/ai/`
- Store templates and knowledge base in JSON files (no database needed for MVP)
- Deploy as Cloudflare Worker (aligns with existing platform infra)
- Monitor costs: Gmail API calls, LLM API calls (estimate $X per draft)

**Alignment with Business Goals:**
- Operational efficiency: reduce manual workload, scale support
- Customer experience: faster responses, drive self-service
- Revenue: more website bookings (higher conversion than email back-and-forth)
- Brand: consistent, professional communication
