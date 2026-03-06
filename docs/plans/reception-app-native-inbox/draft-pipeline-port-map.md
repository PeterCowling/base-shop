---
Type: Investigation
Status: Complete
Domain: Platform
Created: 2026-03-06
Last-reviewed: 2026-03-06
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-app-native-inbox
Task: TASK-10
---

# Draft Pipeline Port Map

## Purpose

Define the exact extraction boundary for `TASK-09` so reception can run the Brikette draft pipeline without a runtime dependency on `packages/mcp-server`.

## Outcome

`TASK-09` is viable, but it is not a "copy three tool files" job. The safe cut is:

- extract deterministic core logic into reception-local modules;
- copy a small, explicit data pack into `apps/reception/data/`;
- replace MCP-only resource loaders with reception-local loaders over that data pack;
- drop JSONL / reviewed-ledger side effects from the request path;
- verify parity against a fixed fixture corpus before wiring sync/API/UI.

## Reception-Local Module Boundary

`TASK-09` should implement these reception-local modules:

- `apps/reception/src/lib/inbox/draft-pipeline.server.ts`
- `apps/reception/src/lib/inbox/draft-core/interpret.ts`
- `apps/reception/src/lib/inbox/draft-core/generate.ts`
- `apps/reception/src/lib/inbox/draft-core/quality-check.ts`
- `apps/reception/src/lib/inbox/draft-core/template-ranker.ts`
- `apps/reception/src/lib/inbox/draft-core/coverage.ts`
- `apps/reception/src/lib/inbox/draft-core/slot-resolver.ts`
- `apps/reception/src/lib/inbox/draft-core/email-template.ts`
- `apps/reception/src/lib/inbox/draft-core/email-signature.ts`
- `apps/reception/src/lib/inbox/draft-core/policy-decision.ts`
- `apps/reception/src/lib/inbox/draft-core/knowledge.server.ts`
- `apps/reception/src/lib/inbox/draft-core/draft-guide.server.ts`
- `apps/reception/src/lib/inbox/draft-core/voice-examples.server.ts`

## Dependency Inventory

| Source file | Dependency / seam | Kind | Reception decision | Reception target / note |
|---|---|---|---|---|
| `draft-interpret.ts` | deterministic interpret logic | core | `extract` | `draft-core/interpret.ts`; keep deterministic behavior, no MCP tool wrapper |
| `draft-generate.ts` | orchestration body | core | `extract` | `draft-core/generate.ts`; remove MCP tool I/O wrapper and internal side effects |
| `draft-quality-check.ts` | quality gate logic | core | `extract` | `draft-core/quality-check.ts`; return typed result, not MCP `jsonResult()` envelope |
| `draft-generate.ts` | `randomUUID` from Node crypto | runtime helper | `replace` | use Web Crypto `crypto.randomUUID()` or avoid ids where not needed |
| `draft-generate.ts`, `draft-quality-check.ts` | `fs/promises`, `fs`, `path` package-path reads | file I/O | `replace` | reception loaders read only from `apps/reception/data/**` |
| `draft-generate.ts`, `draft-quality-check.ts` | `zod` schemas | tool wrapper | `drop with rationale` | validate at API boundary if needed; core pipeline should accept typed inputs |
| `draft-generate.ts`, `draft-quality-check.ts` | `validation.ts` (`jsonResult`, `errorResult`, `formatError`) | MCP wrapper | `drop with rationale` | reception pipeline returns typed domain objects/errors |
| `draft-generate.ts`, `draft-quality-check.ts` | `coverage.ts` | helper import | `extract` | `draft-core/coverage.ts`; keep `@acme/lib` tokenizer dependency |
| `draft-generate.ts` | `slot-resolver.ts` | helper import | `extract` | `draft-core/slot-resolver.ts` |
| `draft-generate.ts` | `email-signature.ts` | helper import | `extract` | `draft-core/email-signature.ts` |
| `draft-generate.ts` | `email-template.ts` | helper import | `extract` | `draft-core/email-template.ts` |
| `draft-generate.ts`, `draft-quality-check.ts` | `template-ranker.ts` | helper import + data read | `extract` | `draft-core/template-ranker.ts`; point priors lookup at reception data |
| `draft-generate.ts`, `draft-quality-check.ts` | `policy-decision.ts` | helper import | `extract` | `draft-core/policy-decision.ts` |
| `draft-generate.ts` | `handleDraftQualityTool` | stage boundary | `replace` | `draft-pipeline.server.ts` calls `draft-core/quality-check.ts` directly |
| `draft-generate.ts` | `handleBriketteResourceRead` | resource loader | `replace` | `draft-core/knowledge.server.ts` over a reception knowledge snapshot |
| `draft-generate.ts` | `handleDraftGuideRead` | resource loader | `replace` | `draft-core/draft-guide.server.ts` reading copied JSON |
| `draft-generate.ts` | `handleVoiceExamplesRead` | resource loader | `replace` | `draft-core/voice-examples.server.ts` reading copied JSON |
| `draft-generate.ts` | `appendJsonlEvent`, `normalizeSignalCategory` | telemetry side effect | `drop with rationale` | no JSONL writes in Worker request path; route-level telemetry belongs in `TASK-08` |
| `draft-generate.ts` | `appendTelemetryEvent` from Gmail tool | telemetry side effect | `drop with rationale` | draft core must not depend on Gmail tool telemetry |
| `draft-generate.ts` | `hashQuestion`, `ingestUnknownAnswerEntries` | reviewed-ledger side effect | `drop with rationale` | reception must not mutate reviewed-ledger during draft generation |
| `draft-generate.ts` | `readActiveFaqPromotions` | reviewed-ledger data dependency | `replace` | merge promotions into build-time knowledge snapshot; no request-time JSONL reads |

