# Critique History: hbag-pdp-shipping-returns

## Fact-Find Critique

### Round 1 — 2026-02-28

- Route: codemoot
- lp_score: 3.5 (7/10 raw)
- Verdict: needs_revision
- Severity counts: Major=2, Minor=1, Critical=0

Findings:
1. [Major] Trigger-Why, Trigger-Intended-Outcome, and Outcome Contract Why were TBD — weakens planning traceability
2. [Major] Test command referenced `pnpm --filter caryina test` — incorrect package name and incorrect local-run guidance for CI-only policy
3. [Minor] Header Status was Draft while Planning Readiness declared Ready-for-planning

Fixes applied before Round 2:
- Populated Trigger-Why and Trigger-Intended-Outcome with substantive rationale from HBAG-offer.md
- Expanded Outcome Contract Why with full offer-document evidence basis
- Corrected test command to reflect CI-only policy (docs/testing-policy.md)
- Aligned Status field to Ready-for-planning

### Round 2 — 2026-02-28

- Route: codemoot
- lp_score: 4.0 (8/10 raw)
- Verdict: needs_revision (but score crosses credible threshold at 4.0)
- Severity counts: Major=1, Minor=1, Critical=0

Findings:
1. [Major] Test Commands section still implied local test execution — conflicts with CI-only test policy
2. [Minor] Accordion "client-side behaviour" wording implied JS dependency

Fixes applied:
- Replaced test command guidance with CI-only policy reference and `gh run watch` instruction
- Tightened accordion wording to clarify browser-native JS-free behaviour

Fact-find final lp_score: 4.0 — credible. No Criticals. Status: Ready-for-planning.

---

## Plan Critique

### Round 1 — 2026-02-28

- Route: codemoot
- lp_score: 3.5 (7/10 raw)
- Verdict: needs_revision
- Severity counts: Major=3, Minor=2, Critical=0

Findings:
1. [Major] Direct JSON edit to site-content.generated.json is overwritten by materializer on next run — not durable
2. [Major] TASK-03 had internal contradiction: text said add getPolicyContent to Promise.all, but later said call it after Promise.all (synchronous)
3. [Major] StickyCheckoutBar trust line used "30-day returns" — conflicts with exchange-first policy framing
4. [Minor] "static-export compatible" is incorrect for Worker runtime (wrangler.toml)
5. [Minor] Hardcoded summary strings create copy drift risk vs. JSON policy updates

Fixes applied before Round 2:
- TASK-01 scope expanded: create logistics-pack.user.md + run materializer (durable fix)
- TASK-03 contradiction resolved: getPolicyContent explicitly stated as synchronous, called after Promise.all
- StickyCheckoutBar trust line changed to "Free 30-day exchange · Delivery at checkout"
- "static-export compatible" replaced with "Worker runtime compatible; no JS required for accordion"
- Copy drift risk documented in TASK-02 notes (acceptable for launch)

### Round 2 — 2026-02-28

- Route: codemoot
- lp_score: 3.0 (6/10 raw)
- Verdict: needs_revision
- Severity counts: Major=2, Minor=1, Critical=1

Findings:
1. [Critical] TASK-01 assumes materializer consumes logistics-pack.user.md, but detectLogisticsRequirement gate requires HBAG-content-packet.md to contain "logistics-pack.user.md" string — HBAG packet currently has no such reference; logistics mapping skipped; placeholders remain
2. [Major] Acceptance validation only checks placeholder text is gone, not that trust claims are present
3. [Major] logistics-pack.user.md parser is single-line only; multi-line values silently truncated

Fixes applied before Round 3:
- TASK-01 Affects now includes HBAG-content-packet.md update to add logistics-pack.user.md reference
- TC-01-02 added: validates HBAG-content-packet.md contains "logistics-pack.user.md" string
- Acceptance expanded with positive assertions (copy contains "30-day", "exchange", etc.)
- Scouts section documents detectLogisticsRequirement gate and single-line parser constraint
- TC-01-03 clarified: shipping duties appear in bullets (from Duties/Tax Payer Rule), not in summary

### Round 3 — 2026-02-28 (Final)

- Route: codemoot
- lp_score: 4.0 (8/10 raw)
- Verdict: needs_revision (score is credible — 4.0)
- Severity counts: Major=2, Minor=1, Critical=0

Findings:
1. [Major] Acceptance TC-01-03 expected "duties" in shipping summary — but mapper builds summary from Dispatch SLA only; duties go to bullets via Duties/Tax Payer Rule
2. [Major] TC-01-03 repeated same mismatch
3. [Minor] Sticky bar hardcoded copy drift risk (already documented; acceptable for launch)

Fixes applied:
- Acceptance and TCs corrected: shipping summary is from Dispatch SLA only; duties appear in bullets (per mapper line 130); validation targets adjusted accordingly
- No action on Minor finding (already documented in TASK-02 notes)

Plan final lp_score: 4.0 — credible. No Criticals. Status: Active. Eligible for build handoff.
