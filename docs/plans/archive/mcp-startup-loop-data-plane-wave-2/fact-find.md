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
Feature-Slug: mcp-startup-loop-data-plane-wave-2
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-sequence, /lp-replan
Related-Plan: docs/plans/mcp-startup-loop-data-plane-wave-2/plan.md
Business-OS-Integration: off
Business-Unit: PLAT
Card-ID:
---

# MCP Startup Loop Data Plane Wave 2 Fact-Find Brief

## Scope
### Summary
Define a second-wave MCP expansion that turns startup-loop execution into a reproducible, measurement-driven control loop across S2A, S3, and S10 by adding normalized measurement connectors (`measure_*`), bounded app state packets (`app_*`), standing refresh artifact orchestration, experiment runtime interfaces, deterministic pack compilation, anomaly detection, guarded cross-app ops writes, and first-class provenance.

This brief is planning input for the next wave after current first-wave MCP data-plane implementation.

### Goals
- Specify evidence-backed contracts for the 8 requested wave-2 capability areas.
- Map existing reusable infrastructure vs net-new work.
- Keep startup-loop control-plane invariants intact (`S5A` side-effect-free, `S5B` guarded mutation).
- Keep read-only-by-default and no-PII packet constraints explicit.
- Provide planning-ready task seeds with sequencing and risk controls.

### Non-goals
- Implementing wave-2 tools in this fact-find.
- Replacing first-wave scope currently under build.
- Replacing Business OS APIs as write authority.
- Allowing loop skills to call third-party systems directly.

### Constraints & Assumptions
- Constraints:
  - Loop mutation boundaries from `docs/business-os/startup-loop/loop-spec.yaml` and `docs/business-os/startup-loop/autonomy-policy.md` remain authoritative.
  - Read-only first for wave-2 surfaces; guarded writes only where explicitly required.
  - Run packets must be bounded and PII-safe.
  - Standing refresh collectors remain separate writers; MCP acts as read/control facade.
- Assumptions:
  - `@acme/mcp-server` remains the startup-loop MCP entrypoint.
  - `@acme/mcp-cloudflare` capabilities can be reused via adapter/wrapper rather than duplicated API clients.
  - Business OS APIs under `apps/business-os/src/app/api/agent/*` remain the canonical guarded write boundary.

## Wave-2 Operating Spine (Locked for Planning)
### Architectural Spine
Collectors produce artifacts -> MCP exposes normalized reads plus guarded refresh requests -> startup loop consumes reproducible run packets and packs -> BOS remains write authority.

### Runtime Model
- Collectors/scripts are the only systems that pull third-party provider data at scale and persist normalized artifacts on schedule.
- MCP wave-2 tools are default readers over persisted artifacts and metadata.
- MCP may provide guarded request surfaces (`refresh_enqueue_*`) that signal collectors, but MCP is not the collector writer.
- Startup loop stages consume versioned packets/packs and reference artifact IDs for replay.

### Compute Locality Rule
- Default:
  - `measure_*`, `app_*`, `pack_*`, and `anomaly_*` compute from persisted artifacts.
- Allowed exceptions:
  - Live provider probes for connector health/status only.
  - Explicit on-demand refresh request signaling (still collector-owned execution/writes).

### Persistence Model
- Canonical persisted outputs:
  - `metrics.jsonl` (or equivalent per-source normalized metric artifacts),
  - `run-packets/<packetId>.json`,
  - `packs/s10/<runId>/pack.json` and `pack.md`,
  - `anomalies/<runId>.json`.
- MCP responses must reference persisted artifact IDs/paths to preserve replayability.

### Schema Governance Model
- All wave-2 contracts are versioned (`schemaVersion`) and include backward-compat expectations.
- A metrics registry (`metrics-registry.v1`) is mandatory before broad connector rollout:
  - metric name -> unit, allowed grains, default window, allowed dimensions, aggregation method, source priority, PII risk.
- Segment canonicalization rules are required (`channel`, `device`, `product`, etc.) with allowed value maps by source.

### Delivery Shape (Mandatory)
- Wave-2 execution is gated by a vertical slice, not parallelized by capability family:
  - Step 1: shared schemas plus provenance envelope middleware plus policy middleware.
  - Step 2: one `measure_*` adapter + one `app_*` packet + one `pack_*` build over persisted artifacts.
  - Step 3: fixture-based integration/contract tests proving replayability, redaction, and determinism.
  - Step 4: expand sources and capabilities (`anomaly_*`, `exp_*`, then guarded `ops_*` last).

## Evidence Audit (Current State)
### Entry Points
- `docs/plans/mcp-startup-loop-data-plane/fact-find.md` - first-wave baseline and stage-capability matrix.
- `docs/plans/mcp-startup-loop-data-plane/plan.md` - current wave under build; explicitly defers `measure_*`.
- `packages/mcp-server/src/tools/index.ts` - current base MCP tool inventory and dispatcher.
- `packages/mcp-cloudflare/src/tools/index.ts` - separate Cloudflare MCP tool inventory.
- `docs/business-os/startup-loop/loop-spec.yaml` - startup-loop stage contract and run-packet minimum fields.
- `docs/business-os/startup-loop-workflow.user.md` - operational gaps and standing refresh expectations.

