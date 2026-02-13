---
Type: Workflow-Guide
Status: Active
Domain: Venture-Studio
Created: 2026-02-12
Updated: 2026-02-12
Last-reviewed: 2026-02-12
Owner: Pete
---

# Startup Loop Workflow (HEAD + PET + BRIK)

## 1) Purpose

Define the full startup operating loop from idea/spec input to execution and lp-replanning, with explicit inputs, processing, outputs, and current remaining data gaps for HEAD, PET, and BRIK.

## 2) End-to-End Loop (High Level)

```mermaid
flowchart TD
    A[User Inputs\nBusiness idea + product spec + constraints] --> B[Readiness + Mapping Preflight\nlp-readiness]
    B -->|Blocked| B1[Collect missing data\nowner mapping/outcomes/research prompts]
    B1 --> B
    B -->|Ready| C[Market Intelligence Layer\nDeep Research prompts + saved packs]
    C --> D[Forecast Layer\nidea-forecast]
    D --> E[SFS-00 Baseline Merge\n0a intent + 0b existing work + 0c classification]
    E --> F[Prioritized Go Items / Backlog Seeds]
    F --> G[lp-fact-find]
    G --> H[lp-plan]
    H --> I[lp-build]
    I --> J[Launch + Measure\nweekly K/P/C/S review]
    J --> K{Keep / Pivot / Scale / Kill}
    K -->|Continue/Pivot| C
    K -->|Scale| F
    K -->|Kill| L[Archive + Learning Capture]
```

### 2.1 Existing-Business Route (BRIK)

For website-live businesses like BRIK, use this route:

```mermaid
flowchart TD
    A[Existing Business Intake] --> B[Readiness]
    B --> C[Historical Performance Baseline\nnet value/cloudflare]
    C --> D[Deep Research S2\nmust consume baseline]
    D --> E[Deep Research S6\nmust consume baseline]
    E --> F[Forecast/Recalibration + Prioritization]
    F --> G[lp-fact-find -> lp-plan -> lp-build]
```

Rule: BRIK does not proceed past S2/S6 while the historical baseline is missing or draft.
When S2A is blocked due to missing data, the workflow must hand the user the S2A data-request prompt and pause progression until the data pack is supplied.

## 3) Website Upgrade Sub-Loop

```mermaid
flowchart LR
    P[Platform Capability Baseline\nperiodic] --> U[Per-Business Upgrade Brief\nreference-site synthesis]
    U --> M[Best-Of Matrix\nAdopt/Adapt/Defer/Reject]
    M --> Q[lp-fact-find backlog packet]
    Q --> R[lp-plan/lp-build]
```

This sub-loop feeds the main startup loop at the lp-fact-find stage.

## 4) Stage-by-Stage Workflow (Input -> Processing -> Output)

Canonical source: `docs/business-os/startup-loop/loop-spec.yaml` (spec_version 1.0.0).

