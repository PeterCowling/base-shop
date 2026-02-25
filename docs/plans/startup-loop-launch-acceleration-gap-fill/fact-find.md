---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: Venture-Studio
Workstream: Mixed
Created: 2026-02-24
Last-updated: 2026-02-24
Last-reviewed: 2026-02-24
Relates-to: docs/business-os/startup-loop/loop-spec.yaml
Feature-Slug: startup-loop-launch-acceleration-gap-fill
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-plan, startup-loop, lp-weekly
Related-Plan: docs/plans/startup-loop-launch-acceleration-gap-fill/plan.md
Business-OS-Integration: off
Business-Unit: BOS
Card-ID: none
artifact: fact-find
direct-inject: true
direct-inject-rationale: operator requested cross-loop acceleration audit focused on launch throughput, early revenue ramp, and outside-loop workload capture
---

# Startup Loop Launch Acceleration Gap Fill Fact-Find

## Scope
### Summary
Audit the startup-loop system for near-term acceleration leverage: specifically where launch-critical work is still performed outside the loop, which gaps should be plugged with skills/automation first, and how each incorporated workload should emit reusable signals for downstream decisioning.

### Goals
- Identify the highest-friction outside-loop workloads that slow launch speed and first-revenue ramp.
- Define a practical gap-fill pathway for each workload: loop-native skill and/or automation entrypoint.
- Define explicit signal outputs for each newly incorporated workload so outputs can be reused across planning, prioritization, and weekly decisions.
- Produce planning-ready execution seeds for `/lp-do-plan`.

### Non-goals
- Implementing the new skills/connectors in this fact-find run.
- Rewriting loop stage topology in `loop-spec.yaml`.
- Running per-business tactical execution (for example: direct ad launch, outbound campaign execution).

### Constraints & Assumptions
- Constraints:
  - Evidence source is repository state as of 2026-02-24.
  - This run is standalone (`Business-OS-Integration: off`), so no card/stage-doc writes are performed.
  - Existing contracts and canonical paths must remain authoritative.
- Assumptions:
  - Some run-time telemetry may exist outside the repo; this audit only claims repo-verifiable evidence.
  - Existing contract lint pass indicates structural integrity, so main bottlenecks are operational throughput and signal plumbing, not contract breakage.

## Evidence Audit (Current State)
### Entry Points
- `docs/business-os/startup-loop-workflow.user.md` - operator workflow, manual handoff requirements, and current stage-status snapshots.
- `docs/business-os/startup-loop/loop-spec.yaml` - canonical stage graph and `prompt_required` distribution.
- `.claude/skills/startup-loop/SKILL.md` - orchestrator wrapper and stage routing model.
- `.claude/skills/startup-loop/modules/cmd-advance.md` - advance-time gate logic and manual action requirements.
- `docs/business-os/startup-loop/marketing-sales-capability-contract.md` - capability completeness and current status.
- `docs/business-os/startup-loop/demand-evidence-pack-schema.md` - required demand signal structure.
- `docs/business-os/startup-loop/s10-weekly-orchestration-contract-v1.md` - weekly decision orchestration and failure posture.
- `docs/business-os/startup-loop/loop-output-contracts.md` - Layer B -> Layer A signal handoff contract.
- `packages/mcp-server/src/tools/loop.ts` - available loop/metering tooling surface.
- `packages/mcp-server/src/tools/bos.ts` - BOS sync tooling surface.
- `https://github.com/Dicklesworthstone/coding_agent_session_search` - CASS session indexing/search patterns.
- `https://github.com/Dicklesworthstone/cass_memory_system` - episodic/working/procedural memory model for coding agents.
- `https://github.com/Dicklesworthstone/meta_skill` - local-first skill memory/selection platform with MCP integration.

### Key Modules / Files
- `docs/business-os/startup-loop-workflow.user.md:476` - mandatory deep-research handoff rule.
- `docs/business-os/startup-loop-workflow.user.md:501` - required operator handoff message includes manual save/pointer/render steps.
- `docs/business-os/startup-loop-workflow.user.md:562` - prompt handoff map spans ASSESSMENT, MEASURE, MARKET, WEBSITE, SIGNALS.
- `docs/business-os/startup-loop-workflow.user.md:584` - explicit output hygiene steps required on every prompt run.
- `docs/business-os/startup-loop/loop-spec.yaml` - local parse shows 15 `prompt_required: true` stage definitions (command-backed; see Reproducible Evidence Commands below).
- `docs/business-os/startup-loop/marketing-sales-capability-contract.md:39` - CAP-02 marked missing first-class enforcement [stale as-of 2026-02-17 table baseline].
- `docs/business-os/startup-loop/marketing-sales-capability-contract.md:53` - `message-variants.user.md` still recorded as proposed/deferred [stale as-of 2026-02-17 table baseline].
- `packages/mcp-server/src/tools/loop.ts:115` - measurement connector list includes `stripe`, `d1_prisma`, `cloudflare`, `ga4_search_console`, `email_support`.
- `packages/mcp-server/src/tools/loop.ts:560` - `loop_content_sources_collect` exists for source artifact ingestion.
- `docs/business-os/startup-loop/s10-weekly-orchestration-contract-v1.md:183` - first-iteration no-block policy for failures.
- startup-loop docs/skills currently expose no canonical transcript input path for agent-session mining.
  - Evidence: targeted scan on `docs/business-os/startup-loop*` and `.claude/skills/startup-loop*` for `.claude/projects`, `.claude/sessions`, `.codex`, `session transcript`, `conversation transcript` returned no matches (2026-02-24).