### Key Modules / Files
- `packages/mcp-server/src/tools/index.ts`
  - Current families: shop/order/inventory/pages/sections/settings/products/analytics/health/seo/discount/theme/gmail/draft flows.
  - No `measure_*`, `app_*`, `pack_*`, `anomaly_*`, `ops_*`, or `exp_*` tools.
- `packages/mcp-server/src/tools/analytics.ts`
  - Shop-local analytics (`analytics_aggregates`, `analytics_events`, `analytics_summary`) from platform-core aggregates/events, not loop-stage normalized metrics.
- `packages/mcp-server/src/tools/gmail.ts`
  - Queue + labeling flows return counts/samples, but no canonical support-metrics contract (for example response-time SLA series by window/segment).
- `packages/mcp-cloudflare/src/tools/analytics.ts`
  - Cloudflare analytics exists, but with Cloudflare-specific shapes and naming, not startup-loop normalized measure schema.
- `scripts/src/startup-loop/s10-growth-accounting.ts`
  - Produces structured S10 growth summary (`stage_statuses`, `overall_status`, `guardrail_signal`, threshold hash), proving reusable scoring output for pack/anomaly layers.
- `scripts/src/startup-loop/growth-metrics-adapter.ts`
  - Already emits `data_quality` and `sources` pointers, which are usable provenance seeds.
- `scripts/src/startup-loop/diagnosis-snapshot.ts`
  - Deterministic bottleneck snapshot + prior-run comparison.
- `scripts/src/startup-loop/replan-trigger.ts`
  - Guarded trigger lifecycle (`open`, `acknowledged`, `resolved`) with persistence/severity gates.
- `scripts/src/startup-loop/metrics-aggregate.ts`
  - Threshold-based rolling warnings from `metrics.jsonl` (median vs threshold).
- `scripts/src/startup-loop/manifest-update.ts`
  - Single-writer baseline manifest contract.
- `scripts/src/startup-loop/learning-ledger.ts`
  - Append-only learning ledger with dedup/effective view.
- `apps/business-os/src/app/api/agent/cards/[id]/route.ts`
  - Guarded card reads/patches with `entitySha` conflict handling.
- `apps/business-os/src/app/api/agent/stage-docs/[cardId]/[stage]/route.ts`
  - Guarded stage-doc reads/patches with `entitySha` conflict handling.
- `docs/business-os/startup-loop/manifest-schema.md`
  - Canonical run artifact pointers and lifecycle (`candidate` -> `current` + next seed pointers).
- `docs/business-os/startup-loop/event-state-schema.md`
  - Append-only events ledger and deterministic derived state.
- `.github/workflows/brik-weekly-kpi-reminder.yml`
  - Reminder orchestration exists, but not collector pipeline execution/output persistence.
- `scripts/src/brikette/export-cloudflare-monthly-proxies.ts`
  - Manual Cloudflare extraction script exists; no MCP wrapper nor scheduled collector status API.

### Patterns & Conventions Observed
- MCP tools are centrally dispatched through explicit name sets and handlers.
  - Evidence: `packages/mcp-server/src/tools/index.ts`, `packages/mcp-cloudflare/src/tools/index.ts`.
- Startup-loop runtime favors deterministic local artifacts + single-writer promotion.
  - Evidence: `scripts/src/startup-loop/manifest-update.ts`, `docs/business-os/startup-loop/stage-result-schema.md`.
- Guarded concurrency semantics already exist in Business OS APIs via `entitySha`.
  - Evidence: `apps/business-os/src/app/api/agent/cards/[id]/route.ts`, `apps/business-os/src/app/api/agent/stage-docs/[cardId]/[stage]/route.ts`.
- S10 already has reusable machine outputs (growth accounting and bottleneck diagnostics), but no MCP surface exposing them.
  - Evidence: `scripts/src/startup-loop/s10-growth-accounting.ts`, `scripts/src/startup-loop/s10-diagnosis-integration.ts`.

### Data & Contracts
- Types/schemas:
  - Stage graph + run packet minimum: `docs/business-os/startup-loop/loop-spec.yaml`.
  - Stage result contract: `docs/business-os/startup-loop/stage-result-schema.md`.
  - Manifest + pointers: `docs/business-os/startup-loop/manifest-schema.md`.
  - Event/state derivation: `docs/business-os/startup-loop/event-state-schema.md`.
  - Learning ledger: `docs/business-os/startup-loop/learning-ledger-schema.md`.
- Persistence:
  - Loop artifacts: `docs/business-os/startup-baselines/<BIZ>/runs/<run_id>/...` (contracted path).
  - Growth ledger: `data/shops/<shopId>/growth-ledger.json`.
  - Shop analytics aggregates/events: `data/shops/<shopId>/analytics-aggregates.json`, `data/shops/<shopId>/analytics.jsonl`.
  - Business OS state: D1 via `apps/business-os/src/app/api/agent/*`.
- API/event contracts:
  - BOS APIs: `/api/agent/cards`, `/api/agent/stage-docs`, `/api/agent/ideas`, `/api/agent/allocate-id`.
  - Loop control-plane events: `stage_started`, `stage_completed`, `stage_blocked`.