| Stage | Inputs | Processing | Outputs |
|---|---|---|---|
| S0. Intake | Business idea, product spec, channels, constraints, stock timeline | Normalize raw user intent into structured startup context | Intake packet per business |
| S1. Readiness preflight | Strategy plan, people profile, path-business mapping, prior cards/ideas | Run readiness gates (`RG-01..RG-07`) and detect blockers | Readiness report + missing-context register + blocker questions/prompts |
| S1B. Pre-website measurement bootstrap (conditional: pre-website) | Launch-surface mode = `pre-website` + intake packet + business plan | Run mandatory analytics/measurement setup gate and operator handoff (GA4/Search Console/API prereqs) | Measurement setup note + verification checklist + blocker list |
| S2A. Historical performance baseline (conditional: website-live) | Monthly net booking value exports + Cloudflare analytics + ops logs | Consolidate internal history into decision baseline with data-quality notes | Historical baseline pack (`Status: Active` required before S2/S6 for existing businesses) |
| S2. Market intelligence | Deep Research prompt template + business intake packet (+ S2A baseline for existing businesses) | Competitor/demand/pricing/regulatory research, confidence tagging | Market Intelligence Pack per business + `latest` pointer |
| S2B. Offer design | Market intelligence + intake packet + constraints | Consolidate ICP, positioning, pricing, offer design into validated hypothesis | Offer artifact (`/lp-offer` output) |
| *S3. Forecast* (parallel with S6B) | Business intake + fresh market intelligence + offer hypothesis | Build P10/P50/P90 forecast, guardrails, assumptions, 14-day tests | Forecast doc + exec summary + forecast seed |
| *S6B. Channel strategy + GTM* (parallel with S3) | Offer hypothesis + market intelligence + launch surface | Channel-customer fit analysis, 2-3 launch channels, 30-day GTM timeline | Channel plan + SEO strategy + outreach drafts |
| S4. Baseline merge (join barrier) | Offer (S2B) + forecast (S3) + channels (S6B) | Validate required upstream artifacts; compose deterministic baseline snapshot | Candidate baseline snapshot + draft manifest |
| S5A. Prioritize (no side effects) | Baseline snapshot + forecast + constraints | Score and rank go-item candidates | Prioritized backlog candidates (pure ranking, no persistence) |
| S5B. BOS sync (sole mutation boundary) | Prioritized items from S5A | Persist cards/stage-docs to D1; commit manifest pointer as current | BOS cards created/updated + manifest committed |
| S6. Website upgrade synthesis | Platform baseline + business upgrade brief + reference sites | Best-of decomposition and fit matrix (Adopt/Adapt/Defer/Reject) | Fact-find-ready website backlog packet |
| S7. Fact-find | Chosen go-item(s), evidence docs, constraints | Deep evidence audit and task seeds | Fact-find brief (`Ready-for-planning` or `Needs-input`) |
| S8. Plan | Fact-find brief | Confidence-gated implementation plan | Plan doc with tasks/VCs/checkpoints |
| S9. Build | Approved plan tasks | Implement + validate + track outputs | Shipped work + validation evidence |
| S9B. QA gates | Build outputs + design spec + performance budget | Launch QA, design QA, measurement verification | QA report + go/no-go recommendation |
| S10. Weekly decision loop | KPI scoreboard + gate metrics + costs + operational reliability | K/P/C/S decisioning | Continue/Pivot/Scale/Kill decision + loop-back updates |

## 5) Current Missing Information (HEAD, PET, and BRIK)

### 5.1 Cross-cutting blockers (impact HEAD, PET, and BRIK)

| Missing item | Type | Why it blocks | Current evidence |
|---|---|---|---|
| Standing refresh outputs not yet started | Input freshness risk (Periodic) | Prompt templates exist, but no recurring refresh artifacts are persisted yet | No `market-pulse`, `channel-economics-refresh`, or `regulatory-claims-watch` docs found under `docs/business-os/` |

Resolved recently (no longer missing):
- Platform baseline is active: `docs/business-os/platform-capability/latest.user.md`.
- Market intelligence packs are active for HEAD and PET:
  - `docs/business-os/market-research/HEAD/latest.user.md`
  - `docs/business-os/market-research/PET/latest.user.md`
- BRIK market intelligence seed is active:
  - `docs/business-os/market-research/BRIK/latest.user.md`
- HEAD site-upgrade brief is active:
  - `docs/business-os/site-upgrades/HEAD/latest.user.md`
- PET site-upgrade brief is active:
  - `docs/business-os/site-upgrades/PET/latest.user.md`
- BRIK site-upgrade seed is active:
  - `docs/business-os/site-upgrades/BRIK/latest.user.md`
- Intake packets are active for HEAD and PET:
  - `docs/business-os/startup-baselines/HEAD-intake-packet.user.md`
  - `docs/business-os/startup-baselines/PET-intake-packet.user.md`
- Intake packet is active for BRIK:
  - `docs/business-os/startup-baselines/BRIK-intake-packet.user.md`
- Readiness mapping gate now passes for active scope:
  - `docs/business-os/readiness/2026-02-12-idea-readiness.user.md` (`Run-Status: warning`)
- Blocker interview packs are active for HEAD and PET:
  - `docs/business-os/readiness/2026-02-12-HEAD-blocker-interview.user.md`
  - `docs/business-os/readiness/2026-02-12-PET-blocker-interview.user.md`