### Reproducible Evidence Commands (2026-02-24)
1. `prompt_required` stage count and IDs:

```bash
awk '/^[[:space:]]*- id:/{id=$3}/prompt_required: true/{print id}' docs/business-os/startup-loop/loop-spec.yaml | tee /tmp/prompt_required_ids.txt && wc -l /tmp/prompt_required_ids.txt
```

Output:

```text
ASSESSMENT-09
ASSESSMENT-10
ASSESSMENT-11
MEASURE-01
MEASURE-02
PRODUCT-01
MARKET-01
MARKET-02
MARKET-03
MARKET-04
MARKET-05
S5A
WEBSITE-01
WEBSITE-02
SIGNALS
      15 /tmp/prompt_required_ids.txt
```

2. Transcript-path and conversation-term scan in startup-loop docs/skills:

```bash
rg -n "\\.claude/sessions|\\.claude/projects|\\.codex|codex history|claude history|chat transcript|conversation transcript|session transcript" docs/business-os/startup-loop .claude/skills/startup-loop docs/business-os/startup-loop-workflow.user.md || true
```

Output:

```text
(no matches)
```

3. CAP-02/05/06 artifact presence scan for active businesses:

```bash
for b in HEAD PET BRIK; do echo "== $b =="; for f in message-variants.user.md sales-ops.user.md retention.user.md; do p="docs/business-os/strategy/$b/$f"; if [ -f "$p" ]; then echo "present $f"; else echo "missing $f"; fi; done; done
```

Output:

```text
== HEAD ==
missing message-variants.user.md
missing sales-ops.user.md
missing retention.user.md
== PET ==
missing message-variants.user.md
missing sales-ops.user.md
missing retention.user.md
== BRIK ==
missing message-variants.user.md
missing sales-ops.user.md
missing retention.user.md
```

4. Weekly packet and weekly-decision artifact scan:

```bash
for b in HEAD PET BRIK; do echo "== $b s10 packet =="; find "docs/business-os/strategy/$b" -maxdepth 1 -type f -name 's10-weekly-packet-*'; done
for b in HEAD PET BRIK; do echo "== $b weekly decision =="; find "docs/business-os/strategy/$b" -maxdepth 1 -type f -name '*-weekly-kpcs-decision.user.md'; done
```

Output:

```text
== HEAD s10 packet ==
== PET s10 packet ==
== BRIK s10 packet ==
== HEAD weekly decision ==
docs/business-os/strategy/HEAD/2026-02-12-weekly-kpcs-decision.user.md
== PET weekly decision ==
docs/business-os/strategy/PET/2026-02-12-weekly-kpcs-decision.user.md
== BRIK weekly decision ==
docs/business-os/strategy/BRIK/2026-02-13-weekly-kpcs-decision.user.md
```

5. Contract lint baseline:

```bash
bash scripts/check-startup-loop-contracts.sh
```

Output:

```text
Startup Loop contract lint: 20 checks, 0 warnings
RESULT: PASS — all contract checks passed
```

### Patterns & Conventions Observed
- Prompt-heavy stages still depend on operator-run external workflows and manual artifact hygiene.
  - Evidence: `docs/business-os/startup-loop-workflow.user.md:476`, `:501`, `:562`, `:584`.
- Capability contracts exist, but high-value revenue primitives are still weakly captured in practice (message variants/sales ops/retention artifacts absent for HEAD/PET/BRIK in repo scan).
  - Evidence: `docs/business-os/startup-loop/marketing-sales-capability-contract.md:39`, `:53`; file presence check on `docs/business-os/strategy/{HEAD,PET,BRIK}/{message-variants.user.md,sales-ops.user.md,retention.user.md}`.
- Structural tooling is ahead of operational adoption: loop/bos tooling surfaces are broad, but launch-ops ingestion remains partial.
  - Evidence: `packages/mcp-server/src/tools/loop.ts:560`, `packages/mcp-server/src/tools/bos.ts:289`.
- Weekly orchestration is contract-defined, but repo artifact footprint indicates sparse adoption (`s10-weekly-packet-*` absent in HEAD/PET/BRIK directories; weekly decision files present only at 2026-02-12 for HEAD/PET and 2026-02-13 for BRIK in current tree).
  - Evidence: file scan under `docs/business-os/strategy/{HEAD,PET,BRIK}/`.