### Dependency & Impact Map
- Upstream dependencies:
  - Cloudflare, GA4, Search Console, Stripe, email/support systems (connector targets).
  - Existing startup-loop scripts and artifact schemas.
  - Business OS D1 APIs for guarded writes.
- Downstream dependents:
  - `/lp-forecast`, `/lp-prioritize`, `/lp-experiment`, `/lp-fact-find`, weekly S10 operator decisions.
- Likely blast radius:
  - `packages/mcp-server` tool registry/contract layer.
  - Potential adapter usage from `packages/mcp-cloudflare`.
  - Startup-loop script readers/pack builders.
  - BOS guarded-write flows for experiment and ops actions.

### Delivery & Channel Landscape (for business-artifact or mixed)
- Audience/recipient:
  - Internal loop operators and agent skills.
- Channel constraints:
  - MCP tool-call shape and deterministic JSON outputs.
  - Credentials partitioning per source connector.
  - No PII in packet or metric payloads.
- Existing templates/assets:
  - Standing refresh prompt templates (market pulse, channel economics, regulatory watch) exist but are document prompts, not automated collectors.
  - Evidence: `docs/business-os/workflow-prompts/_templates/*.md`.
- Approvals/owners:
  - PLAT (MCP + loop runtime), BOS (D1 APIs and governance), business operators for stage decisions.
- Compliance constraints:
  - Guarded writes only where justified.
  - Redaction + provenance on all outputs.
- Measurement hooks:
  - Existing S10 growth accounting and diagnosis outputs are available for direct reuse in pack and anomaly capabilities.

### Requested Wave-2 Capability Audit

| Requested capability | Current reusable base | Gap to close | Recommended contract shape |
|---|---|---|---|
| 1) Measurement plane (`measure_*`) for S2A/S3/S10 | Shop analytics in base MCP (`analytics_*`), Cloudflare analytics in `@acme/mcp-cloudflare`, order/refund data in `RentalOrder`, manual Cloudflare export script | No canonical cross-source metric schema; no stage-shaped connector outputs; no metrics registry; no standardized quality semantics | `measure_snapshot_get`, `measure_series_get`, `measure_health_status` over persisted collector artifacts using `schemaVersion` + normalized metric registry |
| 2) App state snapshots (`app_*`) returning run packet | Repositories for orders, inventory, pricing, pages; loop run-packet minimum field spec exists | No bounded snapshot tool or replayable packet artifact including redaction metadata and source references | `app_run_packet_build` (persist artifact) + `app_run_packet_get` (read artifact) returning `packetId`, `schemaVersion`, `sizeBytes`, `redactionApplied`, `sourceRefs` |
| 3) Standing refresh artifacts + status/enqueue | Standing refresh cadence documented; reminder workflow exists; export workflows exist | No scheduled collector outputs for startup-loop artifacts; no MCP status API over collector health/lag; no enqueue lifecycle contract | `refresh_status_*` (read-only) and guarded `refresh_enqueue_*` with idempotent request state machine |
| 4) Experiment runtime integration (`exp_*`) | Hypothesis portfolio CLI/storage and prioritize bridge; deterministic assignment logic in Prime; learning ledger + S10 learning hook | No MCP experiment control interface; no unified experiment assignment/logging/result extraction contract across apps | `exp_allocate_id`, `exp_register`, `exp_rollout_status`, `exp_results_snapshot` with guarded write policy and auditable metadata |
| 5) Automated pack compilation (`pack_*`) | S10 growth accounting outputs and diagnosis artifacts already structured | No deterministic pack assembler that composes BOS state + run artifacts + measurements + anomalies into operator-ready bundle | `pack_weekly_s10_build` producing markdown + JSON manifest + evidence links |
| 6) Anomaly/regression detection (`anomaly_*`) | Threshold/median warnings (`metrics-aggregate`), bottleneck detector and persistence trigger logic | No reusable MCP anomaly tools; no standardized detector metadata and severity taxonomy | `anomaly_detect_traffic`, `anomaly_detect_revenue`, `anomaly_detect_errors` (EWMA/z-score first) with run references |
| 7) Guarded cross-app ops writes (`ops_*`) | Existing guarded write patterns (Cloudflare confirm, BOS `entitySha`) and MCP write flows in legacy tools | No startup-loop ops contract enforcing `write_reason`, concurrency token, stage allowlist, audit tags/redaction | `ops_*_guarded` requiring write intent fields and explicit stage policy checks |
| 8) Provenance/lineage/reproducibility first-class | Manifest/events/learning ledger schemas; growth adapter carries `sources` + `data_quality` | No universal MCP output envelope for `schemaVersion`/`refreshedAt`/query signature/generated-at/quality; packet-level version references inconsistent | Shared `provenance` envelope required on all wave-2 tool responses |

### Proposed Canonical Wave-2 Contracts

