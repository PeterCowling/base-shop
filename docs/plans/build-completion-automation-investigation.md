# Investigation: Build-Completion Sections Automation Potential

**Date:** 2026-03-04
**Purpose:** Analyze Standing Updates and Intended Outcome Check sections for deterministic automation.

---

## Executive Summary

Two build-completion sections show strong automation potential:

1. **Standing Updates** — can be deterministically computed from git diff + standing-registry.json
2. **Intended Outcome Check** — verdict can be auto-determined in many cases from build-event.json + plan structure

Both sections are currently filled by humans (codemoot route or inline fallback). Automation would reduce build-completion latency and ensure consistency.

---

## Part 1: Standing Updates Section

### What It Is

The Standing Updates section identifies which standing artifacts (from `standing-registry.json`) changed during the build and need to be reviewed/updated.

**From template (docs/plans/_templates/results-review.user.md):**
```markdown
## Standing Updates
- <Layer A standing artifact path>: <required update summary>
- OR `No standing updates: <reason>`
```

**Real example** (assessment-completion-registry results-review):
```markdown
## Standing Updates
- No standing updates: scanner is additive internal tooling; no existing standing artifacts require modification
```

### Standing Registry Structure

**File:** `docs/business-os/startup-loop/ideas/standing-registry.json`
**Key fields per artifact entry:**
- `artifact_id` — unique identifier (e.g., `BRIK-ASSESSMENT-BUSINESS-PLAN`)
- `path` — relative path to the standing artifact (e.g., `docs/business-os/strategy/BRIK/plan.user.md`)
- `domain` — category (ASSESSMENT, MARKET, SELL, PRODUCTS, LOGISTICS, BOS)
- `business` — which business owns it (BRIK, HBAG, HEAD, PWRB, PET, BOS)
- `active` — boolean (true = monitor for changes, false = skip)
- `artifact_class` — "source_reference" (human-authored docs)
- `trigger_policy` — "eligible" or "manual_override_only"

**Example entries:**
- `BRIK-ASSESSMENT-BUSINESS-PLAN` → `docs/business-os/strategy/BRIK/plan.user.md`
- `HBAG-ASSESSMENT-BRAND-IDENTITY` → `docs/business-os/strategy/HBAG/assessment/2026-02-21-brand-identity-dossier.user.md`
- `BOS-SELL-CASS-VERIFICATION-SCORECARD` → `docs/business-os/strategy/BOS/sales/2026-03-02-cass-verification-decision-scorecard.user.md`

### Algorithm: Git Diff ∩ Registry

**Input:**
- `fromRef` — git ref (usually `HEAD~1` after a completed build)
- `toRef` — git ref (usually `HEAD`)
- `standing-registry.json` — active artifacts only

**Steps:**

1. Run `git diff --name-only <fromRef> <toRef>` → get list of changed files
2. Normalize paths (posix format, relative to repo root)
3. For each entry in `standing-registry.json` where `active: true`:
   - Check if entry's `path` field exists in the git diff list
   - If yes → artifact changed during this build; add to output
4. Output format: array of objects with:
   ```typescript
   {
     artifact_id: string;         // from registry
     path: string;                // from registry
     domain: string;              // from registry
     business: string;            // from registry
     status: "changed" | "unchanged";
     changed_file_count?: number; // how many versions of this artifact were edited
   }
   ```

**Edge cases:**
- Artifact file doesn't exist on disk (skip)
- Artifact moved/renamed in same build (git shows both old and new names; treat as one change)
- Registry entry has typo in `path` → will never match git diff (acceptable: registry maintenance is separate)
- Artifact path is a directory pattern (e.g., `docs/business-os/strategy/BRIK/`) → git diff is file-level; match prefix

### TypeScript Output Example

Script file: `scripts/src/startup-loop/build/detect-standing-updates.ts`

