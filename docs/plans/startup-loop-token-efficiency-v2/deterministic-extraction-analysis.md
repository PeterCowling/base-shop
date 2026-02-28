# Deterministic Sub-Step Extraction Analysis

**Purpose:** Identify skill sub-steps that waste LLM tokens on pure rule execution and propose extracting
them into code, config, or scripts. Produced 2026-02-27.

---

## A) Principles — What Belongs in Tokens vs Not

### Keep in the model (judgment)
- Interpreting ambiguous requirements, weighing tradeoffs, taste
- Claim-evidence audits where the "evidence" is open-world text
- Feasibility assessments that require forward reasoning
- Writing and editing human-facing narrative content
- Deciding *which* contrarian attacks apply to a specific plan
- Scoring rubric *application* (reading evidence, assigning dimension values)

### Extract to code/config (deterministic)
A sub-step is a candidate for extraction if **all three** hold:
1. The output can be fully specified as `f(input) → output` with explicit rules
2. It has measurable pass/fail (exit code, error message, schema validation error)
3. Behavior is stable across runs — no open-world reasoning required

**Token-taxed determinism** occurs when the model re-reads rule tables (thresholds, cap tables,
routing maps, required-field lists) on every invocation just to apply fixed math or lookup logic.
The extracted code is the single source of truth; the model only reads a summary.

### Thin-core principle
- TS handles logic, transforms, validation
- YAML supplies data tables, thresholds, routing maps
- JSON Schema defines shapes
- Shell scripts handle repo ops, glue, CI checks
- Do NOT create a YAML DSL or nested rule engine — prefer small composable modules

---

## B) Prioritized Extraction Table

### ROI Scoring Formula

```
ROI = (Freq × 0.30) + (DetConf × 0.30) + (Blast × 0.20) + ((5 - MaintCost) × 0.20)
```

Scale 1–5 for all inputs. `MaintCost` is inverted (1 = easiest to maintain = best).

| Component | Description |
|---|---|
| **Freq** | How often this sub-step runs (1=rarely, 5=every skill invocation) |
| **DetConf** | How rule-bound the logic is (5=pure algorithm, 1=requires open-world reasoning) |
| **Blast** | Correctness risk if wrong (5=silently wrong decisions, 1=obvious/harmless failures) |
| **MaintCost** | Cost of keeping logic in prose vs code (5=high drift risk, 1=stable forever) |

---

### Table (20 candidates)