#### A) Normalized measurement record
```json
{
  "schemaVersion": "measure.record.v1",
  "business": "BRIK",
  "source": "stripe|ga4|search_console|cloudflare|d1|prisma|email|support",
  "metric": "revenue|refund_rate|chargeback_rate|sessions|cvr|bookings|occupancy|lead_time|cancellations",
  "window": {
    "startAt": "2026-02-01T00:00:00Z",
    "endAt": "2026-02-08T00:00:00Z",
    "grain": "day|week|month",
    "timezone": "UTC"
  },
  "segmentSchemaVersion": "segments.v1",
  "segments": { "channel": "organic", "device": "mobile", "product": "room_private_double" },
  "valueType": "currency|count|ratio|duration",
  "value": 123.45,
  "unit": "EUR|count|ratio|bps|ms",
  "quality": "ok|partial|blocked",
  "qualityNotes": ["sample-size-low", "missing-days:1"],
  "coverage": {
    "expectedPoints": 7,
    "observedPoints": 6,
    "samplingFraction": 1.0
  },
  "refreshedAt": "2026-02-13T10:00:00Z",
  "provenance": {
    "querySignature": "sha256:...",
    "generatedAt": "2026-02-13T10:00:00Z",
    "datasetId": "...",
    "sourceRef": "..."
  }
}
```

#### B) Bounded app run packet
```json
{
  "schemaVersion": "run.packet.v1",
  "packetId": "RPK-BRIK-20260213-1000",
  "source": "app_run_packet_build",
  "timeWindow": { "start": "2026-02-06", "end": "2026-02-13" },
  "segments": { "business": "BRIK", "launchSurface": "website-live" },
  "sizeBytes": 48210,
  "sizeBudgetBytes": 262144,
  "redactionApplied": true,
  "redactionRulesVersion": "packet-redaction.v1",
  "data": {
    "bookingsSummary": {},
    "funnelStats": {},
    "inventoryDeltas": {},
    "pricingTables": {},
    "topPages": [],
    "topQueries": [],
    "topSupportIssues": []
  },
  "sourceRefs": {
    "bookingsSummary": ["artifact://collectors/d1/bookings-2026-02-13.json"],
    "funnelStats": ["artifact://collectors/ga4/funnel-2026-02-13.json"],
    "topSupportIssues": ["artifact://collectors/support/themes-2026-02-13.json"]
  },
  "refreshedAt": "2026-02-13T10:00:00Z",
  "provenance": {
    "generatedAt": "2026-02-13T10:00:00Z",
    "querySignature": "sha256:...",
    "commitSha": "...",
    "artifactRefs": ["..."]
  }
}
```

### Required Shared Contracts and Policies
#### C) Metrics registry (`metrics-registry.v1`) - required
- Purpose:
  - prevent invalid cross-source comparisons and enforce consistent segment semantics.
- Required fields per metric:
  - `metric`,
  - `valueType`,
  - `unit`,
  - `preferredGrains`,
  - `defaultWindow`,
  - `allowedDimensions`,
  - `aggregationMethod`,
  - `sourcePriority`,
  - `piiRisk`.
- Example entry:
```json
{
  "metric": "revenue",
  "valueType": "currency",
  "unit": "EUR",
  "preferredGrains": ["day", "week"],
  "defaultWindow": "28d",
  "allowedDimensions": ["channel", "product"],
  "aggregationMethod": "sum",
  "sourcePriority": ["stripe", "d1"],
  "piiRisk": "low"
}
```
- Segment canonicalization:
  - `segments` is not free-form for startup-loop consumers.
  - metric definitions reference canonical segment keys and allowed values via `segmentSchemaVersion`.
  - source-specific labels are mapped to canonical values before metric emission.

#### D) Provenance envelope (`provenance.v1`) - required
- Required on all wave-2 tool responses:
  - `schemaVersion`,
  - `querySignature`,
  - `generatedAt`,
  - `datasetId`,
  - `sourceRef`,
  - `artifactRefs`,
  - `commitSha` (when sourced from repo artifacts),
  - `quality`.
- Confidence policy:
  - Do not expose subjective `confidence` in v1.
  - Use deterministic `quality`, `qualityNotes`, and `coverage` fields.
- Quality semantics (required):
  - `ok`: `coverage.observedPoints / coverage.expectedPoints >= 0.95` and no blocking validation errors.
  - `partial`: coverage in `[0.50, 0.95)` or non-blocking data issues.
  - `blocked`: coverage `< 0.50`, missing critical dimensions, or failed connector validation.

#### E) Redaction and bounded-packet policy (`packet-redaction.v1`) - required
- Enforcement primitives:
  - allowlist by packet schema path,
  - explicit denylist patterns (email/phone/address-like strings),
  - max packet size and top-K caps per list field,
  - `redactionApplied` and `redactionRulesVersion` in output.
- Required numeric bounds:
  - `maxPacketSizeBytes = 262144` (256 KiB).
  - `maxTopPages = 50`, `maxTopQueries = 50`, `maxTopSupportIssues = 25`.
- Validation:
  - contract tests must fail on forbidden fields/patterns and oversize packets.

#### F) Refresh enqueue lifecycle (`refresh-enqueue.v1`) - required
- `refresh_enqueue_*` is a guarded request surface, not a direct artifact mutation API.
- Required request fields:
  - `requestId` (idempotency key),
  - `business`,
  - `collector`,
  - `reason`,
  - `requestedBy`.
- State machine:
  - `enqueued` -> `pending` -> `running` -> (`complete` | `failed` | `expired`).
