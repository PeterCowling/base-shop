# Steps

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