| # | Skill / Sub-step | Why deterministic | Proposed artifact(s) | Interface contract (in → out) | Tests to add | ROI score | Edge cases / limits |
|---|---|---|---|---|---|---|---|
| 1 | **Confidence threshold enforcement** (`confidence-scoring-rules.md`) | Exact numeric thresholds (IMPLEMENT ≥80, SPIKE ≥80, INVESTIGATE ≥60, replan <60) plus caps (reasoning-only → 75, incomplete VC → 70) are pure lookup tables | `packages/skill-runner/src/confidence-thresholds.yaml` + `packages/skill-runner/src/validate-task-confidence.ts` | In: `{type, confidence, evidence_class?, vc_coverage?}` → Out: `{eligible: bool, capped_at?: number, reason: string}` | Unit: each threshold boundary ±1; cap application; multiples-of-5 rule; exact-80 flag | **4.6** (F:5 D:5 B:5 M:2) | Business fail-first caps interact with evidence class — requires evidence_class field to be well-typed |
| 2 | **Build eligibility gate** (`lp-do-build`, `lp-do-plan`) | Gate is a pure function of task type + confidence score + dependency status | Bundled with #1 as `validate-task-confidence.ts` + wrapper CLI `scripts/validate-build-eligibility.sh` | In: plan.md path + task ID → Out: eligible/blocked + reason (stdout), exit 0/1 | Unit: CHECKPOINT task always eligible; SPIKE=75 blocked; INVESTIGATE=65 eligible | **4.6** (F:5 D:5 B:5 M:2) | CHECKPOINT task type has no numeric gate — must be handled as a special case |
| 3 | **Plan frontmatter schema validation** (`lp-do-plan`, `lp-do-build`) | Foundation Gate checks 8 required frontmatter fields with an enum-bound set of valid values; field names and allowed values are fixed | `packages/skill-runner/schemas/plan.schema.json` + `packages/skill-runner/src/validate-plan.ts` + `scripts/validate-plan.sh <path>` | In: plan.md → Out: `{valid: bool, errors: [{field, message}]}` (stdout JSON), exit 0/1 | Unit: missing Status; invalid Execution-Track value; missing Deliverable-Type; Status=Active without IMPLEMENT task; Golden: round-trip a minimal valid plan | **4.3** (F:4 D:5 B:5 M:2) | Status=Active gate also requires ≥1 IMPLEMENT task at ≥80 — needs task parsing, not just frontmatter |
| 4 | **Canonical path resolver** (`workspace-paths.md`) | Path computation is pure string templates with deterministic fallback (try canonical, then legacy alias) | `packages/skill-runner/src/workspace-paths.ts` (functions: `resolveArtifactPath`, `legacyToCanonical`, `slugFromTitle`) | In: `{slug, artifact_type}` → Out: `{canonical: string, legacy: string}` + `resolveRead` returns first existing path | Unit: canonical preferred over legacy; slug normalisation (kebab-case); all 5 artifact types; write-blocking (legacy path rejected) | **4.2** (F:5 D:5 B:3 M:2) | Slug derivation from free-text title has edge cases (unicode, very long titles) — cap at 60 chars |
| 5 | **lp-do-sequence topological sort** (`seq-algorithm.md`) | Kahn/DFS topological sort is a textbook graph algorithm; file-overlap detection is a pure set-intersection over `Affects:` lists; phase ordering is a fixed enum | `packages/skill-runner/src/sequence-plan.ts` (exported function) + `scripts/sequence-plan.sh <plan.md>` | In: plan.md → Out: plan.md with tasks reordered + `## Parallelism Guide` section appended, explicit `blockedBy` / `blocks` fields per task | Unit: cycle detection emits error; parallel tasks identified correctly; `Affects:` overlap forces ordering; phase enum respected; Golden: canonical test plan fixture | **4.1** (F:4 D:5 B:4 M:2) | File-overlap detection requires parsing Affects lists consistently — needs a defined list format. Implicit "always before" phase rules must be YAML-encoded |
| 6 | **Critique autofix trigger rule** (`lp-do-critique`) | Section Rewrite Gate fires on ≥2 Major OR ≥4 total issues — pure integer comparison | `packages/skill-runner/src/critique-gate.ts` (`shouldTriggerSectionRewrite`, `shouldRunNextRound`) | In: `{critical: number, major: number, minor: number, round: number}` → Out: `{rewrite: bool, next_round: bool, reason: string}` | Unit: boundary conditions at 1/2 Major, 3/4 total; round 3 always final; critical always triggers | **4.1** (F:4 D:5 B:4 M:2) | Round continuation rules differ between fact-find and plan mode — needs a mode parameter |
| 7 | **Critique score stability rule** (`lp-do-critique`) | `|new_score - prior_score| ≤ 0.5` without delta justification is a numeric check; score cannot exceed prior by >0.5 without cited new evidence | Bundled in `packages/skill-runner/src/critique-gate.ts` as `validateScoreMovement` | In: `{prior: number, current: number, has_delta_justification: bool}` → Out: `{valid: bool, violation?: string}` | Unit: 0.4 delta passes; 0.6 delta without justification fails; 0.6 delta with justification passes | **3.7** (F:4 D:5 B:3 M:3) | Only applies when a prior score exists — first round has no prior |
| 8 | **Deliverable routing validator** (`deliverable-routing.yaml`) | YAML already exists; the classification check (does the routing header match the YAML rules?) is a pure lookup + schema check | `packages/skill-runner/src/validate-routing-header.ts` (reads `deliverable-routing.yaml`, checks fact-find frontmatter routing fields) | In: fact-find.md → Out: `{valid: bool, errors: [{field, message}]}`, exit 0/1 | Unit: valid code-change family; unknown deliverable type rejected; startup alias resolves to correct execution skill | **3.6** (F:4 D:4 B:4 M:3) | Multi-family deliverables (`multi`) are valid — validator must not reject them |
| 9 | **lp-do-worldclass state machine** (`lp-do-worldclass`) | 4 states evaluated from 2 file-existence checks + 1 version-equality check — no reasoning required | `packages/skill-runner/src/worldclass-state.ts` (`classifyWorldclassState`) | In: `{goal_path: string, benchmark_path?: string, benchmark_goal_version?: string, goal_version: string}` → Out: `{state: 1|2|3|4, reason: string}` | Unit: all 4 state transitions; version mismatch detected; missing goal → state 1; stale benchmark → state 4 | **3.5** (F:2 D:5 B:4 M:2) | version comparison must be exact string equality (not semver) |
| 10 | **lp-do-worldclass goal_contract_hash** (`modules/goal-phase.md`) | SHA-256 of (singular-goal + sorted domain IDs + sorted constraints) — pure crypto | Bundled in `packages/skill-runner/src/worldclass-state.ts` as `computeGoalContractHash` | In: `{singular_goal: string, domain_ids: string[], constraints: string[]}` → Out: `{hash: string}` | Unit: deterministic output for same inputs; sort order independence for domains/constraints | **3.5** (F:2 D:5 B:4 M:2) | Singular-goal whitespace normalisation must be specified (trim + collapse) |
| 11 | **Evidence cap rules** (`confidence-scoring-rules.md`) | M/L task + reasoning-only evidence → cap 75; incomplete VC → cap 70; >80 requires enumerated TC/VC — these are pure lookup table entries | Bundled with #1 (`validate-task-confidence.ts`) | In: `{size: 'S'|'M'|'L', evidence_class, vc_coverage: 'complete'|'partial'|'none'}` → Out applied cap + reason | Unit: M task reasoning-only capped; complete VC not capped; S task not subject to reasoning cap | **3.5** (F:5 D:5 B:4 M:2) | Evidence class taxonomy must be defined in YAML alongside thresholds |
| 12 | **Fact-find status gate** (`lp-do-fact-find`) | `Status: Ready-for-planning` requires: critique score ≥4.0 OR (3.6–3.9 with no Critical), no open Critical findings, required sections present | `packages/skill-runner/src/validate-fact-find.ts` + `scripts/validate-fact-find.sh` | In: fact-find.md + critique-history.md → Out: `{ready: bool, blocking_issues: string[]}` | Unit: score 3.8 no Critical → ready; score 4.2 with Critical → blocked; missing required section → blocked | **3.6** (F:4 D:4 B:4 M:3) | Critique score may come from codemoot (0–10/2) or inline route (0–5) — normalisation must be consistent |
| 13 | **lp-do-build wave dispatch parser** (`lp-do-build`) | Parsing `## Parallelism Guide` section to extract wave groups is markdown structure parsing — pure text extraction | `packages/skill-runner/src/parse-parallelism-guide.ts` | In: plan.md → Out: `{waves: Array<{wave: number, tasks: string[]}>}` or null if no guide | Unit: 3-wave plan parsed correctly; plan without guide returns null; duplicate task IDs flagged | **3.1** (F:3 D:4 B:3 M:3) | Only runs when Parallelism Guide section exists; must gracefully handle partial/malformed guides |
| 14 | **Plan archiving trigger check** (`_shared/plan-archiving.md`) | Archive trigger fires when build-record.user.md + results-review.user.md both exist in the plan workspace | `packages/skill-runner/src/check-archive-ready.ts` + invoke in `generate-process-improvements.sh` | In: plan workspace path → Out: `{archiveable: bool, missing: string[]}` | Unit: both files present → archiveable; one missing → not yet; non-plan directories ignored | **3.2** (F:3 D:5 B:3 M:4) | Pattern-reflection.user.md is also expected — should be checked too |
| 15 | **Startup-loop stage ID validator** (`check-startup-loop-contracts.sh` SQ-01D) | Stage ID parity across loop-spec.yaml, dictionary.yaml, and stage-operator-map.json is a set-equality check | Already partially in `check-startup-loop-contracts.sh`; extract SQ-01D as standalone TS module | In: loop-spec.yaml + dictionary.yaml + stage-operator-map.json → Out: `{mismatches: string[]}` | Unit: extra ID in dictionary not in spec; missing ID; allowed transitional remaps (S3→SIGNALS-01) pass | **3.3** (F:3 D:5 B:3 M:3) | Transitional remaps are hardcoded in the shell script — must move to YAML allowlist |
| 16 | **Assessment artifact discovery** (`lp-do-assessment-14-logo-brief`) | Select artifact by latest `Updated:` frontmatter date with lexicographic tiebreak — pure date comparison | `packages/skill-runner/src/resolve-assessment-artifact.ts` | In: directory glob pattern + artifact type → Out: `{path: string, updated: string, tiebreak_used: bool}` | Unit: newer date wins; same-date lexicographic tiebreak; missing Updated field falls back to mtime | **3.4** (F:3 D:5 B:3 M:3) | `Updated:` frontmatter may be absent in older artifacts — mtime fallback must be documented |
| 17 | **lp-do-assessment-14 quality gate** (logo brief, 16 checks) | All 16 checks are count/pattern checks: sections present, mark type field non-empty, hex format `#[A-F0-9]{6}`, ≥4 use cases, ≥2 forbidden-territory items, inputs block in frontmatter | `packages/skill-runner/src/validate-logo-brief.ts` | In: logo-brief.md → Out: `{valid: bool, failures: [{check_id, message}]}`, exit 0/1 | Unit: each of 16 checks in isolation; lowercase hex rejected; missing section fails | **3.3** (F:2 D:5 B:3 M:2) | Regex for 6-digit uppercase hex must not accidentally reject inline prose |
| 18 | **Critique round-iteration rules** (`critique-loop-protocol.md`) | Round 1 always runs; Round 2 if ≥1 Critical OR ≥2 Major; Round 3 if Critical after Round 2 — pure boolean table | Bundled in `packages/skill-runner/src/critique-gate.ts` as `shouldRunNextRound` | In: `{round: 1|2|3, critical: number, major: number}` → Out: `{run: bool, reason: string}` | Unit: all 6 branch combinations; Round 3 always terminates | **3.7** (F:4 D:5 B:3 M:3) | Already captured in #6 above — bundle together |
| 19 | **Stage-doc API key policy** (`workspace-paths.md`) | 4-key lookup table (fact-find, plan, build, reflect) with rejected aliases — pure enum | `packages/skill-runner/src/stage-doc-keys.ts` (re-exported enum + `validateStageDocKey`) | In: proposed key string → Out: `{valid: bool, canonical: string, rejected_aliases: string[]}` | Unit: `lp-do-fact-find` rejected → canonical `fact-find` returned; `planned` rejected → `plan` canonical | **2.8** (F:3 D:5 B:2 M:4) | Low blast radius — wrong key returns API error that's immediately visible |
| 20 | **Business fail-first caps** (`confidence-scoring-rules.md`) | Red→Green→Refactor caps (79/84/89) for business-artifact and mixed tasks — pure lookup | Bundled with #1 as `validate-task-confidence.ts` | In: `{track, red_evidence: bool, green_evidence: bool, refactor_evidence: bool, current_score}` → Out: `{capped_at?: number}` | Unit: no-red capped at 79; red+green capped at 84; full evidence uncapped | **3.5** (F:4 D:5 B:4 M:2) | Only applies to business-artifact and mixed tracks, not code-only |