- Acknowledgement contract:
  - enqueue response returns `requestId`, `state`, and `statusUrl`/reference key.
  - duplicate `requestId` returns existing request state (idempotent).
  - collectors remain sole writers of output artifacts; MCP never writes collector outputs.

#### G) Anomaly baseline policy (`anomaly-baseline.v1`) - required
- Minimum history gates:
  - daily-grain detector requires at least 28 points.
  - weekly-grain detector requires at least 8 points.
- Cold-start behavior:
  - below threshold, return `quality=blocked` with `qualityNotes=["insufficient-history"]`.
  - no anomaly severity emission when baseline gate is not met.
- Initial detector set:
  - EWMA and z-score with deterministic parameter defaults, versioned in detector metadata.

### Tool Surface and Backward-Compatibility Policy
- `measure_*` is the canonical startup-loop measurement interface.
- Existing `analytics_*` and Cloudflare-native analytics responses are treated as internal source adapters for `measure_*`.
- Policy for skills:
  - startup-loop skills consume only `measure_*`, not provider-specific `analytics_*`.
- Compatibility:
  - existing `analytics_*` tools remain for non-loop use-cases during transition.
- Sunset trigger (mandatory):
  - once `measure_*` covers all startup-loop metrics currently consumed via `analytics_*` for 2 consecutive weekly S10 runs, block startup-loop skill access to `analytics_*` within 14 days.
  - retain legacy `analytics_*` for non-loop consumers for up to 60 additional days with migration notices.

### Credentials and Tenancy Model (Decision Required Early)
- Decision options (must choose in Phase 0):
  - Option A (recommended): BOS-scoped connector profiles and secret references.
    - Model: BOS stores per-business connector profile metadata; collectors resolve short-lived credentials via centralized secret manager.
    - Pros: clear tenancy boundaries, centralized rotation, strong audit attribution.
    - Cons: initial BOS integration work.
  - Option B: collector-environment scoped secrets by business/provider.
    - Model: collectors read env-scoped secrets directly with naming conventions.
    - Pros: faster initial rollout.
    - Cons: weaker tenancy controls, harder audit attribution, higher rotation risk.
- Decision criteria:
  - must support per-business scoping, rotation without redeploy, audit logs by business/provider, and environment isolation.
  - if any criterion fails, option is rejected for production wave-2.
- This decision blocks Phase 2 connector expansion.

### Cloudflare Reuse and Testability Constraint
- Reuse path remains preferred: `@acme/mcp-cloudflare` behind `measure_*` adapters.
- Testability requirement before broad adoption (mandatory):
  - add adapter contract tests in `packages/mcp-server` with Cloudflare fixtures, and
  - add package-local tests in `packages/mcp-cloudflare` for covered endpoints.
- No production dependency on untested Cloudflare paths.

### Hypothesis & Validation Landscape
#### Key Hypotheses
| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|-----------|-----------|-------------------|-------------------|
| H1 | Normalized `measure_*` outputs materially improve S2A/S3/S10 decision quality vs document-only refresh. | Connector reliability + schema contract adoption. | Medium-High | 1-2 weeks |
| H2 | `app_*` run packets reduce per-run bespoke querying and increase reproducibility. | Packet schema boundedness + provenance fields. | Medium | 1 week |
| H3 | Standing refresh artifacts eliminate most freshness-related stage blocking. | Collector scheduling and health telemetry. | Medium | 1-2 weeks |
| H4 | Experiment runtime MCP interface improves S5A expected-value calibration and S10 scale/hold/kill decisions. | Hypothesis portfolio + assignment logging integration. | Medium | 1-2 weeks |
| H5 | Deterministic S10 pack assembly cuts operator overhead and missed signal risk. | Reliable artifact composition and evidence linking. | Medium | <1 week |
| H6 | Early anomaly detection reduces time-to-detect regressions and increases stable growth loops. | Baseline metric quality + detector calibration. | Medium | <1 week |
| H7 | Guarded `ops_*` writes can reduce repetitive operator work without policy regressions. | Strong write guard contract + auditability. | Medium-High | 1-2 weeks |
| H8 | Mandatory provenance envelope enables replay/debug of automated decisions. | Uniform envelope adoption across new tools. | Medium | <1 week |

