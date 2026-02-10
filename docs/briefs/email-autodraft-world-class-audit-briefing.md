---
Type: Briefing
Outcome: Understanding
Status: Active
Domain: Automation
Created: 2026-02-10
Last-updated: 2026-02-10
Topic-Slug: email-autodraft-world-class-audit
---

# Email Autodraft World-Class Audit Briefing

## Executive Summary
The current email autodraft system is a deterministic template selector/assembler with a branded HTML wrapper, not a true world-class response engine. It can produce usable drafts for simple FAQs, but it has material weaknesses for high-stakes policy conversations (refunds, non-refundable disputes, payment edge cases), uneven architecture boundaries (MCP + Google Apps Script split), and weak quality controls that measure token/format checks more than communication quality.

The core gap: system behavior is mostly rule matching and template splicing, while your target requires context-aware composition, policy-safe reasoning, and quality evaluation against brand/legal standards.

## Questions Answered
- Q1: Where are the biggest quality limits in the current pipeline?
- Q2: Is Google Apps Script still a structural dependency/risk?
- Q3: Why are policy/refund messages still mediocre?
- Q4: What concrete architecture can remove GAS and raise quality several levels?

## High-Level Architecture
- Pipeline tools:
  - `packages/mcp-server/src/tools/draft-interpret.ts` — heuristic parsing and category detection.
  - `packages/mcp-server/src/tools/draft-generate.ts` — template ranking + static composition.
  - `packages/mcp-server/src/tools/draft-quality-check.ts` — rule-based gate.
- Gmail ops:
  - `packages/mcp-server/src/tools/gmail.ts` and `packages/mcp-server/src/clients/gmail.ts`.
- Style/content assets:
  - `packages/mcp-server/data/email-templates.json`
  - `packages/mcp-server/data/draft-guide.json`
  - `packages/mcp-server/data/voice-examples.json`
- Reception/GAS integration:
  - `apps/reception/src/services/useBookingEmail.ts`
  - `apps/reception/src/services/useEmailGuest.ts`
  - `apps/brikette-scripts/src/email-monitor/Code.gs`

## End-to-End Flow
### Primary flow (today)
1. `gmail_list_pending` returns labeled queue from Gmail (`packages/mcp-server/src/tools/gmail.ts:440`).
2. `gmail_get_email` fetches email and applies Processing label lock (`packages/mcp-server/src/tools/gmail.ts:555`).
3. `draft_interpret` does regex/heuristic classification (`packages/mcp-server/src/tools/draft-interpret.ts:397`).
4. `draft_generate` picks template(s), assembles body, wraps HTML (`packages/mcp-server/src/tools/draft-generate.ts:223`).
5. `draft_quality_check` performs rule checks (`packages/mcp-server/src/tools/draft-quality-check.ts:211`).
6. `gmail_create_draft` writes draft and labels (`packages/mcp-server/src/tools/gmail.ts:666`).

### Alternate/legacy paths
- Reception still has GAS fallback for booking emails when env flag is not true (`apps/reception/src/services/useBookingEmail.ts:120`, `apps/reception/src/services/useBookingEmail.ts:142`).
- Guest email hook still calls GAS web app directly (`apps/reception/src/services/useEmailGuest.ts:35`).
- Inbox triage/labeling still depends on GAS monitor script (`apps/brikette-scripts/src/email-monitor/Code.gs:96`).

## Findings (Limitations and Insufficiencies)
### Critical
1. Deterministic template engine cannot deliver world-class policy communication
- `draft_generate` does not call an LLM or policy reasoner; it ranks templates and returns static text (`packages/mcp-server/src/tools/draft-generate.ts:221`, `packages/mcp-server/src/tools/draft-generate.ts:243`).
- For high-stakes emails, this produces fixed copy instead of context-aware messaging.

2. Hard-rule cancellation path can select the wrong template
- Hard-rule mode for `cancellation` bypasses semantic scoring and takes filtered templates in file order (`packages/mcp-server/src/utils/template-ranker.ts:87`, `packages/mcp-server/src/utils/template-ranker.ts:221`).
- `draft_generate` still takes `candidates[0]` even when selection is only `suggest` (`packages/mcp-server/src/tools/draft-generate.ts:231`).
- In the template file, "Cancellation of Non-Refundable Booking" precedes "No Show" (`packages/mcp-server/data/email-templates.json:68`, `packages/mcp-server/data/email-templates.json:73`), causing deterministic bias toward the first variant.

3. Reception email sending surface has an unsafe default path and weak guardrails
- GAS fallback remains in production code (`apps/reception/src/services/useBookingEmail.ts:142`).
- `useEmailGuest` is GAS-only when enabled (`apps/reception/src/services/useEmailGuest.ts:35`).
- API route forwarding to MCP send has no auth/rate-limit checks (`apps/reception/src/app/api/mcp/booking-email/route.ts:5`).

### High
4. Quality resources are loaded but not used for generation decisions
- `draft-guide` and `voice-examples` are read but ignored (`packages/mcp-server/src/tools/draft-generate.ts:259`).
- Knowledge resources are reduced to count summaries (`keys:X`/`items:X`) instead of content-grounded reasoning (`packages/mcp-server/src/tools/draft-generate.ts:129`).

