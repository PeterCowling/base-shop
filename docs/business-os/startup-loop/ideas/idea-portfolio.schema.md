---
Schema: idea-portfolio
Version: 1.0.0
Stage: IDEAS-03 (updated on each promotion)
Status: Active
Created: 2026-02-22
Owner: startup-loop maintainers
Related-stages: IDEAS-03 (promotion gate)
Related-artifacts: idea-backlog.schema.md, idea-card.schema.md, handoff-to-fact-find.md
---

# Idea Portfolio Schema

The idea portfolio is the cross-cycle registry of all promoted idea cards for a business. It provides a longitudinal view of what ideas have been promoted, which fact-find and build cycles they generated, and what outcomes were observed.

The portfolio is append-only. Do not remove rows. Archive or annotate rows when an idea is superseded or closed out.

## Artifact location

```
docs/business-os/strategy/<BIZ>/idea-portfolio.user.md
```

## Frontmatter

```yaml
---
Business: <BIZ>
Last-updated: <YYYY-MM-DD>
Owner: <operator name or handle>
---
```

## Portfolio table

| Idea-ID | Title | Promoted-date | Fact-Find | Build-Cycle | Outcome |
|---------|-------|---------------|-----------|-------------|---------|
| IDEA-<BIZ>-001 | Example idea | 2026-02-22 | [fact-find-2026-02-22-example.md](../../../docs/...) | DO-2026-02-23 | Pending |
| IDEA-<BIZ>-002 | Closed idea | 2026-01-15 | [fact-find-2026-01-15-example.md](../../../docs/...) | DO-2026-01-20 | Validated — launched |
| IDEA-<BIZ>-003 | Invalidated idea | 2026-02-01 | [fact-find-2026-02-01-example.md](../../../docs/...) | DO-2026-02-05 | Invalidated — archived |

### Column definitions

| Column | Definition |
|--------|------------|
| `Idea-ID` | Idea card ID (format: `IDEA-<BIZ>-<seq>`). Links to the idea card file in `idea-cards/`. |
| `Title` | One-line description copied from the idea card. |
| `Promoted-date` | ISO 8601 date when IDEAS-03 promotion gate was satisfied and the fact-find was initiated. |
| `Fact-Find` | Relative path to the `fact-find.md` artifact created from this idea card. Must contain `idea_card_id` in frontmatter. |
| `Build-Cycle` | Identifier for the DO build cycle spawned from this fact-find (e.g., `DO-<date>-<slug>` or BOS card ID). Blank if not yet in build. |
| `Outcome` | Disposition of this build cycle. Values: `Pending` (in progress), `Validated — launched`, `Validated — paused`, `Invalidated — archived`, `Cancelled — <reason>`. |

## Outcome definitions

| Outcome | Meaning |
|---------|---------|
| `Pending` | Fact-find initiated or build cycle in progress. No outcome yet. |
| `Validated — launched` | Build cycle completed; idea hypothesis supported; feature/initiative launched. |
| `Validated — paused` | Hypothesis supported but launch deferred (resource or timing constraint). |
| `Invalidated — archived` | Build cycle or test showed hypothesis was false. Idea archived. |
| `Cancelled — <reason>` | Fact-find or build cycle cancelled before completion. |

## Maintenance instructions

1. **On IDEAS-03 promotion:** add a new row immediately. Set `Outcome: Pending`. Fill `Idea-ID`, `Title`, `Promoted-date`, and `Fact-Find` link. Leave `Build-Cycle` blank until a DO cycle is initiated.
2. **On DO cycle initiation:** update the `Build-Cycle` column with the BOS card ID or DO cycle identifier.
3. **On DO cycle completion:** update `Outcome` with the actual disposition (Validated, Invalidated, or Cancelled).
4. **Do not delete rows.** The portfolio is an append-only audit trail. For superseded or archived ideas, update the `Outcome` column only.
5. **Update `Last-updated` frontmatter** each time a row is added or modified.

## Example (complete artifact)

```markdown
---
Business: BRIK
Last-updated: 2026-02-22
Owner: peter
---

# Idea Portfolio — BRIK

| Idea-ID | Title | Promoted-date | Fact-Find | Build-Cycle | Outcome |
|---------|-------|---------------|-----------|-------------|---------|
| IDEA-BRIK-001 | Bundle loyalty card with Positano stay | 2026-02-15 | [fact-find-2026-02-15-loyalty-bundle.md](fact-find-2026-02-15-loyalty-bundle.md) | BRIK-042 | Validated — launched |
| IDEA-BRIK-002 | Hostel welcome kit upsell | 2026-02-22 | [fact-find-2026-02-22-welcome-kit.md](fact-find-2026-02-22-welcome-kit.md) | — | Pending |
```
