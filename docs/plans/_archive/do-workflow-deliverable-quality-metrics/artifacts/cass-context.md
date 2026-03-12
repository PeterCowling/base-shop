---
Type: Startup-Loop-CASS-Context
Status: Active
Mode: fact-find
Generated: 2026-03-12T12:07:09.331Z
Provider: cass
Slug: do-workflow-deliverable-quality-metrics
---

# CASS Context Pack

- Query: startup loop fact-find; feature slug do-workflow-deliverable-quality-metrics; topic deliverable quality metrics - section completeness validation in telemetry; prior evidence, reusable decisions, blockers, mitigations
- Top-K target: 8
- Source roots: docs/plans, docs/business-os/startup-loop, .claude/skills, docs/business-os/strategy
- Provider used: cass

## Retrieval Warnings

- CASS_RETRIEVE_COMMAND is not configured; using built-in CASS session-history provider. Set CASS_RETRIEVE_COMMAND to use an external CASS backend.

## CASS Output

### Built-in CASS Provider (session-history retrieval)
- query: startup loop fact-find; feature slug do-workflow-deliverable-quality-metrics; topic deliverable quality metrics - section completeness validation in telemetry; prior evidence, reusable decisions, blockers, mitigations
- roots: ~/.claude/projects, ~/.codex/sessions
- hits: 8

| Session File | Line | Snippet |
|---|---:|---|
| ~/.claude/projects/-Users-petercowling-base-shop/a30b5fa9-6825-413c-8b06-90451a28a293/tool-results/toolu_0195MbQhWxFtfeWNeaSNg19u.txt | 5 | docs/plans/startup-loop-orchestrated-os-comparison-v2/plan.md:287:- **Affects:** `docs/business-os/startup-loop/process-assignment-v2.yaml`, `[readonly] docs/business-os/startup-loop/process-registry-v1.md`, `[readonly] docs/business-os/startup-loop/workstream-workflow-taxonom... |
| ~/.claude/projects/-Users-petercowling-base-shop/a30b5fa9-6825-413c-8b06-90451a28a293/tool-results/toolu_0195MbQhWxFtfeWNeaSNg19u.txt | 19 | docs/plans/startup-loop-orchestrated-os-comparison-v2/fact-find.md:243: - A: Yes, as `Domain` section labels in `process-registry-v1.md`, but not as first-class schema fields. |
| ~/.claude/projects/-Users-petercowling-base-shop/a30b5fa9-6825-413c-8b06-90451a28a293/tool-results/toolu_0195MbQhWxFtfeWNeaSNg19u.txt | 23 | docs/plans/startup-loop-orchestrated-os-comparison-v2/artifacts/v2-vocabulary-and-assignment-baseline.md:66:\| **Domain** _(section heading)_ \| Legacy alias → Workstream \| Process-grouping label used as section headings in process-registry-v1.md (e.g., `## Domain: CDI`). Same c... |
| ~/.claude/projects/-Users-petercowling-base-shop/a30b5fa9-6825-413c-8b06-90451a28a293/tool-results/toolu_0195MbQhWxFtfeWNeaSNg19u.txt | 24 | docs/plans/startup-loop-orchestrated-os-comparison-v2/artifacts/v2-vocabulary-and-assignment-baseline.md:74:\| `Domain:` (section heading) \| process-registry-v1.md section headings \| `Workstream:` \| TASK-04: replace section heading prefix \| |
| ~/.claude/projects/-Users-petercowling-base-shop/a30b5fa9-6825-413c-8b06-90451a28a293/tool-results/toolu_0195MbQhWxFtfeWNeaSNg19u.txt | 45 | docs/plans/startup-loop-orchestrated-os-comparison/decisions/v1-boundary-decision.md:30:5. **Delayed native embedding has manageable risk.** If v2 merits process IDs as first-class loop-spec fields, the process-registry-v1.md becomes the migration source. No rework is wasted. |
| ~/.claude/projects/-Users-petercowling-base-shop/a30b5fa9-6825-413c-8b06-90451a28a293/tool-results/toolu_0195MbQhWxFtfeWNeaSNg19u.txt | 46 | docs/plans/startup-loop-orchestrated-os-comparison/decisions/v1-boundary-decision.md:42:\| `docs/business-os/startup-loop/process-registry-v1.md` \| Create (new additive contract) \| TASK-02 primary deliverable \| |
| ~/.claude/projects/-Users-petercowling-base-shop/a30b5fa9-6825-413c-8b06-90451a28a293/tool-results/toolu_0195MbQhWxFtfeWNeaSNg19u.txt | 47 | docs/plans/startup-loop-orchestrated-os-comparison/decisions/v1-boundary-decision.md:66:- **TASK-02** (process-registry-v1.md): additive contract mapping all 28 process IDs. |
| ~/.claude/projects/-Users-petercowling-base-shop/a30b5fa9-6825-413c-8b06-90451a28a293/tool-results/toolu_0195MbQhWxFtfeWNeaSNg19u.txt | 52 | docs/plans/startup-loop-orchestrated-os-comparison/artifacts/contract-overlap-matrix.md:33:\| 1 \| Weekly signal intake and insight synthesis \| CDI-1 \| S10 weekly readout (loop-spec.yaml) + weekly-kpcs-decision-prompt.md \| Partial \| `docs/business-os/startup-loop/loop-spec.yaml#... |

## How To Use

- Treat this as advisory context only.
- Keep canonical evidence links in fact-find/plan artifacts.
- If retrieval quality is low, refine the query and re-run.

