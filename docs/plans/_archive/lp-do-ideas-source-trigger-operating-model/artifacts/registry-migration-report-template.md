---
Type: Registry-Migration-Report-Template
Status: Active
Task: TASK-03
Feature-Slug: lp-do-ideas-source-trigger-operating-model
Created: 2026-02-25
Last-updated: 2026-02-25
---

# Registry v1 -> v2 Migration Report Template

## Metadata
- Migration run timestamp: `<ISO-8601>`
- Operator: `<name>`
- Input registry path: `<path>`
- Output registry path: `<path>`
- Report source: `lp-do-ideas-registry-migrate-v1-v2.ts`

## Counts
- Input entries: `<n>`
- Output entries: `<n>`
- Classified: `<n>`
- Inferred: `<n>`
- Unknown: `<n>`
- Blocked: `<n>`
- Fail-open detected: `<Yes|No>`

## Entry Classification
| Artifact ID | Status (`classified|inferred|unknown|blocked`) | Class | Trigger | Propagation | Reason |
|---|---|---|---|---|---|
| `<artifact_id>` | `<status>` | `<artifact_class or ->` | `<trigger_policy or ->` | `<propagation_mode or ->` | `<reason>` |

## Unknown Artifact IDs
- `<artifact_id>`

## Blocked Artifact IDs
- `<artifact_id>`

## Validation Checklist
- [ ] Unknown entries defaulted to non-trigger (`trigger_policy: never`)
- [ ] Aggregate pack entries mapped to `projection_summary + manual_override_only`
- [ ] No `unknown` row has `trigger_policy: eligible`
- [ ] Blocked entries captured with actionable reason

## Follow-up Actions
1. `<action for unknown entries>`
2. `<action for blocked entries>`
3. `<confirm pilot classification completeness>`