---

**Top 10 by ROI (sorted):**

| Rank | Item | ROI |
|---|---|---|
| 1 | Confidence threshold enforcement | 4.6 |
| 2 | Build eligibility gate | 4.6 |
| 3 | Plan frontmatter schema validation | 4.3 |
| 4 | Canonical path resolver | 4.2 |
| 5 | lp-do-sequence topological sort | 4.1 |
| 6 | Critique autofix trigger rule | 4.1 |
| 7 | Critique score stability rule | 3.7 |
| 8 | Critique round-iteration rules | 3.7 |
| 9 | Deliverable routing validator | 3.6 |
| 10 | Fact-find status gate | 3.6 |

---

## C) Recommended Folder Structure

```
packages/
  skill-runner/                        # NEW package: deterministic skill infrastructure
    package.json
    tsconfig.json
    src/
      confidence-thresholds.yaml       # DATA: thresholds, caps, evidence classes
      confidence-thresholds.ts         # LOGIC: validate-task-confidence + build eligibility
      critique-gate.ts                 # LOGIC: autofix trigger, score stability, round iteration
      workspace-paths.ts               # LOGIC: canonical + legacy path resolution
      validate-plan.ts                 # LOGIC: plan frontmatter schema validation
      validate-fact-find.ts            # LOGIC: fact-find ready-for-planning gate
      validate-routing-header.ts       # LOGIC: deliverable routing header validation
      validate-logo-brief.ts           # LOGIC: 16-check logo brief quality gate
      sequence-plan.ts                 # LOGIC: topological sort + Parallelism Guide writer
      worldclass-state.ts              # LOGIC: 4-state machine + goal_contract_hash
      resolve-assessment-artifact.ts   # LOGIC: latest Updated: date artifact selector
      parse-parallelism-guide.ts       # LOGIC: wave group parser
      check-archive-ready.ts           # LOGIC: archiving trigger check
      stage-doc-keys.ts                # DATA+LOGIC: stage-doc API key enum + validator
      index.ts                         # re-exports all public functions
    schemas/
      plan.schema.json                 # JSON Schema for plan.md frontmatter
      fact-find.schema.json            # JSON Schema for fact-find.md frontmatter
      dispatch-v2.schema.json          # (already exists — move here from docs/)
    __tests__/
      confidence-thresholds.test.ts
      critique-gate.test.ts
      workspace-paths.test.ts
      validate-plan.test.ts
      sequence-plan.test.ts
      worldclass-state.test.ts
    fixtures/
      minimal-valid-plan.md
      invalid-plan-missing-status.md
      minimal-valid-fact-find.md
      sequence-3-task-no-deps.md       # golden input
      sequence-3-task-no-deps.out.md   # golden output
      sequence-cycle-error.md          # error fixture

scripts/
  validate-plan.sh                     # thin wrapper: node packages/skill-runner/src/validate-plan.ts $1
  validate-fact-find.sh                # thin wrapper
  sequence-plan.sh                     # thin wrapper: reads plan.md, writes reordered plan.md in-place
  validate-build-eligibility.sh        # thin wrapper: args: plan.md task-id
```

