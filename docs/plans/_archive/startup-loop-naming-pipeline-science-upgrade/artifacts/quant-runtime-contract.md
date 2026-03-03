---
Type: Quant-Runtime-Contract
Task: TASK-01
Plan: startup-loop-naming-pipeline-science-upgrade
Created: 2026-02-26
Sources:
  - baseline-funnel-metrics.md (this plan)
  - scripts/src/startup-loop/ (existing TS runtime)
  - tools/ (existing tools namespace)
  - .claude/skills/lp-do-assessment-04-candidate-names/SKILL.md
  - .claude/skills/lp-do-assessment-05-name-selection/SKILL.md
---

# Quantitative Runtime Contract

This document defines where the naming pipeline quantitative tooling lives, how it is invoked, how dependencies are managed, and the go/no-go criteria that gate TASK-04 and TASK-05.

## 1. Runtime Architecture

The naming pipeline quantitative stack is **dual-runtime**:

| Layer | Runtime | Location | Purpose |
|-------|---------|----------|---------|
| RDAP client + telemetry | TypeScript | `scripts/src/startup-loop/naming/` | Standards-conformant RDAP checks, retry logic, telemetry emission |
| Candidate sidecar schema + log writer | TypeScript | `scripts/src/startup-loop/naming/` | Schema validation, event log emission per candidate per stage |
| Baseline extractor | TypeScript | `scripts/src/startup-loop/naming/` | Reads sidecar logs, emits aggregate funnel metrics |
| Shadow probabilistic model | Python | `tools/naminglab/model/` | Training, scoring, calibration reporting |
| Feature extraction layer | Python | `tools/naminglab/features/` | Phonetic, orthographic, confusion-proxy features |
| Adaptive controller | Python | `tools/naminglab/controller/` | Pattern allocation bandit, confidence-based N planner |
| Replay harness + CI gates | Python + Jest | `tools/naminglab/replay/`, `tools/naminglab/tests/` | Replay from sidecar history, schema/calibration CI checks |

**Rationale for dual-runtime:** TypeScript is the existing language for `scripts/src/startup-loop/` tooling. Python is required for the probabilistic model, feature extraction (phonetic libraries, scipy calibration), and bandit controller. These concerns are cleanly separable — TypeScript handles orchestration and artifact IO; Python handles quantitative computation.

### 1a. New TypeScript namespace

```
scripts/src/startup-loop/naming/
  rdap-client.ts           ← TASK-02: RDAP standards-conformant client
  rdap-types.ts            ← TASK-02: shared types for RDAP results
  rdap-retry.ts            ← TASK-02: exponential backoff + throttle handling
  candidate-sidecar-schema.json  ← TASK-03: JSON Schema for candidate events
  event-log-writer.ts      ← TASK-03: writes sidecar records per stage transition
  baseline-extractor.ts    ← TASK-03: reads sidecars → aggregate funnel metrics
```

All new `.ts` files follow existing conventions in `scripts/src/startup-loop/`:
- Exported functions, no default exports
- Corresponding `__tests__/naming-*.test.ts` files
- CommonJS output via `tsc` (matches existing `scripts/tsconfig.json`)

### 1b. New Python namespace

```
tools/naminglab/
  __init__.py
  requirements.txt          ← scikit-learn, scipy, numpy, pandas
  model/
    train.py                ← TASK-04: logistic regression model training
    score.py                ← TASK-04: per-candidate p_viable + uncertainty
    calibration.py          ← TASK-04: Brier, log-loss, reliability diagram
    pairwise.py             ← TASK-04: Bradley-Terry pairwise scoring
  features/
    phonetic.py             ← TASK-05: syllable count, vowel ratio, onset complexity
    orthographic.py         ← TASK-05: length, letter-pair frequency, suffix class
    confusion_proxy.py      ← TASK-05: nearest-neighbour confusion risk from corpus
  controller/
    bandit.py               ← TASK-05: Thompson-sampling pattern-family allocator
    yield_planner.py        ← TASK-05: P(Y>=K) >= 0.95 minimum-N calculator
  replay/
    harness.py              ← TASK-06: replays historical sidecar files
  tests/
    test_model.py           ← TASK-06: model CI gates
    test_schema.py          ← TASK-06: sidecar schema CI gates
    test_calibration.py     ← TASK-06: calibration regression CI gate
```

## 2. Invocation

### 2a. TypeScript naming modules

Invoked through existing `scripts/` pnpm workspace:

