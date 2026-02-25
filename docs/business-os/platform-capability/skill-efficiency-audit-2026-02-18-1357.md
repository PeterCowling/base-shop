scan_timestamp: 2026-02-18 13:57
threshold: 200 lines
scope: lp-*, startup-loop, draft-outreach
git_sha: 672c5cb
previous_artifact: skill-efficiency-audit-2026-02-18-1230.md
skills_scanned: 28

---
Type: Skill Efficiency Audit
Audit-Date: 2026-02-18
Skill: /meta-loop-efficiency
Run: 2026-02-18-1357
Status: Active
---

# Startup Loop Skill Efficiency Audit — 2026-02-18 13:57

## 1. Scan Summary

| Metric | Count |
|---|---:|
| Skills scanned | 28 |
| H1 opportunities (monolith or bloated-orchestrator) | 13 |
| H2 dispatch-candidates | 14 |
| H0 duplicate candidates | 0 |

**Wave 1 build impact (since last audit):**
- lp-design-qa: 470L monolith → 161L **compliant** ✓ (H1 + H2 both resolved)
- lp-sequence: 287L monolith → 124L **compliant** ✓ (H1 resolved)
- lp-channels: 262L monolith → 92L **compliant** ✓ (H1 resolved)
- Net H1 change: −3 resolved, +1 regression (lp-do-fact-find) = net −2

**Regression detected (HIGH tier):** lp-do-fact-find: 198L → 201L (3-line growth crossed threshold; bloated-orchestrator).

**New H2 finding (HIGH tier):** lp-sequence newly appears as dispatch-candidate (phase_matches 0→9 due to Step-N headings in new module files). Advisory: false positive — modules contain sequential algorithm steps, not parallel dispatch domains.

Compliant skills (H1 and H2 clean): draft-outreach, lp-prioritize, lp-assessment-bootstrap\*,
lp-channels, lp-design-qa, lp-design-system, lp-launch-qa, lp-prioritize, lp-refactor,
lp-do-replan\*, lp-seo, lp-signal-review\*, lp-site-upgrade\*, startup-loop.

\* H2 dispatch-candidate but H1 compliant.

---

## 2. Possible Duplicates (H0)

SHA256 comparison across all 28 SKILL.md files (whitespace-normalized). No identical hashes found.

**No duplicate candidates detected.**

---

## 3. List 1 — Modularization Opportunities (H1)

Threshold: 200 lines for SKILL.md orchestrator. Ranked tier-first, then lines descending.

### HIGH tier

| Skill | Lines | Status | Delta | Notes |
|---|---:|---|---|---|
| lp-offer | 233 | **monolith** | known | No modules/; 1 dispatch ref (partially addressed) |
| lp-do-build | 222 | bloated-orchestrator | known | Has modules/; orchestrator exceeds threshold |
| lp-do-plan | 214 | bloated-orchestrator | known | Has modules/; also H2 dispatch-candidate |
| lp-forecast | 201 | **monolith** | known | No modules/; 5 phase headings → H2 candidate too |
| lp-do-fact-find | 201 | bloated-orchestrator | **REGRESSION** (was 198L compliant) | Has modules/; 3-line growth crossed threshold; trim orchestrator to ≤200L |

**Resolved since last audit (HIGH tier):**
- lp-sequence: 287L monolith → 124L compliant ✓
- lp-channels: 262L monolith → 92L compliant ✓

### MEDIUM tier

| Skill | Lines | Status | Delta | Notes |
|---|---:|---|---|---|
| lp-design-spec | 385 | **monolith** | known | No modules/; 9 phase headings → strong dispatch candidate too |
| lp-experiment | 310 | **monolith** | known | No modules/; 0 phase headings (mode-based structure) |

**Resolved since last audit (MEDIUM tier):**
- lp-design-qa: 470L monolith → 161L compliant ✓

### LOW tier

| Skill | Lines | Status | Delta | Notes |
|---|---:|---|---|---|
| lp-guide-audit | 310 | **monolith** | known | Unlisted → low; 0 phase headings |
| lp-onboarding-audit | 268 | **monolith** | known | No modules/; 6 phase headings |
| lp-measure | 230 | **monolith** | known | No modules/; 7 phase headings |
| lp-guide-improve | 226 | **monolith** | known | Unlisted → low; 3 phase headings |
| lp-readiness | 223 | **monolith** | known | No modules/; 3 phase headings |
| lp-baseline-merge | 201 | **monolith** | known | No modules/; 0 phase headings |

**Module-monolith advisory:** No module file in any skill directory exceeds 400L. No module-monolith candidates.

---

## 4. List 2 — Dispatch Opportunities (H2 + H3)

H2 criterion: dispatch_refs_any_md == 0 AND phase_matches_any_md ≥ 3.
H3 criterion (advisory): references lp-do-build; no wave-dispatch-protocol.md ref.

Ranked tier-first, then phase_matches descending within tier.

### HIGH tier

| Skill | phase_matches | dispatch_refs | H2 | H3 | Delta | Notes |
|---|---:|---:|---|---|---|---|
| lp-do-plan | 10 | 0 | dispatch-candidate | wave-candidate | known | Also H1 bloated-orchestrator; Plan Phase 1–10 headings across modules |
| lp-do-fact-find | 9 | 0 | dispatch-candidate | wave-candidate | known | H1 regression (201L); 9 phase headings across modules |
| lp-sequence | 9 | 0 | dispatch-candidate | wave-candidate | **NEW** | H1 compliant (124L); Step-N headings in new modules trigger heuristic — **advisory: false positive** (sequential algorithm steps, not parallel domains; Step headings in modules are not dispatch targets) |
| lp-channels | 6 | 0 | dispatch-candidate | — | known | H1 compliant (92L); Stage headings in channel modules — **advisory: false positive** (sequential research stages, not parallel domains) |
| lp-do-replan | 5 | 0 | dispatch-candidate | wave-candidate | known | H1 compliant (151L); Phase 1–5 headings |
| lp-forecast | 5 | 0 | dispatch-candidate | — | known | Also H1 monolith (201L) |