- Outcome contracts are now locked in canonical plans:
  - `docs/business-os/strategy/HEAD/plan.user.md`
  - `docs/business-os/strategy/PET/plan.user.md`
- Prioritization scorecards are active for HEAD and PET:
  - `docs/business-os/strategy/HEAD/2026-02-12-prioritization-scorecard.user.md`
  - `docs/business-os/strategy/PET/2026-02-12-prioritization-scorecard.user.md`
- Weekly K/P/C/S decision logs have started for HEAD and PET:
  - `docs/business-os/strategy/HEAD/2026-02-12-weekly-kpcs-decision.user.md`
  - `docs/business-os/strategy/PET/2026-02-12-weekly-kpcs-decision.user.md`

### 5.2 HEAD-specific gaps

| Stage | Missing information | Gap type | Evidence |
|---|---|---|---|
| S1 Readiness | Demand/conversion baselines still not measured | Input missing | `docs/business-os/strategy/HEAD/plan.user.md` metrics section |
| S3 Forecast | Region/tax still unresolved in some active decision docs (`Region: TBD`) | Input/consistency gap | `docs/business-os/strategy/HEAD/2026-02-11-week2-gate-dry-run.user.md`, `docs/business-os/strategy/HEAD/launch-readiness-action-backlog.user.md` |
| S3 Forecast | Key operational confirmations missing: in-stock date, sellable units, price architecture, compatibility matrix, payment readiness, returns SLA | Input missing | `docs/business-os/startup-baselines/HEAD-forecast-seed.user.md` section "Still missing / needs confirmation" |
| S3 Forecast | No post-launch recalibration artifact exists yet | Output missing | No `docs/business-os/strategy/HEAD/*-forecast-recalibration.user.md` |
| S4 Baseline merge | Baseline exists but remains draft and not yet promoted into canonical strategy outcome contract | Output not integrated | `docs/business-os/startup-baselines/HEAD-forecast-seed.user.md` + `docs/business-os/strategy/HEAD/plan.user.md` |

### 5.3 PET-specific gaps

| Stage | Missing information | Gap type | Evidence |
|---|---|---|---|
| S1 Readiness | Demand/margin baselines not measured in canonical plan | Input missing | `docs/business-os/strategy/PET/plan.user.md` metrics section |
| S3 Forecast | Forecast is not decision-grade until inventory units/arrival, real costs, and observed CPC/CVR are captured | Input missing | `docs/business-os/strategy/PET/italy-90-day-launch-forecast-v2.user.md` section "Required Data to Upgrade v2 -> Decision-Grade" |
| S3 Forecast | No post-launch recalibration artifact exists yet | Output missing | No `docs/business-os/strategy/PET/*-forecast-recalibration.user.md` |
| S4 Baseline merge | PET baseline now exists but remains draft and not yet promoted into canonical strategy outcome contract | Output not integrated | `docs/business-os/startup-baselines/PET-forecast-seed.user.md` + `docs/business-os/strategy/PET/plan.user.md` |

### 5.4 BRIK-specific gaps

