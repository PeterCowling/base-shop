# emit-phase — Dedup, Cap, and Signal Review Emission

## Phase Purpose

This module is invoked by `/lp-signal-review` after `audit-phase.md` produces a scored principles table. It:

1. Ranks finding-eligible principles
2. Applies dedup against open plan tasks and prior Signal Reviews
3. Applies novelty gate and cap enforcement
4. Emits the Signal Review artifact with all required sections

**Draft-mode constraint (normative)**: This module must not call `/lp-fact-find` or any other skill. It must not create files other than the Signal Review artifact. It must not write to BOS API or modify prior Signal Review artifacts. Finding Brief stubs are embedded in the Signal Review only; promotion is always manual.

---

## Step 1: Rank Finding-Eligible Principles

From the scored principles table:

1. Filter to rows where `Finding Eligible = Yes`.
2. Rank by priority:
   - Primary sort: Severity descending (5 first)
   - Secondary sort: Support descending (higher evidence = more reliable finding)
   - Tertiary sort: Principle ID ascending (lower number = higher priority; tiebreak only)

---

## Step 2: Dedup by Fingerprint

For each candidate finding (in rank order), compute its **fingerprint**:

```
<principle_id>-<stage_id>-<failure_indicator_code>
```

Where:
- `principle_id` = P01 through P10
- `stage_id` = most affected stage (e.g., `S2B`, `S10`, `S6B`); use `run-level` for cross-cutting findings
- `failure_indicator_code` = short kebab-case slug derived from the matched failure indicator; use the most specific applicable indicator

Examples:
- `P08-S10-no-outcome-data-in-readout`
- `P10-S2B-no-human-approved-field`
- `P09-S3-missing-artifact`
- `P04-S2-all-values-estimated-no-source`

### Dedup Source 1: Open Plan Tasks

Search `docs/plans/*/plan.md` for tasks that:
1. Contain the fingerprint string in the task body, AND
2. Have a `Status:` field that is **not** `Complete`

If a match is found: the finding is already tracked as an open plan task. Log it to **Skipped Findings** with reason `promoted-to-plan-task`. Do **not** emit a Finding Brief.

### Dedup Source 2: Prior Signal Reviews

Search `docs/business-os/strategy/<BIZ>/signal-review-*.md` for the fingerprint string in any prior artifact.

If found in a prior Signal Review **and** no corresponding open plan task exists (deferred/unpromoted):
- Add to **Unresolved Prior Findings** section of this Signal Review.
- Do **not** spend a top-N slot UNLESS new evidence exists:
  - Support has increased since the prior run (more artifacts now readable), OR
  - Severity has escalated (a stage artifact now missing that was previously present)
- If new evidence: allow re-entry in the candidate list tagged `REPEAT`; include a one-sentence description of the new evidence.

### Novelty Gate

If the fingerprint matches nothing in either dedup source: the finding is **novel**. It is eligible for a top-N Finding Brief slot.

---

## Step 3: Cap Enforcement

After dedup and novelty filtering, take the top `max_findings` candidates from the ranked list (default: 3).

Remaining eligible candidates (after cap) → log to **Skipped Findings** with reason `cap-exceeded`.

---

## Step 4: Self-Check Gate

Before writing the Signal Review artifact, confirm that the Principle Scores table received from `audit-phase.md` contains a row for every principle ID P01 through P10.

If any principle ID is absent, fail-closed:

```
Error: Self-check failed — principle(s) <list> not present in Principle Scores table.
Signal Review not emitted. Check audit-phase output for silent skips.
```

Do not emit a partial Signal Review.

---

## Step 5: Emit Signal Review Artifact

Write the Signal Review artifact to:

```
docs/business-os/strategy/<BIZ>/signal-review-<YYYYMMDD>-<HHMM>-W<ISOweek>.md
```

Where:
- `<YYYYMMDD>` is from `as_of_date` (default: today)
- `<HHMM>` is the current wall-clock time in 24-hour format — prevents same-day collision on retries
- `<ISOweek>` is the ISO 8601 week number (e.g., `W08` for week 8)

### Required Section Order

Emit all sections in this order.

---

#### Section 1: Frontmatter

```yaml
---
Type: Signal-Review
Business: <BIZ>
Run-date: <YYYYMMDD>
ISO-week: W<NN>
Self-audit-mode: <off|track-only>
Principles-version: <version from signal-principles.md header>
---
```

---

#### Section 2: Run Summary

