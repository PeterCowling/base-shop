# lp-do-assessment-08-current-situation — Current Situation (ASSESSMENT-08)

Elicits and records what the operator directly knows about the business before ASSESSMENT intake runs. Captures launch surface, inventory/product readiness, commercial architecture, and pre-locked channel decisions. All fields are either confirmed or explicitly marked as open gaps.

## Invocation

```
/lp-do-assessment-08-current-situation --business <BIZ>
```

Required:
- `--business <BIZ>` — 3-4 character business identifier

**Business resolution pre-flight:** If `--business` is absent or the directory `docs/business-os/strategy/<BIZ>/` does not exist, apply `_shared/business-resolution.md` before any other step.

## Operating Mode

ELICIT + WRITE

This skill:
- Reads existing business strategy docs to extract any already-documented operator context
- Pre-populates a draft artifact from whatever is already on record
- Surfaces gaps and asks the operator to fill or confirm each field
- Writes the final ASSESSMENT-08 artifact

Does NOT:
- Research external sources (that is ASSESSMENT-01–ASSESSMENT-07 territory)
- Make strategic recommendations about which options to pursue
- Set field values the operator has not confirmed

## Required Inputs (pre-flight)

Required:
- `--business <BIZ>` — business identifier

Optional (read if present, note gap if absent):
- `docs/business-os/strategy/<BIZ>/plan.user.md` — may contain operational context
- `docs/business-os/startup-baselines/<BIZ>-intake-packet.user.md` — may contain pre-recorded observed fields
- `docs/business-os/strategy/<BIZ>/s0c-option-select.user.md` — may contain execution constraints (from ASSESSMENT-03)
- Any other strategy or brief docs under `docs/business-os/strategy/<BIZ>/`

If upstream ASSESSMENT-01–ASSESSMENT-07 artifacts are absent, note the gap but proceed — ASSESSMENT-08 captures operator-direct knowledge only and does not depend on research outputs.

---

## Steps

### Step 1: Scan for known operator context

Scan the search paths above. Extract any fields already documented as `observed` or confirmed by the operator:
- Any mention of launch surface (pre-website / website-live)
- Any mention of stock, inventory, units, or in-stock timing
- Any mention of execution posture or time constraints
- Any pricing or payment stack decisions
- Any channel decisions or decision reference IDs (`DEC-*`)
- Any compatibility or product readiness notes

### Step 2: Pre-populate draft

Assemble a pre-populated draft from what was found. For each field, mark:
- `confirmed` — if already documented as `observed` by the operator
- `pending` — if mentioned but not explicitly confirmed
- blank — if no evidence found

### Step 3: Elicit missing or unconfirmed fields

Present the pre-populated draft and ask the operator to confirm or complete each section. The operator may respond with a value, `TBD`, or `unknown` — all are valid.

**Elicitation questions:**

*Launch and operational context:*
1. What is the launch surface? (`pre-website` — no site yet; or `website-live` — site exists and receiving traffic)
2. What is the primary execution constraint? (e.g. speed-to-first-sales, runway pressure, specific external deadline)
3. Is there anything that must NOT happen before a specific milestone?

*Inventory and product readiness:*
4. Is stock for Product 1 purchased? If yes: approximate in-stock date and sellable unit count?
5. Is a processor/product compatibility matrix drafted? (Which brands/models/variants are confirmed compatible?)
6. Are there any known quality, sourcing, or lead-time constraints for the launch SKUs?
6a. Where are products physically manufactured? (Required to determine the legal origin claim — "Made in X" vs "Designed in X" vs "Handfinished in X".)
6b. What is your direct role in production? (e.g., design, final finishing in home country, quality curation) — This determines the defensible origin claim for brand copy.

*Commercial architecture:*
7. Is pricing decided? (Single unit / bundle / both; indicative price range)
8. Is the payment provider for the primary launch market decided?
9. Is a returns policy drafted? (SLA in days; who bears cost)

*Channel pre-decisions:*
10. Are any channel decisions already locked before the channel strategy stage? If yes: provide decision reference (`DEC-*`) or description.
11. Are there any channels explicitly ruled out at this stage?

### Step 4: Resolve open gaps

For each field where the operator responds `TBD` or `unknown`, add a row to Section E (Open Evidence Gaps) with a brief note on why it is needed for S1/S3 progression.