### Data & Contracts
- Existing closed-loop contract is explicit: `results-review.user.md` feeds Layer A standing updates.
  - Evidence: `docs/business-os/startup-loop/loop-output-contracts.md:20`, `:150`, `:157`, `:177`.
- Weekly operations intentionally tolerate restricted/noisy conditions without blocking stage close in phase 1.
  - Evidence: `docs/business-os/startup-loop/s10-weekly-orchestration-contract-v1.md:178`, `:183`, `:192`.
- Demand Evidence Pack already defines pass-floor fields usable as a signal schema.
  - Evidence: `docs/business-os/startup-loop/demand-evidence-pack-schema.md`.

### External Research (CASS/CASS Memory/Meta Skill)
- CASS (`coding_agent_session_search`) provides a local index over multi-agent coding session history and explicit non-interactive robot/json interfaces (`cass search/view/expand --robot|--json`).
  - Evidence: `https://github.com/Dicklesworthstone/coding_agent_session_search` (`README.md`, “Agent Quickstart (Robot Mode)”).
- CASS “Universal Connectors” define Claude Code session JSONL location as `~/.claude/projects` and include codex session-source examples (`~/.codex/sessions`).
  - Evidence: `https://github.com/Dicklesworthstone/coding_agent_session_search` (`README.md`, “Universal Connectors”).
- cass-memory models memory as episodic (raw sessions) -> working (structured diary) -> procedural (confidence-tracked playbook rules), including decay and anti-pattern handling.
  - Evidence: `https://github.com/Dicklesworthstone/cass_memory_system` (`README.md`, “Why This Exists”, “How It Works”, “Confidence Decay System”, “Anti-Pattern Learning”).
- meta_skill (`ms`) adds local-first skill storage/search/selection with dual persistence (SQLite + Git), hybrid retrieval, adaptive ranking, and MCP integration.
  - Evidence: `https://github.com/Dicklesworthstone/meta_skill` (`README.md`, “What ms Actually Is”, “MCP Server”).
- All three repos currently publish `MIT License (with OpenAI/Anthropic Rider)`; treat them as pattern references unless explicit legal clearance exists for code vendoring/embedding.
  - Evidence: `LICENSE` file in each repository (fetched 2026-02-24).
- Transferable pattern for Base-Shop [inferred]: treat agent conversations as first-class evidence inputs for loop gap discovery, then distill recurring operational fixes into executable skills and contracts; phase-1 should reuse patterns, not vendor dependencies.

### Outside-Loop Workload -> Gap Fill -> Signal Matrix
| Outside-loop workload (today) | Current evidence | Gap-fill capability (proposed) | Signal output contract (required) | Primary consumers |
|---|---|---|---|---|
| Agent conversations reviewed ad hoc to spot out-of-loop work | No canonical transcript-ingestion path in startup-loop docs/skills; discovery depends on manual reading | New discovery worker `lp-discover-loop-gaps-from-sessions` (CASS-style session ingestion + taxonomy tagging) | `docs/business-os/startup-loop/discovery/<YYYY-MM-DD>-conversation-gap-observations.json` with schema versioning + redacted source refs | `/lp-do-fact-find`, `/lp-do-plan`, startup-loop maintainers |
| Deep research runs + manual save/pointer/render | `startup-loop-workflow.user.md:501`, `:509`, `:514`, `:515` | New orchestration skill `lp-research-handoff-runner` to execute handoff checklist, enforce output path, update latest pointer, render HTML | `research-run-log.user.md` + normalized citation block (`source_id`, `url`, `captured_at`, `artifact_path`) | MARKET stages, WEBSITE stages, `/lp-do-fact-find` |
| Demand evidence/message-variant logging mostly manual and incomplete | `marketing-sales-capability-contract.md:39`, `:53`; DEP schema exists but partial adoption | New capture skill `lp-capture-demand-signals` (DEP + message variants writer with validation) | `message-variants.user.md` + DEP status delta (`pass|partial|fail` by hypothesis) | SELL-01, SIGNALS, bottleneck diagnosis |
| Sales ops and retention execution knowledge held outside loop docs | missing files in `docs/business-os/strategy/{HEAD,PET,BRIK}/` | New paired skills `lp-capture-sales-ops` and `lp-capture-retention` with schema-bound prompts | `sales-ops.user.md`, `retention.user.md`, plus weekly KPI denominator linkage map | SIGNALS, forecast recalibration, prioritize |
| Weekly decision execution not consistently routed through weekly packet contract | `s10-weekly-packet-*` absent in strategy folders | `/lp-weekly` dispatcher enforcement ladder (L0 advisory -> L1 soft gate -> L2 hard gate) in startup-loop advance for SIGNALS | `s10-weekly-packet-<YYYY-Www>.md` + lane completeness flags + missing-artifact reason codes | Operator decisions, signal review, replan triggers |
| Channel-performance data relies on manual extracts across ad/CRM surfaces | limited connector enum in `loop.ts:115-120` | Connector expansion + `measure_snapshot_get` normalization extension (meta/google/tiktok/ota exports) | source-normalized measure artifacts with denominator provenance + attribution confidence + window metadata (minimum viable measurement) | forecast, weekly KPCS, anomaly detection |
| Standing refresh source collection remains partially manual despite collector tools | manual handoff text in workflow + `loop_content_sources_collect` availability | Auto-collector wrapper integrated into monthly/quarterly refresh flows | `sources.index.json` freshness stamp + source coverage score | standing refresh prompts, market/SEO updates |