**Placement rationale:**
- `packages/skill-runner` is a workspace package so it can be imported by other packages and scripts
- Shell script wrappers in `scripts/` stay thin — they just exec the TS module via `tsx` or compiled JS
- Fixtures directory enables regression testing without hitting the real FS
- Schemas colocated with the package that uses them (not in `docs/`) for maintainability

**YAML data files in `src/`** (not `data/`) because they are tightly coupled to the TS logic and versioned together.

---

## D) First 3 Extractions to Implement Now

### Extraction 1: Confidence Threshold Config + Build Eligibility Gate

**ROI: 4.6 — Highest priority. Every plan execution re-reads 3.2KB of threshold rules.**

#### Minimal implementation

```yaml
# packages/skill-runner/src/confidence-thresholds.yaml
thresholds:
  implement: 80
  spike: 80
  investigate: 60
  replan_trigger: 60
  max_reasoning_only: 75          # M/L tasks with reasoning-only evidence
  max_incomplete_vc: 70           # any task with incomplete validation contract
  above_80_requires_full_tc_vc: true

caps:
  exact_80_flag: true             # emit held-back-test warning when any dimension = 80
  score_multiples_of_5_only: true

business_fail_first:              # applies to business-artifact and mixed tracks only
  no_red_evidence: 79
  red_present_no_green: 84
  green_present_no_refactor: 89
```