```bash
# Type-check naming modules (included automatically via tsconfig)
pnpm --filter scripts typecheck

# Test naming modules
pnpm --filter scripts test -- --testPathPattern="naming"

# Run baseline extractor directly (for CI or manual use)
pnpm --filter scripts tsx scripts/src/startup-loop/naming/baseline-extractor.ts \
  --biz HEAD \
  --sidecar-dir docs/business-os/strategy/HEAD/naming-sidecars/ \
  --out docs/plans/startup-loop-naming-pipeline-science-upgrade/artifacts/
```

### 2b. Python naminglab modules

Invoked from `tools/naminglab/` with a dedicated virtualenv:

```bash
# Setup (one-time)
cd tools/naminglab
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Train model
python model/train.py \
  --sidecar-glob "docs/business-os/strategy/*/naming-sidecars/*.jsonl" \
  --model-out artifacts/model-v<N>.pkl \
  --seed 42

# Score a candidate batch
python model/score.py \
  --model artifacts/model-v<N>.pkl \
  --candidates docs/business-os/strategy/<BIZ>/naming-candidates-<DATE>.md \
  --out docs/business-os/strategy/<BIZ>/naming-shadow-scores-<DATE>.jsonl

# Generate calibration report
python model/calibration.py \
  --scores docs/business-os/strategy/<BIZ>/naming-shadow-scores-<DATE>.jsonl \
  --labels docs/business-os/strategy/<BIZ>/naming-sidecars/ \
  --out docs/plans/startup-loop-naming-pipeline-science-upgrade/artifacts/shadow-calibration-report.md

# Run Python tests
cd tools/naminglab
python -m pytest tests/ -v
```

### 2c. CI invocation

Python CI is added as a separate CI step (not folded into existing Jest/pnpm CI):

```yaml
# In .github/workflows/reusable-scripts.yml or equivalent
- name: Run naminglab Python tests
  run: |
    cd tools/naminglab
    python -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    python -m pytest tests/ -v
```

This is an **additive** CI step. It does not modify existing Jest or pnpm typecheck steps.

## 3. Dependency Handling

### 3a. Python dependencies

```
# tools/naminglab/requirements.txt
scikit-learn>=1.4.0
scipy>=1.12.0
numpy>=1.26.0
pandas>=2.2.0
jellyfish>=1.0.0   # phonetic algorithms (Metaphone, Soundex)
```

**No system-level Python packages required.** All managed via venv. Python 3.11+ assumed (matches CI runner defaults).

**No changes to monorepo package.json or pnpm-lock.yaml** — Python deps are isolated to `tools/naminglab/`.

### 3b. TypeScript dependencies

No new npm packages are required for the naming TS modules. The existing deps (`zod`, Node.js `fs/path`) are sufficient for schema validation and file IO.

If JSON Schema validation is preferred over Zod for `candidate-sidecar-schema.json`, use `ajv` which is already available in `devDependencies` (check before adding). If not present, evaluate whether Zod is sufficient before adding `ajv`.

### 3c. Sidecar data storage

Sidecar logs are stored under:
```
docs/business-os/strategy/<BIZ>/naming-sidecars/
  <YYYY-MM-DD>-round-<N>.jsonl    ← one file per naming round
```

Sidecar files are **committed to the repo** alongside other naming artifacts. They are small (one JSON record per candidate × 250 candidates = ~50–100 KB per round).

### 3d. Model artifact storage

Trained model artifacts stored under:
```
docs/plans/startup-loop-naming-pipeline-science-upgrade/artifacts/
  model-v<N>.pkl         ← versioned model binary (committed for reproducibility)
  model-v<N>-meta.json   ← seed, training_date, training_rounds, feature_list
```

Model binaries are committed. Size budget: each scikit-learn logistic regression model on 1,250 candidate records is ~10–50 KB. Acceptable for a git repo.

## 4. Go/No-Go Criteria for Downstream Tasks

### 4a. TASK-04 gate (shadow probabilistic model)

**Go criteria (all must be met):**
- [ ] TASK-02 complete: RDAP client emits structured `available | taken | unknown` with reason codes
- [ ] TASK-03 complete: Candidate sidecar schema validated and at least one round's sidecar records exist (or proxy training uses baseline metrics + score dimensions from existing artifacts)
- [ ] Baseline data: ≥2 historical naming rounds available with N_generated, N_pass_rdap, and per-candidate score vectors (from existing `naming-candidates-*.md` files)
- [ ] Python environment: `tools/naminglab/` requirements installable in CI

