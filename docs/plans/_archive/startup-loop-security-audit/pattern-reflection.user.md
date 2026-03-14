---
schema_version: pattern-reflection.v1
feature_slug: startup-loop-security-audit
generated_at: 2026-03-13T16:57:35.919Z
entries:
  - canonical_title: "Candidate: /lp-security-remediation — recurring workflow: when GATE-LAUNCH-SEC blocks due to status: fail on specific SEC checks (e.g., SEC-02 missing headers, SEC-04 bad cookie flags), there is a repeatable remediation + re-audit loop. Once a second business hits S9B this pattern will repeat. Trigger observation: s9b-gates.md step 4 defines a hard block path with \"Remediate all failing security checks (SEC-XX)\"; no guided remediation skill exists yet."
    pattern_summary: "Candidate: /lp-security-remediation — recurring workflow: when GATE-LAUNCH-SEC blocks due to stat..."
    category: new-skill
    routing_target: defer
    occurrence_count: 1
  - canonical_title: "Candidate: Automate SEC-05 (repo secrets) check — SEC-05 currently relies on TruffleHog in CI, but the /lp-launch-qa domain-security check at QA time still requires the agent to describe what it found in CI. This could be made deterministic: read the last CI run's TruffleHog output via the GitHub API and report findings directly without agent interpretation. Trigger observation: TASK-05 added TruffleHog to CI but TASK-01 domain-security.md still describes SEC-05 as an agent-read check on the repo."
    pattern_summary: "Candidate: Automate SEC-05 (repo secrets) check — SEC-05 currently relies on TruffleHog in CI, bu..."
    category: ai-to-mechanistic
    routing_target: defer
    occurrence_count: 1
---

# Pattern Reflection

## Patterns

- `new-skill` | `Candidate: /lp-security-remediation — recurring workflow: when GATE-LAUNCH-SEC blocks due to stat...` | routing: `defer` | occurrences: `1`
- `ai-to-mechanistic` | `Candidate: Automate SEC-05 (repo secrets) check — SEC-05 currently relies on TruffleHog in CI, bu...` | routing: `defer` | occurrences: `1`

## Access Declarations

None identified.
