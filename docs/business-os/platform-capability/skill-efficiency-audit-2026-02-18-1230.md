scan_timestamp: 2026-02-18 12:30
threshold: 200 lines
scope: lp-*, startup-loop, draft-outreach
git_sha: 676c03d
previous_artifact: none
skills_scanned: 28

---
Type: Skill Efficiency Audit
Audit-Date: 2026-02-18
Skill: /meta-loop-efficiency
Run: 2026-02-18-1230
Status: Active
---

# Startup Loop Skill Efficiency Audit — 2026-02-18 12:30

## 1. Scan Summary

| Metric | Count |
|---|---:|
| Skills scanned | 28 |
| Fully compliant (no H1/H2 flags) | 8 |
| H1 compliant, H2 dispatch-candidate | 5 |
| H1 opportunity (monolith or bloated-orchestrator) | 15 |
| H2 dispatch-candidate | 14 |
| H0 duplicate candidates | 0 |

**First run** — all findings are new-to-HIGH. Planning anchor emitted (see §5).

Compliant skills (no action needed): draft-outreach, lp-prioritize, lp-design-system,
lp-launch-qa, lp-prioritize, lp-refactor, lp-seo, startup-loop.

H1-compliant but H2 dispatch-candidate: lp-assessment-bootstrap, lp-do-fact-find, lp-do-replan,
lp-signal-review, lp-site-upgrade.

---

## 2. Possible Duplicates (H0)

Checked all same-line-count pairs (lp-experiment/lp-guide-audit at 310L;
lp-forecast/lp-baseline-merge at 201L). All four have distinct MD5 hashes.

**No duplicate candidates detected.**

---

## 3. List 1 — Modularization Opportunities (H1)

Threshold: 200 lines for SKILL.md orchestrator. Ranked tier-first, then lines
descending within tier. All findings are new (first run; previous_artifact: none).

### HIGH tier

| Skill | Lines | Status | Notes |
|---|---:|---|---|
| lp-sequence | 287 | **monolith** | No modules/; invoked on every plan topology change → high-frequency; strong candidate |
| lp-channels | 262 | **monolith** | No modules/; 6 stage headings (Stage 1–6) present |
| lp-offer | 233 | **monolith** | No modules/; has 1 dispatch ref (partially addressed) |
| lp-do-build | 222 | bloated-orchestrator | Has modules/; SKILL.md orchestrator itself exceeds threshold; prioritise slim-down |
| lp-do-plan | 214 | bloated-orchestrator | Has modules/; SKILL.md orchestrator exceeds threshold; also H2 dispatch-candidate |
| lp-forecast | 201 | **monolith** | No modules/; barely over threshold; 5 phase headings → H2 candidate too |

### MEDIUM tier

| Skill | Lines | Status | Notes |
|---|---:|---|---|
| lp-design-qa | 470 | **monolith** | No modules/; highest absolute line count in scope; 8 domain phase headings → domain-split analogue to lp-launch-qa |
| lp-design-spec | 385 | **monolith** | No modules/; 9 phase headings → strong dispatch candidate too |
| lp-experiment | 310 | **monolith** | No modules/; 0 phase headings (uses mode-based structure, not Phase N) |

### LOW tier

| Skill | Lines | Status | Notes |
|---|---:|---|---|
| lp-guide-audit | 310 | **monolith** | Unlisted in tier table → defaulted to low; 0 phase headings |
| lp-onboarding-audit | 268 | **monolith** | No modules/; 6 phase headings |
| lp-measure | 230 | **monolith** | No modules/; 7 phase headings |
| lp-guide-improve | 226 | **monolith** | Unlisted in tier table → defaulted to low; 3 phase headings |
| lp-readiness | 223 | **monolith** | No modules/; 3 phase headings |
| lp-baseline-merge | 201 | **monolith** | No modules/; 0 phase headings |

**Module-monolith advisory:** No modules/ directories in this scope currently exceed
400 lines. No module-monolith candidates detected.

---

## 4. List 2 — Dispatch Opportunities (H2 + H3)

H2 criterion: dispatch_refs_any_md == 0 AND phase_matches_any_md ≥ 3.
H3 criterion (advisory): references lp-do-build in any .md; no wave-dispatch-protocol.md ref.

Ranked tier-first, then phase_matches descending within tier.

### HIGH tier