### Quantified Prioritization Model
Scoring fields per workload conversion (baseline values must be explicit in plan):
- `frequency_per_week`
- `median_minutes`
- `p90_minutes`
- `stage_criticality` (1-5)
- `downstream_leverage` (1-5)
- `implementation_effort` (1-5)
- `adoption_friction` (1-5)
- `data_risk` (1-5)
- `operator_minutes_saved_per_week`
- `operator_minutes_added_per_week`

Priority formula:

```text
Priority Score =
(frequency_per_week × median_minutes × stage_criticality × downstream_leverage)
/ (implementation_effort × adoption_friction × data_risk)
```

Adoption economics guardrail:

```text
Net Operator Minutes/Week = operator_minutes_saved_per_week - operator_minutes_added_per_week
```

Baseline assumptions used for initial ordering:
- 3 active businesses in current strategy tree (`HEAD`, `PET`, `BRIK`).
- Median/p90 minute estimates are based on explicit manual steps in workflow handoff requirements (`save`, `pointer update`, `render`, quality checks), then should be remeasured during pilot week 1.
- Scores are for ordering, not absolute ROI forecasting.

### Ordered First-Wave Backlog (Planning Input)
| Rank | Conversion | Freq/wk | Median (min) | p90 (min) | Criticality | Leverage | Effort | Adoption friction | Data risk | Saved min/wk | Added min/wk | Net min/wk | Priority score |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | `lp-research-handoff-runner` | 6 | 22 | 35 | 5 | 4 | 2 | 2 | 1 | 90 | 18 | 72 | 660 |
| 2 | `lp-capture-demand-signals` (DEP + CAP-02) | 9 | 18 | 30 | 5 | 5 | 3 | 3 | 2 | 96 | 30 | 66 | 225 |
| 3 | `/lp-weekly` dispatcher enforcement (L0 first) | 3 | 15 | 25 | 4 | 5 | 2 | 2 | 1 | 30 | 8 | 22 | 225 |
| 4 | Source collector coupling wrapper | 3 | 20 | 35 | 3 | 4 | 3 | 2 | 2 | 36 | 12 | 24 | 60 |
| 5 | CAP-05/CAP-06 capture wrappers | 3 | 25 | 40 | 4 | 4 | 3 | 4 | 2 | 45 | 18 | 27 | 50 |
| 6 | Conversation-derived gap miner (pilot-limited) | 1 | 90 | 120 | 2 | 3 | 4 | 2 | 4 | 45 | 20 | 25 | 17 |

