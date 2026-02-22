---
Schema: scan-proposals
Version: 1.0.0
Stage: IDEAS-01
Status: Draft
Created: 2026-02-22
Owner: startup-loop maintainers
Related-stages: IDEAS-01 (pack diff scan), IDEAS-02 (backlog update)
Related-artifacts: idea-backlog.schema.md, idea-card.schema.md
Related-skill: /idea-scan
---

# Scan Proposals Schema

`scan-proposals.md` is the structured output artifact from IDEAS-01 pack diff scans.
It captures proposal-level recommendations for how changed Layer A signals should modify the idea backlog.
IDEAS-02 consumes this artifact and applies accepted proposals.

## Artifact location

```
docs/business-os/strategy/<BIZ>/scan-proposals.md
```

## Frontmatter

```yaml
---
Business: <BIZ>
Generated-at: <YYYY-MM-DDTHH:mm:ssZ>
Source-pack-diff: <relative path or identifier for the scanned pack diff>
Backlog-baseline: <relative path to idea-backlog.user.md used for comparison>
Proposal-count: <integer>
Owner: <operator name or handle>
---
```

## Proposal list contract

The artifact body MUST contain a proposal table or list where each proposal entry includes the following fields.

| Field | Required | Type | Rule |
|---|---|---|---|
| `type` | Yes | enum | One of: `CREATE`, `STRENGTHEN`, `WEAKEN`, `INVALIDATE`, `MERGE`, `SPLIT` |
| `idea_id` | Conditional | string | Required for all proposal types except `CREATE` |
| `merge_target` | Conditional | string | Required when `type = MERGE`; must reference an existing idea card ID |
| `split_from` | Conditional | string | Required when `type = SPLIT`; must reference an existing idea card ID |
| `evidence_ref` | Yes | string/path | Relative path or anchor to the diff chunk/pack section supporting the proposal |
| `reasoning` | Yes | string | Plain-language explanation for why this proposal should be applied |
| `confidence` | Yes | enum | One of: `low`, `medium`, `high` |

### Type-specific requirements

| Proposal type | `idea_id` | `merge_target` | `split_from` | Meaning |
|---|---|---|---|---|
| `CREATE` | No | No | No | New idea candidate should be added |
| `STRENGTHEN` | Yes | No | No | Existing idea receives stronger support |
| `WEAKEN` | Yes | No | No | Existing idea receives weaker support |
| `INVALIDATE` | Yes | No | No | Existing idea should be downgraded/archived due to contradicting signal |
| `MERGE` | Yes | Yes | No | Current idea should merge into target idea |
| `SPLIT` | Yes | No | Yes | Current idea should split into multiple idea threads |

## Quality bar (hard validation)

A proposal is invalid and must be rejected before operator review when any of the following are missing:

- `evidence_ref`
- `reasoning`
- `confidence`

Additional hard checks:

- `confidence` must be one of `low | medium | high`
- `MERGE` proposals must include a valid `merge_target`
- `SPLIT` proposals must include a valid `split_from`
- `CREATE` proposals must omit `idea_id` (or leave it blank)

## Multi-proposal behavior

A single diff chunk may emit multiple proposals.
Example: one signal can `STRENGTHEN` idea A while simultaneously `WEAKEN` idea B.
The schema supports proposal lists with no one-proposal-per-diff limitation.

## Example artifact (complete)

```markdown
---
Business: BRIK
Generated-at: 2026-02-22T16:20:00Z
Source-pack-diff: docs/business-os/strategy/BRIK/market-aggregate-pack-diff-2026-02-22.md
Backlog-baseline: docs/business-os/strategy/BRIK/idea-backlog.user.md
Proposal-count: 6
Owner: peter
---

# Scan Proposals — BRIK

| type | idea_id | merge_target | split_from | evidence_ref | reasoning | confidence |
|---|---|---|---|---|---|---|
| CREATE |  |  |  | docs/business-os/strategy/BRIK/market-aggregate-pack.user.md#L118 | New repeated demand signal for check-in bundled experiences is not represented in backlog yet. | medium |
| STRENGTHEN | IDEA-BRIK-002 |  |  | docs/business-os/strategy/BRIK/sell-aggregate-pack.user.md#L74 | Conversion proxy data now supports the existing upsell hypothesis more strongly. | high |
| WEAKEN | IDEA-BRIK-007 |  |  | docs/business-os/strategy/BRIK/market-aggregate-pack.user.md#L203 | Recent channel data indicates materially weaker fit for this segment than prior assumptions. | medium |
| INVALIDATE | IDEA-BRIK-011 |  |  | docs/business-os/strategy/BRIK/products-aggregate-pack.user.md#L141 | Supply constraints invalidate the timeline assumptions in the current hypothesis. | high |
| MERGE | IDEA-BRIK-013 | IDEA-BRIK-002 |  | docs/business-os/strategy/BRIK/sell-aggregate-pack.user.md#L91 | This idea duplicates target scope and should be unified to prevent parallel tracking debt. | medium |
| SPLIT | IDEA-BRIK-015 |  | IDEA-BRIK-015 | docs/business-os/strategy/BRIK/market-aggregate-pack.user.md#L159 | Mixed demand evidence indicates two distinct use-cases that require separate hypotheses. | low |
```
