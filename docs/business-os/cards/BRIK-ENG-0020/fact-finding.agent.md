---
Type: Stage-Doc
Card-ID: BRIK-ENG-0020
Stage: Fact-finding
Created: 2026-02-01
Owner: Pete
Status: Active
Last-updated: 2026-02-05
---

# Fact-Finding: Email Autodraft Response System

## Questions to Answer

### 1. Gmail API Access & Technical Feasibility
**Question:** Can we integrate with Gmail API to monitor inbox and create draft responses?

**Method:** ~~Gmail API~~ → **Google Apps Script** (approach revised based on existing infrastructure)

**Evidence type:** repo-diff

**Target date:** 2026-02-01

**Findings:** ✅ **RESOLVED**
- **Technical approach changed:** Use Google Apps Script instead of Gmail API
- **Existing infrastructure found:** 4 Apps Script deployments already in use for Brikette
- **Script deployment IDs discovered in `apps/reception/`:**
  - Booking Email: `AKfycbz236VUyVFKEKkJF8QaiL_h9y75XuwWsl82-xfWepZwv1-gBroOr5S4t_og4Fvl4caW`
  - Guest Email: `AKfycbzEPvmqFeK1wW8VAid-cs6dhlQ49QDDOQR48whSU_jRQkbTQiNN38yjZSUVu9gYvlIx`
  - Alloggiati: `AKfycbxemYj6vv2k8qDyF3QieAfCujnlUeHMMKriYV8lkhLiHVvb7FnjTpwRTtF-Uo9-VT9UVQ`
  - Statistics: `AKfycbwzKYZ0FxoAgSlt98OruRKSaW8OAe4Ug3e1VZ2YGEttgWrRZyAWX8VRHG3Abf_OrXGM`
- **Call patterns:** HTTP GET with query params, JSONP for structured responses
- **Validation pattern:** Zod schemas for type-safe response handling
- **Conclusion:** Technical feasibility confirmed - existing proven infrastructure

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
- Review Brikette website content structure in codebase
- Verify programmatic accessibility (JSON, TypeScript exports)

**Evidence type:** repo-diff

**Target date:** 2026-02-01

**Findings:** ✅ **RESOLVED**
- **FAQ content:** `apps/brikette/src/locales/en/faq.json` - 29 items, structured Q&A format
- **Room details:** `apps/brikette/src/locales/en/rooms.json` - Room amenities and descriptions
- **Menu pricing:** `apps/brikette/src/data/menuPricing.ts` - Bar and breakfast menu with prices
- **Travel guides:** `apps/brikette/src/locales/en/guides/` - 12+ structured guide files
- **Room config:** `apps/brikette/src/config/rooms.ts` - Room configuration
- **Hotel config:** `apps/brikette/src/config/hotel.ts` - Hotel settings
- **All content is programmatically accessible** as JSON/TypeScript exports
- **Multi-language support** exists (17 locales) via translation infrastructure
- **Conclusion:** Content is well-structured and sufficient for knowledge base

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

**Target date:** TBD (deferred to INVESTIGATE task)

**Findings:** **DEFERRED TO PLANNING PHASE** (2026-02-01)
- **Decision:** Fast-track to planning with INVESTIGATE task for baseline collection
- **Rationale:** Business case is strong based on qualitative assessment; metrics can be collected in parallel with initial development
- **Action:** Plan will include INVESTIGATE task to validate assumptions before heavy investment

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

**Target date:** 2026-02-01

**Findings:** ✅ **RESOLVED** (2026-02-01)
- **Decision:** Pete accepts Anthropic DPA as sufficient GDPR coverage
- **Rationale:**
  - Existing Claude integration already processes content via Anthropic API
  - Anthropic's Data Processing Agreement includes standard data protection provisions
  - Email drafts reviewed by human (Pete) before sending - no automated decision-making
  - No personal data retention beyond draft creation (drafts stored in Gmail, not external)
