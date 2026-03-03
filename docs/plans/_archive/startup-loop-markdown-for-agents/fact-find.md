---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Infrastructure
Workstream: Engineering
Created: 2026-02-13
Last-updated: 2026-02-13
Last-reviewed: 2026-02-13
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-markdown-for-agents
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: /lp-do-build
Supporting-Skills: /lp-sequence, /lp-do-replan
Related-Plan: docs/plans/startup-loop-markdown-for-agents/plan.md
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID:
---

# Startup Loop Markdown for Agents Fact-Find Brief

## Scope
### Summary
Implement a startup-loop collector path that fetches source pages as clean markdown using Cloudflare Markdown for Agents, persists deterministic source artifacts, and feeds those artifacts into standing refresh workflows and wave-2 pack/provenance outputs.

### Goals
- Add normalized markdown source ingestion for standing refresh sources with provenance.
- Integrate with existing `refresh_status_get`/`refresh_enqueue_guarded` lifecycle instead of ad hoc fetch scripts.
- Keep wave-2 envelope standards (`schemaVersion`, freshness, quality, provenance).
- Preserve read-only default and no-PII policy.

### Non-goals
- Replacing S2 deep research prompts or automating strategic judgement end-to-end.
- Replacing existing `llms.txt` generation in customer apps.
- Shipping a non-Cloudflare web scraping stack first (only adapter seam).
- Enabling cross-app guarded writes in this slice.

### Constraints & Assumptions
- Constraints:
  - Cloudflare Markdown for Agents must be enabled per zone via Content Access Controls; only available for Cloudflare-proxied domains.
  - Existing startup-loop mutation boundaries remain (guarded writes only for queue/status transitions).
  - Artifacts must remain deterministic and replayable under `docs/business-os/startup-baselines/<BIZ>/runs/<runId>/...`.
  - `@acme/mcp-cloudflare` client currently assumes JSON-wrapped Cloudflare API responses; plain-text markdown endpoint needs a separate fetch path.
- Assumptions:
  - Standing refresh source lists can be modeled as per-business collector configs (market/channel/regulatory).
  - Initial implementation can focus on read and persist; summarization remains in the existing prompt-driven stage.
  - Fallback path for non-Cloudflare domains can be deferred behind an adapter interface (for example AI Gateway Browser Rendering + `ai.toMarkdown`).

## Evidence Audit (Current State)
### Entry Points
- `docs/business-os/startup-loop-workflow.user.md` - standing refresh is required and currently missing persisted artifacts.
- `docs/business-os/workflow-prompts/_templates/monthly-market-pulse-prompt.md` - requires source URLs and access dates, currently manual.
- `packages/mcp-server/src/tools/loop.ts` - existing refresh queue/status, pack builder, and wave-2 loop tools.
- `packages/mcp-server/src/lib/wave2-contracts.ts` - provenance/quality envelope contracts to reuse.
- `packages/mcp-cloudflare/src/client.ts` - Cloudflare client abstraction currently JSON-only.
- `packages/mcp-cloudflare/src/tools/analytics.ts` - existing Cloudflare adapter pattern for normalized metrics.

### Key Modules / Files
- `packages/mcp-server/src/tools/loop.ts`
  - Has `refresh_status_get` and `refresh_enqueue_guarded`; no source-fetch collector or markdown artifact contract.
  - `pack_weekly_s10_build` currently composes manifest + packet + metrics evidence only.
- `packages/mcp-server/src/lib/loop-artifact-reader.ts`
  - Resolves artifact roots and freshness envelopes; currently tracks manifest, metrics, and learning ledger only.
- `packages/mcp-server/src/lib/wave2-contracts.ts`
  - Defines `provenance.v1` and envelope fields required for new collector outputs.
- `packages/mcp-server/src/__tests__/startup-loop-tools.integration.test.ts`
  - Contains integration coverage for refresh lifecycle/anomaly/packet-pack paths; no markdown collector fixture coverage.
- `packages/mcp-cloudflare/src/client.ts`
  - `cfFetch` expects Cloudflare v4 JSON envelope (`success`, `result`), so it cannot consume raw markdown endpoint responses as-is.
- `packages/mcp-cloudflare/src/tools/analytics.ts`
  - Demonstrates adapter pattern and normalized record projection (`measure.record.v1`) that can be mirrored for content source contracts.