```typescript
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

export interface StandingArtifactDiff {
  artifact_id: string;
  path: string;
  domain: string;
  business: string;
  status: "changed";
  changed_files: string[];  // actual paths that matched
  affected_domains: string[];
}

export interface StandingUpdatesResult {
  changed_artifacts: StandingArtifactDiff[];
  unchanged_count: number;
  total_monitored: number;
  output_summary: string;   // ready-to-paste markdown
}

export function detectStandingUpdates(
  repoRoot: string,
  fromRef: string,
  toRef: string,
): StandingUpdatesResult {
  // 1. Get git diff file list
  const diffCommand = `git diff --name-only ${fromRef} ${toRef}`;
  const diffOutput = execSync(diffCommand, {
    cwd: repoRoot,
    encoding: "utf-8",
  });
  const changedFiles = new Set(
    diffOutput
      .split("\n")
      .filter((f) => f.length > 0)
      .map((f) => f.replace(/\\/g, "/")),  // normalize to posix
  );

  // 2. Load registry
  const registryPath = path.join(
    repoRoot,
    "docs/business-os/startup-loop/ideas/standing-registry.json",
  );
  const registryRaw = readFileSync(registryPath, "utf-8");
  const registry = JSON.parse(registryRaw);

  // 3. Match registry entries against git diff
  const changedArtifacts: StandingArtifactDiff[] = [];
  let unchangedCount = 0;

  for (const artifact of registry.artifacts) {
    if (!artifact.active) continue;  // skip inactive

    const normalized = artifact.path.replace(/\\/g, "/");

    // Check exact match or prefix match (for directory artifacts)
    const matchingFiles = Array.from(changedFiles).filter(
      (f) => f === normalized || f.startsWith(normalized.replace(/\/$/, "") + "/"),
    );

    if (matchingFiles.length > 0) {
      changedArtifacts.push({
        artifact_id: artifact.artifact_id,
        path: artifact.path,
        domain: artifact.domain,
        business: artifact.business,
        status: "changed",
        changed_files: matchingFiles,
        affected_domains: [artifact.domain, ...new Set(
          changedArtifacts.map((a) => a.domain),
        )],
      });
    } else {
      unchangedCount++;
    }
  }

  // 4. Generate markdown output
  const lines: string[] = [];
  if (changedArtifacts.length === 0) {
    lines.push("No standing updates: no registered artifacts changed in this build.");
  } else {
    for (const artifact of changedArtifacts) {
      const summary = `${artifact.path}: review for changes in [${artifact.domain}/${artifact.business}]`;
      lines.push(`- ${summary}`);
    }
  }

  return {
    changed_artifacts: changedArtifacts,
    unchanged_count: unchangedCount,
    total_monitored: registry.artifacts.filter((a: any) => a.active).length,
    output_summary: lines.join("\n"),
  };
}
```

### Markdown Output

When Standing Updates is auto-generated:

```markdown
## Standing Updates
- docs/business-os/strategy/BRIK/plan.user.md: review BRIK business plan section for dispatch integration changes
- docs/business-os/strategy/BRIK/assessment/2026-02-12-brand-identity-dossier.user.md: verify brand messaging alignment with new positioning language
```

Or when none:

```markdown
## Standing Updates
- No standing updates: no registered standing artifacts changed during this build.
```

### Integration Point in lp-do-build

**After step 2 in Plan Completion checklist** (after build-record/build-event produced):

```bash
# Auto-fill Standing Updates
pnpm --filter scripts startup-loop:detect-standing-updates \
  --from-ref HEAD~1 \
  --to-ref HEAD \
  --output-format markdown
```

Result is inserted into results-review template before codemoot/inline fallback.

---

## Part 2: Intended Outcome Check Section

### What It Is

The Intended Outcome Check section compares the intended outcome (from build-record Outcome Contract) with what actually happened, and assigns a verdict.

**From template (docs/plans/_templates/results-review.user.md):**
```markdown
## Intended Outcome Check

- **Intended:** <carry from build-record Outcome Contract: Intended Outcome Statement>
- **Observed:** <what actually happened, with evidence pointer>
- **Verdict:** <Met | Partially Met | Not Met>
- **Notes:** <brief rationale for verdict, or "n/a" if Met with no caveats>
```

**Real examples:**