| Stage | Missing information | Gap type | Evidence |
|---|---|---|---|
| S1 Readiness | Outcome contract is not yet in startup-loop canonical format | Input/contract gap | `docs/business-os/strategy/BRIK/plan.user.md` |
| S1 Readiness | Baseline demand/conversion metrics still unmeasured | Input missing | `docs/business-os/strategy/BRIK/plan.user.md` metrics section |
| S2A Historical baseline | Baseline is active but Cloudflare proxies are partial (11/24 months request totals only; no page/geo/device splits) and older months are unavailable under current access | Data quality gap | `docs/business-os/strategy/BRIK/2026-02-12-historical-performance-baseline.user.md` (`Status: Active`); `docs/business-os/strategy/BRIK/data/cloudflare_monthly_proxies.csv`; `docs/business-os/strategy/BRIK/data/data_quality_notes.md` |
| S2A Measurement setup | GA4 + Search Console are still not configured in production, so funnel/source conversion analysis remains unavailable | Input/instrumentation gap | `docs/business-os/strategy/BRIK/plan.user.md`; setup note: `docs/business-os/strategy/BRIK/2026-02-12-ga4-search-console-setup-note.user.md` |
| S2 Market intelligence | Seed pack exists but Deep Research completion is still pending | Output quality gap | `docs/business-os/market-research/BRIK/2026-02-12-market-intelligence.user.md` (`Status: Draft`); handoff prompt: `docs/business-os/market-research/BRIK/2026-02-12-deep-research-market-intelligence-prompt.user.md` |
| S3 Forecasting | BRIK startup-loop forecast artifact not yet created | Output missing | No `docs/business-os/strategy/BRIK/*forecast*.user.md` aligned to startup-loop model |
| S4 Baseline merge | BRIK forecast seed artifact not yet created | Output missing | No `docs/business-os/startup-baselines/BRIK-forecast-seed.user.md` |
| S5 Prioritization | No explicit scored prioritization artifact exists yet | Output missing | No `docs/business-os/strategy/BRIK/*-prioritization-scorecard.user.md` |
| S6 Website synthesis | Seed brief exists but Deep Research completion is still pending | Output quality gap | `docs/business-os/site-upgrades/BRIK/2026-02-12-upgrade-brief.user.md` (`Status: Draft`); handoff prompt: `docs/business-os/site-upgrades/BRIK/2026-02-12-deep-research-site-upgrade-prompt.user.md` |
| S10 Weekly decision loop | No weekly decision artifact exists yet | Output missing | No `docs/business-os/strategy/BRIK/*-weekly-kpcs-decision.user.md` |

## 6) Current State Snapshot by Stage (HEAD vs PET vs BRIK)

| Stage | HEAD | PET | BRIK |
|---|---|---|---|
| S0 Intake | Canonical intake packet active | Canonical intake packet active | Canonical intake packet active |
| S1 Readiness | Mapping gate clear; business-level outcome/metrics gaps remain | Mapping gate clear; business-level outcome/metrics gaps remain | Mapping gate clear; outcome/metrics contract needs startup-loop normalization |
| S2A Historical baseline | Not required (startup mode) | Not required (startup mode) | Baseline active with partial Cloudflare coverage; GA4/Search Console still missing |
| S2 Market intelligence | Active canonical output (`latest` active) | Active canonical output (`latest` active) | Seed active; Deep Research completion pending |
| S2B Offer design | Not yet started | Not yet started | Not yet started |
| S3 Forecast | v2 + market-intelligence inputs exist; still needs operational confirmations | v2 + market-intelligence inputs exist; still not decision-grade without observed data | Startup-loop forecast artifact missing |
| S6B Channel strategy + GTM | Not yet started | Not yet started | Not yet started |
| S4 Baseline merge | Draft seed exists (pre-merge format) | Draft seed exists (pre-merge format) | Forecast seed missing |
| S5A Prioritize | Scored prioritization artifact active | Scored prioritization artifact active | Scored prioritization artifact missing |
| S5B BOS sync | Not yet started | Not yet started | Not yet started |
| S6 Website best-of synthesis | Active brief available | Active brief available | Seed brief active; Deep Research completion pending |
| S7 Fact-find handoff quality | Possible but weaker due missing upstream canonical artifacts | Possible but weaker due missing upstream canonical artifacts | Possible but currently weak due missing S2/S4/S6 artifacts |
| S8/S9 Plan/Build | Available in process, but depends on stronger upstream inputs | Available in process, but depends on stronger upstream inputs | Available in process, but startup-loop inputs need completion first |
| S9B QA gates | Not yet started | Not yet started | Not yet started |
| S10 Weekly decision loop | Active weekly decision log started | Active weekly decision log started | Weekly decision log missing |

## 7) Minimal Closure Set to Make the Loop Operationally Strong

1. Resolve HEAD and PET operational confirmations from seeds (`stock/date/units/price/compatibility/payments/returns SLA`).
2. Create first forecast recalibration artifacts for HEAD and PET from week-1/2 observed data.
3. Execute BRIK GA4 + Search Console setup and validate event capture in production.
4. Complete BRIK Deep Research upgrades for market intelligence and site-upgrade seed docs.
5. Create BRIK forecast seed + prioritization scorecard + first weekly decision log.
6. Start periodic standing refresh artifacts (market pulse, channel economics, regulatory watch).
7. Register `HOLDCO` in business catalog (taxonomy hygiene item from readiness warning).