#### Existing Signal Coverage
| Hypothesis | Evidence available | Source | Confidence in signal |
|-----------|-------------------|--------|---------------------|
| H1 | Measurement gap is explicit; first wave deferred `measure_*` intentionally. | `docs/plans/mcp-startup-loop-data-plane/plan.md`, `packages/mcp-server/src/tools/index.ts` | High |
| H2 | Run packet minimum exists but lacks bounded app-state/provenance payload contract. | `docs/business-os/startup-loop/loop-spec.yaml`, `docs/business-os/startup-loop-workflow.user.md` | Medium |
| H3 | Standing refresh prompts and reminders exist; collector outputs absent. | `docs/business-os/workflow-prompts/_templates/*.md`, `.github/workflows/brik-weekly-kpi-reminder.yml` | Medium |
| H4 | Experiment and portfolio logic exists in scripts/app code, but not MCP-exposed. | `scripts/src/hypothesis-portfolio/*`, `apps/prime/src/lib/experiments/activationExperiments.ts` | Medium |
| H5 | S10 already emits machine-usable structured outputs. | `scripts/src/startup-loop/s10-growth-accounting.ts`, `scripts/src/startup-loop/s10-diagnosis-integration.ts` | High |
| H6 | Basic thresholds and bottleneck persistence exist now. | `scripts/src/startup-loop/metrics-aggregate.ts`, `scripts/src/startup-loop/bottleneck-history.ts` | Medium |
| H7 | Guarded write semantics and conflict control already proven in BOS APIs. | `apps/business-os/src/app/api/agent/cards/[id]/route.ts`, `apps/business-os/src/app/api/agent/stage-docs/[cardId]/[stage]/route.ts` | High |
| H8 | Provenance-like fields already partially present in loop artifacts. | `docs/business-os/startup-loop/manifest-schema.md`, `scripts/src/startup-loop/growth-metrics-adapter.ts` | Medium |

#### Falsifiability Assessment
- Easy to test:
  - Contract-level validation for normalized metric and packet schemas.
  - Pack assembly determinism and anomaly detector repeatability with fixtures.
- Hard to test:
  - Third-party connector data quality under real credentials (GA4/Search Console/Stripe).
  - Cross-app `ops_*` write safety in production-like contention.
- Validation seams needed:
  - Connector adapter interfaces + deterministic fixture adapters.
  - Common provenance envelope validator for all wave-2 handlers.
  - Policy middleware that enforces write preconditions (`write_reason`, stage, `entitySha`).

#### Recommended Validation Approach
- Quick probes for:
  - `measure_*` schema correctness and metrics-registry enforcement using fixture-backed synthetic sources.
  - `app_run_packet_*` boundedness/PII guard checks and deterministic redaction behavior.
- Structured tests for:
  - Refresh health/enqueue lifecycle and stale collector states.
  - Experiment registration/rollout/result snapshot flows with conflict cases.
  - Guarded `ops_*` preflight and conflict handling.
- Deferred validation for:
  - Live provider rate-limit behavior and long-tail data drift.

### Test Landscape
#### Test Infrastructure
- Frameworks:
  - MCP server: Jest under `packages/mcp-server/src/__tests__`.
  - Startup loop scripts: Jest under `scripts/src/startup-loop/__tests__`.
  - Business OS APIs: route tests under `apps/business-os/src/app/api/agent/**/__tests__/route.test.ts`.
- Commands:
  - `pnpm --filter @acme/mcp-server typecheck`
  - `pnpm --filter @acme/mcp-server lint`
  - `pnpm run test:governed -- jest -- --runTestsByPath <target>`
- CI integration:
  - Repo uses governed test/lint/typecheck scripts; targeted validation expected.
- Coverage tools:
  - Jest suites + governed test harness patterns.

#### Existing Test Coverage
| Area | Test Type | Files | Coverage Notes |
|------|-----------|-------|----------------|
| Base MCP email/policy tooling | unit/integration | `packages/mcp-server/src/__tests__/*.test.ts` | Strong coverage for email and policy helpers, weaker on startup-loop data-plane surfaces |
| Startup-loop diagnostics and growth accounting | unit/integration | `scripts/src/startup-loop/__tests__/diagnosis-snapshot.test.ts`, `scripts/src/startup-loop/__tests__/s10-growth-accounting.test.ts` | Strong deterministic coverage for S10 diagnostics/growth |
| BOS guarded API semantics | route tests | `apps/business-os/src/app/api/agent/cards/__tests__/route.test.ts`, `apps/business-os/src/app/api/agent/stage-docs/__tests__/route.test.ts` | Conflict and entitySha semantics validated |
| Cloudflare MCP | none found | `packages/mcp-cloudflare` | No package-local test suite detected |

#### Test Patterns & Conventions
- Unit tests:
  - Deterministic pure-function assertions for startup-loop kernels.
- Integration tests:
  - File-based fixtures for loop artifacts and pipeline orchestration.
- API tests:
  - Route-level request/response and conflict-path checks.
- Test data:
  - Synthetic fixture payloads and repository stubs.

#### Coverage Gaps (Planning Inputs)
- Untested paths:
  - No `measure_*` connector contract tests (tools do not exist yet).
  - No `app_*` run packet contract tests.
  - No `pack_*` deterministic pack compilation tests.
  - No `anomaly_*` tool contract tests.
  - No `ops_*` stage-gated write contract tests.
- Extinct tests:
  - None identified in audited scope.

#### Testability Assessment
- Easy to test:
  - Schema validation, stage-gating preflight, deterministic file composition.
- Hard to test:
  - Live third-party connector behavior, auth/credential rotation, throttling.
- Test seams needed:
  - Source-adapter abstraction layer for connectors.
  - Shared provenance validator.
  - Policy harness reusable across `exp_*` and `ops_*` writes.

#### Recommended Test Approach
- Unit tests for:
  - Metric normalization, packet shaping, provenance envelope enrichment, anomaly scoring.
- Integration tests for:
  - BOS API conflict paths (`entitySha`) and guarded write outcomes.
  - Refresh status derivation from collector artifacts.
