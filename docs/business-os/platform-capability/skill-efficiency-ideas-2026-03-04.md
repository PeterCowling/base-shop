---
Type: Idea Pack
Status: Active
Domain: Skills / Platform
Created: 2026-03-04
Source-Audit: docs/business-os/platform-capability/skill-efficiency-audit-2026-03-04-1143.md
---

# Skill Efficiency Ideas — 2026-03-04

## Goal
Convert the 2026-03-04 skill-efficiency findings into realistic ideas that can move through `lp-do-ideas -> lp-do-build`.

## Prioritized Idea List

| Priority | Idea | Why now | Recommended route |
|---|---|---|---|
| P1 | Core Triad Size Budget Guardrails (`lp-do-fact-find`, `lp-do-plan`, `lp-do-build`) | These three regressed by +42 to +95 lines and are critical-path skills | lp-do-fact-find |
| P1 | Split `startup-loop/modules/cmd-advance.md` Monolith | Single 532L module creates maintenance and token concentration risk | lp-do-fact-find |
| P1 | Deterministic Extraction Program (TS/JSON/YAML-first) | Current signals are mostly structural; deterministic logic extraction is not explicitly enforced | lp-do-fact-find |
| P2 | Dispatch Adoption Wave for High-Signal Orchestrators | 29 dispatch-candidates still open; only 12% dispatch adoption overall | lp-do-fact-find |
| P2 | Wave-Dispatch Eligibility Rules + False-Positive Suppression | Current heuristics flag sequential workflows as wave-candidates; creates noisy backlog | lp-do-fact-find |
| P2 | Shared Assessment Modules/Template Extraction | Assessment skills duplicate structure heavily; shared modules reduce drift and maintenance cost | lp-do-fact-find |
| P3 | Skill Efficiency KPI Instrumentation | Current audit is structural only; needs observed ROI (tokens/time/error-rate) | lp-do-fact-find |
| P3 | Audit-to-Ideas Autopacket Bridge | Remove manual conversion step after each audit and keep queue freshness high | lp-do-fact-find |

## `lp-do-ideas` Intake Blocks (Copy/Paste)

Run each as a separate `operator_idea` submission.

### 1) Core Triad Size Budget Guardrails
Business: BOS  
Area anchor: BOS core workflow skills — enforce size budgets  
Domain: STRATEGY  
Why: The triad that every build cycle depends on has already regressed significantly; without guardrails it will drift back into monolith state.  
Intended outcome: Define and implement enforceable size-budget checks and exception policy for `lp-do-fact-find`, `lp-do-plan`, and `lp-do-build`.  
Evidence refs:
- docs/business-os/platform-capability/skill-efficiency-audit-2026-03-04-1143.md
- .claude/skills/lp-do-fact-find/SKILL.md
- .claude/skills/lp-do-plan/SKILL.md
- .claude/skills/lp-do-build/SKILL.md

### 2) Split `startup-loop/modules/cmd-advance.md` Module Monolith
Business: BOS  
Area anchor: startup-loop module — cmd-advance monolith split  
Domain: STRATEGY  
Why: A single 532-line module in the startup-loop command path concentrates complexity and raises edit risk.  
Intended outcome: Split `cmd-advance.md` into focused modules with unchanged external behavior and clearer maintenance boundaries.  
Evidence refs:
- docs/business-os/platform-capability/skill-efficiency-audit-2026-03-04-1143.md
- .claude/skills/startup-loop/modules/cmd-advance.md

### 3) Deterministic Extraction Program (TS/JSON/YAML-first)
Business: BOS  
Area anchor: skill logic layer — deterministic extraction program  
Domain: STRATEGY  
Why: Without explicit extraction goals, line reductions can be satisfied by moving prose around rather than moving deterministic rules into executable/data artifacts.  
Intended outcome: Define and execute extraction of deterministic rules, decision tables, and contracts into typed `.ts` or data (`.json/.yaml`) artifacts with validation tests.  
Evidence refs:
- docs/business-os/platform-capability/skill-efficiency-audit-2026-03-04-1143.md
- .claude/skills/meta-loop-efficiency/SKILL.md

