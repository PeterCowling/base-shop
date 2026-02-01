---
Type: Stage-Doc
Card-ID: BRIK-ENG-0020
Stage: Fact-finding
Created: 2026-02-01
Owner: Pete
---

# Fact-Finding: Email Autodraft Response System

## Questions to Answer

### 1. Gmail API Access & Technical Feasibility
**Question:** Can we integrate with Gmail API to monitor inbox and create draft responses?

**Method:**
- Test Gmail API authentication with Pete's workspace account
- Build minimal prototype: read inbox, create a draft message
- Check API rate limits, quotas, and costs
- Evaluate webhook vs. polling approach

**Evidence type:** repo-diff + measurement

**Target date:** TBD

**Findings:**
_To be completed during Fact-finding phase_

---

### 2. Customer Inquiry Pattern Analysis
**Question:** What types of inquiries do customers send, and what % can be handled with templated responses?

**Method:**
- Sample 50-100 recent customer emails from Gmail
- Categorize by type: booking inquiry, pricing question, availability check, directions, general info, support issue, other
- Identify the 5-10 most common patterns
- Analyze what information is needed to answer each type (website links, pricing data, availability, etc.)
- Estimate what % of inquiries fit repeatable patterns

**Evidence type:** customer-input

**Target date:** TBD

**Findings:**
_To be completed during Fact-finding phase_

---

### 3. Website Content Readiness
**Question:** Does the Brikette website have sufficient content to answer common customer questions?

**Method:**
- Review Brikette website pages (guides, pricing, FAQ, booking flow)
- Cross-reference with common inquiry types from Pattern Analysis (#2)
- Identify gaps: what questions can't be answered with current website content?
- Check content structure: is it programmatically accessible (JSON, markdown)?
- Assess content freshness: how often do pricing/availability pages need updates?

**Evidence type:** repo-diff

**Target date:** TBD

**Findings:**
_To be completed during Fact-finding phase_

---

### 4. Baseline Email Metrics
**Question:** What is the current email volume, response time, and time cost?

**Method:**
- Track all customer inquiry emails for 1 week
- Measure:
  - Volume: # of customer inquiries per day
  - Response time: hours from receipt to Pete's reply sent
  - Time per email: minutes spent reading, researching, composing, sending
  - Total workload: hours per week on email responses
- Exclude spam, transactional emails, internal communications

**Evidence type:** measurement

**Target date:** TBD

**Findings:**
_To be completed during Fact-finding phase_

---

### 5. Legal & Privacy Compliance
**Question:** Are there legal or privacy risks with auto-generating email drafts using AI?

**Method:**
- Research or consult legal on:
  - Are AI-generated drafts considered binding offers? (likely no, since Pete reviews before sending)
  - GDPR compliance: can customer email content be processed by external LLM API (Claude)?
  - Data retention: how long to store email content and draft metadata?
  - Disclaimers: do auto-generated responses need specific disclosures?
- Review Gmail API terms of service for compliance requirements

**Evidence type:** legal

**Target date:** TBD

**Findings:**
_To be completed during Fact-finding phase_

---

## Summary of Findings

_To be completed after all questions are answered_

**Key Insights:**
- TBD

**Risks Identified:**
- TBD

**Go/No-Go Recommendation:**
- TBD

---

## Transition Decision

**Next Lane:** TBD

**Rationale:**
_To be completed based on findings_

**If → Planned:**
- Technical feasibility confirmed (Gmail API works, no blockers)
- Inquiry patterns show ≥60% can be templated
- Website content is sufficient or gaps are addressable
- Legal/privacy review shows no blockers
- Baseline metrics justify development investment

**If → Parked/Rejected:**
- Gmail API blocked or too expensive
- Inquiry patterns too unique/complex to template
- Legal/privacy risks too high
- Time savings don't justify development cost