**Proxy training path (if sidecar data is not yet available):**
TASK-04 may begin training on **baseline proxy labels** extracted from existing `naming-candidates-*.md` and `naming-rdap-*.txt` files. The proxy label is:
- `viable = 1` if RDAP status is `available` AND score ≥ 18
- `viable = 0` if RDAP status is `taken`
- `viable = null` if RDAP status is `unknown` (excluded from training)

This gives ~1,250 labeled records (5 rounds × 250 candidates) without waiting for sidecar events. Features are derived from name text and score dimensions only (no stage-transition features until TASK-03 sidecar data exists).

**No-go trigger:** If TASK-04 produces Brier score > 0.35 on the proxy training set (indicating model is near random on viability prediction), stop and replan: either collect more rounds or revise feature set before shadow deployment.

### 4b. TASK-05 gate (adaptive controller + yield planner)

**Go criteria (all must be met):**
- [ ] TASK-04 complete: shadow model producing `p_viable`, `ci90_lower`, `ci90_upper` for candidate batches
- [ ] Feature stack (TASK-05 phonetic/orthographic/confusion_proxy) producing deterministic outputs for a test batch of ≥ 20 names
- [ ] TASK-03 sidecar data: at least 1 complete round of sidecar events available (for pattern posterior initialization)
- [ ] Historical RDAP yield ≥ 3 rounds: required to initialize yield planner beta distributions (at least HEAD R4, R5, R6 or equivalent)

**Initial controller configuration:**
- Pattern arms: A, B, C, D, E (5 arms)
- Prior: Beta(2, 2) uniform (non-informative; will update from R4–R6 RDAP yield by pattern)
- Exploration floor: 10% of allocation per arm minimum (prevents arm starvation)
- K target (minimum finalist threshold): default K=5 (operator must select ≥5 for meaningful choice)
- Confidence target: P(Y >= K) >= 0.95

**No-go trigger:** If the yield planner's recommended N > 500 at any point (implying >2× the current fixed budget), stop and replan: this indicates that available viability signal is insufficient to plan confidently, and more data collection is required before adaptive allocation adds value.

## 5. Integration Points with Existing Skills

### 5a. lp-do-assessment-04-candidate-names

- **Part 3 (RDAP check):** The current Bash loop will be replaced by `rdap-client.ts` (TASK-02). The script in the SKILL.md will be updated to call the TS module rather than inline curl. Backward-compatible: `naming-rdap-<date>.txt` artifact contract is unchanged (additive telemetry fields appended).
- **Part 4 (Rank):** Shortlist generation remains unchanged. Shadow scores are written to a separate `naming-shadow-scores-<date>.jsonl` file and are not merged into `naming-shortlist-<date>.user.md` until checkpoint sign-off.

### 5b. lp-do-assessment-05-name-selection

- **Part 1 (Spec):** No changes. The spec structure is unchanged.
- **Future (post-checkpoint):** If TASK-07 checkpoint approves adaptive N, the spec will gain a `Recommended-N` field computed by the yield planner. Advisory only in this plan.

### 5c. Execution switches

All new quantitative features run behind an execution switch:

```bash
# Enable shadow scoring (TASK-04 output)
NAMING_SHADOW_SCORE=1 python model/score.py ...

# Enable adaptive allocation (TASK-05 output)
NAMING_ADAPTIVE_ALLOC=1 python controller/bandit.py ...
```

Setting neither switch = legacy mode. Switches are additive; legacy behavior is preserved when switches are off.

## 6. Summary: Three Questions Answered

| Question | Answer |
|----------|--------|
| What are baseline values for N_generated, N_pass_rdap, N_shortlisted, N_finalists, stage time? | See `baseline-funnel-metrics.md`. Fixed N=250; RDAP yield 21–75%; N_shortlisted=20 (fixed); N_finalists and stage time are currently unmeasured. |
| Where will quantitative tooling live and how will it be invoked? | TypeScript naming modules: `scripts/src/startup-loop/naming/`. Python quantitative runtime: `tools/naminglab/`. TypeScript invoked via pnpm; Python via venv CLI + optional CI step. No changes to monorepo lock files. |
| What minimum data completeness blocks downstream model work? | TASK-04 can start on proxy labels from existing artifacts (5 rounds × 250 names). TASK-05 requires TASK-04 model output + at least 1 TASK-03 sidecar round. Explicit Brier > 0.35 and N_recommended > 500 are defined no-go triggers for TASK-04 and TASK-05 respectively. |