```markdown
## Run Summary

- Business: <BIZ>
- As of date: <YYYY-MM-DD>
- Artifacts audited: <count of stage artifact paths that were readable>
- Missing artifacts: <count> (<comma-separated stage IDs with missing artifacts, or "none">)
- Principles scored: 10
- Finding-eligible (pre-dedup): <count>
- Finding Briefs emitted: <count>
- Skipped — already in plan task: <count>
- Skipped — prior Signal Review (unresolved): <count>
- Skipped — cap exceeded: <count>
```

---

#### Section 3: Principle Scores

Paste the full scored principles table from `audit-phase.md` output, including evidence notes.

```markdown
## Principle Scores

| Principle ID | Name | Severity | Support | Evidence Pointer | Finding Eligible |
|---|---|---|---|---|---|
| P01 | ... | ... | ... | ... | ... |
| ...ten rows total... |
```

All ten rows must be present (enforced by self-check gate above). Include evidence notes immediately after the table.

---

#### Section 4: Top Findings

```markdown
## Top Findings
```

For each Finding Brief (up to `max_findings`), emit one subsection:

```markdown
### Finding <N>: <principle name> — <stage or scope>

- Fingerprint: <fingerprint>
- Severity: <1-5>
- Support: <1-5>
- Stage(s) affected: <e.g., S2B, S6B>
- Failure indicator: <one sentence describing the specific failure from signal-principles.md>
- Evidence pointer: <file path that confirmed this, or "missing artifact: <path>">
- Status: <Novel | REPEAT (new evidence: <one-sentence description>)>

**Why this matters**: <one paragraph explaining the impact on run validity or output quality>

**Promotion stub** — paste into `docs/plans/<finding-slug>/fact-find.md` and fill remaining fields:

\`\`\`yaml
---
Type: Fact-Find
Outcome: Planning
Status: Draft
Feature-Slug: <signal-finding-P0N-YYYYMMDD>
Execution-Track: <business-artifact or mixed>
Deliverable-Type: <single-deliverable>
Primary-Execution-Skill: lp-build
Business-Unit: <BIZ>
Card-ID: none
---
\`\`\`

Fingerprint: <fingerprint>

**Summary** (3 bullets — fill during promotion):
- What: <describe the principle violation>
- Why: <describe the impact on run quality>
- Next: <describe the investigation or change needed>
```

**Frontmatter stub constraints**:
- Keys must be a valid subset of `docs/plans/_templates/fact-find-planning.md` — no custom keys
- `Finding-ID` must **not** appear in frontmatter — the fingerprint goes in the body only, as `Fingerprint: <value>`
- `Status: Draft` is the safe default; operator changes to `Ready-for-planning` after completing promotion
- `Card-ID: none` is the safe default; operator fills during promotion if a BOS card is created
- Operator fills all remaining required fields from the fact-find template during promotion

---

#### Section 5: Skipped Findings

Emit this section even if empty.

```markdown
## Skipped Findings

| Fingerprint | Severity | Support | Reason |
|---|---|---|---|
| <fingerprint> | <N> | <N> | <promoted-to-plan-task \| cap-exceeded \| below-threshold> |
```

If no findings were skipped: emit the table header with one row: `| — | — | — | No findings skipped this run. |`

---

#### Section 6: Unresolved Prior Findings

```markdown
## Unresolved Prior Findings
```

**When `self_audit_mode: off`** (first 3 runs):

```markdown
Self-audit is off for this run (runs 1–3). Prior finding tracking begins from run 4.
```

**When `self_audit_mode: track-only`**:
- Read all prior `signal-review-*.md` files under `docs/business-os/strategy/<BIZ>/`
- For each fingerprint in a prior Signal Review's Top Findings section that has no matching open plan task: emit a row.

```markdown
| Fingerprint | First seen | Age (runs) | Promoted? | Notes |
|---|---|---|---|---|
| <fingerprint> | <YYYYMMDD> | <count> | No | <any new context this run> |
```

If none: `No unresolved prior findings.`

**If prior Signal Reviews do not yet exist**: `No prior Signal Reviews found under docs/business-os/strategy/<BIZ>/. Unresolved prior findings tracking begins from run 2.`

---

#### Section 7: Promotion Instructions

```markdown
## How to Promote a Finding Brief

To act on a finding:

1. Copy the **Promotion stub** from the Finding Brief you want to promote.
2. Create a new file at `docs/plans/<finding-slug>/fact-find.md`.
3. Paste the frontmatter stub. Fill remaining required fields from `docs/plans/_templates/fact-find-planning.md`.
4. Add `Fingerprint: <fingerprint>` in the body (not in frontmatter).
5. Run `/lp-fact-find` on the brief to complete the evidence audit and gap review.
6. Once promoted, future Signal Reviews will suppress this fingerprint (dedup source: open plan tasks).

Suggested invocation after creating the file:

    /lp-fact-find docs/plans/<finding-slug>/fact-find.md
```