From lp-do-ideas-source-trigger-operating-model:
```markdown
- **Intended:** Operator ideas and strategy document changes are automatically queued as dispatch packets and routed into the fact-find / briefing pipeline without manual triage.
- **Observed:** 4 dispatch packets created and routed on day one. All reached the correct fact-find slugs. Anti-loop invariants, dual-lane scheduler, and reflection debt emitter all functioned without intervention. Evidence: `docs/business-os/startup-loop/ideas/trial/queue-state.json`.
- **Verdict:** Met
- **Notes:** System operated in trial mode as designed. Live-mode activation criteria are separately gated by `lp-do-ideas-go-live-seam.md`.
```

From assessment-completion-registry:
```markdown
- **Intended:** A programmatic assessment completion registry exists that can answer "which ASSESSMENT stages has `<BIZ>` completed and when?" from a single file read, populated by a deterministic scanner.
- **Observed:** Scanner function `scanAssessmentCompletion()` produces per-business per-stage completion records with artifact paths and dates. CLI wrapper provides human-readable matrix. Verified against actual strategy directories — 9 businesses, 14 stages each, correct results.
- **Verdict:** Met
- **Notes:** n/a
```

### Data Sources for Verdict Computation

**From build-event.json:**
```json
{
  "intended_outcome": {
    "type": "measurable" | "operational",
    "statement": "...",
    "source": "operator" | "auto"
  }
}
```

**From build-record.user.md:**
- Task completion status (Complete, Blocked, etc.)
- Validation evidence blocks
- Scope deviations (if any)
- Test results

**From plan.md:**
- Task list with status
- Wave completion status
- Validation evidence
- Any noted caveats or deviations

### Auto-Verdict Logic: When Can Verdict Be Determined?

#### Case 1: Operational Outcome + All Tasks Complete

**Condition:**
- `build-event.intended_outcome.type === "operational"`
- All executable tasks in plan marked `Complete`
- No scope deviations or caveats
- No validation failures

**Verdict:** ✅ **Met** (with auto-generated Observed + Notes)

**Rationale:** Operational outcomes are process/infrastructure deliverables. If all tasks are done with no failures, the process succeeded.

**Example:**
```typescript
{
  verdict: "Met",
  rationale: "All {N} planned tasks completed successfully with clean validation.",
  observed: "All executable tasks in the plan completed: {task_titles}. Validation evidence confirmed {}.",
}
```

#### Case 2: Measurable Outcome + Evidence Artifact Exists

**Condition:**
- `build-event.intended_outcome.type === "measurable"`
- Intended outcome statement references a specific artifact/metric (e.g., "scanner produces X output")
- Build-record includes validation evidence pointing to that artifact
- Evidence file exists on disk and is non-empty

**Verdict:** ✅ **Met** (extracted evidence from build-record)

**Rationale:** Measurable outcomes require proof. If the evidence artifact is listed in build-record validation, assume Met.

**Example:**
```typescript
// From build-record: "Scanner verified against actual `docs/business-os/strategy/` — 9 businesses..."
{
  verdict: "Met",
  rationale: "Validation evidence confirms measurable outcome.",
  observed: "<excerpt from build-record validation section>"
}
```

#### Case 3: Operational + Partial Completion

**Condition:**
- `build-event.intended_outcome.type === "operational"`
- Some tasks Complete, but others Blocked or below threshold
- Scope deviations noted

**Verdict:** ⚠️ **Partially Met** (requires human review for final wording)

**Rationale:** Operational outcome may still be partially satisfied (e.g., "dispatch system works but manual triage still needed for edge cases"). Human decides.

**Needs LLM:** Yes — to articulate what was achieved vs. what's still pending.

#### Case 4: Measurable + No Evidence Artifact

**Condition:**
- `build-event.intended_outcome.type === "measurable"`
- Intended outcome references specific measurement (e.g., "conversion rate improved by X%")
- Build-record does NOT include a validation evidence section with that metric
- Metric value not found in plan or build-record

**Verdict:** ❌ **Not Met** OR ⚠️ **Cannot Determine**