## Data Pack Decisions

The reception port needs a committed or generated data pack under `apps/reception/data/`:

| Data asset | Current source | Decision | Rationale |
|---|---|---|---|
| `email-templates.json` | `packages/mcp-server/data/email-templates.json` | `copy` | hard requirement for generation and quality checks; current corpus is 180 templates across 20 categories |
| `draft-guide.json` | `packages/mcp-server/data/draft-guide.json` | `copy` | generation consults this guide directly |
| `voice-examples.json` | `packages/mcp-server/data/voice-examples.json` | `copy` | generation currently reads voice examples explicitly |
| `ranker-template-priors.json` | `packages/mcp-server/data/ranker-template-priors.json` | `copy` | ranker currently reads this file synchronously; current file is empty but the contract should stay parity-safe |
| `brikette-knowledge.snapshot.json` | derived from Brikette FAQ / rooms / pricing / policies plus active FAQ promotions | `replace` | one reception-local snapshot is safer than request-time reads from `apps/brikette/**` and reviewed-ledger JSONL |

## Runtime Rules For TASK-09

- No runtime reads from `packages/mcp-server/**`.
- No runtime reads from `apps/brikette/**`.
- No JSONL writes from the draft core.
- No reviewed-ledger mutations from the draft core.
- No Gmail API calls from the draft core.
- The only Worker file reads are reception-local static assets under `apps/reception/data/**`.

## Parity Fixture Corpus

`TASK-09` should save a minimum fixture corpus covering the highest-risk branches:

| Fixture ID | Class | Source reference | Why it stays in corpus |
|---|---|---|---|
| `SGL-01` | single-topic check-in FAQ | `packages/mcp-server/src/__tests__/draft-pipeline.integration.test.ts` | proves baseline FAQ ranking, knowledge injection, and HTML rendering |
| `SGL-04` | cancellation policy | `packages/mcp-server/src/__tests__/draft-pipeline.integration.test.ts` | proves policy gating, template constraints, and warning behavior |
| `MLT-01` | multi-topic breakfast + WiFi + check-in | `packages/mcp-server/src/__tests__/draft-pipeline.integration.test.ts` | proves per-question ranking and multi-answer composition |
| `PP-01` | prepayment workflow | `packages/mcp-server/src/__tests__/pipeline-integration.test.ts`, `packages/mcp-server/src/__tests__/fixtures/email/sample-action-plans.ts` | proves hard-rule category handling and workflow-specific template selection |
| `IT-01` | Italian inquiry | `packages/mcp-server/src/__tests__/pipeline-integration.test.ts` | proves language detection and non-English output path |

For each fixture, reception output must be compared against MCP output on:

- interpreted language
- dominant scenario category
- selected template category and subject
- answered-question set / coverage status
- quality result (`passed`, failed checks, warnings)
- presence of branded HTML output

Exact body text does not need byte-for-byte equality, but category choice, hard-rule behavior, and quality pass/fail outcome must match.

## TASK-09 Implications

`TASK-09` should update its execution scope to include:

- extracted helper modules for `coverage`, `slot-resolver`, and `email-signature`;
- reception-local loaders for `draft-guide`, `voice-examples`, and knowledge snapshot data;
- copied data files for templates, guide, voice examples, and ranker priors;
- a documented refresh path for the reception data pack from MCP source assets.

## Confidence Effect

This resolves the main scope ambiguity that kept `TASK-09` below the execution bar. The remaining work is still large, but it is now bounded and testable.