## 8) Practical Reading Order for Operators

1. `docs/business-os/platform-capability/latest.user.md`
2. `docs/business-os/market-research/<BIZ>/latest.user.md`
3. `docs/business-os/site-upgrades/<BIZ>/latest.user.md`
4. `docs/business-os/strategy/<BIZ>/plan.user.md`
5. Existing-business route only: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-historical-performance-baseline.user.md`
6. `docs/business-os/startup-baselines/<BIZ>-forecast-seed.user.md`
7. latest readiness report in `docs/business-os/readiness/`
8. prompt pack index: `docs/business-os/workflow-prompts/_templates/`
9. then run `lp-fact-find -> lp-plan -> lp-build` for top P1 item

## 9) Deep Research Gate (S2 + S6)

### 9.1 Mandatory hand-off rule

When either S2 (market intelligence) or S6 (site-upgrade brief) is in a seed/draft state, the workflow must:

1. Stop progression for that business at the affected stage.
2. Hand the user a ready-to-run Deep Research prompt file (not a template with placeholders).
3. Require Deep Research completion and persistence before continuing downstream stages.

Seed/draft trigger conditions:

- `latest.user.md` is `Missing`, or
- `latest.user.md` points to a source doc with `Status: Draft`, or
- source doc is stale (`Last-reviewed` older than 30 days), or
- major outcome/ICP/channel/product change occurred.

Additional existing-business trigger:

- For `website-live` businesses, if S2A historical baseline is missing, `Draft`, or `Blocked`, S2/S6 must remain blocked.
- If S2A result is `Blocked` due to missing data, hand the user an S2A data-request prompt immediately and pause until data is supplied.

Pre-website measurement trigger:

- For `pre-website` businesses, S2 onward should be treated as `warning` quality unless S1B measurement bootstrap output exists and its verification checklist has passed.
- If S1B output is missing, hand the user the S1B measurement-bootstrap prompt immediately and pause paid-traffic launch planning until completed.

### 9.2 Required operator hand-off message

```text
Deep Research completion is required for {{BIZ}} at stage {{S2|S6}}.

Use this ready-to-run prompt file:
{{PROMPT_FILE_PATH}}

Run Deep Research, then save/replace target output:
{{TARGET_OUTPUT_PATH}}

After saving:
1) Ensure output doc is decision-grade and set Status: Active.
2) Update latest pointer (`latest.user.md`) with source path.
3) Render HTML companion:
   pnpm docs:render-user-html -- {{TARGET_OUTPUT_PATH}}