```typescript
// packages/skill-runner/src/confidence-thresholds.ts
import yaml from 'js-yaml';
import { readFileSync } from 'fs';
import { join } from 'path';

const config = yaml.load(
  readFileSync(join(__dirname, 'confidence-thresholds.yaml'), 'utf8')
) as ConfidenceConfig;

export type TaskType = 'IMPLEMENT' | 'SPIKE' | 'INVESTIGATE' | 'CHECKPOINT';
export type Track = 'code' | 'business-artifact' | 'mixed';
export type EvidenceClass = 'reasoning-only' | 'repo-verified' | 'test-backed' | 'external';
export type VCCoverage = 'complete' | 'partial' | 'none';
export type TaskSize = 'S' | 'M' | 'L';

export interface EligibilityInput {
  type: TaskType;
  confidence: number;
  track?: Track;
  evidence_class?: EvidenceClass;
  vc_coverage?: VCCoverage;
  size?: TaskSize;
  red_evidence?: boolean;
  green_evidence?: boolean;
  refactor_evidence?: boolean;
}

export interface EligibilityResult {
  eligible: boolean;
  effective_confidence: number;  // after caps applied
  capped_at?: number;
  cap_reason?: string;
  warnings: string[];
  reason: string;
}

export function validateTaskEligibility(input: EligibilityInput): EligibilityResult {
  if (input.type === 'CHECKPOINT') {
    return { eligible: true, effective_confidence: 100, warnings: [], reason: 'CHECKPOINT tasks are always eligible' };
  }

  let effective = input.confidence;
  const warnings: string[] = [];
  let cap_reason: string | undefined;
  let capped_at: number | undefined;

  // Multiples-of-5 validation
  if (effective % 5 !== 0) {
    return { eligible: false, effective_confidence: effective, warnings, reason: `Confidence must be a multiple of 5; got ${effective}` };
  }

  // Evidence caps (M/L only)
  if ((input.size === 'M' || input.size === 'L') && input.evidence_class === 'reasoning-only') {
    const cap = config.thresholds.max_reasoning_only;
    if (effective > cap) { capped_at = cap; cap_reason = `M/L task with reasoning-only evidence capped at ${cap}`; effective = cap; }
  }

  // VC coverage cap
  if (input.vc_coverage && input.vc_coverage !== 'complete') {
    const cap = config.thresholds.max_incomplete_vc;
    if (effective > cap) { capped_at = cap; cap_reason = `Incomplete validation contract capped at ${cap}`; effective = cap; }
  }

  // >80 requires full TC/VC
  if (effective > 80 && config.thresholds.above_80_requires_full_tc_vc &&
      input.vc_coverage !== 'complete') {
    capped_at = 80; cap_reason = '>80 requires complete TC/VC coverage'; effective = 80;
  }

  // Business fail-first caps
  if (input.track && input.track !== 'code') {
    const bff = config.business_fail_first;
    if (!input.red_evidence && effective > bff.no_red_evidence) {
      capped_at = bff.no_red_evidence; cap_reason = 'No Red evidence (business fail-first)'; effective = bff.no_red_evidence;
    } else if (input.red_evidence && !input.green_evidence && effective > bff.red_present_no_green) {
      capped_at = bff.red_present_no_green; cap_reason = 'Red present but no Green evidence (business fail-first)'; effective = bff.red_present_no_green;
    } else if (input.green_evidence && !input.refactor_evidence && effective > bff.green_present_no_refactor) {
      capped_at = bff.green_present_no_refactor; cap_reason = 'Green present but no Refactor evidence'; effective = bff.green_present_no_refactor;
    }
  }

  // Exact-80 warning
  if (effective === 80 && config.thresholds.exact_80_flag) {
    warnings.push('Score is exactly 80 — apply held-back test: state what single unknown would push this below 80');
  }

  // Threshold gate
  const thresholds = config.thresholds;
  const min_for_type = input.type === 'INVESTIGATE' ? thresholds.investigate : thresholds.implement;
  const eligible = effective >= min_for_type;

  return {
    eligible,
    effective_confidence: effective,
    ...(capped_at !== undefined ? { capped_at, cap_reason } : {}),
    warnings,
    reason: eligible
      ? `${input.type} eligible at ${effective}`
      : `${input.type} requires ≥${min_for_type}; effective confidence is ${effective}${cap_reason ? ` (capped: ${cap_reason})` : ''}`
  };
}
```