- Contract tests for:
  - `measure_*`, `app_*`, `pack_*`, `anomaly_*`, `exp_*`, `ops_*` input/output schemas.
- Rehearsal tests for:
  - End-to-end weekly S10 pack build with fixture run directories.

### Recent Git History (Targeted)
- `scripts/src/startup-loop/*`
  - Recent commits are concentrated on learning compiler, bottleneck diagnosis, and growth accounting integration.
  - Evidence: `git log --oneline --max-count=12 -- scripts/src/startup-loop`.
  - Implication: strong reusable S10 runtime kernels already exist.
- `packages/mcp-server/*`
  - Recent commits are primarily email automation/policy related.
  - Evidence: `git log --oneline --max-count=12 -- packages/mcp-server`.
  - Implication: startup-loop measurement and packet domains are still largely open.
- `packages/mcp-cloudflare/*`
  - Minimal recent commit activity in this package.
  - Evidence: `git log --oneline --max-count=12 -- packages/mcp-cloudflare`.
  - Implication: reuse is possible, but integration patterns should be explicitly planned and tested.

## External Research (If needed)
- No external web research required.
- Findings are based on in-repo contracts and runtime code.

## Questions
### Resolved
- Q: Do we already have any wave-2 style tool prefixes (`measure_*`, `app_*`, `exp_*`, `pack_*`, `anomaly_*`, `ops_*`) in base MCP?
  - A: No.
  - Evidence: `packages/mcp-server/src/tools/index.ts`, repo-wide search across MCP and startup-loop paths.
- Q: Can we reuse runtime kernels for anomaly/readout without new math infra?
  - A: Yes. S10 growth accounting, diagnosis snapshots, persistence checks, and trigger logic are already implemented and tested.
  - Evidence: `scripts/src/startup-loop/s10-growth-accounting.ts`, `scripts/src/startup-loop/diagnosis-snapshot.ts`, `scripts/src/startup-loop/replan-trigger.ts`.
- Q: Do we already have guarded write concurrency primitives for mutation tools?
  - A: Yes, via BOS API `entitySha` patterns.
  - Evidence: `apps/business-os/src/app/api/agent/cards/[id]/route.ts`, `apps/business-os/src/app/api/agent/stage-docs/[cardId]/[stage]/route.ts`.
- Q: Are standing refresh collectors currently automated and surfaced through MCP?
  - A: No.
  - Evidence: `docs/business-os/startup-loop-workflow.user.md`, `.github/workflows/brik-weekly-kpi-reminder.yml`.

### Open (User Input Needed)
- Decision: select credential and tenancy option for Phase 0:
  - Option A: BOS-scoped connector profiles + centralized secret manager (recommended),
  - Option B: collector-environment scoped secrets.
- Decision: ratify Cloudflare long-term surface strategy after vertical slice:
  - keep adapter over `@acme/mcp-cloudflare`,
  - or consolidate Cloudflare measurement surface into base MCP in later phase.
- Decision: confirm owners and acceptance criteria for the `analytics_*` sunset trigger execution window.

## Confidence Inputs (for /lp-plan)
- **Implementation:** 82%
  - Why: core building blocks (MCP dispatch model, startup-loop kernels, BOS guarded APIs) already exist.
- **Approach:** 84%
  - Why: read-only-first + normalized contracts + collector separation aligns with loop governance and single-writer constraints.
- **Impact:** 78%
  - Why: cross-cutting scope across multiple packages and external connectors increases integration surface.
- **Delivery-Readiness:** 82%
  - Why: owners/channels are clear and first-wave adjacency is explicit.
- **Testability:** 81%
  - Why: deterministic kernels and fixture patterns are strong, but live connector behavior remains harder.

### What would raise confidence to >=90
- Lock architecture decisions in `/lp-plan`:
  - ratify artifact-reader MCP default and exception policy,
  - credential/tenancy model,
  - `analytics_*` containment policy.
- Complete one vertical wave-2 slice: `measure_snapshot_get` + `app_run_packet_build` + `pack_weekly_s10_build` with fixture-backed provenance, registry, and redaction checks.
- Add a connector adapter harness with deterministic fixtures for at least Stripe + Cloudflare.
- Add guarded-write contract tests for one `exp_*` and one `ops_*` tool against mocked BOS conflict paths.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|------|-----------|--------|---------------------------|
| Tool-surface sprawl without shared envelope leads to inconsistent outputs and brittle skill prompts. | Medium | High | Enforce common wave-2 response envelope (`schemaVersion`/`refreshedAt`/provenance/quality) at middleware layer. |
| Connector heterogeneity (units/windows/segments) causes invalid cross-source comparisons. | High | High | Normalize through strict schema + per-source adapters; reject invalid records early. |
| Refresh enqueue introduces hidden write paths that violate single-writer assumptions. | Medium | High | Keep enqueue as request signal only; collectors remain sole writers of refresh artifacts. |
| Experiment writes bypass governance if routed directly to app-specific storage. | Medium | High | Route experiment registration/rollout through guarded MCP policy + BOS audit trail fields. |
| `ops_*` automation could cause high-blast-radius mutations without proper concurrency checks. | Medium | High | Require `write_reason`, stage allowlist, and `entitySha`/equivalent token on every guarded op. |
| PII leakage in run packets/provenance. | Medium | High | Packet bounding + redaction allowlist + contract tests for forbidden fields. |
| Drift between documented MCP configuration and runtime activation causes false assumptions. | Medium | Medium | Add startup preflight that validates configured MCP servers and enabled tool groups. |
| Cloudflare capabilities remain siloed in separate MCP package, delaying unified measurement plane. | Medium | Medium | Add explicit adapter decision task (reuse `@acme/mcp-cloudflare` vs merge surface) early in plan. |
| Provider quotas/rate limits create partial windows that silently bias trend calculations. | High | High | Cache collector outputs, expose missing-window coverage in quality fields, and fail fast when coverage drops below quality thresholds. |
| Schema evolution breaks downstream stage consumers and historical replay tooling. | Medium | High | Version contracts and enforce backward-compat contract tests for active schema versions. |