**Needs LLM:** Yes — operator must provide observed value to compare.

#### Case 5: Measurable + Evidence Contradicts Intended

**Condition:**
- Evidence artifact exists
- Evidence clearly shows outcome was NOT achieved (e.g., "scanner created but CLI integration deferred")

**Verdict:** ⚠️ **Partially Met** (extract the deferral note)

**Example:**
```typescript
// From build-record: "Remaining 4 categories: no new data sources, packages, skills, or loop processes identified"
// But intended outcome was "new standing data sources AND skills identified"
{
  verdict: "Partially Met",
  rationale: "Some idea categories found; others deferred or not applicable.",
  observed: "<evidence from build-record>"
}
```

### Auto-Verdict Sketch (TypeScript)

```typescript
import { BuildEvent } from "./lp-do-build-event-emitter.js";

export interface IntendedOutcomeCheckResult {
  intended: string;
  observed: string;
  verdict: "Met" | "Partially Met" | "Not Met" | "Needs Review";
  notes: string;
  auto_determined: boolean;
  confidence: "high" | "medium" | "low";
}

export function autoVerdictFromBuildEvent(
  buildEvent: BuildEvent,
  planStatus: {
    all_executable_tasks_complete: boolean;
    task_count: number;
    complete_count: number;
    validation_passed: boolean;
    scope_deviations: string[];
    validation_evidence_excerpt?: string;
  },
  operatorNotes?: string,  // fallback from build-record if auto fails
): IntendedOutcomeCheckResult {
  const outcomeType = buildEvent.intended_outcome?.type;
  const outcomeStatement = buildEvent.intended_outcome?.statement ?? "";

  // RULE 1: Operational + All Complete
  if (
    outcomeType === "operational" &&
    planStatus.all_executable_tasks_complete &&
    planStatus.validation_passed &&
    planStatus.scope_deviations.length === 0
  ) {
    return {
      intended: outcomeStatement,
      observed: `All ${planStatus.task_count} planned tasks completed successfully with validation passing.`,
      verdict: "Met",
      notes: "n/a",
      auto_determined: true,
      confidence: "high",
    };
  }

  // RULE 2: Operational + Partial
  if (
    outcomeType === "operational" &&
    !planStatus.all_executable_tasks_complete
  ) {
    return {
      intended: outcomeStatement,
      observed: `${planStatus.complete_count} of ${planStatus.task_count} tasks completed. ${planStatus.scope_deviations.length > 0 ? `Scope deviations noted: ${planStatus.scope_deviations.join("; ")}` : ""}`,
      verdict: "Partially Met",  // needs human review to finalize
      notes: operatorNotes ?? "Review scope deviations and decide if partial delivery suffices for the outcome.",
      auto_determined: false,
      confidence: "medium",
    };
  }

  // RULE 3: Measurable + Validation Evidence Present
  if (
    outcomeType === "measurable" &&
    planStatus.validation_evidence_excerpt
  ) {
    return {
      intended: outcomeStatement,
      observed: planStatus.validation_evidence_excerpt,
      verdict: "Met",  // evidence exists; assume Met
      notes: "n/a",
      auto_determined: true,
      confidence: "high",
    };
  }

  // RULE 4: Cannot Auto-Determine
  return {
    intended: outcomeStatement,
    observed: "(Requires human review — no validation evidence found.)",
    verdict: "Needs Review",
    notes: operatorNotes ?? "Provide observed outcome and comparison to intended statement.",
    auto_determined: false,
    confidence: "low",
  };
}
```

### When Verdict Needs LLM

1. **Partial outcomes** — split out what was achieved vs. what wasn't
2. **Conditional success** — "outcome met IF we exclude edge case X"
3. **Measurable with external data** — requires checking live dashboards, API responses, etc.
4. **Deferred work** — intended outcome achieved but follow-ups remain
5. **Team consensus** — intended outcome is subjective (e.g., "user satisfaction improved")

### Integration Point in lp-do-build

**Step 2 in Plan Completion checklist** (before codemoot/inline fallback):