**Token savings estimate:**
- `confidence-scoring-rules.md` is currently re-loaded into every `lp-do-plan`, `lp-do-replan`, and `lp-do-build` eligibility evaluation (~800 tokens each load)
- The model still reads a short summary (the YAML file, ~100 tokens) but delegates validation to the CLI
- Each plan averages 5 tasks; each task triggers 1 eligibility check
- Conservative estimate: 700 tokens saved per plan operation × 3 skill invocations (plan + replan + build) × 15 plans/week = **~31,500 tokens/week**
- Additionally removes the cognitive overhead of re-verifying cap interactions on each evaluation

**Rollout plan:**
1. Create `packages/skill-runner/` with `package.json` + tsconfig
2. Add `confidence-thresholds.yaml` + `confidence-thresholds.ts`
3. Add unit tests (boundary conditions for all 8 cap rules + 3 threshold gates)
4. Add `scripts/validate-build-eligibility.sh` thin wrapper
5. Update `_shared/confidence-scoring-rules.md` to reference the YAML as canonical source; keep the prose explanation (needed for the model to *assign* dimension scores, not just validate them)
6. Update `lp-do-plan` SKILL.md Phase 3/6: "run `scripts/validate-build-eligibility.sh` after scoring to catch cap violations — do not re-implement threshold logic in the model"
7. No behavior change: current scoring is unchanged; the script just catches rule violations

---

### Extraction 2: Plan Frontmatter Schema Validation

**ROI: 4.3 — Eliminates the Foundation Gate manual check on every plan creation/activation.**

#### Minimal implementation

```json5
// packages/skill-runner/schemas/plan.schema.json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["Status", "Execution-Track", "Deliverable-Family", "Deliverable-Type", "Primary-Execution-Skill"],
  "properties": {
    "Status": { "enum": ["Draft", "Active", "Blocked", "Complete", "Infeasible"] },
    "Execution-Track": { "enum": ["code", "business-artifact", "mixed"] },
    "Deliverable-Family": { "enum": ["code-change", "doc", "message", "spreadsheet", "multi"] },
    "Deliverable-Type": { "type": "string", "minLength": 1 },
    "Primary-Execution-Skill": { "type": "string", "minLength": 1 },
    "Startup-Deliverable-Alias": { "type": "string" },
    "Overall-Confidence": { "type": "number", "minimum": 0, "maximum": 100 },
    "Feature-Slug": { "pattern": "^[a-z0-9-]+$" }
  },
  "allOf": [
    {
      "if": { "properties": { "Status": { "const": "Active" } } },
      "then": { "required": ["Overall-Confidence"] }
    }
  ]
}
```

