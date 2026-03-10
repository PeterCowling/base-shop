# Build-Completion Automation: Summary & Next Steps

## Quick Reference

Two sections in results-review.user.md are candidates for deterministic automation:

| Section | Automation Potential | Effort | Risk | Latency Gain |
|---------|---------------------|--------|------|--------------|
| Standing Updates | 100% deterministic | Low | Low | ~2-3 min |
| Intended Outcome Check (Verdict) | ~60-70% (high confidence cases) | Medium | Low | ~3-5 min |

---

## Standing Updates: Algorithm

**Input:** git diff from `HEAD~1` to `HEAD` + standing-registry.json active entries

**Process:**
```
1. git diff --name-only HEAD~1 HEAD → changed_files set
2. For each active entry in registry:
     if entry.path in changed_files:
       → add to "changed artifacts" list
3. Output markdown list of changed artifacts
   OR "No standing updates: ..." if empty
```

**Examples:**
- Changed: `docs/business-os/strategy/BRIK/plan.user.md` → output: `"- docs/business-os/strategy/BRIK/plan.user.md: review for changes"`
- Unchanged: all registry entries not in diff → output: `"No standing updates: no registered artifacts changed"`

**Status:** Ready to implement. No LLM needed.

---

## Intended Outcome Check: Verdict Auto-Determination

**Key insight:** Verdict can be auto-determined when outcome type + plan status + evidence align predictably.

### Rule 1: Operational + All Tasks Complete ✅ HIGH CONFIDENCE

**When:**
- `build-event.intended_outcome.type === "operational"` (infrastructure/process delivery)
- All executable tasks in plan marked `Complete`
- Validation evidence passed
- No scope deviations

**Auto-verdict:** **Met** with generic `Observed` summary

**Example:** Assessment-completion-registry — all 3 tasks done, no deviations → auto-fill with "All planned tasks completed."

---

### Rule 2: Measurable + Validation Evidence Present ✅ HIGH CONFIDENCE

**When:**
- `build-event.intended_outcome.type === "measurable"` (metric/output-based)
- Build-record contains validation evidence section pointing to proof artifact
- Proof artifact exists and is non-empty

**Auto-verdict:** **Met** + extract evidence excerpt as Observed

**Example:** "Scanner verified against actual directories — 9 businesses, 14 stages" → use as Observed.

---

### Rule 3: Operational + Partial Completion ⚠️ MEDIUM CONFIDENCE

**When:**
- Type === "operational"
- Some tasks Complete, others Blocked or below threshold
- Scope deviations noted

**Auto-verdict:** **Partially Met** + outline what was completed vs. deferred

**Needs LLM:** Yes — to decide if partial satisfies the intent

---

### Rule 4: Cannot Auto-Determine ❌ ROUTE TO LLM

**When:**
- Measurable outcome + no validation evidence
- Ambiguous scope deviations
- Evidence contradicts outcome expectation

**Handling:** Mark verdict as "Needs Review" and route to codemoot/inline LLM for context-aware finalization.

---

## Implementation Roadmap

### Phase 1: Standing Updates (Week 1)

**Deliverable:** `scripts/src/startup-loop/build/detect-standing-updates.ts`

**Changes:**
1. Write deterministic git-diff-based detector
2. Add pnpm script: `startup-loop:detect-standing-updates`
3. Update lp-do-build SKILL.md step 2 to call it before codemoot
4. Test on 1-2 builds

**Latency gain:** ~2-3 minutes

---

### Phase 2: Intended Outcome Check — Rules 1 & 3 (Week 2)

**Deliverable:** `scripts/src/startup-loop/build/auto-verdict-outcome-check.ts`

**Changes:**
1. Implement Rules 1, 2, 3 (skip Rule 4 — let codemoot handle)
2. Add pnpm script: `startup-loop:auto-verdict-outcome-check`
3. Add confidence field: "high" | "medium" | "low"
4. Only auto-fill if confidence >= medium; otherwise route to codemoot
5. Update lp-do-build SKILL.md step 2 with verdict logic
6. Test on 2-3 builds, collect edge cases

**Latency gain:** ~3-5 minutes

---

## TypeScript Function Signatures

### detect-standing-updates.ts

