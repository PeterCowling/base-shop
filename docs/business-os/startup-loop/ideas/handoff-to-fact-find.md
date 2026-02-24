---
Type: Handoff-Contract
Version: 1.0.0
Stage: IDEAS-03
Status: Active
Created: 2026-02-22
Owner: startup-loop maintainers
Related-stages: IDEAS-03 (promotion gate), DO (fact-find subprocess)
Related-skill: /lp-do-fact-find
Related-artifacts: idea-card.schema.md, idea-backlog.schema.md, idea-portfolio.schema.md
---

# Handoff to Fact-Find Contract

This document defines the formal handoff from the IDEAS pipeline to the DO layer fact-find process. It governs how idea card fields map to fact-find frontmatter, what makes a card promotion-ready, how the operator initiates the fact-find, and what distinguishes an idea-card-driven cycle from an operator-override (direct-inject) cycle.

## 1. Promotion-Ready Criteria

A card is **promotion-ready** when ALL of the following are true:

| Criterion | Requirement |
|-----------|-------------|
| `Score` | `≥ 3` (assigned in IDEAS-02) |
| `Status` | `scored` |
| `Evidence-quality` | `Medium` or `High` |

Cards with `Score ≤ 2` or `Evidence-quality: Low` must not be promoted without an explicit operator override (see Section 4: Direct-Inject Cycle).

When multiple cards are promotion-ready (top 1–3 from IDEAS-02), the operator selects the single highest-priority card to promote per IDEAS-03 gate cycle. Only one card is promoted per gate cycle; remaining promotion-ready cards stay in `Status: scored` for the next cycle.

## 2. Field Mapping: Idea Card → Fact-Find Frontmatter

The following fields must be carried from the idea card into the `fact-find.md` frontmatter when the fact-find is initiated from an idea card:

| Idea Card Field | Fact-Find Frontmatter Field | Notes |
|-----------------|----------------------------|-------|
| `ID` | `idea_card_id` | Verbatim copy. Example: `IDEA-BRIK-002`. Mandatory for all idea-card-driven cycles. |
| `Source-Domain` | `layer_a_inputs` | One-element list. Example: `- SELL`. Records which Layer A domain the idea came from. |
| `Hypothesis` | Seed for `Outcome` section | The fact-find `Outcome` section should reference the idea card hypothesis as the starting assumption to test or refine. |
| `Title` | Informs `Feature-Slug` | Use the idea title to derive the feature slug (kebab-case). |
| `Source-Link` | `layer_a_source` | Relative path to the Layer A artifact that surfaced the idea. Allows downstream traceability. |

### Mandatory fact-find frontmatter additions (idea-card-driven cycle)

```yaml
idea_card_id: IDEA-<BIZ>-<seq>        # required — verbatim idea card ID
layer_a_inputs:
  - <MARKET | SELL | PRODUCTS | LOGISTICS>  # source domain from idea card
layer_a_source: <relative path to source Layer A artifact>  # from Source-Link
```

These fields are in addition to the standard fact-find frontmatter fields defined in `docs/business-os/startup-loop/loop-output-contracts.md` (Artifact 1).

## 3. Operator Action to Initiate Fact-Find

To satisfy the IDEAS-03 promotion gate, the operator must:

1. Confirm the selected card is promotion-ready (Score ≥ 3, Status: scored, Evidence-quality: Medium or High).
2. Run `/lp-do-fact-find` with the idea card file as the primary input:
   ```
   /lp-do-fact-find <path-to-idea-card-file>
   ```
   Or provide the idea card ID as the argument:
   ```
   /lp-do-fact-find IDEA-<BIZ>-<seq>
   ```
3. The resulting `fact-find.md` must include `idea_card_id:` in its frontmatter, matching the card's `ID:` field exactly.
4. After `fact-find.md` is created:
   - Update the idea card: set `Status: promoted` and `Promoted-to: <path-to-fact-find.md>`.
   - Update the idea backlog: set the card's `Status` to `promoted` in the backlog table.
   - Add a row to `idea-portfolio.user.md` (see `idea-portfolio.schema.md`).

The IDEAS-03 gate is satisfied when `fact-find.md` exists at the canonical artifact path and its frontmatter contains `idea_card_id` matching the promoted card's ID.

## 4. Direct-Inject Cycle (Operator Override)

A fact-find cycle initiated without an idea card is a **direct-inject cycle**. This represents an operator override of the IDEAS pipeline — the operator bypasses IDEAS-01 through IDEAS-03 and initiates a fact-find directly.

Direct-inject cycles are permitted but must be explicitly flagged. The `fact-find.md` frontmatter must include:

```yaml
direct-inject: true
direct-inject-rationale: <brief explanation of why the IDEAS pipeline was bypassed>
```

A direct-inject cycle does NOT satisfy the IDEAS-03 gate. The IDEAS-03 gate is only satisfied by a fact-find that was initiated from a promotion-ready idea card (i.e., `idea_card_id` is present in frontmatter and matches an idea card with `Status: promoted`).

### When direct-inject is appropriate

- Time-sensitive opportunity with no time for an IDEAS review cycle
- Operator has strong external signal that is not yet captured in standing intelligence
- Existing fact-find from a prior cycle is being resumed or extended (not a new idea)
- Loop gap fill or bottleneck response triggered by `/startup-loop advance`

## 5. Traceability Summary

The full traceability chain from standing intelligence to build outcome is:

```
Layer A pack output
  → idea-backlog.user.md (IDEAS-01)
    → IDEA-<BIZ>-<seq>.md idea card (IDEAS-02, scored)
      → fact-find.md with idea_card_id (IDEAS-03, promoted)
        → plan.md
          → DO build cycle
            → idea-portfolio.user.md (Outcome recorded)
```

Each link in this chain is auditable via the artifact paths recorded in `Promoted-to` (idea card), `idea_card_id` (fact-find frontmatter), and `Fact-Find` (portfolio table).

## 6. Schema Cross-Reference

| Concept | Defined in |
|---------|-----------|
| Idea backlog artifact format | `idea-backlog.schema.md` |
| Scan proposal artifact format | `scan-proposals.schema.md` |
| Idea card artifact format | `idea-card.schema.md` |
| Idea portfolio artifact format | `idea-portfolio.schema.md` |
| Fact-find artifact format | `docs/business-os/startup-loop/loop-output-contracts.md` (Artifact 1) |
| Promotion-ready scoring rubric | `idea-card.schema.md` Section "Scoring rubric" |
| IDEAS-03 stage definition | `docs/business-os/startup-loop/loop-spec.yaml` (id: IDEAS-03) |
| Fact-find skill | `.claude/skills/lp-do-fact-find/SKILL.md` |