### Ordered First-Wave Implementation Contract
| ID | Backlog item | Why top priority (numeric) | Required artifacts (canonical paths) | Acceptance criteria | Dependencies | Rollback |
|---|---|---|---|---|---|---|
| W1-01 | Research handoff runner | Score 660; net 72 min/week saved | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-research-run-log.user.md`; existing target artifact paths from prompt map; existing `latest.user.md` pointers | Runner executes save/pointer/render checklist with deterministic output; p50/p90 handoff latency emitted | existing prompt templates + render command | disable runner hook and revert to current manual handoff message |
| W1-02 | Demand signal capture | Score 225; net 66 min/week saved | `docs/business-os/strategy/<BIZ>/message-variants.user.md`; DEP artifact in `docs/business-os/market-research/<BIZ>/` | CAP-02 schema passes; DEP hypothesis rows include `pass|partial|fail`; missing fields are blocked at validator | DEP schema + new CAP-02 schema + writer skill | keep advisory warnings; allow manual entry path until fixed |
| W1-03 | Weekly packet dispatcher L0 | Score 225; net 22 min/week saved | `docs/business-os/strategy/<BIZ>/s10-weekly-packet-<YYYY-Www>.md`; `docs/business-os/strategy/<BIZ>/s10-weekly-packet-latest.md` | L0 warning emitted when missing; no stage-close block in phase 1; missing reason recorded | `lp-weekly` contract + startup-loop advance integration | set enforcement mode `L0-disabled` and preserve current weekly decision flow |
| W1-04 | Source collector coupling | Score 60; net 24 min/week saved | `docs/business-os/strategy/<BIZ>/sources.index.json` | collector writes freshness stamp and coverage score; source provenance complete | `loop_content_sources_collect` + source mapping config | disable wrapper and use current manual source-refresh checklist |
| W1-05 | CAP-05/CAP-06 wrappers | Score 50; net 27 min/week saved | `docs/business-os/strategy/<BIZ>/sales-ops.user.md`; `docs/business-os/strategy/<BIZ>/retention.user.md` | schema-defined required fields complete; weekly denominator links present | existing `sales-ops-schema.md`, `retention-schema.md` | revert to operator-authored docs without wrapper enforcement |
| W1-06 | Conversation gap miner pilot | Score 17; net 25 min/week saved | `docs/business-os/startup-loop/discovery/<YYYY-MM-DD>-conversation-gap-observations.json` | redaction enforced; no raw transcript commits; observation precision >=0.70 in pilot sample | transcript governance policy + ingestion adapters | stop ingestion worker and keep manual conversation review |

### Signal Artifact Contract Template
For every new capture/automation workload, planning must produce:
1. Artifact name.
2. Canonical path.
3. Schema version and required fields.
4. Producer skill/tool.
5. Validator check ID and command hook.
6. Downstream consumers.
7. Freshness SLA.
8. Example payload pointer.

### Signal Artifact Contracts (Initial Set)
| Artifact | Canonical path | Schema version + required fields | Producer | Validator hook | Primary consumers | Freshness SLA | Example payload pointer |
|---|---|---|---|---|---|---|---|
| Conversation gap observations | `docs/business-os/startup-loop/discovery/<YYYY-MM-DD>-conversation-gap-observations.json` | `v1`; `work_unit`, `outside_loop_step`, `proposed_stage`, `proposed_skill`, `signal_artifact`, `confidence`, `source_session_ref_hash`, `captured_at` | `lp-discover-loop-gaps-from-sessions` | Proposed ACC-01 check in `scripts/check-startup-loop-contracts.sh` extension | `/lp-do-fact-find`, `/lp-do-plan`, loop maintainers | weekly | add sample block in planned `conversation-gap-observations-schema-v1.md` |
| Research run log | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-research-run-log.user.md` | `v1`; target artifact path, source citations, checklist status, render status, duration fields | `lp-research-handoff-runner` | Proposed ACC-02 check (required checklist + rendered companion) | MARKET/WEBSITE stages, fact-find | per run (same day) | add sample in planned `research-run-log-schema-v1.md` |
| Message variants (CAP-02) | `docs/business-os/strategy/<BIZ>/message-variants.user.md` | `v1` (new schema to define); variant text, channel, numerator, denominator, outcome, timestamp, source tag | `lp-capture-demand-signals` | Proposed ACC-03 check + CAP-02 schema validator | SELL/SIGNALS, weekly decision, bottleneck diagnosis | weekly | add sample in planned `message-variants-schema-v1.md` |
| Sales ops (CAP-05) | `docs/business-os/strategy/<BIZ>/sales-ops.user.md` | Existing canonical schema: `docs/business-os/startup-loop/sales-ops-schema.md` | `lp-capture-sales-ops` | existing schema review + proposed ACC-04 recency check | SIGNALS, forecast, prioritize | weekly while active | `docs/business-os/startup-loop/sales-ops-schema.md` examples |
| Retention (CAP-06) | `docs/business-os/strategy/<BIZ>/retention.user.md` | Existing canonical schema: `docs/business-os/startup-loop/retention-schema.md` | `lp-capture-retention` | existing schema review + proposed ACC-05 recency check | SIGNALS, forecast recalibration | weekly once activated | `docs/business-os/startup-loop/retention-schema.md` examples |
| Weekly packet | `docs/business-os/strategy/<BIZ>/s10-weekly-packet-<YYYY-Www>.md` + latest pointer file | Existing canonical schema: `docs/business-os/startup-loop/s10-weekly-packet-schema-v1.md` | `lp-weekly` | existing weekly packet preflight + proposed ACC-06 freshness scan | S10 operator decisions, signal review | weekly | `docs/business-os/startup-loop/s10-weekly-packet-schema-v1.md` sample packet |
| Source index | `docs/business-os/strategy/<BIZ>/sources.index.json` | `v1`; `source_id`, `url`, `captured_at`, `freshness_days`, `coverage_score`, `provenance` | source collector wrapper | Proposed ACC-07 source-index validator | standing refresh prompts, MARKET/SEO updates | monthly or on major shift | add sample in planned `sources-index-schema-v1.md` |
| Measure snapshot extensions | run-scoped measure snapshot artifact (via `measure_snapshot_get`) | `v1`; metric, numerator, denominator, source, window_start/end, attribution_confidence | connector collectors + measure normalizer | existing measure pipeline validation + proposed ACC-08 denominator checks | weekly KPCS, forecast, anomalies | weekly | add sample in planned `measure-snapshot-extension-schema-v1.md` |

### Conversation-Mining Governance Contract
- Canonical source priority for phase-1:
  - `~/.claude/projects/**/*.jsonl` (CASS-documented Claude Code connector path).
  - `~/.codex/sessions/**/*.jsonl` (CASS source example path).
  - Additional stores only by explicit opt-in.
- Privacy and data-handling rules:
  - Raw transcripts are local-only runtime inputs and MUST NOT be committed to repo.
  - Persisted repo artifact contains only structured observations and hashed source refs.
  - Redaction pass is required before write: emails, phone numbers, secrets, tokens, payment identifiers.
