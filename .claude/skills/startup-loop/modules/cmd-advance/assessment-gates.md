# `cmd-advance` — Assessment Gates

## Assessment Gate Family

Load this module when the current transition touches the ASSESSMENT stage family.

### GATE-A08-00: Current situation required at ASSESSMENT-08→ASSESSMENT-09 (when start-point=problem)

**Gate ID**: GATE-A08-00 (Hard)
**Trigger**: Before advancing from ASSESSMENT-08 to ASSESSMENT-09. Only fires when `start-point=problem`.

**Check (filesystem-only):**

```bash
# Check for current situation artifact with Status: Active
grep -l "Status: Active" docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-operator-context.user.md 2>/dev/null
# Match found  → gate passes
# No match     → gate blocked
```

**Decision table:**

| <YYYY-MM-DD>-operator-context.user.md exists? | Status field | Gate result | Action |
|---|---|---|---|
| No | — | `blocked` | Run `/lp-do-assessment-08-current-situation --business <BIZ>` |
| Yes | `Active` | `pass` | Continue to ASSESSMENT intake sync |
| Yes | `Draft` or absent | `blocked` | Complete artifact (all sections A–D, Section E gaps listed) then set Status: Active |

**When blocked:**

Return blocked run packet:
- `blocking_reason`: `GATE-A08-00: Current situation artifact missing or not Active. Required before ASSESSMENT intake sync can run.`
- `next_action`: `Run /lp-do-assessment-08-current-situation --business <BIZ>. Artifact required at docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-operator-context.user.md with Status: Active.`
- `prompt_file`: none (skill generates the artifact interactively)

**When passes:**

Proceed to ASSESSMENT intake sync. The sync module reads `<YYYY-MM-DD>-operator-context.user.md` as its seventh precursor (`Precursor-ASSESSMENT-08`).

---

### GATE-ASSESSMENT-00: ASSESSMENT-09 Intake contract — completeness + quality + intake sync

**Gate ID**: GATE-ASSESSMENT-00 (Hard)
**Trigger**: Before advancing from ASSESSMENT-09 to ASSESSMENT-10. Always fires when start-point=problem.

**Named**: ASSESSMENT-09 Intake contract

Validates that all required ASSESSMENT precursor artifacts are present and meet minimum quality before the business can enter branding (`ASSESSMENT-10`), then runs intake sync to produce/refresh the intake packet.

**Check (filesystem-only):**

```bash
# ASSESSMENT-01: Problem Statement (Active + required sections)
grep -l "Status: Active" docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-problem-statement.user.md 2>/dev/null &&
grep -Eq "## Problem|## Customer|## Evidence" docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-problem-statement.user.md 2>/dev/null

# ASSESSMENT-02: Solution profiling results (any date prefix, >=3 options)
ls docs/business-os/strategy/<BIZ>/*-solution-profile-results.user.md 2>/dev/null | head -1

# ASSESSMENT-03: Solution select (selected option + rationale present)
ls docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-solution-decision.user.md 2>/dev/null &&
grep -Eq "Selected|Rationale|Assumption" docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-solution-decision.user.md 2>/dev/null

# ASSESSMENT-04: Candidate names (any date prefix, >=3 candidates) — skip check if name confirmed
ls docs/business-os/strategy/<BIZ>/*-candidate-names.user.md 2>/dev/null | head -1

# ASSESSMENT-06: Distribution profiling — Status + >=2 channel rows + primary channel
grep -l "Status: Active\\|Status: Draft" docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-launch-distribution-plan.user.md 2>/dev/null &&
grep -Eq "Primary channel|Chosen channel|Recommended channel" docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-launch-distribution-plan.user.md 2>/dev/null

# ASSESSMENT-07: Measurement profiling — Status + tracking method + >=2 metrics + threshold
grep -l "Status: Active\\|Status: Draft" docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-measurement-profile.user.md 2>/dev/null &&
grep -Eq "Tracking|Instrumentation|Method" docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-measurement-profile.user.md 2>/dev/null &&
grep -Eq "Threshold|Target|Trigger" docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-measurement-profile.user.md 2>/dev/null

# ASSESSMENT-08: Current situation — Active + sections A-E + open gaps section
grep -l "Status: Active" docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-operator-context.user.md 2>/dev/null &&
grep -Eq "Section A|Section B|Section C|Section D|Section E|Open gaps|Evidence gaps" docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-operator-context.user.md 2>/dev/null
```

**Decision table:**