5. Classification is too shallow for edge cases and mixed-intent policy emails
- Scenario detection is a short regex chain with only 5 categories (`packages/mcp-server/src/tools/draft-interpret.ts:406`).
- Agreement detection handles only narrow explicit patterns (`packages/mcp-server/src/tools/draft-interpret.ts:294`).
- Language detection is keyword-based and falls back to EN on any Latin text (`packages/mcp-server/src/tools/draft-interpret.ts:133`).

6. Template taxonomy is inconsistent across interpret, rank, and quality layers
- Template categories include many domain-specific labels (`packages/mcp-server/data/email-templates.json:3`).
- Interpret outputs only `faq|policy|payment|cancellation|general` (`packages/mcp-server/src/tools/draft-interpret.ts:406`).
- Quality gate calibration targets another category set (`packages/mcp-server/src/tools/draft-quality-check.ts:85`).
- Result: mismatched category semantics and unpredictable downstream behavior.

7. HTML/email rendering quality has structural issues
- Wrapper sets greeting and can include body templates that already start with "Dear...", creating duplicate greeting blocks.
  - Wrapper greeting: `packages/mcp-server/src/utils/email-template.ts:80`
  - Templates with own greeting: `packages/mcp-server/data/email-templates.json:68`
- CTA block injects table row markup inside content cell, invalid table nesting (`packages/mcp-server/src/utils/email-template.ts:84`, `packages/mcp-server/src/utils/email-template.ts:145`).
- Branding links/assets rely on Google Drive and one plain-HTTP URL (`packages/mcp-server/src/utils/email-template.ts:10`, `packages/mcp-server/src/utils/email-template.ts:17`).

### Medium
8. Queue/lock behavior is fragile under restart or multi-session operation
- Processing lock is partly in-memory (`packages/mcp-server/src/tools/gmail.ts:72`).
- Stale lock fallback uses message `internalDate`, not lock-label timestamp (`packages/mcp-server/src/tools/gmail.ts:420`), which can unlock old emails prematurely after restart.

9. Gmail list operations are N+1 and quota-inefficient at scale
- `gmail_list_pending` fetches thread and message metadata per email in sequence (`packages/mcp-server/src/tools/gmail.ts:464`).

10. Knowledge resources have drift risk due hardcoded data snapshots
- Rooms and menu data are hardcoded with explicit TODOs about sync (`packages/mcp-server/src/resources/brikette-knowledge.ts:116`, `packages/mcp-server/src/resources/brikette-knowledge.ts:170`).

11. Test harness reliability and quality assertions are misaligned
- Monorepo Jest can fail due duplicate module resolution from build artifacts (`pnpm exec jest --runTestsByPath ...` error with `.open-next` package shadow).
- Package-level targeted test script is missing in `@acme/mcp-server` (`packages/mcp-server/package.json:25`).
- Existing tests validate structure/rules more than output quality/effectiveness for production-like drafts (`packages/mcp-server/src/__tests__/draft-generate.test.ts:97`, `packages/mcp-server/src/__tests__/voice-examples.test.ts:27`).

## Evidence Snapshots (Dry Runs)
- Cancellation/refund sample produced a long static template with duplicate greeting and a promotional booking CTA; quality gate still passed.
- No-show sample selected "Cancellation of Non-Refundable Booking" as top template (first in ordered cancellation candidates), not "No Show".
- Multi-question sample generated composite output with duplicated luggage content and failed `unanswered_questions` for missing breakfast answer.

## Configuration, Flags, and Operational Controls
- Reception MCP path is feature-flagged by `NEXT_PUBLIC_MCP_BOOKING_EMAIL_ENABLED` (`apps/reception/src/utils/emailConstants.ts:8`), defaulting to GAS fallback when not true.
- GAS monitor script runs every 30 minutes (`apps/brikette-scripts/src/email-monitor/Code.gs:259`).

## Error Handling and Failure Modes
- Quality failures are surfaced but not enforced as blocking; draft can still proceed.
- Policy-sensitive messages can be "technically valid" while communication quality/legal clarity remains inadequate.
- External dependencies (GAS web apps + Drive-hosted assets) increase runtime and deliverability uncertainty.

## If You Later Want to Change This (Non-plan)
### Likely change points
- Replace template-only `draft_generate` with policy-aware composition architecture.
- Remove GAS fallback paths in reception and unify on authenticated MCP/API path.
- Replace GAS monitor with Gmail API watcher/poller service in Node runtime.

### Key risks to manage
- Legal/policy tone drift on non-refundable/refund disputes.
- Regression in label-state workflow during migration off GAS monitor.
- Security hardening required for booking email API route before broader rollout.

### Recommended strategic direction
1. Single-runtime architecture (Node/MCP) for queueing, classification, drafting, and sending.
2. Policy decision engine for high-stakes categories (refund/prepayment/cancellation) before language generation.
3. Retrieval + constrained generation + evaluator loop (instead of static template splicing).
4. Strong quality rubric with measurable acceptance goals per scenario and red-team cases.