```

### 9.3 Current required hand-offs (now)

- HEAD S1B pre-website measurement bootstrap:
  - Prompt file: `docs/business-os/workflow-prompts/_templates/pre-website-measurement-bootstrap-prompt.md`
  - Target output: `docs/business-os/strategy/HEAD/<YYYY-MM-DD>-pre-website-measurement-setup.user.md`
- PET S1B pre-website measurement bootstrap:
  - Prompt file: `docs/business-os/workflow-prompts/_templates/pre-website-measurement-bootstrap-prompt.md`
  - Target output: `docs/business-os/strategy/PET/<YYYY-MM-DD>-pre-website-measurement-setup.user.md`
- BRIK S2 market intelligence:
  - Prompt file: `docs/business-os/market-research/BRIK/2026-02-12-deep-research-market-intelligence-prompt.user.md`
  - Target output: `docs/business-os/market-research/BRIK/2026-02-12-market-intelligence.user.md`
- BRIK S6 site-upgrade brief:
  - Prompt file: `docs/business-os/site-upgrades/BRIK/2026-02-12-deep-research-site-upgrade-prompt.user.md`
  - Target output: `docs/business-os/site-upgrades/BRIK/2026-02-12-upgrade-brief.user.md`

### 9.4 Output gate

S2/S6 is complete only when:

- Target doc status is `Active` (not `Draft`).
- `latest.user.md` points to that active doc.
- HTML companion exists.
- Source list and evidence sections are populated (decision-grade quality bar met).

## 10) Prompt Hand-Off Map (By Stage)

Use this map to decide when the user should be handed a prompt and what output must be produced.

| Stage | Trigger | Prompt template | Required inputs | Required output path |
|---|---|---|---|---|
| S0 Intake | New business/product idea enters loop or major scope shift | `docs/business-os/workflow-prompts/_templates/intake-normalizer-prompt.md` | Raw user idea + product spec + constraints | `docs/business-os/startup-baselines/<BIZ>-intake-packet.user.md` |
| S1 Readiness | Readiness has `block`/`warning` or missing-context register exists | `docs/business-os/workflow-prompts/_templates/readiness-blocker-interview-prompt.md` | latest readiness report + plan + baseline seed | `docs/business-os/readiness/<YYYY-MM-DD>-<BIZ>-blocker-interview.user.md` |
| S1B Pre-website measurement bootstrap | Launch-surface mode is `pre-website` and measurement bootstrap doc is missing/stale | `docs/business-os/workflow-prompts/_templates/pre-website-measurement-bootstrap-prompt.md` | intake packet + business plan + launch-surface mode + runtime/deploy details | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-pre-website-measurement-setup.user.md` |
| S2A-1 Historical data request (existing businesses) | Business is `website-live` and latest baseline is `Blocked` or unavailable fields prevent decision-grade output | `docs/business-os/workflow-prompts/_templates/historical-data-request-prompt.md` (or business-specific handoff prompt file) | blocker summary + required metric list + known source systems | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-historical-data-request-prompt.user.md` |
| S2A-2 Historical baseline consolidation (existing businesses) | Required S2A data pack has been supplied | `docs/business-os/workflow-prompts/_templates/existing-business-historical-baseline-prompt.md` (or business-specific handoff prompt file) | net booking value history + Cloudflare analytics + ops logs | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-historical-performance-baseline.user.md` |
| S2 Market intelligence | `latest.user.md` missing, stale, or points to `Draft`; market conditions changed materially | `docs/business-os/market-research/_templates/deep-research-market-intelligence-prompt.md` (or business-specific handoff prompt file) | intake packet + current constraints + channel intent | `docs/business-os/market-research/<BIZ>/<YYYY-MM-DD>-market-intelligence.user.md` |
| S3 Forecast recalibration | Week-1/2 data available, gate failed, or major assumption breaks | `docs/business-os/workflow-prompts/_templates/forecast-recalibration-prompt.md` | previous forecast + measured KPI data + active constraints | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-forecast-recalibration.user.md` |
| S5 Prioritization | >=3 candidate go-items or conflicting priorities | `docs/business-os/workflow-prompts/_templates/prioritization-scorer-prompt.md` | baseline seed + forecast + constraints + candidate set | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-prioritization-scorecard.user.md` |
| S6 Site upgrade | `latest.user.md` missing, stale, or points to `Draft`; outcome/ICP/channel/product changed | `docs/business-os/site-upgrades/_templates/deep-research-business-upgrade-prompt.md` (or business-specific handoff prompt file) | platform baseline + market intel + plan + baseline seed | `docs/business-os/site-upgrades/<BIZ>/<YYYY-MM-DD>-upgrade-brief.user.md` |
| S10 Weekly decision | Weekly cadence checkpoint | `docs/business-os/workflow-prompts/_templates/weekly-kpcs-decision-prompt.md` | weekly KPI pack + outcome contract + experiment results | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-weekly-kpcs-decision.user.md` |

Output hygiene for every prompt run:

1. Save markdown output at required path.
2. Render HTML companion:
   `pnpm docs:render-user-html -- <output.user.md>`
3. Update relevant `latest.user.md` pointer when applicable.

## 11) Design Policy (Cross-Cutting)

Design decisions for customer-facing surfaces must be grounded in demographic evidence, not developer defaults. This section seeds the design policy for each business.

### 11.1 BRIK Design Policy (Prime Guest Portal)

**Target Demographic (observed):**

| Segment | Share | Implication |
|---------|-------|-------------|
| Female | ~99% | Avoid cold/corporate palettes. Favor warm, expressive, lifestyle-aligned aesthetics. |
| Age 18-25 | ~60% | Mobile-native generation. Expect app-quality design (Instagram, Airbnb, Pinterest level). High sensitivity to visual polish and micro-interactions. |
| Age 26-35 | ~39% | Similar expectations but slightly more tolerance for functional design. Still mobile-first. |
| Age 35+ | ~1% | Not a design driver. |
| Mobile-only | 100% | Prime is accessed on guests' phones during their stay. No desktop/tablet use case. |

**Design Principles (BRIK customer-facing surfaces):**

1. **Warm over cold** — Primary palette should use warm hues (coral, rose, warm violet, sage) rather than cold corporate blues/teals. The current teal (`192° 80% 34%`) reads as fintech, not travel/lifestyle.
2. **Approachable typography** — Prefer friendly geometric sans-serifs (Plus Jakarta Sans, DM Sans) over developer-oriented fonts (Geist Sans, SF Mono). Rounded terminals signal warmth.
3. **Expressive but not noisy** — Subtle gradients, soft shadows, and gentle motion. Avoid flat gray backgrounds. Slight warm tints on surfaces (e.g., `bg-rose-50` instead of `bg-gray-50`).
4. **Mobile-only, thumb-first** — Prime is a phone-only app. Design exclusively for mobile viewports. Optimize for one-handed use, thumb-zone reachability, and handheld viewing distance. No desktop or tablet breakpoints. Primary actions belong in the bottom half of the screen.
5. **Mobile-native quality bar** — This demographic benchmarks against Airbnb, Pinterest, Hostelworld, and Instagram. Card-based layouts with generous radius, smooth transitions, and high-quality imagery. The quality bar is set by the best apps on their home screen, not by web standards.
6. **Inclusive, not stereotyped** — "Designed for young women" does not mean "pink everything." It means warm, polished, photography-forward, and emotionally resonant. Avoid patronizing color choices.
7. **Token-driven** — All visual changes flow through the theme token system (`packages/themes/prime/tokens.css`). No hardcoded Tailwind colors. This ensures dark mode, accessibility, and future theme variants work automatically.

**Surfaces governed by this policy:**
- Prime guest portal (all guest-facing pages)
- Brikette website (booking and guide pages) — to be aligned in a future pass
- Email templates sent to guests

**Surfaces NOT governed (internal tools):**
- Reception app (staff-facing, operational)
- Business OS (internal admin)
- Owner/admin dashboards within Prime

**Active fact-find:** `docs/plans/prime-design-refresh-fact-find.md`

### 11.2 HEAD / PET Design Policies

Not yet established. Will be seeded when customer-facing surfaces are built for these businesses. Demographic research should inform design token choices from day one — do not default to framework/template aesthetics.

## 12) Standing Refresh Prompts (Periodic)

These are recurring research prompts for standing information refresh.

| Refresh area | Cadence | Trigger | Prompt template | Output path |
|---|---|---|---|---|
| Platform capability baseline | Every 30-45 days | New platform primitives, major app architecture shifts, or stale baseline | `docs/business-os/platform-capability/_templates/deep-research-platform-capability-baseline-prompt.md` | `docs/business-os/platform-capability/<YYYY-MM-DD>-platform-capability-baseline.user.md` |
| Market pulse per business | Monthly | Competitor/offer/channel shifts suspected | `docs/business-os/workflow-prompts/_templates/monthly-market-pulse-prompt.md` | `docs/business-os/market-research/<BIZ>/<YYYY-MM-DD>-market-pulse.user.md` |
| Channel economics refresh | Monthly | CPC/CAC/CVR/returns shift or spend-plan review cycle | `docs/business-os/workflow-prompts/_templates/monthly-channel-economics-refresh-prompt.md` | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-channel-economics-refresh.user.md` |
| Regulatory and claims watch | Quarterly | New policy/compliance/claims risks in target region | `docs/business-os/workflow-prompts/_templates/quarterly-regulatory-claims-watch-prompt.md` | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-regulatory-claims-watch.user.md` |

Generic operator hand-off message:

```text
Research refresh required for {{BIZ}}.

