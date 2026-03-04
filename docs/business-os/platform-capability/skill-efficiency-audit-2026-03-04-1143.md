scan_timestamp: 2026-03-04 11:43
threshold: 200 lines
scope: lp-*, startup-loop, draft-outreach
git_sha: 67cbec2
previous_artifact: skill-efficiency-audit-2026-02-18-1357.md
skills_scanned: 47

# Skill Efficiency Audit

## Scan Summary

| Metric | Count |
|---|---:|
| Skills scanned | 47 |
| Compliant | 21 (45%) |
| H1 monolith | 21 |
| H1 bloated-orchestrator | 5 |
| H1 module-monolith (advisory) | 1 |
| H2 dispatch-candidate | 28 |
| H3 wave-candidate | 13 |
| H0 duplicate groups | 0 |

## Possible Duplicates (H0)

None. All 47 SHA256 hashes are unique.

## List 1 — Modularization Opportunities (H1)

### high tier

**Monoliths** (>200L SKILL.md, no modules/):

| Skill | SKILL.md | Status |
|---|---:|---|
| lp-do-assessment-14-logo-brief | 643 | NEW |
| lp-do-factcheck | 438 | NEW |
| lp-design-spec | 395 | known |
| lp-do-assessment-01-problem-statement | 346 | NEW |
| lp-do-assessment-15-packaging-brief | 342 | NEW |
| lp-do-assessment-13-product-naming | 336 | NEW |
| lp-experiment | 313 | known |
| lp-guide-audit | 310 | known |
| lp-do-assessment-11-brand-identity | 299 | NEW |
| lp-do-ideas | 294 | NEW |
| lp-do-assessment-05-name-selection | 292 | NEW |
| lp-do-assessment-04-candidate-names | 280 | NEW |
| lp-onboarding-audit | 268 | known |
| lp-offer | 235 | known |
| lp-measure | 233 | known |
| lp-readiness | 230 | known |
| lp-guide-improve | 226 | known |
| lp-baseline-merge | 207 | known |
| lp-do-assessment-10-brand-profiling | 205 | NEW |
| lp-forecast | 204 | known |
| lp-do-assessment-08-current-situation | 203 | NEW |

**Bloated-orchestrators** (>200L SKILL.md, has modules/):

| Skill | SKILL.md | Max Module | Status |
|---|---:|---:|---|
| lp-do-critique | 535 | 83 | NEW |
| lp-do-plan | 309 | 76 | known (was 214, +95) |
| lp-do-build | 308 | 151 | known (was 222, +86) |
| lp-do-fact-find | 243 | 147 | known (was 201, +42) |
| lp-do-worldclass | 200 | 328 | NEW |

**Module-monolith advisory:**

| Skill | Module | Lines |
|---|---|---:|
| startup-loop | modules/cmd-advance.md | 532 |

### medium tier

No medium-tier skills exceed the threshold.

### low tier

No low-tier skills exceed the threshold (draft-outreach at 128L is compliant).

## List 2 — Dispatch Opportunities (H2 + H3)

### high tier

| Skill | Phases | Dispatch Refs | Wave Ref | Signal |
|---|---:|---:|---:|---|
| lp-do-worldclass | 19 | 0 | 0 | dispatch-candidate + wave-candidate |
| lp-do-plan | 14 | 0 | 0 | dispatch-candidate + wave-candidate |
| lp-do-fact-find | 13 | 0 | 0 | dispatch-candidate + wave-candidate |
| lp-weekly | 13 | 0 | 0 | dispatch-candidate |
| lp-do-critique | 10 | 0 | 0 | dispatch-candidate + wave-candidate |
| lp-do-sequence | 9 | 0 | 0 | dispatch-candidate + wave-candidate |
| lp-channels | 6 | 0 | 0 | dispatch-candidate |
| lp-do-replan | 5 | 0 | 0 | dispatch-candidate + wave-candidate |
| lp-forecast | 5 | 0 | 0 | dispatch-candidate |
| startup-loop | 11 | 1 | 0 | wave-candidate |

### medium tier

| Skill | Phases | Dispatch Refs | Wave Ref | Signal |
|---|---:|---:|---:|---|
| lp-design-spec | 9 | 0 | 0 | dispatch-candidate + wave-candidate |
| lp-launch-qa | 6 | 1 | 0 | wave-candidate |
| lp-signal-review | 6 | 0 | 0 | dispatch-candidate + wave-candidate |
| lp-measure | 7 | 0 | 0 | dispatch-candidate |
| lp-site-upgrade | 4 | 0 | 0 | dispatch-candidate |

### low tier

| Skill | Phases | Signal |
|---|---:|---|
| lp-coverage-scan | 13 | dispatch-candidate |
| lp-do-assessment-14 | 15 | dispatch-candidate |
| lp-do-assessment-01 | 11 | dispatch-candidate |
| lp-do-assessment-15 | 8 | dispatch-candidate |
| lp-do-assessment-03 | 6 | dispatch-candidate |
| lp-do-assessment-11 | 6 | dispatch-candidate |
| lp-onboarding-audit | 6 | dispatch-candidate |
| lp-do-assessment-08 | 5 | dispatch-candidate |
| lp-do-briefing | 5 | dispatch-candidate |
| lp-assessment-bootstrap | 4 | dispatch-candidate |
| lp-brand-refresh | 4 | dispatch-candidate |
| lp-do-assessment-10 | 4 | dispatch-candidate |
| lp-do-ideas | 4 | dispatch-candidate |
| lp-do-assessment-12 | 3 | dispatch-candidate |
| lp-guide-improve | 3 | dispatch-candidate |
| lp-readiness | 3 | dispatch-candidate |

## Delta Status

Previous artifact: `skill-efficiency-audit-2026-02-18-1357.md` (28 skills, git SHA `672c5cb`)

### Growth since last audit

- Skills scanned: 28 → 47 (+19, mostly assessment series)
- H1 opportunities: 13 → 26 (+13)
- H2 dispatch-candidates: 14 → 28 (+14)
- H3 wave adoption: 0% → 0% (unchanged)
- Dispatch adoption: 6/47 = 13% (was ~14%)

### Regressions (known skills that grew)

| Skill | Prior Lines | Current Lines | Growth |
|---|---:|---:|---|
| lp-do-plan | 214 | 309 | +95 |
| lp-do-build | 222 | 308 | +86 |
| lp-do-fact-find | 201 | 243 | +42 |

### New-to-HIGH (11 skills)

lp-do-assessment-14-logo-brief (643), lp-do-factcheck (438), lp-do-assessment-01-problem-statement (346), lp-do-assessment-15-packaging-brief (342), lp-do-assessment-13-product-naming (336), lp-do-assessment-11-brand-identity (299), lp-do-ideas (294), lp-do-assessment-05-name-selection (292), lp-do-assessment-04-candidate-names (280), lp-do-assessment-10-brand-profiling (205), lp-do-assessment-08-current-situation (203)

Plus 2 new bloated-orchestrators: lp-do-critique (535), lp-do-worldclass (200)

## Planning Anchor

13 new-to-HIGH items and 3 regressions detected since `skill-efficiency-audit-2026-02-18-1357.md`.

The assessment skill family (13 skills, 10 monoliths) is the primary driver of new opportunities.
The core workflow triad (fact-find → plan → build) regressed by 42–95 lines each — feature accretion without corresponding modularization.

Suggested: `/lp-do-fact-find startup-loop-token-efficiency-v2` to scope modularization of assessment monoliths and workflow skill growth.
