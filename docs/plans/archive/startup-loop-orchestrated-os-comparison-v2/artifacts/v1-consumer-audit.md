---
Type: Investigation Artifact
Task: TASK-10
Plan: startup-loop-orchestrated-os-comparison-v2
Status: Complete
Created: 2026-02-18
Method: ripgrep scan across repo for process-registry-v1 references during /lp-do-replan evidence pass
---

# supersede-now Consumer Breakage Audit

Produced during `/lp-do-replan` evidence gathering after TASK-00 decision (supersede-now). Identifies all files that reference `process-registry-v1.md` as an authoritative source and must be re-pointed before v1 is archived.

---

## High-Risk Authoritative Consumers (5 files)

These files will break as authoritative references the moment v1 is archived. TASK-06 must update all five before TASK-04 tombstones v1.

### 1. `docs/business-os/startup-loop/exception-runbooks-v1.md`

**Risk**: Highest. 8+ authoritative references including frontmatter `Related-process-registry` field and four inline `### Required Processes (from process-registry-v1.md)` section headers throughout the document.

**Required action**: Replace `process-registry-v1.md` with `process-registry-v2.md` in:
- Frontmatter `Related-process-registry:` field
- All four `### Required Processes (from process-registry-v1.md)` section headings
- Dependency table row: `| process-registry-v1.md | Required processes per exception state... |`

### 2. `docs/business-os/startup-loop/audit-cadence-contract-v1.md`

**Risk**: High. 6+ authoritative references, including functional references (B5 process-sample audit and B6 owner-roles check both name v1 as their data source).

**Required action**: Replace `process-registry-v1.md` with `process-registry-v2.md` in:
- Frontmatter `Related-process-registry:` field
- B5 checklist item text (process sample audit source)
- B6 checklist item text (owner role column source)
- Dependency table rows

**Note**: The audit procedure itself (B5: sample 3 process IDs) remains valid — only the source pointer changes.

### 3. `docs/business-os/startup-loop/retention-schema.md`

**Risk**: Medium. 4 authoritative references, primarily in dependency table and frontmatter.

**Required action**: Replace `process-registry-v1.md` with `process-registry-v2.md` in:
- Frontmatter `Related-processes:` field pointer
- Prose reference: `Both are defined in process-registry-v1.md.`
- Dependency table row

### 4. `docs/business-os/startup-loop/sales-ops-schema.md`

**Risk**: Medium. 4 authoritative references in frontmatter and capability linkage.

**Required action**: Replace `process-registry-v1.md` with `process-registry-v2.md` in:
- Frontmatter `Related-process:` field
- Prose reference: `GTM-3 (Sales/account pipeline...) in process-registry-v1.md`
- Dependency table row

### 5. `docs/business-os/startup-loop/marketing-sales-capability-contract.md`

**Risk**: Medium. Already in TASK-06 `Affects`. Confirmed to contain authoritative references in capability linkage tables.

**Required action**: Replace all `process-registry-v1.md` references with `process-registry-v2.md` in capability linkage tables. (TASK-06 was already scoped to update vocabulary; now also update registry pointer.)

---

## Low-Risk / Incidental References (excluded from action list)

These files mention v1 but not as an authoritative runtime source — they are plan artifacts, history docs, or comparison notes. No action needed:

- `docs/plans/startup-loop-orchestrated-os-comparison-v2/plan.md` — plan metadata
- `docs/plans/startup-loop-orchestrated-os-comparison-v2/fact-find.md` — planning reference
- `docs/plans/startup-loop-orchestrated-os-comparison-v2/artifacts/v2-vocabulary-and-assignment-baseline.md` — planning artifact
- `docs/plans/startup-loop-orchestrated-os-comparison/plan.md` — prior-wave history
- `docs/plans/startup-loop-orchestrated-os-comparison/decisions/v1-boundary-decision.md` — history
- `docs/plans/startup-loop-orchestrated-os-comparison/artifacts/contract-overlap-matrix.md` — prior-wave artifact

---

## Domain Heading Consumers

`## Domain:` section headings exist **only in `process-registry-v1.md`** (7 occurrences — one per workstream). No external consumer file uses `## Domain:` as a live heading. Zero external breakage from the Domain → Workstream rename in v2.

---

## Stage Label Consumers

`label_operator_short` and `label_operator_long` are consumed by:
- `stage-addressing.ts` via `LABEL_INDEX` (exact case-sensitive match) — old label strings will fail after rename UNLESS added to `aliases[]`
- `generate-stage-operator-views.ts` via `buildTable` (column 3) and `buildMap` (JSON output)
- All operators using `--stage-label` flag

**Existing alias infrastructure**: Every stage entry already has an `aliases[]` array of lowercase slugs. `resolveByAlias` does a normalized lowercase lookup through `ALIAS_INDEX`. Adding old label strings to `aliases[]` (lowercased) is sufficient for backward compatibility — **no changes needed to `stage-addressing.ts` or `generate-stage-operator-views.ts` source code**.

---

## Summary Table

| File | Risk | Action Owner | Action |
|---|---|---|---|
| exception-runbooks-v1.md | HIGH | TASK-06 | Re-point 8+ v1 refs → v2 |
| audit-cadence-contract-v1.md | HIGH | TASK-06 | Re-point 6+ v1 refs → v2 |
| retention-schema.md | MEDIUM | TASK-06 | Re-point 4 v1 refs → v2 |
| sales-ops-schema.md | MEDIUM | TASK-06 | Re-point 4 v1 refs → v2 |
| marketing-sales-capability-contract.md | MEDIUM | TASK-06 | Re-point v1 refs → v2 (already in Affects) |
| stage-operator-dictionary.yaml | MEDIUM | TASK-04 | Add old label_operator_short to aliases[]; set new labels |
| All files referencing `--stage-label` | LOW | TASK-06/TASK-07 | Covered by alias fallback; no source changes needed |

---

## Validation Closure

Per TASK-10 acceptance: scan complete, breakage list produced, migration steps per file documented.

**Investigation status: COMPLETE** (executed during /lp-do-replan evidence pass 2026-02-18).
