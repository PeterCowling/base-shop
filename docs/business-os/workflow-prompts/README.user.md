---
Type: Prompt-Pack-Index
Status: Active
Domain: Venture-Studio
Created: 2026-02-12
Updated: 2026-02-17
Last-reviewed: 2026-02-17
Owner: Pete
---

# Startup Loop Prompt Pack

Canonical template directory:

- `docs/business-os/workflow-prompts/_templates/`

## Stage prompts

Canonical source: `docs/business-os/startup-loop/loop-spec.yaml` (spec_version 1.3.0).

| Stage | Prompt template | Launch-surface | Notes |
|---|---|---|---|
| S0 Intake | `intake-normalizer-prompt.md` | all | |
| S1 Readiness | `readiness-blocker-interview-prompt.md` | all | |
| S1B Pre-website measurement bootstrap | `pre-website-measurement-bootstrap-prompt.md` | pre-website | Comprehensive Phase 0 access bundle (P0-01..P0-12), Phase 1 agent config (GA4/GSC/DNS/GitHub/Code), Phase 2 staging verification. 7 Derived Policies. Front-loads all credential creation so agents run Phase 1 unattended. |
| S1B / S2A Measurement quality audit | `measurement-quality-audit-prompt.md` | website-live | For existing live sites entering the loop. Idempotent gap audit against 7 Derived Policies. Does not provision; only reports current vs required state. Use when GA4+Cloudflare are already set up. |
| S2A Existing-business data request | `historical-data-request-prompt.md` | website-live | |
| S2A Existing-business baseline | `existing-business-historical-baseline-prompt.md` | website-live | |
| S2B Offer design | no-prompt-required | all | Skill-driven: `/lp-offer` |
| S3 Forecast | no-prompt-required | all | Skill-driven: `/lp-forecast` |
| S3 Forecast recalibration | `forecast-recalibration-prompt.md` | all | Post-launch recalibration only |
| S6B Channel strategy + GTM | no-prompt-required | all | Skill-driven: `/lp-channels` |
| S4 Baseline merge | no-prompt-required | all | Skill-driven: `/lp-baseline-merge` |
| S5A Prioritize | `prioritization-scorer-prompt.md` | all | |
| S5B BOS sync | no-prompt-required | all | Skill-driven: `/lp-bos-sync` |
| S7 Fact-find | no-prompt-required | all | Skill-driven: `/lp-fact-find` |
| S8 Plan | no-prompt-required | all | Skill-driven: `/lp-plan` |
| S9 Build | no-prompt-required | all | Skill-driven: `/lp-build` |
| S9B Post-deploy verification | `post-deploy-measurement-verification-prompt.md` | all | Run immediately after first production deploy. Two-phase: Immediate (T+0, DebugView/curl only) and Delayed (T+1 Data API baseline, T+7 week-1 baseline + GSC coverage delta). DV-03 cross-domain linking is advisory (H). |
| S9B QA gates | no-prompt-required | all | Skill-driven: `/lp-launch-qa` |
| S10 Weekly decision | `weekly-kpcs-decision-prompt.md` | all | |

## Operator prompts

| Purpose | Prompt template | Launch-surface |
|---|---|---|
| Run-packet and next-step handoff (`start/status/submit/advance`) | `startup-loop-operator-handoff-prompt.md` | all |

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
