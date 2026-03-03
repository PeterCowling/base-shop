---
Type: Schema
Schema: idea-card
Version: 1.0.0
Stage: IDEAS-01, IDEAS-02, IDEAS-03
Status: Active
Created: 2026-02-22
Owner: startup-loop maintainers
Related-stages: IDEAS-01 (capture), IDEAS-02 (review), IDEAS-03 (promotion gate)
Related-artifact: idea-backlog.schema.md
---

# Idea Card Schema

An idea card is the atomic unit of the IDEAS pipeline. Each candidate idea from the idea backlog gets its own idea card file when it is selected for detailed review in IDEAS-02. The idea card carries the full context needed to decide whether to promote the idea to a fact-find cycle.

## Artifact location

```
docs/business-os/strategy/<BIZ>/idea-cards/IDEA-<BIZ>-<seq>.md
```

One file per idea card. Use the ID as the filename.

## Required fields

```yaml
---
ID: IDEA-<BIZ>-<seq>
Title: <one-line description>
Business: <BIZ>
Source-Domain: <MARKET | SELL | PRODUCTS | LOGISTICS>
Source-Link: <relative path to Layer A artifact that surfaced this idea>
Hypothesis: <what we believe; must be falsifiable>
ICP-fit: <brief rationale for fit with the current ICP>
Evidence-quality: <High | Medium | Low>
Score: <1 | 2 | 3 | 4 | 5>
Status: <new | scored | promoted | archived>
Promoted-to: <relative path to fact-find.md if promoted, else blank>
---
```

### Field definitions

| Field | Type | Required | Definition |
|-------|------|----------|------------|
| `ID` | string | Yes | Unique identifier. Format: `IDEA-<BIZ>-<seq>` where `<seq>` is a 3-digit zero-padded sequence number per business. Must match the idea backlog row ID. |
| `Title` | string | Yes | One-line human-readable description of the idea. Same as the backlog row title. |
| `Business` | string | Yes | Business code (e.g., `BRIK`, `HBAG`, `HEAD`). |
| `Source-Domain` | enum | Yes | Which Layer A domain surfaced this idea. One of: `MARKET`, `SELL`, `PRODUCTS`, `LOGISTICS`. |
| `Source-Link` | path | Yes | Relative path (from repo root) to the specific Layer A artifact (e.g., pack or stage output) that surfaced this idea. Allows traceability back to the standing intelligence signal. |
| `Hypothesis` | string | Yes | A falsifiable statement of what we believe this idea will achieve. Must name the expected outcome and the mechanism. Example: "If we bundle the loyalty card with hostel stays, 20% of hostel guests will purchase at checkout because they are already in a buying context." |
| `ICP-fit` | string | Yes | Brief rationale for how this idea fits the current ICP definition. Reference the ICP from <YYYY-MM-DD>-brand-profile.user.md or intake packet. |
| `Evidence-quality` | enum | Yes | Operator assessment of the strength of evidence supporting the hypothesis. `High` = validated demand signal (survey, sales, waitlist); `Medium` = indirect signal (competitor data, analogous markets, operator observation); `Low` = hypothesis only, no external validation. |
| `Score` | integer | Yes | Operator-assigned priority score 1–5. Used in IDEAS-02 for ranking. 5 = highest priority. See scoring rubric below. |
| `Status` | enum | Yes | Current lifecycle state: `new` (captured, not reviewed), `scored` (reviewed in IDEAS-02), `promoted` (promoted to fact-find in IDEAS-03), `archived` (de-prioritised). |
| `Promoted-to` | path | Conditional | Required when `Status: promoted`. Relative path to the `fact-find.md` file created from this card. Blank when not yet promoted. |

## Scoring rubric (IDEAS-02)

| Score | Meaning |
|-------|---------|
| 5 | Strong ICP fit + High evidence quality + clearly falsifiable hypothesis + low execution risk |
| 4 | Good ICP fit + Medium-High evidence + falsifiable hypothesis |
| 3 | Moderate ICP fit OR Medium evidence; promotion-ready with caveats |
| 2 | Weak ICP fit OR Low evidence; not promotion-ready this cycle |
| 1 | Does not fit ICP OR no evidence; archive unless context changes |

A card is **promotion-ready** when: `Score ≥ 3` AND `Status: scored` AND `Evidence-quality: Medium or High`.

## Body sections

After the frontmatter, the idea card may include the following optional body sections to capture the operator's analysis during IDEAS-02 review:

```markdown
## Context

<What was happening in the standing intelligence that surfaced this idea? Link to the specific pack output or stage artifact.>

## Evidence Summary

<Key evidence points supporting or challenging the hypothesis. Include source citations.>

## Risks and Unknowns

<Key risks and open questions. What would need to be true for this to work?>

## Next Step (if promoted)

<What is the intended scope of the fact-find? What questions should the fact-find answer?>
```

## Example card

```markdown
---
ID: IDEA-BRIK-002
Title: Hostel welcome kit upsell
Business: BRIK
Source-Domain: SELL
Source-Link: docs/business-os/strategy/BRIK/sell-aggregate-pack.user.md
Hypothesis: If we offer a curated welcome kit at hostel check-in, 15% of guests will purchase because they are in a discovery mindset and value local curation.
ICP-fit: Fits boutique traveller ICP (25–40, experience-led, willing to pay for curation); aligns with Positano high-season guest profile.
Evidence-quality: Medium
Score: 5
Status: promoted
Promoted-to: docs/business-os/strategy/BRIK/fact-find-2026-02-22-welcome-kit.md
---

## Context

SELL-06 aggregate pack (2026-02-22) flagged that upsell conversion at reception is untested. Competitor hostels in Amalfi Coast area are running welcome kit programmes with reported 12% attach rate.

## Evidence Summary

- Competitor analogues: 2 hostels in comparable markets running welcome kits (Medium evidence)
- BRIK guest survey (Feb 2026): 64% of respondents "would consider" a curated local product bundle at check-in
- No direct BRIK sales test yet

## Risks and Unknowns

- Optimal price point unknown (fact-find must investigate)
- Reception staff capacity to pitch upsell is uncertain
- Inventory commitment required before testing

## Next Step (if promoted)

Fact-find to scope: pricing hypothesis, inventory minimums, reception pitch script, and 30-day test protocol.
```
