# Output Contract, Quality Gate, and Red Flags

## Output Contract

**Path:** `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-operator-context.user.md`

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

**Downstream consumer:** `modules/assessment-intake-sync.md` reads `<YYYY-MM-DD>-operator-context.user.md` as its seventh precursor (ASSESSMENT-08). Fields from Sections A–D populate operator-context rows in intake Sections A, B, C, and D. Section E gaps populate intake Section F (Missing-Data Checklist).

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