Use prompt template:
{{PROMPT_TEMPLATE_PATH}}

Fill placeholders using latest canonical docs for {{BIZ}}.

Save result to:
{{OUTPUT_PATH}}

Then render HTML:
pnpm docs:render-user-html -- {{OUTPUT_PATH}}
```

## 13) Operator Interface (How User Engages Startup Loop)

Startup Loop needs a single operator interaction pattern so users do not guess the next step.
Canonical chat wrapper skill: `.claude/skills/startup-loop/SKILL.md`.

### 13.1 Command-style interaction contract

Use this command pattern in agent chat:

1. `/startup-loop start --business <BIZ> --mode <dry|live> --launch-surface <pre-website|website-live>`
2. `/startup-loop status --business <BIZ>`
3. `/startup-loop submit --business <BIZ> --stage <S#> --artifact <path>`
4. `/startup-loop advance --business <BIZ>`

### 13.2 Required run packet (agent response format)

Every `start`, `status`, and `advance` response must return:

| Field | Required value |
|---|---|
| `run_id` | Stable run identifier (`SFS-<BIZ>-<YYYYMMDD>-<hhmm>`) |
| `business` | Target business code (`HEAD`, `PET`, `BRIK`, etc.) |
| `current_stage` | Active stage (`S0..S10`) |
| `status` | `ready` / `blocked` / `awaiting-input` / `complete` |
| `blocking_reason` | Empty if not blocked; explicit gate reason if blocked |
| `next_action` | Exact next user action in one sentence |
| `prompt_file` | Prompt file path when user handoff is required |
| `required_output_path` | Exact output artifact path expected next |
| `bos_sync_actions` | List of required Business OS updates before advancing |