- Retention policy:
  - Raw transcript cache: 30 days max (local, non-repo).
  - Derived observation artifacts: 180 days rolling in repo, then archive or supersede.
- Access policy:
  - Discovery outputs are limited to startup-loop maintainers + planning workflows.

### Weekly Packet Enforcement Levels
| Level | Behavior | Stage impact | Promotion criteria |
|---|---|---|---|
| L0 (Advisory) | Warn when packet missing/stale; register reason code | No block | Default phase-1 mode |
| L1 (Soft gate) | Require explicit acknowledgement reason to close SIGNALS when packet missing/stale | Close allowed with reason | Promote after 2 consecutive successful weeks with packet freshness >=90% |
| L2 (Hard gate) | Block SIGNALS close until packet exists and freshness passes | Blocks close | Promote after additional 2 weeks at >=95% freshness and no unresolved publish failures |

### Minimum Viable Measurement Principle (Connector Expansion)
- Phase-1 connector goal is denominator-valid trend direction, not full attribution perfection.
- A connector payload is admissible only if it includes:
  - metric identity,
  - numerator/denominator semantics,
  - population/window,
  - source provenance,
  - attribution confidence.
- Begin with top two revenue-critical sources per business before expanding.

### Dependency & Impact Map
- Upstream dependencies:
  - External systems: GA4/Search Console, ad platforms, booking systems, CRM/support channels.
  - Operator-provided qualitative inputs (objections, sales notes, retention reasons).
- Downstream dependents:
  - `/lp-offer`, `/lp-channels`, `/lp-forecast`, `/lp-prioritize`, `/lp-weekly`, `/lp-do-fact-find`.
- Likely blast radius:
  - Faster stage progression from MEASURE/MARKET to SELL and DO.
  - Higher-quality denominator and attribution signal for weekly decisions.
  - Lower operator coordination overhead for recurring launch work.

### Delivery & Channel Landscape
- Audience/recipient:
  - Venture-studio operator and startup-loop maintainers.
- Channel constraints:
  - Must preserve existing canonical artifact paths and gate semantics.
- Existing templates/assets:
  - Workflow prompt templates and capability schemas are already present; missing layer is automation wrappers and ingestion enforcement.
- Approvals/owners:
  - Operator owns business-facing choices; maintainers own skill/tooling implementation.
- Measurement hooks:
  - Current hooks exist via DEP schema, weekly decision templates, and MCP measure tools; coupling is incomplete.

### Test Landscape
#### Test Infrastructure
- Startup-loop contract lint script currently passes.
  - Evidence: `bash scripts/check-startup-loop-contracts.sh` (2026-02-24 run; PASS).
- Existing MCP/startup-loop tests focus on contract/tool correctness, not operator workload latency.

#### Coverage Gaps
- No deterministic pipeline exists to mine agent conversations into structured “outside-loop workload” findings.
- No deterministic test asserts that prompt-handoff stages can be completed without manual file hygiene actions.
- No automated completeness scan for weekly packet production by business/week.
- No CI check for presence/recency of CAP-02/05/06 artifacts per active business.

#### Recommended Test Approach
- Contract tests for new capture skills (schema validation + canonical path write behavior).
- Governance checks for weekly packet existence and freshness.
- Pilot telemetry checks: cycle-time from MARKET-01 handoff to SELL-01 readiness.

## Hypothesis & Validation Landscape
### Key Hypotheses
| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | Launch throughput is mainly constrained by manual handoff/hygiene work, not missing stage definitions. | Accurate mapping of operator actions in workflow docs | Low | 1 week pilot |
| H2 | Converting outside-loop recurring work into schema-bound capture skills will reduce time-to-first-revenue decisions. | Adoption of capture skills in at least one active business | Medium | 2-3 weeks |
| H3 | Signal quality improves materially when each added workload emits explicit machine-readable artifacts, not narrative-only notes. | Signal schema adoption + downstream consumption hooks | Medium | 2 weekly cycles |

### Existing Signal Coverage
| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | Explicit manual handoff policy and manual output hygiene steps are documented | `startup-loop-workflow.user.md:476-587` | High |
| H2 | Capability gaps and missing artifacts are contract-documented | `marketing-sales-capability-contract.md:39`, `:53`, repo file-presence scan | Medium |
| H3 | Loop already defines feedback contracts but allows restricted-mode continuation and operator-mediated updates | `loop-output-contracts.md:20`, `s10-weekly-orchestration-contract-v1.md:178-192` | Medium |

### Falsifiability Assessment
- Easy to test:
  - Weekly packet production compliance after enforced `/lp-weekly` dispatch.
  - DEP/message-variant capture completeness before SELL spend activation.
- Hard to test:
  - Causal uplift of revenue ramp attributable only to loop automation (confounded by offer/channel quality).
- Validation seams needed:
  - Per-stage cycle-time telemetry (`handoff_started_at`, `artifact_ready_at`, `gate_passed_at`).
  - Standardized missing-signal reason taxonomy.