- **Binding offers:** Not a concern - Pete reviews all drafts before sending
- **Data retention:** Drafts stored in Gmail (Pete's control), processing is transient

---

### 6. Email Branding & Template Infrastructure
**Question:** What email branding/styling infrastructure exists that can be reused?

**Method:** Analyze `_EmailsConfig.gs` from booking monitor scripts

**Evidence type:** repo-diff

**Target date:** 2026-02-01

**Findings:** **CAPTURED** (2026-02-01)
- **Professional email template system** with modular components:
  - Header generator with branded hostel logo
  - Dual-owner signature block (Cristiana + Peter handwritten signatures)
  - Footer with terms/conditions link and social media icons
- **Color scheme system** (extensible):
  - Currently: `yellow` scheme for booking confirmations (amber/gold palette)
  - Pattern supports multiple schemes: `ColorSchemes["blue"]`, etc.
  - Activity-to-color mapping: `ActivityColors[1] = "yellow"`
- **AVIF image optimization**:
  - All images have PNG + AVIF versions
  - `getAvifFallbackImage()` helper generates `<picture>` elements
  - Modern format support with graceful degradation
- **Brand assets centralized**:
  - Hostel website, Instagram, TikTok URLs
  - Terms and conditions link (Google Doc)
  - Owner signature images
  - Social media icons
- **CSS-in-JS approach**:
  - `getStyles(colors)` returns 25+ named style strings
  - Mobile-responsive (max-width: 600px container)
  - Inline styles for email client compatibility

**Implications for autodraft:**
- Reuse `EmailsConfig` directly - no need to recreate branding
- Color schemes can differentiate email types:
  - Yellow = booking confirmations (existing)
  - Blue = inquiry responses (new)
  - Green = availability confirmations (new)
- AVIF fallback pattern should be used in new emails
- Signature block maintains professional/personal touch

---

## Summary of Findings

**Last Updated:** 2026-02-01 (6 of 6 questions resolved or deferred)

**Key Insights:**
- ✅ Technical feasibility confirmed via existing Google Apps Script infrastructure
- ✅ Website content is comprehensive and programmatically accessible
- ✅ GDPR position resolved - Anthropic DPA accepted as sufficient coverage
- ✅ Customer inquiry patterns - will validate via INVESTIGATE task
- ✅ Baseline metrics - deferred to INVESTIGATE task (can run in parallel)
- ✅ Email branding infrastructure captured - `EmailsConfig` provides complete template system

**Risks Identified:**
- **Security risk:** Hardcoded script URLs flagged in security audit - should move to env vars
- **Scope risk:** If inquiry patterns are too unique, templating ROI may be low (mitigated by INVESTIGATE task)

**Go/No-Go Recommendation:**
- **GO** - Technical foundation is strong (existing scripts, proven patterns)
- **All blockers resolved or deferred** - Fast-track approved
- **Proceeding to `/plan-feature`** with INVESTIGATE task for baseline validation

---

## Transition Decision

**Next Lane:** Ready-for-planning (approved 2026-02-01)

**Rationale:**
- ✅ Technical feasibility confirmed (Google Apps Script, not Gmail API)
- ✅ Website content is sufficient and programmatically accessible
- ✅ GDPR position resolved - Anthropic DPA accepted as sufficient
- ✅ Inquiry patterns - INVESTIGATE task in plan
- ✅ Baseline metrics - INVESTIGATE task in plan

**Fast-track approved (Option B):**
1. ✅ GDPR decision made: Anthropic DPA accepted as sufficient
2. ✅ Plan will include INVESTIGATE tasks for:
   - Email volume/pattern validation (can run in parallel with build)
   - Baseline metrics collection
3. ✅ Proceeding to `/plan-feature` after script source code analysis

**Script source code analysis complete:**
- All 5 booking monitor files now captured in `apps/brikette-scripts/src/booking-monitor/`
- See `apps/brikette-scripts/docs/booking-monitor-architecture.md` for full analysis
- Ready to proceed to `/plan-feature`

**Exit criteria (if discovered during planning):**
- INVESTIGATE shows <40% of inquiries can be templated
- Baseline metrics show insufficient volume to justify investment

---

### 7. Claude Interface & Architecture Decisions
**Question:** What Claude interface and architecture pattern should we use?

**Method:** Design consultation with Pete to choose between:
- Claude interface options: Claude Desktop (MCP), Claude Code (CLI), Claude web
- Architecture patterns: File-based sync vs MCP tools

**Evidence type:** decision

**Target date:** 2026-02-01

**Findings:** ✅ **RESOLVED** (2026-02-01)

**Pete's Decisions:**
1. **Primary interface:** Claude Code (CLI)
2. **Workflow type:** Human-initiated (1-2x daily batch processing acceptable)
3. **MCP server:** Comfortable running locally

**Architecture Pattern Selected:** Pattern B (Claude Code + MCP Tools)

**Rationale for Pattern B:**
- Extends existing MCP server infrastructure (`packages/mcp-server/`)
- Real-time feedback during email processing (vs file sync delays)
- Natural error handling inline with conversation
- One system to maintain (vs file-based requiring GAS + file watching)
- Future-compatible with Claude Desktop if Pete wants to switch

**Implementation Approach:**
- Gmail API accessed via MCP tools (list pending, get details, create draft, mark processed)
- Knowledge base exposed as MCP resources (FAQ, rooms, pricing, policies)
- Custom `/process-emails` skill for guided workflow
- Human-in-loop maintained: Pete reviews all drafts before sending

**Workflow Design:** See `docs/plans/email-autodraft-workflow-design.md`

---

## Updated Summary

**Last Updated:** 2026-02-01 (7 of 7 questions resolved)

All architectural decisions are now complete. Ready for `/plan-feature`.
