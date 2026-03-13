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

## Notes

- This gate is filesystem-only at advance time. No HTTP calls are made during the advance check — only the QA report artifact is read.
- The 30-day window ensures security baselines remain current. A site that has changed significantly since the last QA run should be re-audited regardless of the age window.
- Consumer coupling: this module reads the QA report artifact written by `/lp-launch-qa` (modules/domain-security.md). If the lp-launch-qa report schema changes (domain section format), update the read logic in step 3–4 above.