### Step 5: Write and save artifact

Assemble confirmed values and open gaps into the output format below. Save to the output path.

---

## Output Contract

**Path:** `docs/business-os/strategy/<BIZ>/s0e-operator-evidence.user.md`

**Format:**

```markdown
---
Type: Operator-Evidence
Stage: ASSESSMENT-08
Business: <BIZ>
Status: Active
Created: <date>
Updated: <date>
Last-reviewed: <date>
Owner: <operator>
---

# Operator Evidence — <BIZ> (ASSESSMENT-08)

## A) Launch and Operational Context

| Field | Value | Status |
|---|---|---|
| Launch surface | pre-website \| website-live | confirmed \| pending |
| Execution posture | [operator description] | confirmed \| pending |
| Primary time constraint | [description or TBD] | confirmed \| pending |
| Hard stop conditions | [description or none] | confirmed \| pending |

## B) Inventory and Product Readiness

| Field | Value | Status |
|---|---|---|
| Product 1 stock status | purchased \| not yet \| TBD | confirmed \| pending |
| In-stock date (target) | [date or TBD] | confirmed \| pending |
| Sellable units (launch) | [number or TBD] | confirmed \| pending |
| Compatibility matrix | ready \| partial \| not yet | confirmed \| pending |
| Known sourcing constraints | [description or none] | confirmed \| pending |
| Manufacturing country | [where products are physically made — e.g., China, Italy, Portugal] | confirmed \| pending |
| Operator's role in production | designer \| finisher \| curator \| sourcer \| none | confirmed \| pending |

## C) Commercial Architecture

| Field | Value | Status |
|---|---|---|
| Pricing model | single \| bundle \| both \| TBD | confirmed \| pending |
| Indicative price range | [range or TBD] | confirmed \| pending |
| Payment provider (launch market) | [provider or TBD] | confirmed \| pending |
| Returns policy | [SLA or TBD] | confirmed \| pending |

## D) Channel Pre-Decisions

[List any channel decisions already locked before S6B channel strategy. Leave blank if no pre-decisions exist.]

| Decision | Value | Decision ref |
|---|---|---|

## E) Open Evidence Gaps

[All fields above where Status is pending or TBD. These feed Section F of the intake packet.]

| Gap | Why needed | Priority |
|---|---|---|
```

**Downstream consumer:** `modules/assessment-intake-sync.md` reads `s0e-operator-evidence.user.md` as its seventh precursor (ASSESSMENT-08). Fields from Sections A–D populate operator-context rows in intake Sections A, B, C, and D. Section E gaps populate intake Section F (Missing-Data Checklist).

---

## Quality Gate

Before saving, verify:

- [ ] All four sections A–D present (empty tables are acceptable if genuinely no data)
- [ ] Every row in A–D has a Status value (`confirmed` or `pending` — not blank)
- [ ] Section E lists every row from A–D where Status is `pending` or `TBD`
- [ ] Section E entries have a Priority column (`critical` / `high` / `medium`)
- [ ] Frontmatter fields all present: Type, Stage, Business, Status, Created, Updated, Last-reviewed, Owner
- [ ] Artifact saved to correct path before completion message

## Red Flags

Invalid outputs — do not emit:

- Sections with blank Status values (every row must be confirmed or pending)
- Section E missing items that appear as pending in A–D
- Fields set to a value the operator did not confirm (no invented values)
- Artifact not saved (output must be written to file, not only displayed in chat)

## Completion Message

> "Operator evidence recorded: `docs/business-os/strategy/<BIZ>/s0e-operator-evidence.user.md`. [N] fields confirmed, [M] gaps logged in Section E."
>
> "All eight ASSESSMENT precursors (ASSESSMENT-01–ASSESSMENT-08) now present for <BIZ>. The next `/startup-loop start` or `advance` call will trigger ASSESSMENT intake sync automatically."

---

## Integration

**Upstream (ASSESSMENT-07):** Runs after `/lp-do-assessment-07-measurement-profiling --business <BIZ>` produces measurement-plan.user.md.

**Downstream:** `modules/assessment-intake-sync.md` reads this artifact as `Precursor-ASSESSMENT-08`. Section E gaps feed intake Section F (Missing-Data Checklist). Section D channel pre-decisions are preserved as operator-locked rows in intake Section D.