### 4) Dispatch Adoption Wave for High-Signal Orchestrators
Business: BOS  
Area anchor: BOS orchestrators — dispatch adoption expansion  
Domain: STRATEGY  
Why: Dispatch adoption is still low, and high-phase orchestrators have unresolved parallelization potential.  
Intended outcome: Prioritize top orchestrators for true parallel-domain dispatch adoption and land first-wave conversions.  
Evidence refs:
- docs/business-os/platform-capability/skill-efficiency-audit-2026-03-04-1143.md
- .claude/skills/lp-do-worldclass/SKILL.md
- .claude/skills/lp-weekly/SKILL.md
- .claude/skills/lp-do-critique/SKILL.md

### 5) Wave Eligibility Rules + False-Positive Suppression
Business: BOS  
Area anchor: meta-loop heuristics — wave eligibility and suppression  
Domain: STRATEGY  
Why: Heuristic noise turns sequential flows into false wave-candidates, creating avoidable planning churn.  
Intended outcome: Define deterministic wave-eligibility criteria and suppress non-wave patterns in audit output.  
Evidence refs:
- docs/business-os/platform-capability/skill-efficiency-audit-2026-03-04-1143.md
- .claude/skills/meta-loop-efficiency/SKILL.md

### 6) Shared Assessment Modules/Template Extraction
Business: BOS  
Area anchor: assessment skills — shared modules and template baseline  
Domain: STRATEGY  
Why: Assessment skill growth is coupled with repeated structure; without shared modules, drift and duplicate edits continue.  
Intended outcome: Establish reusable shared module/template baseline and migrate first assessment wave onto it.  
Evidence refs:
- .claude/skills/lp-do-assessment-01-problem-statement/SKILL.md
- .claude/skills/lp-do-assessment-11-brand-identity/SKILL.md
- .claude/skills/lp-do-assessment-14-logo-brief/SKILL.md

### 7) Skill Efficiency KPI Instrumentation
Business: BOS  
Area anchor: skill platform telemetry — observed efficiency KPI layer  
Domain: STRATEGY  
Why: Structural scan data alone does not prove actual ROI or throughput gains.  
Intended outcome: Add observed KPIs (token usage, execution duration, rework rate) and report before/after impact per optimization wave.  
Evidence refs:
- docs/business-os/platform-capability/skill-efficiency-audit-2026-03-04-1143.md
- docs/business-os/startup-loop/ideas/trial/telemetry.jsonl

### 8) Audit-to-Ideas Autopacket Bridge
Business: BOS  
Area anchor: meta-loop pipeline — auto-create dispatch packets from audits  
Domain: STRATEGY  
Why: Manual conversion from audit findings to ideas is slow and error-prone.  
Intended outcome: Build deterministic conversion from qualifying audit findings into queue-ready dispatch packets.  
Evidence refs:
- .claude/skills/meta-loop-efficiency/SKILL.md
- docs/business-os/startup-loop/ideas/trial/queue-state.json
- docs/business-os/platform-capability/skill-efficiency-audit-2026-03-04-1143.md

## Anti-Gaming Acceptance Gates (for every implementation plan)

1. Orchestrator line-count reduction does not count as success by itself.
2. A task only counts as complete when deterministic rules moved into `.ts/.json/.yaml` where applicable.
3. Reject changes where `SKILL.md` shrinks but total skill markdown footprint grows without deterministic extraction artifacts.
4. Require behavior-parity validation for extracted logic.

## Suggested Execution Order (for throughput + risk)

1. Dispatch #1, #2, #3, #4 (P1 structural control + deterministic extraction baseline)
2. Dispatch #5, #6, #7 (adoption quality and scalability)
3. Dispatch #8, #9 (measurement and automation hardening)