- `docs/business-os/startup-loop/loop-spec.yaml`
  - Stage graph includes standing refresh dependent stages (S2/S3/S10) and run packet contract.
- `docs/business-os/workflow-prompts/README.user.md`
  - Defines monthly/quarterly standing refresh prompt templates but no automated collector contract.
- `packages/seo/src/ai/buildLlmsTxt.ts`
  - Current outbound AI-discovery implementation is static `llms.txt` generation; no ingestion path.

### Patterns & Conventions Observed
- Startup-loop wave-2 tools are explicit, versioned, and policy-gated.
  - Evidence: `packages/mcp-server/src/tools/index.ts`, `packages/mcp-server/src/tools/loop.ts`, `scripts/src/startup-loop/mcp-preflight.ts`
- Refresh workflows use idempotent queue lifecycle with guarded transitions.
  - Evidence: `packages/mcp-server/src/tools/loop.ts` (`refresh_enqueue_guarded`)
- Deterministic artifacts and provenance are required for replayability.
  - Evidence: `packages/mcp-server/src/lib/wave2-contracts.ts`, `docs/business-os/startup-loop/manifest-schema.md`
- Standing refresh output exists as prompt templates, not automated artifacts.
  - Evidence: `docs/business-os/startup-loop-workflow.user.md` section "Standing Refresh Prompts (Periodic)"

### Data & Contracts
- Types/schemas:
  - `provenance.v1`, wave-2 envelope, and metric contracts in `packages/mcp-server/src/lib/wave2-contracts.ts`
  - Run/stage model in `docs/business-os/startup-loop/loop-spec.yaml`
- Persistence:
  - Current run artifacts: `baseline.manifest.json`, `metrics.jsonl`, run packets, packs, refresh queue/status files.
  - Missing today: persisted markdown source artifacts for standing refresh collectors.
- API/event contracts:
  - Existing Cloudflare adapter uses `cfFetch()` against `/client/v4` JSON APIs.
  - Existing loop refresh APIs expose queue status and guarded lifecycle, suitable as control plane for collector triggers.

