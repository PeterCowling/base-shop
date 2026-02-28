---
Type: Prompt-Pack-Index
Status: Active
Domain: Venture-Studio
Created: 2026-02-12
Updated: 2026-02-25
Last-reviewed: 2026-02-25
Owner: Pete
---

# Startup Loop Prompt Pack

Canonical template directory:

- `docs/business-os/workflow-prompts/_templates/`

Canonical source:

- `docs/business-os/startup-loop/loop-spec.yaml` (spec_version `3.13.0`)
- `docs/business-os/startup-loop/_generated/stage-operator-map.json`

## Stage prompts

| Stage ID | Stage label | Prompt template | Launch-surface | Notes |
|---|---|---|---|---|
| `ASSESSMENT-09` | Intake | `intake-normalizer-prompt.md` | all | Required prompt stage |
| `ASSESSMENT-10` | Brand profiling | `brand-01-brand-profiling-prompt.md` | all | Required prompt stage |
| `ASSESSMENT-11` | Brand identity | `brand-02-brand-identity-prompt.md` | all | Required prompt stage |
| `MEASURE-01` | Agent-Setup | `measurement-agent-setup-prompt.md` | all | Required prompt stage |
| `MEASURE-02` | Results | `existing-business-historical-baseline-prompt.md` | all | Required prompt stage |
| `PRODUCT-01` | Product from photo | `product-from-photo-prompt.md` | all | Required prompt stage |
| `MARKET-01` | Competitor mapping | `docs/business-os/market-research/_templates/deep-research-competitor-mapping-prompt.md` | all | Required prompt stage |
| `MARKET-02` | Demand evidence | `docs/business-os/market-research/_templates/deep-research-demand-evidence-prompt.md` | all | Required prompt stage |
| `MARKET-03` | Pricing benchmarks | `docs/business-os/market-research/_templates/deep-research-pricing-benchmarks-prompt.md` | all | Required prompt stage |
| `MARKET-04` | Channel landscape | `docs/business-os/market-research/_templates/deep-research-channel-landscape-prompt.md` | all | Required prompt stage |
| `MARKET-05` | Assumptions and risk register | `docs/business-os/market-research/_templates/market-assumptions-risk-register-prompt.md` | all | Required prompt stage |
| `MARKET-06` | Offer design | no-prompt-required | all | Skill-driven: `/lp-offer` |
| `SIGNALS-01` | Forecast | no-prompt-required | all | Skill-driven: `/lp-forecast` |
| `PRODUCT-02` | Adjacent product research | no-prompt-required | conditional | Skill-driven: `/lp-other-products` |
| `SELL-01` | Channel strategy + GTM | no-prompt-required | all | Skill-driven: `/lp-channels` |
| `SELL-02` | Activation readiness (pre-spend) | no-prompt-required | conditional | Gate-driven readiness checks |
| `S4` | Baseline merge + prioritization | no-prompt-required | all | Skill-driven: `/lp-baseline-merge` + `/lp-prioritize` |
| `WEBSITE-01` | L1 first build framework | `website-first-build-framework-prompt.md` | pre-website | Required prompt stage |
| `WEBSITE-02` | Site-upgrade synthesis | `docs/business-os/site-upgrades/_templates/deep-research-business-upgrade-prompt.md` | website-live | Required prompt stage. L1 Build 2 auto-mode: image-first merchandising for visual-heavy catalogs. |
| `DO` | Delivery execution | no-prompt-required | all | Skill-driven: `/lp-do-fact-find`, `/lp-do-plan`, `/lp-do-build` |
| `S9B` | Post-deploy verification | `post-deploy-measurement-verification-prompt.md` | all | Run after deploy |
| `S9B` | QA gates | no-prompt-required | all | Skill-driven: `/lp-launch-qa` |
| `SIGNALS` | Weekly decision | `weekly-kpcs-decision-prompt.md` | all | Required prompt stage |

## Operator prompt

| Purpose | Prompt template | Launch-surface |
|---|---|---|
| Run-packet and next-step handoff (`start/status/submit/advance`) | `startup-loop-operator-handoff-prompt.md` | all |

Command wrapper that uses this operator prompt:

- `.claude/skills/startup-loop/SKILL.md` (`/startup-loop`)

## Standing refresh prompts

| Refresh cadence | Prompt template |
|---|---|
| Monthly market pulse | `monthly-market-pulse-prompt.md` |
| Monthly channel economics | `monthly-channel-economics-refresh-prompt.md` |
| Quarterly regulatory watch | `quarterly-regulatory-claims-watch-prompt.md` |

## Adjacent canonical prompts

| Area | Prompt template |
|---|---|
| Platform baseline refresh | `docs/business-os/platform-capability/_templates/deep-research-platform-capability-baseline-prompt.md` |
