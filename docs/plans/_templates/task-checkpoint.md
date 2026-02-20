---
Type: Reference
Status: Reference
---
### TASK-XX: Horizon checkpoint - reassess downstream plan
- **Type:** CHECKPOINT
- **Deliverable:** <updated plan evidence via /lp-do-replan>
- **Execution-Skill:** lp-do-build
- **Execution-Track:** <code | business-artifact | mixed>
- **Effort:** <S>
- **Status:** <Pending | In-Progress | Complete (YYYY-MM-DD) | Blocked | Superseded | Needs-Input>
- **Affects:** `docs/plans/<feature-slug>/plan.md`
- **Depends on:** <upstream IMPLEMENT task>
- **Blocks:** <first downstream task>
- **Confidence:** 95%
  - Implementation: 95% - process is defined
  - Approach: 95% - prevents deep dead-end execution
  - Impact: 95% - controls downstream risk
- **Acceptance:**
  - `/lp-do-build` checkpoint executor run
  - `/lp-do-replan` run on downstream tasks
  - confidence for downstream tasks recalibrated from latest evidence
  - plan updated and re-sequenced
- **Horizon assumptions to validate:**
  - ...
  - ...
- **Validation contract:** <how checkpoint completion is verified>
- **Planning validation:** <replan evidence path/notes>
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** <plan update path>
