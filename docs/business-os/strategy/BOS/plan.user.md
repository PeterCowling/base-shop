---
Type: Business-Plan
Status: Active
Business: BOS
Created: 2026-02-09
Updated: 2026-02-09
Last-reviewed: 2026-02-09
Owner: Pete
---

# Business OS — Business Plan

## Strategy

### Current Focus (2026-02-09)

1. **Cabinet System Bootstrap** (Priority: High)
   - Status: Phase 0 (bootstrapping); CS-02 in progress (business plans + people profiles); D1-backed kanban operational
   - Next: Complete CS-02 (this task), then CS-03 (discovery index), then CS-04 (workload metrics)

2. **Agent Skill Ecosystem** (Priority: Medium)
   - Status: 31+ Claude Code skills authored; deployed at business-os.peter-cowling1976.workers.dev; Agent API functional
   - Next: Document skill authoring patterns, establish skill quality gates, consolidate overlapping skills

3. **Coordination Layer Validation** (Priority: High)
   - Status: BOS-ENG-0001 (Phase 2+ Plan) in fact-finding; kanban used actively but workflow automation not validated
   - Next: Validate Cabinet sweep workflow (risk/opportunity identification), measure coordination overhead

## Risks

### Active Risks

- **Single-User Validation Risk** (Severity: High, Added: 2026-02-09)
  - Source: Sole team member (Pete) in Phase 0; Cabinet System designed for multi-person coordination but untested at scale
  - Impact: Premature optimization; coordination overhead may exceed value until team grows
  - Mitigation: Keep Cabinet lightweight (manual sweeps, simple .user.md files); defer automation until Phase 1+ (multi-person)

- **Agent Skill Maintenance Burden** (Severity: Medium, Added: 2026-02-09)
  - Source: 31+ skills without versioning, deprecation policy, or quality gates; overlapping functionality (e.g., multiple translation skills)
  - Impact: Skill rot, user confusion, maintenance overhead
  - Mitigation: Establish skill registry, consolidate overlaps, add versioning and deprecation workflow

- **Cabinet Sweep Cadence Unknown** (Severity: Low, Added: 2026-02-09)
  - Source: Cabinet System plan assumes weekly sweeps but no evidence this cadence is sustainable
  - Impact: Stale business plans, missed risks/opportunities
  - Mitigation: Start with monthly sweeps, measure time cost, adjust cadence based on ROI

## Opportunities

### Validated (Ready for Cards)
_None yet — to be populated by Cabinet sweeps_

### Under Investigation
_None yet_

## Learnings

_No learnings recorded yet. This section is append-only — learnings are added after card reflections._

## Metrics

### Coordination Efficiency (Established: 2026-02-09)

- **Cards in Discovery:** 7 (across all businesses)
  - Target: <10 at any time (avoid discovery bloat)
  - Measurement: Manual count from discovery-index.md

- **Cards in Planned State:** 28+
  - Target: Planned backlog = 2-3 sprints of work (~10-15 cards)
  - Measurement: Manual count from kanban

- **Cabinet Sweep Time:** Not measured
  - Target: <2 hours per sweep (sustainable for weekly cadence)
  - Measurement: Manual tracking

### Agent Effectiveness (Established: 2026-02-09)

- **Skill Usage Rate:** Not measured
  - Target: Top 10 skills account for 80%+ usage
  - Measurement: Agent API logs (requires instrumentation)

### System Health (Established: 2026-02-09)

- **Writer Lock Violations:** 0 (enforced by pre-commit hooks)
  - Target: Maintain 0 (strict enforcement)
  - Measurement: Git history audit for SKIP_WRITER_LOCK=1 or --no-verify
