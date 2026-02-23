# TASK-04 — Hreflang Reciprocity Sampling (Pre/Post TASK-02)

Date: 2026-02-22
Task: `TASK-04` (`INVESTIGATE`)
Plan: `docs/plans/brikette-seo-traffic-growth/plan.md`

## Scope

Locale pairs required by plan:
- EN/IT
- EN/DE
- EN/FR
- EN/ES
- EN/JA

Checks per pair:
- Self-reference
- Reciprocity (A->B and B->A)
- Canonical alignment
- `x-default`

## Data Sources

Pre-pass (pre-TASK-02):
- Reconstructed from commit snapshot `2a72c9506f` (pre-slashless rollout), static-export HTML inspection for locale root pages.
- Artifact: `docs/plans/brikette-seo-traffic-growth/artifacts/task-04-hreflang-pre-pass.json`

Post-pass (post-TASK-02 + post-deploy):
- Live production HTML inspection on locale root pages.
- Artifact: `docs/plans/brikette-seo-traffic-growth/artifacts/task-04-hreflang-post-pass.json`

## Pre vs Post Results

| Pair | Self-ref pre | Reciprocity pre | Canonical aligned pre | x-default pre | Self-ref post | Reciprocity post | Canonical aligned post | x-default post |
|---|---|---|---|---|---|---|---|---|
| EN/IT | ✅ | ✅ | ✅ | `https://hostel-positano.com/en/` | ✅ | ✅ | ✅ | `https://hostel-positano.com/en` |
| EN/DE | ✅ | ✅ | ✅ | `https://hostel-positano.com/en/` | ✅ | ✅ | ✅ | `https://hostel-positano.com/en` |
| EN/FR | ✅ | ✅ | ✅ | `https://hostel-positano.com/en/` | ✅ | ✅ | ✅ | `https://hostel-positano.com/en` |
| EN/ES | ✅ | ✅ | ✅ | `https://hostel-positano.com/en/` | ✅ | ✅ | ✅ | `https://hostel-positano.com/en` |
| EN/JA | ✅ | ✅ | ✅ | `https://hostel-positano.com/en/` | ✅ | ✅ | ✅ | `https://hostel-positano.com/en` |

## Delta Summary

- Reciprocity and self-reference were healthy in both passes.
- Format normalization changed as expected after TASK-02/TASK-01 deployment:
  - pre-pass locale canonical/hreflang roots were trailing-slash
  - post-pass locale canonical/hreflang roots are slashless
- `x-default` moved from trailing-slash EN root to slashless EN root.

## Decision Output

Decision: **Hreflang implementation is clean after TASK-02 and remains reciprocal across sampled locale pairs.**

No replan required from hreflang evidence.

## Acceptance Check

- Pre-pass and post-pass completed on same 5 pairs: **Pass**
- Self-reference and reciprocity checks recorded: **Pass**
- Canonical/hreflang format consistency delta captured: **Pass**