### 13.3 Advance rule

A stage is considered complete only when both are true:

1. Required artifact is written and valid.
2. Required Business OS sync actions are confirmed complete.

If either is missing, the run stays `blocked` at current stage.

## 14) Business OS Sync Contract (No Loop-to-BOS Drift)

Startup Loop artifacts and Business OS state must move together.

### 14.1 Write-path rule

For cards, ideas, and stage docs:

- Canonical write path is Business OS UI/API (`/api/agent/*`) to D1.
- Do not treat markdown mirror under `docs/business-os/cards/` and `docs/business-os/ideas/` as editable source-of-truth.

Reference:
- `docs/business-os/README.md`
- `docs/business-os/agent-workflows.md`

### 14.2 Stage-to-BOS update matrix

| Stage | Required BOS update | Write path |
|---|---|---|
| S0 Intake | Update business strategy context (intent, scope, constraints) | `docs/business-os/strategy/<BIZ>/plan.user.md` |
| S1 Readiness | Record blockers/warnings and owner actions | `docs/business-os/readiness/<YYYY-MM-DD>-*.user.md` + strategy plan risk section |
| S1B Measurement bootstrap | Record measurement setup status and blockers | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-pre-website-measurement-setup.user.md` |
| S2/S3 Research + Forecast | Update canonical latest pointers and strategy assumptions/targets | `latest.user.md` pointer + `docs/business-os/strategy/<BIZ>/plan.user.md` |
| S5A Prioritize | No BOS sync (pure ranking, no side effects) | n/a |
| S5B BOS sync | Promote selected go-items into Business OS ideas/cards; commit manifest pointer | `POST /api/agent/ideas`, `POST /api/agent/cards` |
| S7 Fact-find | Upsert `fact-find` stage doc for selected card | `GET/PATCH/POST /api/agent/stage-docs/:cardId/fact-find` |
| S8 Plan | Upsert `plan` stage doc + lane transition `Fact-finding -> Planned` | `PATCH /api/agent/cards/:id` + `GET/PATCH/POST /api/agent/stage-docs/:cardId/plan` |
| S9 Build | Upsert `build` stage doc + lane transitions to `In progress`/`Done` | `PATCH /api/agent/cards/:id` + `GET/PATCH/POST /api/agent/stage-docs/:cardId/build` |
| S10 Weekly decision | Record K/P/C/S decision and update card/business plan state | `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-weekly-kpcs-decision.user.md` + card updates via API |

### 14.3 Sync guardrails

1. No `advance` when required BOS writes fail.
2. No `advance` when `latest.user.md` pointer is stale for the completed stage.
3. If API write fails, return `blocked` with retry command and exact failing endpoint.
4. Weekly K/P/C/S decision must include links to related card IDs and latest stage docs.