| Skill | phase_matches | dispatch_refs | H2 | H3 | Notes |
|---|---:|---:|---|---|---|
| lp-do-plan | 10 | 0 | dispatch-candidate | wave-candidate | Also H1 bloated-orchestrator; Plan Phase 1–10 headings across modules |
| lp-do-fact-find | 9 | 0 | dispatch-candidate | wave-candidate | H1 compliant (198L); 9 phase headings across modules |
| lp-channels | 6 | 0 | dispatch-candidate | — | Also H1 monolith; Stage 1–6 headings (confirmed manually) |
| lp-do-replan | 5 | 0 | dispatch-candidate | wave-candidate | H1 compliant (151L); Phase 1–5 headings |
| lp-forecast | 5 | 0 | dispatch-candidate | — | Also H1 monolith (201L) |

### MEDIUM tier

| Skill | phase_matches | dispatch_refs | H2 | H3 | Notes |
|---|---:|---:|---|---|---|
| lp-design-spec | 9 | 0 | dispatch-candidate | wave-candidate | Also H1 monolith; 9 phase headings |
| lp-design-qa | 8 | 0 | dispatch-candidate | wave-candidate | Also H1 monolith (470L); strongest combined signal |
| lp-site-upgrade | 4 | 0 | dispatch-candidate | — | H1 compliant (149L); 4 phase headings |

### LOW tier

| Skill | phase_matches | dispatch_refs | H2 | H3 | Notes |
|---|---:|---:|---|---|---|
| lp-measure | 7 | 0 | dispatch-candidate | — | Also H1 monolith (230L) |
| lp-onboarding-audit | 6 | 0 | dispatch-candidate | — | Also H1 monolith (268L) |
| lp-signal-review | 5 | 0 | dispatch-candidate | — | H1 compliant (98L, has modules) |
| lp-assessment-bootstrap | 4 | 0 | dispatch-candidate | — | H1 compliant (94L); 4 phase headings |
| lp-readiness | 3 | 0 | dispatch-candidate | — | Also H1 monolith (223L) |
| lp-guide-improve | 3 | 0 | dispatch-candidate | — | Also H1 monolith (226L, unlisted → low) |

**H3 advisory note:** H3 (wave-dispatch-protocol ref) fires for 8 skills. Many of
these reference lp-do-build in a downstream context (e.g. "proceed to /lp-do-build") rather
than as a parallel build orchestration target. H3 calibration recommended after
reviewing which skills actually orchestrate parallel build waves. lp-do-plan is the
highest-value H3 target (it produces the Parallelism Guide consumed by lp-do-build).

---

## 5. Planning Anchor

**Status: NEW-TO-HIGH (first run — all findings are new)**

Top action targets from this scan (highest combined signal):

| Priority | Skill | Signal | Why |
|---|---|---|---|
| 1 | lp-design-qa | H1 monolith (470L) + H2 dispatch-candidate (8 matches) | Largest skill in scope; domain-split analogue to lp-launch-qa (conversion/colour/spacing/copy/a11y/responsive) |
| 2 | lp-sequence | H1 monolith (287L) + high tier | Invoked on every plan topology change; thinning reduces context at highest-frequency call site |
| 3 | lp-channels | H1 monolith (262L) + H2 dispatch-candidate (6 matches) | Stage 1–6 independently executable; high-tier; already has 0 dispatch refs |

**Recommended next step:**

```
/lp-do-fact-find startup-loop-token-efficiency-v2
```

Scope suggestion: start with lp-design-qa domain split (H1+H2 highest combined
signal; clear domain boundaries) + lp-sequence thin-out (H1 high-tier, high-frequency).

---

## 6. Delta Status

| Item | Previous status | Current status | Action |
|---|---|---|---|
| All 15 H1 opportunities | — (first run) | NEW | Planning anchor emitted |
| All 14 H2 dispatch-candidates | — (first run) | NEW | Planning anchor emitted |
| Commit guard | Fired (dirty tree: pre-existing dev branch changes) | Artifact staged explicitly by path only — unrelated dirty files not committed | Noted in build evidence |

**Regressions since last audit:** N/A (first run)

**Known items to suppress on next run:** All 15 H1 + 14 H2 items above are now
`known`. Next audit should suppress planning anchor for these items unless they
worsen (additional lines without modules) or a new skill appears above threshold.