### MEDIUM tier

| Skill | phase_matches | dispatch_refs | H2 | H3 | Delta | Notes |
|---|---:|---:|---|---|---|---|
| lp-design-spec | 9 | 0 | dispatch-candidate | wave-candidate | known | Also H1 monolith; 9 phase headings |
| lp-site-upgrade | 4 | 0 | dispatch-candidate | — | known | H1 compliant (149L) |

**Resolved since last audit (MEDIUM tier):**
- lp-design-qa: dispatch-candidate → dispatch-adopted (dispatch_refs 0→1, subagent-dispatch-contract.md Model A) ✓

### LOW tier

| Skill | phase_matches | dispatch_refs | H2 | H3 | Delta | Notes |
|---|---:|---:|---|---|---|---|
| lp-measure | 7 | 0 | dispatch-candidate | — | known | Also H1 monolith (230L) |
| lp-onboarding-audit | 6 | 0 | dispatch-candidate | — | known | Also H1 monolith (268L) |
| lp-signal-review | 5 | 0 | dispatch-candidate | — | known | H1 compliant (98L, has modules) |
| lp-assessment-bootstrap | 4 | 0 | dispatch-candidate | — | known | H1 compliant (94L); 4 phase headings |
| lp-readiness | 3 | 0 | dispatch-candidate | — | known | Also H1 monolith (223L) |
| lp-guide-improve | 3 | 0 | dispatch-candidate | — | known | Also H1 monolith (226L, unlisted → low) |

**H3 advisory note:** H3 fires for lp-sequence (new — lp-do-build referenced as downstream "use /lp-do-build" step; Step-N headings in new modules; no wave-dispatch-protocol ref). This is a false positive for the same reason as H2: the Step headings are sequential, not wave-dispatchable. Net H3 advisory count: 7 (same as previous — lp-design-qa resolved, lp-sequence added).

---

## 5. Planning Anchor

**Status: NEW findings + REGRESSION detected**

| Finding | Type | Tier | Action |
|---|---|---|---|
| lp-do-fact-find 198→201L | H1 regression | HIGH | Trim SKILL.md orchestrator by ≥2 lines; verify modules/ coverage unchanged |
| lp-sequence H2 new | H2 new-to-HIGH | HIGH | Advisory only — false positive (Step-N headings in modules are sequential algorithm stages, not parallel dispatch domains). No dispatch adoption needed. |

**Recommended action for lp-do-fact-find regression:**

```
# Inspect growth and trim
wc -l .claude/skills/lp-do-fact-find/SKILL.md
# Target: ≤200L; trim introductory prose or inline routing header
```

This is a minor regression (3 lines over threshold, already has modules). A quick editorial trim is sufficient — no planning/fact-find cycle needed.

**lp-sequence H2 false positive:**

The heuristic fired because the new `modules/seq-algorithm.md` and `modules/seq-plan-update.md` contain `## Step N:` headings which match the H2 pattern. These steps are a sequential DAG algorithm (each step feeds the next) — not independent parallel domains. Dispatch adoption is NOT recommended. No fact-find needed. Suppress in next audit by acknowledging as known.

**No new opportunities requiring a fact-find cycle.** Wave 1 build achieved its three primary goals. The lp-do-fact-find regression is a minor editorial fix, not a planning task.

> **Previous planning anchor** (`/lp-do-fact-find startup-loop-token-efficiency-v2`) is now **COMPLETE** — plan `docs/plans/startup-loop-token-efficiency-v2/plan.md` Wave 1 executed and committed at `672c5cb`.

---

## 6. Delta Status

| Item | Previous status | Current status | Notes |
|---|---|---|---|
| lp-design-qa H1 (470L monolith) | NEW | **RESOLVED** ✓ | 161L, has modules; dispatch_refs=1 |
| lp-sequence H1 (287L monolith) | NEW | **RESOLVED** ✓ | 124L, has modules |
| lp-channels H1 (262L monolith) | NEW | **RESOLVED** ✓ | 92L, has modules |
| lp-design-qa H2 (dispatch-candidate) | NEW | **RESOLVED** ✓ | Model A dispatch adopted |
| lp-do-fact-find H1 (compliant at 198L) | compliant | **REGRESSION** (201L bloated-orchestrator) | 3-line growth; editorial trim needed |
| lp-sequence H2 (not previously flagged) | n/a | **NEW** (9 phase_matches) | False positive; Step-N headings in modules |
| All other H1 opportunities (12 items) | known | known | No change |
| All other H2 opportunities (12 items) | known | known | No change |

**Regressions since last audit:** 1 (lp-do-fact-find H1: 198→201L)

**Items resolved since last audit:** 4 (lp-design-qa H1, lp-sequence H1, lp-channels H1, lp-design-qa H2)

**Net H1 opportunity count:** 15 → 13 (−2 net: 3 resolved, 1 regression)
**Net H2 opportunity count:** 14 → 14 (0 net: 1 resolved, 1 new false positive)