| Sub-stage | Artifact | Status | Gate result |
|---|---|---|---|
| ASSESSMENT-01 | <YYYY-MM-DD>-problem-statement.user.md | Active + problem/customer/evidence sections | pass |
| ASSESSMENT-01 | missing, not Active, or incomplete structure | — | blocked |
| ASSESSMENT-02 | *-solution-profile-results.user.md | exists + >=3 solution options profiled | pass |
| ASSESSMENT-02 | missing or thin (<3 options) | — | blocked |
| ASSESSMENT-03 | <YYYY-MM-DD>-solution-decision.user.md | selected option + rationale + assumptions | pass |
| ASSESSMENT-03 | missing or missing rationale/assumptions | — | blocked |
| ASSESSMENT-04 | *-candidate-names.user.md | exists + shortlist-quality candidate set | pass (or skipped if name confirmed) |
| ASSESSMENT-04 | missing (when required) or low-quality shortlist | — | blocked |
| ASSESSMENT-06 | <YYYY-MM-DD>-launch-distribution-plan.user.md | Active/Draft + >=2 channels + primary channel chosen | pass |
| ASSESSMENT-06 | missing or quality minimum not met | — | blocked |
| ASSESSMENT-07 | <YYYY-MM-DD>-measurement-profile.user.md | Active/Draft + tracking method + >=2 metrics + threshold/trigger | pass |
| ASSESSMENT-07 | missing or quality minimum not met | — | blocked |
| ASSESSMENT-08 | <YYYY-MM-DD>-operator-context.user.md | Active + sections A-E + gap logging present | pass |
| ASSESSMENT-08 | missing or quality minimum not met | — | blocked |

**When blocked:**

Return blocked run packet:
- `blocking_reason`: `GATE-ASSESSMENT-00: ASSESSMENT-09 Intake blocked — completeness/quality checks failed for [list sub-stages]. All required ASSESSMENT precursors must pass before ASSESSMENT-10.`
- `next_action`: For each failing sub-stage, specify the skill to run and the exact quality gap to close before re-running `/startup-loop advance --business <BIZ>`.
- `prompt_file`: none (skills generate artifacts interactively)

**When passes:**

Run ASSESSMENT intake sync (apply `modules/assessment-intake-sync.md`) and produce/refresh:
- `docs/business-os/startup-baselines/<BIZ>/<YYYY-MM-DD>-assessment-intake-packet.user.md`

Then continue to ASSESSMENT-10.

---

### GATE-ASSESSMENT-01: ASSESSMENT container completeness + quality required at ASSESSMENT→MEASURE-01

**Gate ID**: GATE-ASSESSMENT-01 (Hard)
**Trigger**: Before advancing from ASSESSMENT (container) to `MEASURE-01`.

**Named**: ASSESSMENT quality gate

Validates that both branding sub-stage outputs exist and meet minimum quality before the container can progress to MEASURE entry.

**Check (filesystem-only):**

```bash
# ASSESSMENT-10 output: brand profiling quality contract
ls docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-brand-profile.user.md 2>/dev/null &&
grep -Eq "Status: (Draft|Active)" docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-brand-profile.user.md 2>/dev/null &&
grep -Eq "Section A|Section B|Section C|Section D|Section E" docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-brand-profile.user.md 2>/dev/null &&
grep -Eq "Voice|Tone|Personality|Audience" docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-brand-profile.user.md 2>/dev/null

# ASSESSMENT-11 output: brand identity quality contract
ls docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-brand-identity-dossier.user.md 2>/dev/null &&
grep -Eq "Status: (Draft|Active)" docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-brand-identity-dossier.user.md 2>/dev/null &&
grep -Eq "Color|Colour|Typography|Imagery|Token" docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-brand-identity-dossier.user.md 2>/dev/null
```

**Decision table:**

| Artifact | Completeness + quality | Gate result |
|---|---|---|
| <YYYY-MM-DD>-brand-profile.user.md | Exists + Draft/Active + sections A-E + voice/personality content | pass |
| <YYYY-MM-DD>-brand-profile.user.md | Missing or quality minimum not met | blocked |
| <YYYY-MM-DD>-brand-identity-dossier.user.md | Exists + Draft/Active + visual identity sections + token guidance | pass |
| <YYYY-MM-DD>-brand-identity-dossier.user.md | Missing or quality minimum not met | blocked |

**When blocked:**

Return blocked run packet:
- `blocking_reason`: `GATE-ASSESSMENT-01: ASSESSMENT container blocked — branding completeness/quality contract not met (<YYYY-MM-DD>-brand-profile.user.md + <YYYY-MM-DD>-brand-identity-dossier.user.md required at quality minimum) before MEASURE entry.`
- `next_action`: `Run /lp-do-assessment-10-brand-profiling and/or /lp-do-assessment-11-brand-identity to close listed quality gaps, then re-run /startup-loop advance --business <BIZ>.`
- `prompt_file`: none (skills generate artifacts interactively)

**When passes:**

Proceed to `MEASURE-01`.