```typescript
export interface StandingArtifactDiff {
  artifact_id: string;
  path: string;
  domain: string;
  business: string;
  status: "changed";
  changed_files: string[];
}

export interface StandingUpdatesResult {
  changed_artifacts: StandingArtifactDiff[];
  unchanged_count: number;
  total_monitored: number;
  output_summary: string;  // markdown ready for insertion
}

export function detectStandingUpdates(
  repoRoot: string,
  fromRef: string,
  toRef: string,
): StandingUpdatesResult
```

### auto-verdict-outcome-check.ts

```typescript
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
  planStatus: PlanStatus,
  operatorNotes?: string,
): IntendedOutcomeCheckResult
```

---

## Integration with lp-do-build

**Update step 2 in Plan Completion checklist:**

```markdown
2. Produce `results-review.user.md`:

   a. Auto-fill Standing Updates:
      pnpm --filter scripts startup-loop:detect-standing-updates \
        --from-ref HEAD~1 --to-ref HEAD --output-format markdown

   b. Auto-fill Intended Outcome Check:
      pnpm --filter scripts startup-loop:auto-verdict-outcome-check \
        --build-event-path <slug>/build-event.json \
        --build-record-path <slug>/build-record.user.md \
        --plan-path <slug>/plan.md \
        --output-format markdown

   c. If verdict confidence < high: route to codemoot for LLM refinement
      Otherwise: insert auto-filled sections into template

   d. Remaining sections (Observed Outcomes, New Idea Candidates, Standing Expansion):
      - Inline fallback OR codemoot route as normal
```

---

## Expected Outcomes (Next 3 Builds)

1. **Standing Updates auto-generated:** 100% of cases (no failures expected)
2. **Intended Outcome Check auto-filled:** ~70% of cases with high confidence
3. **Fallback to codemoot:** ~30% of cases (partial outcomes, edge cases)
4. **Latency reduction:** 3-5 minutes per build on average
5. **No regression:** Auto-filled sections match human review intent

---

## Files Mentioned in Investigation

**Key reference files:**
- `/Users/petercowling/base-shop/docs/business-os/startup-loop/ideas/standing-registry.json` — standing artifact registry
- `/Users/petercowling/base-shop/scripts/src/startup-loop/build/generate-process-improvements.ts` — shows `deriveIdeaKey()` and registry matching pattern
- `/Users/petercowling/base-shop/.claude/skills/lp-do-build/SKILL.md` — Plan Completion checklist, step 2
- `/Users/petercowling/base-shop/scripts/src/startup-loop/build/lp-do-build-event-emitter.ts` — build-event.json structure
- `/Users/petercowling/base-shop/docs/plans/_templates/results-review.user.md` — template sections

**Build examples:**
- `/Users/petercowling/base-shop/docs/plans/_archive/assessment-completion-registry/build-event.json` — Rule 1 example (operational + complete)
- `/Users/petercowling/base-shop/docs/plans/_archive/assessment-completion-registry/results-review.user.md` — expected output format
- `/Users/petercowling/base-shop/docs/plans/_archive/lp-do-ideas-source-trigger-operating-model/results-review.user.md` — Rule 1 example (all tasks complete)

---

## Determinism Guarantees

Both scripts are **fully deterministic**:

1. **No external APIs** — only git commands + file I/O
2. **No randomization** — output is idempotent (same input → same output)
3. **No user input required** — all data sourced from repo artifacts
4. **No state mutation** — read-only analysis

This means:
- Same verdict if re-run on same build artifacts
- No caching needed; re-runs are fast
- Safe to call multiple times in a single build cycle
- Results are reproducible for audit/review

---

## Risk Assessment

**Low risk overall:**

- Standing Updates: Read-only git analysis; worst case is an incomplete list (operator can manually add missing entries)
- Verdict auto-fill: High-confidence rules only; medium-confidence cases route to LLM
- No breaking changes to existing lp-do-build flow
- Fallback to codemoot/inline LLM is always available
- No schema changes to build-event.json or results-review.user.md

**Testing strategy:**
- Unit tests for each rule in isolation
- Integration test: full build cycle with both auto-generators enabled
- 2-3 shadow runs on real plans to validate output quality
- Operator review before landing in main build flow