```bash
# Auto-fill Intended Outcome Check
pnpm --filter scripts startup-loop:auto-verdict-outcome-check \
  --build-event-path docs/plans/<slug>/build-event.json \
  --plan-path docs/plans/<slug>/plan.md \
  --build-record-path docs/plans/<slug>/build-record.user.md \
  --output-format markdown
```

**Output:** Markdown snippet or `null` if ambiguous (route to codemoot/LLM).

---

## Part 3: Deployment Recommendations

### Minimal First Phase (Deterministic Only)

**Launch:**
- `detect-standing-updates.ts` — git diff ∩ registry
- `auto-verdict-outcome-check.ts` — Rule 1 only (operational + all complete)

**Risk:** Low. Both are read-only analyses with no mutation.

**Outcome:** Reduce ~2-3 minutes of codemoot/LLM time per build.

### Second Phase (Confidence Expansion)

**Add:**
- Rule 2 for operational partial outcomes (routes to codemoot for context)
- Rule 3 for measurable outcomes with evidence (high confidence)

**Risk:** Medium. May miss nuances. Fallback to codemoot on confidence < medium.

**Outcome:** Reduce ~5-7 minutes of build-completion latency.

### Execution Plan

1. **Create scripts** (this week):
   - `/scripts/src/startup-loop/build/detect-standing-updates.ts`
   - `/scripts/src/startup-loop/build/auto-verdict-outcome-check.ts`

2. **Add to package.json scripts:**
   ```json
   {
     "startup-loop:detect-standing-updates": "tsx src/startup-loop/build/detect-standing-updates.ts",
     "startup-loop:auto-verdict-outcome-check": "tsx src/startup-loop/build/auto-verdict-outcome-check.ts"
   }
   ```

3. **Update lp-do-build SKILL.md** (step 2):
   - Call detect-standing-updates before template insertion
   - Call auto-verdict-outcome-check before codemoot route decision
   - Codemoot route only if verdict is "Needs Review" or confidence < high

4. **Update results-review template** (docs/plans/_templates/results-review.user.md):
   - Mark `## Standing Updates` as auto-fillable
   - Mark `## Intended Outcome Check` as auto-fillable with confidence indicators

5. **Test on 2-3 builds** (next loop cycle):
   - Verify auto-generated summaries match human intent
   - Collect edge cases for Rule expansion

---

## Part 4: Files to Monitor for Automation Signals

### Standing Registry Maintenance

**File:** `docs/business-os/startup-loop/ideas/standing-registry.json`

**Signals that automation is working:**
- Registry grows over time as new standing artifacts are created
- `last_known_sha` field is updated post-build (track which builds touched each artifact)
- Active flag is toggled when artifacts retire or new ones onboard

### Completed Ideas Registry

**File:** `docs/business-os/_data/completed-ideas.json`

**Signals:**
- Ideas extracted from results-review Standing Updates section should be recorded here after build
- Prevents duplicate ideas from being re-processed in future builds

**Current use:** `deriveIdeaKey()` in generate-process-improvements.ts checks completed registry to suppress repeated ideas.

### Build Events Trend

**Pattern:** Each build-event.json should contain:
```json
{
  "intended_outcome": {
    "type": "measurable" | "operational",
    "statement": "...",
    "source": "operator"
  }
}
```

**Why it matters:** Type field determines which verdict rules apply. Over time, track:
- Ratio of measurable vs. operational outcomes
- Whether operator-sourced outcomes have higher success rates than auto-generated
- Trends in verdict distribution (Met vs. Partially Met vs. Not Met)

---

## Appendix: Example Standing Updates Output

### Build: assessment-completion-registry (2026-03-03)

**Git diff result:**
```
docs/business-os/startup-loop/ideas/standing-registry.json
docs/plans/_archive/assessment-completion-registry/plan.md
docs/plans/_archive/assessment-completion-registry/build-record.user.md
docs/plans/_archive/assessment-completion-registry/results-review.user.md
```

