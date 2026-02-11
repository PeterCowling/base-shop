---
Type: Ideas-Readiness
Status: Historical
Date: 2026-02-10
Run-Status: blocked
Scope: BRIK, PIPE, PLAT, BOS
Max-Age-Days: 21
---

# Ideas Readiness Audit

Readiness status: BLOCKED. Do not run `/ideas-go-faster` until listed blockers are resolved.

## 1. Scope and Inputs

- Scope: all active businesses (`BRIK`, `PIPE`, `PLAT`, `BOS`)
- Staleness threshold: 21 days
- Inputs audited:
  - `docs/business-os/strategy/<BIZ>/plan.user.md`
  - `docs/business-os/people/people.user.md`
  - working tree changed paths from `git status --short`
  - `docs/business-os/cards/` and existing sweep artifacts

## 2. Gate Table (Per Business)

| Business | RG-01 Freshness | RG-02 Outcome Clarity | RG-03 Business-vs-Code Balance | RG-04 Code-to-Plan Traceability | RG-05 Tooling/Data Prereqs | RG-06 Decision Context |
|---|---|---|---|---|---|---|
| BRIK | pass | block | warning | block | block | block |
| PIPE | pass | block | block | block | block | block |
| PLAT | pass | block | block | block | block | block |
| BOS | pass | block | block | block | block | block |

## 3. Hard Blockers

1. **Outcome contracts missing for all businesses (RG-02)**
   - No plan currently contains the required active outcome fields (`Outcome`, `Baseline`, `Target`, `By`, `Owner`, `Leading Indicators`, `Decision Link`).
   - Evidence:
     - `docs/business-os/strategy/BRIK/plan.user.md:15`
     - `docs/business-os/strategy/PIPE/plan.user.md:15`
     - `docs/business-os/strategy/PLAT/plan.user.md:15`
     - `docs/business-os/strategy/BOS/plan.user.md:15`

2. **Changed code paths are not explicitly mapped to business outcomes (RG-04)**
   - Current change volume is high and cross-domain, with no authoritative mapping file prior to this audit.
   - High-volume changed areas observed:
     - `apps/prime` (48 paths)
     - `apps/reception` (34 paths)
     - `packages/mcp-server` (8 paths)
   - A first mapping registry was created at:
     - `docs/business-os/readiness/path-business-map.user.yaml`
   - Mapping remains provisional and includes open questions; unresolved mappings remain blocking.

3. **Critical tooling/data prerequisites are missing (RG-05)**
   - BRIK: analytics and conversion telemetry not configured.
     - Evidence: `docs/business-os/strategy/BRIK/plan.user.md:22`, `docs/business-os/strategy/BRIK/plan.user.md:64`
   - PIPE: no validated first-sale/fulfillment signal loop instrumentation.
     - Evidence: `docs/business-os/strategy/PIPE/plan.user.md:18`, `docs/business-os/strategy/PIPE/plan.user.md:70`
   - PLAT: build/CI baseline timing metrics not measured.
     - Evidence: `docs/business-os/strategy/PLAT/plan.user.md:64`, `docs/business-os/strategy/PLAT/plan.user.md:68`
   - BOS: cabinet/skill throughput instrumentation not in place.
     - Evidence: `docs/business-os/strategy/BOS/plan.user.md:72`, `docs/business-os/strategy/BOS/plan.user.md:78`

4. **Decision links are not explicit (RG-06)**
   - Plans do not currently tie current focus to explicit decision-unlock statements.
   - Evidence: current-focus sections across all four plans at line 15.

## 4. Warnings (Non-blocking)

- `people.user.md` has no explicit `Last-reviewed` field, reducing freshness certainty for role/capacity context.
  - Evidence: `docs/business-os/people/people.user.md:1`
- BRIK has some business-result language, but still lacks explicit outcome contract fields.
  - Evidence: `docs/business-os/strategy/BRIK/plan.user.md:21`

## 5. Questions Asked and Answers Received

### Questions asked (priority order)

1. For each business (`BRIK`, `PIPE`, `PLAT`, `BOS`), what is the single most important current-period outcome, with baseline, target, deadline, owner, weekly leading indicator, and decision link?
2. Confirm business ownership mapping for major changed-path groups: `apps/prime`, `apps/reception`, `packages/mcp-server`, `scripts`.
3. What are the committed dates/owners for standing up missing tooling prerequisites (BRIK analytics, PIPE first-sale loop metrics, PLAT CI baseline metrics, BOS process metrics)?

### Answers received

- None yet (awaiting user input).

## 6. Docs Updated During This Audit

- Created `docs/business-os/readiness/path-business-map.user.yaml`
- Created `docs/business-os/readiness/2026-02-10-missing-context-register.user.md`
- Created `docs/business-os/readiness/2026-02-10-ideas-readiness.user.md`

## 7. Go / No-Go

Readiness status: BLOCKED. Do not run `/ideas-go-faster` until listed blockers are resolved.