## Planning Constraints & Notes
- Must-follow patterns:
  - Stage policy boundaries from loop-spec/autonomy policy remain hard constraints.
  - Writes only through guarded interfaces with explicit intent + conflict token.
  - No direct third-party access from loop skills; MCP returns normalized schema only.
  - MCP handlers default to reading persisted artifacts; collector execution owns heavy external pulls.
- Rollout/rollback expectations:
  - Rollout order:
    - shared contracts/middleware,
    - vertical slice (`measure` + `app_packet` + `pack`) with tests,
    - broader read-only coverage (`anomaly`, additional sources),
    - experiment control,
    - guarded ops writes last.
  - Rollback: disable tool groups by prefix without altering base MCP legacy surfaces.
- Observability expectations:
  - Every wave-2 tool returns `schemaVersion`, `refreshedAt`, provenance, and quality metadata and emits structured audit logs.
  - Collector health and artifact lag exposed via `refresh_status_*`.

## Suggested Task Seeds (Non-binding)
- Phase 0 (decisions + schema governance):
  - ratify compute locality default (artifact-reader MCP) and exception policy,
  - finalize credential/tenancy model,
  - codify `metrics-registry.v1`, `provenance.v1`, and `packet-redaction.v1`.
- Phase 1 (vertical slice gate, mandatory):
  - implement one `measure_snapshot_get` source adapter over persisted artifacts,
  - implement `app_run_packet_build` + `app_run_packet_get` as persisted artifacts,
  - implement `pack_weekly_s10_build` consuming those artifacts deterministically,
  - add fixture integration tests proving replayability, redaction, and schema compliance.
- Phase 1.5 (checkpoint gate, mandatory before source expansion):
  - review vertical-slice outputs against registry/provenance/redaction contracts,
  - confirm replay determinism across repeated runs with identical artifacts,
  - verify `analytics_*` sunset trigger prerequisites are measurable,
  - approve go/no-go for Phase 2 expansion.
- Phase 2 (read-only expansion):
  - expand `measure_*` sources (Stripe, D1/Prisma, Cloudflare, GA4/Search Console, support/email),
  - add `anomaly_detect_*` over artifact-backed series,
  - add `refresh_status_*` and guarded `refresh_enqueue_*` with request lifecycle contract.
- Phase 3 (guarded control surfaces):
  - implement `exp_*` runtime interfaces with BOS conflict semantics and audit tags,
  - pilot one guarded `ops_*` command with full preflight policy checks.
- Phase 4 (surface consolidation):
  - contain/deprecate startup-loop usage of provider-specific `analytics_*` in favor of `measure_*`.

## Execution Routing Packet
- Primary execution skill:
  - `/lp-build`
- Supporting skills:
  - `/lp-sequence`, `/lp-replan`
- Deliverable acceptance package:
  - Wave-2 schema spec and shared middleware implemented (`metrics-registry.v1`, `provenance.v1`, `packet-redaction.v1`).
  - Vertical slice (`measure_*` + `app_*` + `pack_*`) passing targeted fixture-based determinism and replay tests.
  - Expanded read-only wave (`anomaly_*`, additional measurement sources) passing targeted tests.
  - Refresh status/enqueue contract implemented with clear writer boundaries.
  - Experiment runtime interface integrated with guard semantics.
  - Guarded `ops_*` pilot with full audit and concurrency controls.
  - Updated MCP docs and operator runbook for wave-2 usage.
- Post-delivery measurement plan:
  - Track S2A/S3/S10 runs with and without wave-2 inputs.
  - Track stale-artifact and blocked-stage rates before/after refresh status tooling.
  - Track anomaly time-to-detect and false-positive rate.
  - Track operator time spent assembling weekly S10 packs.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items (if any):
  - None for planning kickoff.
  - Implementation should gate on Phase 0 architecture decisions (tenancy model and analytics surface policy ownership/acceptance).
- Recommended next step:
  - Proceed to `/lp-plan` for `mcp-startup-loop-data-plane-wave-2`, sequencing read-only capabilities first and deferring guarded `ops_*` until policy and audit gates are validated.

## Source Baseline
- First-wave baseline references:
  - `docs/plans/mcp-startup-loop-data-plane/fact-find.md`
  - `docs/plans/mcp-startup-loop-data-plane/plan.md`