### Dependency & Impact Map
- Upstream dependencies:
  - Cloudflare Markdown for Agents on target source domains.
  - Existing Cloudflare auth/config in `@acme/mcp-cloudflare` (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` where needed).
  - Startup-loop artifact directory conventions and wave-2 schema contracts.
- Downstream dependents:
  - S2 market intelligence refresh inputs.
  - S6B channel strategy refresh inputs.
  - S10 weekly pack evidence quality and freshness.
  - Future TASK-07 measurement-source coverage reporting in `mcp-startup-loop-data-plane-wave-2`.
- Likely blast radius:
  - `packages/mcp-cloudflare/src/client.ts` (new raw-text fetch helper or endpoint-specific client path)
  - `packages/mcp-cloudflare/src/tools/` (new content/markdown adapter tool(s))
  - `packages/mcp-server/src/tools/loop.ts` (collector read/persist surfaces)
  - `packages/mcp-server/src/__tests__/startup-loop-tools.integration.test.ts` (new fixtures and contract checks)
  - `docs/business-os/workflow-prompts/_templates/*refresh*.md` (handoff updates to consume collected artifacts)

### Test Landscape
#### Test Infrastructure
- **Frameworks:** Jest
- **Commands:**
  - `pnpm --filter @acme/mcp-server test:startup-loop`
  - `CI=true pnpm run test:governed -- jest -- --config ./jest.config.cjs --runInBand --runTestsByPath packages/mcp-server/src/__tests__/loop-tools.test.ts`
  - `CI=true pnpm run test:governed -- jest -- --config ./jest.config.cjs --runInBand --runTestsByPath packages/mcp-cloudflare/src/tools/analytics.contract.test.ts`
- **CI integration:** governed Jest runs with startup-loop-specific config and policy gates.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|------|-----------|-------|----------------|
| Loop refresh lifecycle | integration | `packages/mcp-server/src/__tests__/startup-loop-tools.integration.test.ts` | Covers queue idempotency, transitions, stale status behavior |
| Wave-2 envelope/registry | unit | `packages/mcp-server/src/lib/wave2-contracts.ts` (via callers) | Contract enforcement for quality/provenance and packet bounds |
| Cloudflare adapter contract | unit/contract | `packages/mcp-cloudflare/src/tools/analytics.contract.test.ts` | Deterministic normalization and fallback paths |

#### Test Patterns & Conventions
- Contract-first assertions on JSON payloads (`schemaVersion`, normalized metrics, deterministic fields).
- Fixture-driven integration tests for startup-loop artifact paths.
- Controlled `runInBand` execution for startup-loop suites.

#### Coverage Gaps (Planning Inputs)
- No contract or integration tests for markdown collector endpoints and raw-text responses.
- No startup-loop fixture coverage for persisted source markdown artifacts.
- No explicit drift test ensuring new collector tools are wired into `loopToolPoliciesRaw` and registry checks.

#### Extinct tests (tests asserting obsolete behavior)
- None confirmed at fact-find time.
- Watch item: if startup-loop enforces `analytics_*` sunset for loop stages, existing tests that assume direct `analytics_*` availability in loop paths must be updated during build.

#### Testability Assessment
- **Easy to test:**
  - Deterministic artifact writes and envelope/provenance fields.
  - Queue lifecycle behavior for collector refresh requests.
- **Hard to test:**
  - Live Cloudflare domain behavior when feature is disabled per-zone.
  - Mixed domain fleets (Cloudflare and non-Cloudflare) without dedicated test doubles.
- **Test seams needed:**
  - Injectable fetch client for markdown endpoint behavior (success, disabled, HTML fallback, timeout).
  - Stable fixture format for source artifact metadata, checksum, and freshness.

#### Recommended Test Approach
- **Unit tests for:**
  - Markdown response parsing/validation and provenance envelope mapping.
  - Policy gating and tool registry wiring for new loop tools.
- **Integration tests for:**
  - End-to-end collector fetch -> persist -> `refresh_status_get` -> pack evidence references.
- **Contract tests for:**
  - Cloudflare adapter output shape and fallback behavior when markdown endpoint is unavailable.

### Recent Git History (Targeted)
- `4166298ae4` - add refresh and anomaly loop tools (established queue lifecycle to reuse).
- `7510b0ba57` - implement wave-2 contracts and vertical-slice loop tools.
- `3a97532ace` - add canonical startup-loop stage graph/spec.
- `4d9325702e` - recent `mcp-cloudflare` activity indicates active adapter surface.

## External Research (If needed)
- Cloudflare announcement: Markdown for Agents is delivered by URL suffix (`/markdown`) or `Accept: text/markdown`, with platform-side extraction preserving headings, links, tables, and summaries.
  - Source: https://blog.cloudflare.com/markdown-for-agents/
- Cloudflare docs: enablement is controlled in dashboard "Content Signals"; API configuration is available via Content Access Controls. Feature scope is Cloudflare-served content.
  - Source: https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/
- Cloudflare docs: Content Signals defaults include `/llms.txt` and `/llms-full.txt` as crawler-facing files.
  - Source: https://developers.cloudflare.com/fundamentals/reference/content-signals/
- Cloudflare Browser Rendering docs: `ai.toMarkdown` via AI Gateway is available as fallback for pages without direct markdown support.
  - Source: https://developers.cloudflare.com/browser-rendering/features/markdown/

Inference from sources:
- A startup-loop implementation should treat Cloudflare markdown as a preferred adapter, but not the only adapter, because standing refresh sources may include domains not hosted on Cloudflare.

## Questions
### Resolved
- Q: Do we already have startup-loop refresh control surfaces that can orchestrate collector work?
  - A: Yes. `refresh_status_get` and `refresh_enqueue_guarded` already provide lifecycle and idempotency semantics.
  - Evidence: `packages/mcp-server/src/tools/loop.ts`
- Q: Are standing refresh artifacts already automated and persisted?
  - A: No. Workflow docs call them required, but only prompt templates exist.
  - Evidence: `docs/business-os/startup-loop-workflow.user.md`, `docs/business-os/workflow-prompts/_templates/*refresh*.md`
- Q: Is there an existing Cloudflare adapter pattern we can extend?
  - A: Yes, analytics adapter contracts and tests provide a reusable blueprint.
  - Evidence: `packages/mcp-cloudflare/src/tools/analytics.ts`, `packages/mcp-cloudflare/src/tools/analytics.contract.test.ts`

### Open (User Input Needed)
- None blocking for planning.

## Confidence Inputs (for /lp-do-plan)
- **Implementation:** 82%
  - Why: existing refresh lifecycle, artifact conventions, and Cloudflare adapter patterns reduce unknowns.
  - To reach >=90%: complete a spike confirming one real domain end-to-end (`Accept: text/markdown` -> persisted artifact -> pack evidence).
- **Approach:** 79%
  - Why: preferred adapter is clear, but fallback boundary (non-Cloudflare domains) needs explicit product decision.
  - To reach >=80%: lock decision on fallback policy (defer vs AI Gateway adapter in same wave).
  - To reach >=90%: document an ADR with domain eligibility, fallback behavior, and failure modes.
- **Impact:** 84%
  - Why: blast radius is concentrated in mcp-server/mcp-cloudflare and standing refresh docs, with low risk to user-facing apps.
  - To reach >=90%: produce a call-site map for all standing refresh consumers and verify no hidden `analytics_*` loop dependencies.
- **Delivery-Readiness:** 78%
  - Why: engineering seams are clear, but rollout owner/cadence and source allowlist governance are not yet captured as acceptance gates.
  - To reach >=80%: define owner, weekly S10 review cadence, and source allowlist file contract.
  - To reach >=90%: add go/no-go checklist with operational alerting for collector failures.
- **Testability:** 80%
  - Why: deterministic contracts make local testing straightforward; external enablement behavior remains integration-heavy.
  - To reach >=90%: add deterministic fake server fixtures covering disabled-feature and HTML-fallback cases.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|------|-----------|--------|---------------------------|
| Source domains are not Cloudflare-hosted, so markdown endpoint is unavailable | Medium | High | Add adapter abstraction and explicit fallback policy; fail with actionable status and provenance note |
| Raw markdown artifacts include sensitive data from pages outside expected scope | Low | High | Enforce allowlist, size caps, and redaction checks before persistence; record source URL and checksum |
| Collector freshness appears green while source quality degrades (empty/low-quality markdown) | Medium | Medium | Add quality gates (min length, heading/link density heuristics, parse success) and surface in `qualityNotes` |
| Startup-loop packs become non-deterministic due to live fetch timing | Medium | Medium | Persist snapshots first; pack builders consume persisted artifacts only |
| Tool-policy drift if new loop tools are added without metadata wiring | Medium | Medium | Extend preflight checks (`mcp-preflight`) and add contract tests for registry/policy parity |

## Planning Constraints & Notes
- Must-follow patterns:
  - Keep startup-loop default read-only and use guarded writes only for refresh queue transitions.
  - All collector outputs require wave-2 envelope and provenance fields.
  - Persist artifacts under startup-loop run roots; no transient-only fetch for planning decisions.
- Rollout/rollback expectations:
  - Rollout behind new `loop_` tool names and collector keys.
  - Rollback by disabling new tool registrations and retaining existing prompt-only standing refresh path.
- Observability expectations:
  - Track fetch success rate, freshness lag, quality-note frequency, and source coverage per business/run.

## Suggested Task Seeds (Non-binding)
- Add a Cloudflare markdown adapter in `@acme/mcp-cloudflare` with raw-text response support and structured errors.
- Define `content.source.v1` artifact schema (`url`, `fetchedAt`, `checksum`, `quality`, `provenance`, `markdownPath`).
- Add loop tool(s) to fetch/persist markdown source artifacts and return envelope-compliant metadata.
- Extend pack builder to include source artifact evidence refs for S10 operator bundles.
- Update standing refresh prompt templates to accept collector artifact inputs by path.
- Add startup-loop integration and contract tests for success, disabled, and fallback/error cases.
- Add preflight guard to verify new loop tools have policy metadata and registry wiring.

## Execution Routing Packet
- Primary execution skill:
  - `/lp-do-build`
- Supporting skills:
  - `/lp-sequence`, `/lp-do-replan`
- Deliverable acceptance package (what must exist before task can be marked complete):
  - New adapter/tool contracts merged with passing targeted tests.
  - Persisted markdown source artifacts referenced by startup-loop evidence outputs.
  - Updated standing refresh prompt docs and operator notes.
  - Documented rollback and operational metrics.
- Post-delivery measurement plan:
  - Weekly S10 review tracks source coverage percent, freshness lag, and collector error rate by business.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items (if any):
  - None
- Recommended next step:
  - Proceed to `/lp-do-plan` with this brief and sequence tasks to land adapter and artifact contracts before broader collector rollout.
