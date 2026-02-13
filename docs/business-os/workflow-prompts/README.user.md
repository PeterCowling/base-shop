---
Type: Prompt-Pack-Index
Status: Active
Domain: Venture-Studio
Created: 2026-02-12
Updated: 2026-02-12
Last-reviewed: 2026-02-12
Owner: Pete
---

# Startup Loop Prompt Pack

Canonical template directory:

- `docs/business-os/workflow-prompts/_templates/`

## Stage prompts

Canonical source: `docs/business-os/startup-loop/loop-spec.yaml` (spec_version 1.0.0).

| Stage | Prompt template | Notes |
|---|---|---|
| S0 Intake | `intake-normalizer-prompt.md` | |
| S1 Readiness | `readiness-blocker-interview-prompt.md` | |
| S1B Pre-website measurement bootstrap | `pre-website-measurement-bootstrap-prompt.md` | Conditional: pre-website only |
| S2A Existing-business data request | `historical-data-request-prompt.md` | Conditional: website-live only |
| S2A Existing-business baseline | `existing-business-historical-baseline-prompt.md` | Conditional: website-live only |
| S2B Offer design | no-prompt-required | Skill-driven: `/lp-offer` |
| S3 Forecast | no-prompt-required | Skill-driven: `/lp-forecast` |
| S3 Forecast recalibration | `forecast-recalibration-prompt.md` | Post-launch recalibration only |
| S6B Channel strategy + GTM | no-prompt-required | Skill-driven: `/lp-channels` |
| S4 Baseline merge | no-prompt-required | Skill-driven: `/lp-baseline-merge` |
| S5A Prioritize | `prioritization-scorer-prompt.md` | |
| S5B BOS sync | no-prompt-required | Skill-driven: `/lp-bos-sync` |
| S7 Fact-find | no-prompt-required | Skill-driven: `/lp-fact-find` |
| S8 Plan | no-prompt-required | Skill-driven: `/lp-plan` |
| S9 Build | no-prompt-required | Skill-driven: `/lp-build` |
| S9B QA gates | no-prompt-required | Skill-driven: `/lp-launch-qa` |
| S10 Weekly decision | `weekly-kpcs-decision-prompt.md` | |

## Operator prompts

| Purpose | Prompt template |
|---|---|
| Run-packet and next-step handoff (`start/status/submit/advance`) | `startup-loop-operator-handoff-prompt.md` |

Command wrapper that uses this operator prompt:

- `.claude/skills/startup-loop/SKILL.md` (`/startup-loop`)

Automatic flag rule:
- If launch-surface mode is `pre-website`, run S1B before S2 and do not start paid traffic until the S1B verification checklist passes.

## Standing refresh prompts

| Refresh cadence | Prompt template |
|---|---|
| Monthly market pulse | `monthly-market-pulse-prompt.md` |
| Monthly channel economics | `monthly-channel-economics-refresh-prompt.md` |
| Quarterly regulatory watch | `quarterly-regulatory-claims-watch-prompt.md` |

## Adjacent canonical prompts

| Area | Prompt template |
|---|---|
| S2 Market intelligence | `docs/business-os/market-research/_templates/deep-research-market-intelligence-prompt.md` |
| S6 Site upgrade synthesis | `docs/business-os/site-upgrades/_templates/deep-research-business-upgrade-prompt.md` |
| Platform baseline refresh | `docs/business-os/platform-capability/_templates/deep-research-platform-capability-baseline-prompt.md` |
