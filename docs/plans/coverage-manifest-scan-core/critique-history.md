# Critique History — coverage-manifest-scan-core

---

## Plan Critique — Round 3 (FINAL)

- Route: codemoot
- Score: 8/10 → lp_score: 4.0
- Verdict: needs_revision (score credible)
- Severity counts: Critical 0, Major 2 (warnings), Minor 1 (info)
- Post-loop gate: credible (lp_score 4.0 ≥ 4.0), no Critical → proceed to completion

### Findings

1. **Major** (line 326): Compliance escalation via `priority: "P1"` may be ineffective — downstream classifier prioritizes `area_anchor`/`evidence_refs`, not stored `priority`. Fixed — clarified that `priority: "P1"` is a best-effort metadata signal; downstream re-classification from `evidence_refs` is the real escalation path.
2. **Major** (line 427): Risk table repeated the same ineffective escalation claim. Fixed — updated to describe full escalation flow.
3. **Minor** (line 56/142): TASK-01 VC-01 used `yaml.parse(content)` (JS runtime syntax) which contradicts agent-only model. Fixed — VC-01 now describes agent-native parse.

---

## Plan Critique — Round 2

- Route: codemoot
- Score: 6/10 → lp_score: 3.0
- Verdict: needs_revision
- Severity counts: Critical 1, Major 1 (warning), Minor 0
- Condition for Round 3: Critical present → YES

### Findings

1. **Critical** (line 326): `priority: "P0"` schema-invalid — `priority` enum is `P1|P2|P3` only. Fixed — changed to `priority: "P1"`.
2. **Major** (line 360): Edge case section still referenced `risk_ref` (not in schema). Fixed — replaced with schema-valid compliance guidance.

---

## Plan Critique — Round 1

- Route: codemoot
- Score: 6/10 → lp_score: 3.0
- Verdict: needs_revision
- Severity counts: Critical 1, Major 2 (warnings), Minor 0
- Condition for Round 2: Critical present → YES

### Findings

1. **Critical** (line 326): `risk_vector`/`risk_ref` fields added to dispatch packets, but schema has `additionalProperties: false` and neither field exists in the schema → dispatches would be schema-invalid. Fixed — replaced with `priority: "P1"` + `evidence_refs` approach.
2. **Major** (line 327): Dispatch ID acceptance criteria used 8-digit format (`YYYYMMDD-NNNN`); Notes section already had the correct 14-digit format (`YYYYMMDDHHmmss`). Fixed — acceptance criteria updated to 14-digit.
3. **Major** (line 56): "js-yaml or native" assumption is inaccurate — no native YAML parser in Node.js, and this is an agent-only skill with no runtime. Fixed — assumption now states agent reads YAML files natively as text.

---

## Fact-Find Critique — Round 2

- Route: codemoot
- Score: 9/10 → lp_score: 4.5
- Verdict: needs_revision (score credible)
- Severity counts: Critical 0, Major 1 (warning), Minor 1 (info)
- Condition for Round 3: no Critical remaining → Round 3 NOT required
- Post-loop gate: credible (lp_score 4.5 ≥ 4.0), no Critical → proceed to completion

### Findings

1. **Major** (line 102): "required fields include…" still implied a broader set. Fixed — clarified as exact `required[]` array + labeled optional fields explicitly.
2. **Minor** (line 190): Duplicate coverage-gap bullet. Fixed — deduplicated.

---


## Fact-Find Critique — Round 1

- Route: codemoot
- Score: 7/10 → lp_score: 3.5
- Verdict: needs_revision
- Severity counts: Critical 0, Major 3 (warnings), Minor 0
- Condition for Round 2: 2+ Major → YES

### Findings

1. **Major** (line 85): `PROCESS_QUALITY_RE` incorrectly attributed to `lp-do-ideas-trial.ts`; it is defined in `lp-do-ideas-classifier.ts`. Fixed.
2. **Major** (line 101): Required fields list for dispatch.v1 overstated (included `business`, `trigger`, `current_truth`, `next_scope_now` which are not in schema `required[]`). Verified file already had correct list; no change needed.
3. **Major** (line 179): Test coverage table attributed classifier coverage to `lp-do-ideas-persistence.test.ts` and stated no dedicated classifier test file; `lp-do-ideas-classifier.test.ts` exists. Fixed — table updated, coverage gaps section corrected.

### Autofixes Applied

- `lp-do-ideas-trial.ts` reference corrected to `lp-do-ideas-classifier.ts` for PROCESS_QUALITY_RE
- Test coverage table: added dedicated `lp-do-ideas-classifier.test.ts` row; removed incorrect persistence.test.ts attribution for classifier; corrected coverage gaps section
