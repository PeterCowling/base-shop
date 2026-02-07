---
Type: Idea
ID: BRIK-OPP-0003
Business: BRIK
Owner: Pete
Status: Historical
Card-ID: BRIK-ENG-0020
Created-Date: 2026-02-01
Last-Updated: 2026-02-01
Last-updated: 2026-02-05
---

# Email Autodraft Response System for Customer Inquiries

## Summary
Automate email response generation for Brikette customer inquiries by integrating with Gmail API to provide intelligent draft responses that include links to website resources, pricing information, and availability details. The system should encourage customers to complete bookings through the website or Prime app rather than via email.

## Opportunity
Brikette receives customer inquiries via email about accommodations, pricing, availability, guide bookings, and general information. Currently, Pete manually responds to each inquiry, which is time-consuming and doesn't scale. Many inquiries ask questions that are already answered on the website or could be handled through the online booking system.

Automated draft generation would:
- Reduce response time from hours to minutes
- Ensure consistent, accurate information in all responses
- Free up Pete's time for high-value customer interactions
- Drive customers to self-service booking (higher conversion, lower manual work)
- Reduce errors from manual information lookup

Estimated impact:
- 60-80% of inquiries can be handled with templated responses
- Response time improvement: hours → minutes (auto-draft available immediately)
- Customer satisfaction improvement through faster, accurate responses
- Potential to reduce manual email time by 50%+

## Proposed Approach

### Phase 1: Auto-draft Generation (MVP)
1. **Gmail Integration**
   - Use Gmail API to monitor inbox for customer inquiries
   - Classify emails using AI (booking inquiry, pricing question, general info, etc.)
   - Generate contextual draft responses for all customer inquiries

2. **Knowledge Base**
   - Index website content (guides, pricing pages, FAQ)
   - Track current availability (integration with booking system or manual updates)
   - Store standard response templates for common inquiries
   - Include links to relevant website pages and Prime app

3. **Draft Response Logic**
   - Parse inquiry to identify: question type, dates (if mentioned), property/service interest
   - Generate response with:
     - Direct answer to question with current information
     - Links to website pages for detailed info
     - Call-to-action to book via website/Prime app (not email)
     - Pricing and availability if requested (with caveat to check website for real-time updates)
   - Pete reviews and sends (or edits) each draft

4. **UI/Workflow**
   - Drafts appear in Gmail as standard Gmail drafts
   - Optional: dashboard showing pending drafts for review
   - Pete can edit, approve, or reject each draft before sending

### Phase 2: Enhanced Intelligence (Future)
- Learn from Pete's edits to improve draft quality
- Detect urgency and prioritize certain inquiries
- Auto-populate booking holds for Pete to approve
- Multi-language support for non-English inquiries

## Success Criteria
- System successfully generates drafts for ≥80% of customer inquiries
- Draft accuracy: ≥90% of drafts require minimal/no edits
- Response time: drafts available within 5 minutes of email receipt
- Conversion: increased website booking rate (measure before/after)
- Time savings: Pete spends ≤50% of current time on email responses

## Assumptions
- Gmail API access is feasible (not blocked by Google workspace policies)
- Website content is structured enough to be indexed/searchable
- Current booking system can provide availability data (or manual updates are acceptable for MVP)
- Most inquiries follow common patterns (not highly unique/complex)
- Customers are willing to self-service book when directed to website

## Dependencies
- Website content must be up-to-date and accurate
- Booking system integration for real-time availability (or manual sync process)
- Gmail workspace account with API access enabled

## Risks
- Google may rate-limit or restrict API usage
- Draft quality may be poor initially (requires training/tuning)
- Customers may ignore website links and expect email booking
- Legal/compliance: must ensure auto-generated content is accurate and doesn't create binding commitments

## Next Steps
1. Move to Fact-finding: validate Gmail API access and explore implementation options
2. Audit common inquiry types (sample 50-100 recent emails to identify patterns)
3. Prototype simple draft generation for 1-2 common inquiry types
4. Measure baseline: current email volume, response time, time spent on email