**Registry check:**
- `docs/business-os/startup-loop/ideas/standing-registry.json` — in diff, but excluded (source_process artifact, not source_reference)
- `docs/business-os/strategy/*/plan.user.md` — NOT in diff → no change
- No other active standing artifacts match

**Output:**
```markdown
## Standing Updates
- No standing updates: scanner outputs are computed on-demand from existing assessment directory contents; no standing artifacts modified.
```

### Build: bos-ideas-dispatch-20260303-code-signals (2026-03-04)

**Git diff result:**
```
scripts/src/startup-loop/build/lp-do-ideas-codebase-signals-bridge.ts
scripts/src/startup-loop/build/generate-process-improvements.ts
docs/business-os/startup-loop/ideas/standing-registry.json
...
```

**Registry check:**
- `BOS-BOS-BUG_SCAN_FINDINGS` → path `docs/plans/_latest/bug-scan-findings.user.json` — not in diff
- `BOS-BOS-CODEBASE_STRUCTURAL_SIGNALS` → path `docs/business-os/startup-loop/ideas/trial/codebase-signals.latest.json` — not in diff
- `BOS-BOS-AGENT_SESSION_FINDINGS` → path `docs/business-os/startup-loop/ideas/trial/agent-session-findings.latest.json` — not in diff

**Output:**
```markdown
## Standing Updates
- No standing updates: this build integrated signal bridges into the process-improvements generation pipeline; no standing reference artifacts were modified as part of integration.
```

---

## Appendix: Example Intended Outcome Check Auto-Fill

### Build: assessment-completion-registry

**Build event:**
```json
{
  "intended_outcome": {
    "type": "operational",
    "statement": "A programmatic assessment completion registry exists that can answer which ASSESSMENT stages a business has completed and when, from a single file read, populated by a deterministic scanner."
  }
}
```

**Plan status:**
```
- Task 1: Complete
- Task 2: Complete
- Task 3: Complete
- All validation: Pass
- Scope deviations: None
```

**Auto output:**
```markdown
## Intended Outcome Check

- **Intended:** A programmatic assessment completion registry exists that can answer which ASSESSMENT stages a business has completed and when, from a single file read, populated by a deterministic scanner.
- **Observed:** All 3 planned tasks completed successfully. Scanner function scanAssessmentCompletion() verified against actual strategy directories — 9 businesses, 14 stages each, correct results.
- **Verdict:** Met
- **Notes:** n/a
```

**Confidence:** high — operational outcome, all tasks complete, validation passed.

---

## Appendix: Example Verdict = Needs Review

### Hypothetical Build: X with Partial Task Completion

**Build event:**
```json
{
  "intended_outcome": {
    "type": "operational",
    "statement": "Users can upload images to the product catalog via S3/R2 integration."
  }
}
```

**Plan status:**
```
- TASK-01 (API route): Complete
- TASK-02 (UI component): Complete
- TASK-03 (CLI tool): Blocked (deferred to next cycle)
- Validation: Pass
- Scope deviation: "TASK-03 deferred; users can upload but not via CLI"
```

**Auto output:**
```markdown
## Intended Outcome Check

- **Intended:** Users can upload images to the product catalog via S3/R2 integration.
- **Observed:** API route and UI component completed. CLI tool deferred to next cycle. Scope deviation: TASK-03 out of scope for this build.
- **Verdict:** Partially Met
- **Notes:** Review whether intended outcome is satisfied with partial implementation (web UI + API only, no CLI). Remaining work: CLI tooling in next cycle.
```

**Confidence:** medium — operator should confirm if partial satisfies "users can upload."

---

## Conclusion

**Standing Updates:** Automation is straightforward and low-risk. A deterministic git-diff-based scanner can handle 100% of cases.

**Intended Outcome Check Verdict:** Automation can handle ~60-70% of cases with high confidence (Rule 1: operational + complete, Rule 3: measurable + evidence). Remaining cases route to codemoot for context-aware finalization. This reduces LLM latency by 3-5 minutes per build without sacrificing accuracy.

Both changes integrate cleanly into the existing lp-do-build flow at step 2 (pre-codemoot) and leverage existing build-event.json infrastructure.