```typescript
// packages/skill-runner/src/validate-plan.ts
import Ajv from 'ajv';
import { parseFrontmatter, parseTaskBlocks } from './plan-parser';

export interface ValidationResult {
  valid: boolean;
  errors: Array<{ field: string; message: string }>;
  warnings: string[];
}

export function validatePlan(content: string): ValidationResult {
  const { frontmatter, tasks } = parseFrontmatter(content);
  const errors: Array<{ field: string; message: string }> = [];
  const warnings: string[] = [];

  // JSON Schema validation
  const ajv = new Ajv();
  const schema = require('../schemas/plan.schema.json');
  if (!ajv.validate(schema, frontmatter)) {
    for (const err of ajv.errors ?? []) {
      errors.push({ field: err.instancePath || err.params?.missingProperty || 'unknown', message: err.message ?? 'invalid' });
    }
  }

  // Invariant: Status=Active requires ≥1 IMPLEMENT task at ≥80
  if (frontmatter.Status === 'Active') {
    const implementEligible = tasks.filter(t =>
      t.type === 'IMPLEMENT' && t.confidence >= 80
    );
    if (implementEligible.length === 0) {
      errors.push({ field: 'Status', message: 'Status=Active requires at least 1 IMPLEMENT task with confidence ≥80' });
    }
  }

  // Warning: no tasks at all
  if (tasks.length === 0) { warnings.push('Plan has no tasks'); }

  return { valid: errors.length === 0, errors, warnings };
}
```

**Token savings estimate:**
- Foundation Gate in `lp-do-plan` currently re-reads required field list and validates manually (~400 tokens of reasoning)
- The model calls `scripts/validate-plan.sh plan.md` and gets a JSON error list instead
- 10 plan operations/week × 400 tokens = **4,000 tokens/week**
- More importantly: catches format regressions that currently slip through to the build phase silently

**Rollout plan:**
1. Add `schemas/plan.schema.json` — no behavior change, pure addition
2. Add `validate-plan.ts` + `scripts/validate-plan.sh`
3. Add golden fixtures (minimal valid plan, 5 failure cases)
4. Update `lp-do-plan` Phase 8: "before persisting, run `scripts/validate-plan.sh` — fix any schema errors first"
5. Add to `validate-changes.sh` as a new check (only runs if `docs/plans/*/plan.md` files are staged)

---

### Extraction 3: lp-do-sequence Topological Sort

**ROI: 4.1 — Biggest token saving per invocation; called after every plan topology edit.**

#### Minimal implementation

```typescript
// packages/skill-runner/src/sequence-plan.ts
import { parseTaskBlocks, writeTaskBlocks } from './plan-parser';

interface Task {
  id: string;
  title: string;
  type: string;
  confidence: number;
  affects: string[];        // file paths from Affects: list
  depends_on: string[];     // explicit task IDs
  phase: Phase;
  raw: string;
}

type Phase = 'investigate' | 'implement' | 'validate' | 'checkpoint';

const PHASE_ORDER: Phase[] = ['investigate', 'implement', 'validate', 'checkpoint'];

export interface SequenceResult {
  ordered_ids: string[];
  waves: Array<{ wave: number; tasks: string[] }>;
  cycle_detected: boolean;
  cycle_path?: string[];
}

export function sequencePlan(planContent: string): SequenceResult {
  const tasks = parseTaskBlocks(planContent);

  // Build adjacency list: edge A→B means B must run after A
  const graph = new Map<string, Set<string>>();
  const inDegree = new Map<string, number>();
  for (const t of tasks) { graph.set(t.id, new Set()); inDegree.set(t.id, 0); }

  for (const t of tasks) {
    // Explicit deps
    for (const dep of t.depends_on) {
      graph.get(dep)?.add(t.id);
      inDegree.set(t.id, (inDegree.get(t.id) ?? 0) + 1);
    }
    // File-overlap: if task A and task B share affected files, A must precede B if A has lower phase
    for (const other of tasks) {
      if (other.id === t.id) continue;
      const overlap = t.affects.some(f => other.affects.includes(f));
      if (overlap && PHASE_ORDER.indexOf(t.phase) < PHASE_ORDER.indexOf(other.phase)) {
        graph.get(t.id)?.add(other.id);
        inDegree.set(other.id, (inDegree.get(other.id) ?? 0) + 1);
      }
    }
  }

  // Kahn's algorithm
  const queue = tasks.filter(t => inDegree.get(t.id) === 0)
    .sort((a, b) => PHASE_ORDER.indexOf(a.phase) - PHASE_ORDER.indexOf(b.phase));
  const ordered: string[] = [];

  while (queue.length > 0) {
    const task = queue.shift()!;
    ordered.push(task.id);
    for (const neighbor of graph.get(task.id) ?? []) {
      const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) {
        const neighborTask = tasks.find(t => t.id === neighbor)!;
        const insertIdx = queue.findIndex(q =>
          PHASE_ORDER.indexOf(q.phase) > PHASE_ORDER.indexOf(neighborTask.phase)
        );
        queue.splice(insertIdx === -1 ? queue.length : insertIdx, 0, neighborTask);
      }
    }
  }

  if (ordered.length < tasks.length) {
    // Cycle detected — find path
    const remaining = tasks.filter(t => !ordered.includes(t.id)).map(t => t.id);
    return { ordered_ids: ordered, waves: [], cycle_detected: true, cycle_path: remaining };
  }

  // Build wave groups (max parallelism)
  const waves: Array<{ wave: number; tasks: string[] }> = [];
  const placed = new Set<string>();
  let waveNum = 1;
  while (placed.size < ordered.length) {
    const wave = ordered.filter(id => {
      if (placed.has(id)) return false;
      const task = tasks.find(t => t.id === id)!;
      return task.depends_on.every(d => placed.has(d));
    });
    wave.forEach(id => placed.add(id));
    waves.push({ wave: waveNum++, tasks: wave });
  }

  return { ordered_ids: ordered, waves, cycle_detected: false };
}
```