### Recommended Validation Approach
- Quick probes:
  - Run one business pilot (BRIK preferred due existing DEP baseline) with explicit outside-loop capture wrappers.
- Structured tests:
  - Two-cycle A/B operational comparison: manual path vs loop-assisted path for same stage family.
- Deferred validation:
  - Full revenue-lift inference after at least 4 weeks of standardized capture.

### Pilot Success Metrics By Conversion
| Conversion | Metric | Week-1 target | Week-2 target | Failure trigger |
|---|---|---|---|---|
| Research handoff runner | `handoff_started_at -> artifact_ready_at` p50/p90 | p50 <= 30 min; p90 <= 45 min | p50 <= 20 min; p90 <= 35 min | p90 worsens vs baseline or render/pointer failures >5% |
| Demand signal capture | `% hypotheses with DEP status + variant denominator fields` | >=70% completeness | >=90% completeness | completeness <70% after week 2 |
| Weekly packet enforcement | `% businesses with fresh packet + latest pointer` | >=67% (2 of 3 businesses) | >=100% | any week with freshness <67% without reason code |
| Source collector coupling | `source coverage score` + freshness days | coverage >=0.60 | coverage >=0.80 | coverage stagnates and manual extraction time does not drop |
| CAP-05/CAP-06 wrappers | schema pass rate | >=50% for pilot business | >=80% for pilot business | required fields repeatedly missing after operator assist |
| Conversation gap miner pilot | observation precision (manual adjudication sample) | >=0.60 | >=0.70 | precision <0.60 or privacy redaction failure |

## Questions
### Resolved
- Q: Are current bottlenecks primarily contract drift or throughput friction?
  - A: Throughput friction is currently the larger constraint; contract lint is green.
  - Evidence: `scripts/check-startup-loop-contracts.sh` pass, plus manual handoff burden in workflow docs.
- Q: Is there already a schema foundation for demand signal capture?
  - A: Yes; DEP schema exists and can be used as a direct automation substrate.
  - Evidence: `docs/business-os/startup-loop/demand-evidence-pack-schema.md`.
- Q: Does loop tooling already support source collection and anomaly checks?
  - A: Yes, partially; source collection and anomaly tools exist, but flow-level coupling is incomplete.
  - Evidence: `packages/mcp-server/src/tools/loop.ts:560`, `:601`, `:616`, `:631`.

### Open (User Input Needed)
- Q: Confirm phase-1 transcript governance defaults: source paths (`~/.claude/projects`, `~/.codex/sessions`), 30-day raw local retention, and no raw transcript commits.
  - Why it matters: determines discovery coverage, privacy posture, and legal/compliance safety.
  - Decision impacted: conversation-mining adapter implementation and artifact contract enforcement.
  - Decision owner: Pete.
  - Default assumption (if any) + risk: use defaults above; risk is lower coverage if other agent stores are excluded.
- Q: Which business should be mandatory pilot for the first acceleration wave (`BRIK` default vs `HEAD`)?
  - Why it matters: determines data richness and speed of signal verification.
  - Decision impacted: task sequencing and success metrics for phase-1 implementation.
  - Decision owner: Pete.
  - Default assumption (if any) + risk: default `BRIK`; risk is hospitality-specific bias in capability design.
- Q: Confirm enforcement ladder thresholds for L0 -> L1 -> L2 promotion (90%/95% freshness default) and whether L2 is allowed in phase-1 or deferred to phase-2.
  - Why it matters: affects adoption pressure vs operator flexibility while preserving no-block posture in early weekly operations.
  - Decision impacted: gate policy in `startup-loop` and `/lp-weekly`.
  - Decision owner: Pete.
  - Default assumption (if any) + risk: run L0 only in phase-1, stage L1/L2 behind explicit promotion criteria; risk is slower convergence on completeness.

## Confidence Inputs
Rubric (re-scoreable):
- 1.0 = weak/unreliable; planning likely to churn.
- 2.0 = partial signal; major unknowns unresolved.
- 3.0 = credible but significant implementation/test gaps.
- 4.0 = strong and mostly implementation-ready.
- 5.0 = execution-ready with validated telemetry and governance.

Scoring conversion: `percent = (score / 5.0) * 100`.

