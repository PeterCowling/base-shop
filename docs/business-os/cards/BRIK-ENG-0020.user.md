---
Type: Card
Status: Active
Lane: Planned
Priority: P2
Owner: Pete
ID: BRIK-ENG-0020
Title: Email Autodraft Response System
Business: BRIK
Tags: [email, automation, AI, customer-service, claude-code, mcp]
Created: 2026-02-01
Updated: 2026-02-02
Plan-Created: 2026-02-02
Plan-Confidence: 82%
Plan-Link: docs/plans/email-autodraft-consolidation-plan.md
Last-Progress: 2026-02-02
Architecture-Decision: Claude Code + MCP Tools (Pattern B)
Workflow-Design: docs/plans/email-autodraft-workflow-design.md
Consolidation-Plan: docs/plans/email-autodraft-consolidation-plan.md
Consolidation-Fact-Find: docs/plans/email-autodraft-consolidation-fact-find.md
---

# Email Autodraft Response System

## Description
Build an email response drafting system using **Claude Code** with **MCP tools** to generate intelligent draft responses for Brikette customer inquiries. Pete runs `/process-emails` in Claude Code, which uses MCP tools to fetch pending emails, access the knowledge base, and create drafts in Gmail.

**Architecture Decision (2026-02-01):** Claude Code + MCP Tools (Pattern B)
- Primary interface: Claude Code (CLI)
- Workflow: Human-initiated (1-2x daily batch processing)
- Integration: MCP server with Gmail tools + knowledge base resources
- Human-in-loop: Pete reviews all drafts before sending

**Workflow Design:** See `docs/plans/email-autodraft-workflow-design.md`

## Value
- **Zero AI costs:** Uses existing Claude Max subscription (no per-request API charges)
- **Faster responses:** Reduce response time from hours to minutes
- **Time savings:** Reduce Pete's email workload by 50%+, free time for high-value work
- **Consistency:** Ensure accurate, professional responses across all customer inquiries
- **Drive conversions:** Direct customers to website self-service booking (higher conversion)
- **Quality control:** Pete initiates and reviews every draft (human-in-loop)

Estimated impact: 60-80% of inquiries can be handled with high-quality auto-drafts, requiring minimal or no manual editing.

## Scope

**In scope (MVP):**
- MCP Server Gmail tools (`gmail_list_pending`, `gmail_get_email`, `gmail_create_draft`, `gmail_mark_processed`)
- MCP resources for knowledge base (FAQ, rooms, pricing, policies)
- `/process-emails` skill for guided workflow in Claude Code
- GAS script for email monitoring and label management
- Pete initiates sessions and reviews all drafts before sending

**Out of scope (future phases):**
- Auto-send capability
- Fully automated monitoring (currently human-initiated)
- Direct booking creation or holds
- Multi-language draft generation
- Learning from Pete's edits to improve drafts

## Fact-finding Summary

**Brief:** `docs/business-os/cards/BRIK-ENG-0020/fact-finding.user.md`
**Workflow Design:** `docs/plans/email-autodraft-workflow-design.md`

**Technical Approach:** Claude Code + MCP Tools (Pattern B)
- **Primary interface:** Claude Code (CLI) with `/process-emails` skill
- **Integration:** MCP server extended with Gmail tools
- **Knowledge base:** Exposed as MCP resources (FAQ, rooms, pricing, policies)
- **Human-in-loop:** Pete initiates sessions and reviews all drafts

**Architecture Decision (2026-02-01):**
- Pattern B chosen over Pattern A (file-based) because:
  - Extends existing MCP server infrastructure (12+ tool modules)
  - Real-time feedback during email processing
  - Single system to maintain
  - Future-compatible with Claude Desktop

**Key Findings:**
- ✅ **MCP server infrastructure** exists with established patterns
- ✅ Website content well-structured (29 FAQ items, room details, menu pricing, guides)
- ✅ GAS infrastructure exists for Gmail operations
- ✅ Email branding system (`EmailsConfig`) available for reuse

**All Questions Resolved:**
1. ✅ GDPR compliance - Anthropic DPA accepted
2. ✅ Baseline metrics - INVESTIGATE task in plan
3. ✅ **Claude interface:** Claude Code (CLI)
4. ✅ **Workflow type:** Human-initiated (1-2x daily)
5. ✅ **MCP server:** Comfortable running locally

**Status:** Ready-for-planning (all decisions complete)

**Key Infrastructure:**
- `packages/mcp-server/` - Existing MCP server with 12+ tool modules (to be extended)
- `apps/brikette/src/locales/en/faq.json` - FAQ knowledge base (29 items)
- `apps/brikette/src/data/menuPricing.ts` - Pricing data
- `apps/brikette/src/config/rooms.ts` - Room configuration

## Next Steps

**Consolidation Plan (2026-02-02):** Comprehensive world-class email autodraft system.

1. ✅ ~~Move to Fact-finding lane~~
2. ✅ ~~Revise fact-find with Google Apps Script approach~~
3. ✅ ~~Make GDPR decision~~ - Anthropic DPA accepted (2026-02-01)
4. ✅ ~~Architecture pivot~~ - Claude Code + MCP Tools (2026-02-01)
5. ✅ ~~Interface decision~~ - Claude Code selected (2026-02-01)
6. ✅ ~~Workflow design~~ - Complete (see `docs/plans/email-autodraft-workflow-design.md`)
7. ✅ ~~Consolidation fact-find~~ - Complete (see `docs/plans/email-autodraft-consolidation-fact-find.md`)
8. ✅ ~~Consolidation plan~~ - Complete (see `docs/plans/email-autodraft-consolidation-plan.md`)
9. **NEXT:** Start with TASK-00 (baseline measurement) - blocks all implementation
10. **All 19 tasks now ≥80%** — Re-plan completed 2026-02-02, raising 8 tasks above threshold

**Consolidation Plan (2026-02-02):**
- 19 tasks across 9 phases
- Three-stage pipeline: Interpretation → Composition → Quality Gate
- Professional email formatting from GAS
- Agreement detection with 0% false positive tolerance
- Overall confidence: 82% (raised from 74% via re-plan)