**Token savings estimate:**
- `seq-algorithm.md` is 3.7KB (~925 tokens), loaded into every lp-do-sequence invocation
- The model also does O(n) dependency graph reasoning (~800 tokens for a 10-task plan)
- Total per invocation: ~1,725 tokens saved
- lp-do-sequence runs after every plan creation + every replan = ~15–20 invocations/week
- **~28,875 tokens/week** — the single highest-impact extraction
- Cycle detection is deterministic code vs model "I believe there's no cycle" — hard fail is much safer

**Rollout plan:**
1. Add `plan-parser.ts` (shared: parse task blocks with `Affects:`, `depends_on`, `phase` fields)
2. Add `sequence-plan.ts`
3. Add golden fixtures: 3-task linear, 3-task parallel, cycle-detection error case
4. Add `scripts/sequence-plan.sh <plan.md>` wrapper
5. Update `lp-do-sequence` SKILL.md: replace Steps 2–6 in `seq-algorithm.md` with: "Run `scripts/sequence-plan.sh plan.md` — it outputs the reordered task list and Parallelism Guide section. Apply the output to the plan file. Report results."
6. The model retains Steps 1 (parse context), 7 (validate + report) and the ID-stability policy
7. **Prerequisite**: plan task format must have machine-readable `depends_on: [TASK-02, TASK-03]` field — add this to the plan template in `docs/plans/_templates/`

---

## Key Risks Across All Extractions

| Risk | Mitigation |
|---|---|
| Schema-correct nonsense: validator passes but plan is logically wrong | Add invariant checks beyond shape (e.g., Status=Active requires eligible task) |
| Plan parser breaks on non-standard task formatting | Strict parsing with clear error messages; fail-fast on unrecognized format |
| Threshold YAML drift from SKILL.md prose | SKILL.md references YAML as source of truth; prose is commentary only; CI checks YAML is parseable |
| Topological sort changes ordering on plans written before `depends_on` field existed | Graceful fallback: if no `depends_on` fields found, output in file order + warn |
| Package adding `skill-runner` to turbo causes unexpected build coupling | Mark as private package; no exports to app packages; only consumed by scripts and skill prose references |

---

## What This Leaves in the Model

The following remain judgment work — do NOT attempt to extract:

- **Claim-evidence audits** (which evidence actually supports a claim — requires reading comprehension)
- **Dimension scoring** in critiques (assigning 80 vs 75 to a specific plan step requires reasoning)
- **Feasibility forward simulation** (predicting failure modes requires open-world reasoning)
- **Contrarian attack generation** (requires creative and adversarial reasoning)
- **Deliverable family/type classification** from free text (routing.yaml handles valid states; getting from "user wants X" to the right family requires judgment)
- **Confidence score assignment** (cap rules are extractable; the initial dimension scores are not)
- **Plan task decomposition** (what tasks are needed — requires domain knowledge)