| Dimension | Score (1-5) | Percent | Evidence basis | What makes it >=90% |
|---|---:|---:|---|---|
| Implementation | 3.9 | 78% | Strong gap mapping + ordered backlog; no live implementation slice yet | complete one pilot slice with measured time savings and validator pass |
| Approach | 4.3 | 86% | Reuses canonical contracts/schemas; avoids stage-topology change | prove one end-to-end conversion with downstream consumer reuse |
| Impact | 4.2 | 84% | High-score items sit on launch critical path and show net positive operator economics | 2-4 week cycle-time and denominator-validity uplift trend |
| Delivery-Readiness | 3.65 | 73% | Artifact contracts defined but validators/hooks are still proposed | finalize task IDs, owners, and rollout schedule in `/lp-do-plan` |
| Testability | 3.55 | 71% | Deterministic checks outlined; not yet wired in CI/governance | land ACC checks + cycle-time regression alarms |

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| New automation adds ceremony without reducing real operator work | Medium | High | Track `saved_min/wk`, `added_min/wk`, and `net_min/wk`; stop rollout if net is non-positive for 2 consecutive weeks |
| Overly aggressive gating slows execution for early-stage businesses | Medium | Medium | Phase rollout: advisory first, hard gates only after baseline evidence |
| Connector expansion increases maintenance surface and data quality variance | Medium | Medium | Start with top 2 revenue-critical sources and enforce provenance metadata |
| Signal artifacts become verbose but not decision-usable | Medium | High | Define consumer-specific required fields per artifact (forecast, weekly, prioritize) |
| Business-specific bias from single pilot distorts generalized workflow | Medium | Medium | Run second pilot in a different business profile before broad rollout |
| Drift between skills and docs reappears during rapid iteration | Low | Medium | Extend contract lint to include new acceleration artifacts and coupling checks |
| Transcript ingestion leaks PII/secrets into durable artifacts | High | High | Enforce redaction pre-write, hash source refs, prohibit raw transcript commits, define retention windows |
| External repo licensing constraints block direct code reuse | Medium | Medium | Treat CASS/cass-memory/meta_skill as pattern references in phase-1; legal review required before vendoring or embedding code |

## Planning Constraints & Notes
- Must-follow patterns:
  - Reuse canonical artifact paths; no side-channel docs for production loop outputs.
  - Every new workload automation must define explicit signal output schema and downstream consumer.
  - Keep stage graph stable unless a separate approved topology change is created.
  - Conversation mining must treat raw transcripts as non-repo inputs; only redacted, structured observations may persist.
  - External CASS/cass-memory/meta_skill integration is pattern-level only in phase-1; no vendoring without legal sign-off.
- Rollout/rollback expectations:
  - Deliver in small waves (capture skill -> validation check -> consumer integration).
  - Rollback path per wave: disable new gate/check and keep existing manual path operational.
- Observability expectations:
  - Track stage handoff latency, capture completeness rate, and weekly packet freshness per business.
  - Track adoption economics (`saved_min/wk`, `added_min/wk`, `net_min/wk`) per conversion.

## Suggested Task Seeds (Non-binding)
- Add a conversation-derived discovery lane:
  - ingest agent sessions,
  - extract out-of-loop work units,
  - emit structured gap observations,
  - apply privacy redaction + hash-only source refs,
  - route accepted findings into `/lp-do-fact-find` seeds.
- Define phase-1 acceleration target model with four mandatory conversions:
  - deep-research handoff runner,
  - demand-signal capture,
  - weekly packet enforcement,
  - source-collector coupling.
- Build CAP-02 artifact contract hardening:
  - finalize `message-variants.user.md` schema + writer/validator skill.
- Add CAP-05/CAP-06 capture wrappers with schema validation and recency checks.
- Extend loop governance checks:
  - weekly packet existence/freshness,
  - missing capture artifact warning registry,
  - stage-to-signal completeness score,
  - enforcement ladder state (L0/L1/L2) and promotion criteria.
- Add connector expansion roadmap for paid channel and OTA surfaces with provenance.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `lp-do-plan`, `startup-loop`, `lp-weekly`
- Deliverable acceptance package:
  - New/updated skills for outside-loop workload ingestion,
  - explicit signal artifact schemas and canonical paths,
  - governance checks proving capture completeness/freshness.
- Post-delivery measurement plan:
  - Handoff latency trend by stage,
  - capture completeness for CAP-02/05/06 artifacts,
  - weekly decision denominator validity coverage,
  - first-revenue decision lead time.

## Evidence Gap Review
### Gaps Addressed
- Verified canonical workflow evidence for manual handoff and file hygiene burden.
- Verified current contract health via startup-loop contract lint pass.
- Verified existing schema/tool surfaces that can be reused for acceleration (DEP, MCP collectors/anomaly tools).
- Added external pattern review from CASS/cass-memory/meta_skill and converted relevant concepts into loop-specific discovery and signal contracts.
- Replaced scan-based inferred claims with replayable command + output evidence blocks.

### Confidence Adjustments
- Reduced Delivery-Readiness and Testability below 80 due to absent implementation telemetry and missing operational assertions.
- Kept Approach/Impact above 80 because required contract primitives already exist and can be composed.

### Remaining Assumptions
- Runtime signal artifacts not committed to repo are discoverable via operational tooling when needed.
- Operator accepts phased adoption (advisory -> hard gate) for new capture flows.
- Pilot business can allocate sufficient cadence for 2 consecutive weekly cycles.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None for planning. Open questions can be resolved as early plan decisions.
- Recommended next step:
  - `/lp-do-plan docs/plans/startup-loop-launch-acceleration-gap-fill/fact-find.md`
