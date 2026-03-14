# cmd-advance/s9b-gates.md — S9B→SIGNALS Advance Gate

## Trigger

Load this module when the current transition touches the S9B launch QA gate or the S9B→SIGNALS advance.

---

## GATE-LAUNCH-SEC

**Gate ID:** GATE-LAUNCH-SEC
**Severity:** Hard
**Applies to:** S9B→SIGNALS advance (unconditional; no business-specific exceptions)

### Check: Recent passing QA report with security domain

1. Glob for: `docs/business-os/site-upgrades/<BIZ>/launch-qa-report-*.md`
   - If no report exists: **BLOCK** — "GATE-LAUNCH-SEC: No launch QA report found. Run `/lp-launch-qa --business <BIZ>` before advancing from S9B."

2. Parse the YYYY-MM-DD date from the most recent matching filename (not file mtime).
   - If the date is >30 days before today: **BLOCK** — "GATE-LAUNCH-SEC: Launch QA report is >30 days old (dated YYYY-MM-DD). Re-run `/lp-launch-qa --business <BIZ>` to refresh."

3. Read the most recent report. Locate the security domain section (look for `domain: security` or `## Security` heading).
   - If no security domain section found: **BLOCK** — "GATE-LAUNCH-SEC: Launch QA report does not include a security domain check. Re-run `/lp-launch-qa --business <BIZ>` (security domain now required as of v3.15.0)."

4. Check the security domain `status` field:
   - `pass` → gate passes.
   - `warn` → gate passes; surface warning to operator in the blocked packet's `next_action` field.
   - `fail` → **BLOCK** — "GATE-LAUNCH-SEC: Security domain failed in the most recent launch QA report. Remediate all failing security checks (SEC-XX) before advancing."

### Pass packet

When gate passes, return advance as normal. Include in the output packet:
```
security_gate: GATE-LAUNCH-SEC
security_gate_status: pass (or warn)
security_qa_report: docs/business-os/site-upgrades/<BIZ>/launch-qa-report-YYYY-MM-DD.md
```

### Block packet

When gate blocks, return:
```
status: blocked
blocking_reason: "GATE-LAUNCH-SEC: <exact reason from step above>"
next_action: "Run /lp-launch-qa --business <BIZ> [--domain security] to re-run the security check, then re-run /startup-loop advance."
```

---

## GATE-UI-SWEEP-01

**Gate ID:** GATE-UI-SWEEP-01
**Severity:** Hard
**Applies to:** S9B→SIGNALS advance (unconditional; no business-specific exceptions)

### Check: Recent rendered UI contrast sweep for this business

1. Glob for: `docs/audits/contrast-sweeps/*/contrast-uniformity-report.md`
   Read the `Business:` frontmatter field from each artifact. Filter to those where `Business:` matches `<BIZ>` (case-insensitive).
   - If no matching artifact is found (or all artifacts are missing the `Business:` field): **BLOCK** (Case A) — "GATE-UI-SWEEP-01: No rendered UI sweep artifact found for business `<BIZ>`. Run `/tools-ui-contrast-sweep`, then manually set `Business: <BIZ>` in the report frontmatter before re-running advance."

2. From the matching artifacts, select the most recent by `Audit-Date:` frontmatter field (descending). Parse `Audit-Date:` as YYYY-MM-DD.
   - If `Audit-Date:` is >30 days before today: **BLOCK** (Case B) — "GATE-UI-SWEEP-01: UI sweep artifact is >30 days old or not yet complete (Status must be 'Complete'). Re-run `/tools-ui-contrast-sweep` with `Business: <BIZ>` in the report frontmatter, then re-run advance."

3. Read the `Status:` field of the selected artifact.
   - If `Status:` is not `Complete`: **BLOCK** (Case B) — same message as step 2.

4. Read the `Routes-Tested:` field. Parse the leading integer (e.g. `parseInt("0 (auth-blocked)")` → 0; `parseInt("5")` → 5; treat `NaN` as 0).
   - If the parsed integer is 0: **BLOCK** (Case C) — "GATE-UI-SWEEP-01: UI sweep artifact for `<BIZ>` is insufficient — either no routes were rendered (`Routes-Tested: 0`), both light and dark modes were not tested (`Modes-Tested` must include both), or S1 blocking issues remain. Resolve all S1 blockers, ensure rendered route coverage, and ensure both modes are tested before re-running advance."

5. Read the `Modes-Tested:` field. Check that the value includes both `"light"` and `"dark"` as substrings (handles `"light, dark"`, `"light,dark"`, and `"dark,light"` variants).
   - If either `"light"` or `"dark"` is missing: **BLOCK** (Case C) — same message as step 4.

6. Read the `S1-Blockers:` field. Parse as integer.
   - If `S1-Blockers:` > 0: **BLOCK** (Case C) — same message as step 4.

### Pass packet

When gate passes, return advance as normal. Include in the output packet:
```
ui_sweep_gate: GATE-UI-SWEEP-01
ui_sweep_gate_status: pass
ui_sweep_report: docs/audits/contrast-sweeps/<slug>/contrast-uniformity-report.md
```

### Block packet

When gate blocks, return:
```
status: blocked
blocking_reason: "GATE-UI-SWEEP-01: <exact reason from step above>"
next_action: "Run /tools-ui-contrast-sweep with Business: <BIZ> in the report frontmatter, ensure all routes and both light/dark modes are tested, resolve S1 blockers, then re-run /startup-loop advance."
```

---

## Notes

- Both gates in this module are filesystem-only at advance time. No HTTP calls are made during the advance check — only the QA report artifact and sweep artifact are read.
- The 30-day window for GATE-LAUNCH-SEC and GATE-UI-SWEEP-01 ensures baselines remain current. A site that has changed significantly since the last run should be re-audited regardless of age.
- GATE-LAUNCH-SEC consumer coupling: reads the QA report artifact written by `/lp-launch-qa` (modules/domain-security.md). If the lp-launch-qa report schema changes (domain section format), update the read logic in steps 3–4 of GATE-LAUNCH-SEC above.
- GATE-UI-SWEEP-01 notes:
  - The `Business:` field in the sweep artifact frontmatter is set manually by the operator when running `/tools-ui-contrast-sweep`. See `tools-ui-contrast-sweep/SKILL.md` for instructions.
  - `Routes-Tested:` may contain a non-integer suffix (e.g. `"0 (auth-blocked — token-level + code-level analysis only)"`). Parse the leading integer before the first space or parenthesis.
  - Legacy artifacts (produced before 2026-03-14) do not contain the `Business:` field — they will trigger Case A and must be re-run before S9B advance.
  - `Routes-Tested > 0` is a proxy, not a guarantee of complete coverage. The gate cannot verify that every screen was audited. Operators must ensure all application routes are covered when running the sweep for S9B advance (see `tools-ui-contrast-sweep/SKILL.md`).
  - Multiple artifacts for the same business: use the most recent by `Audit-Date:` descending.
