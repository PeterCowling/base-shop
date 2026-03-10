# Parts 3–4 — TM Pre-Screen and Shortlist

### Part 3 — TM pre-screen

Extract all Line Names from the candidates file and pipe them through `tm-prescreen-cli.ts` to generate EUIPO, WIPO GBD, and UIBM search direction URLs for every candidate.

```bash
DATE=$(date +%Y-%m-%d)
BIZ="<BIZ>"
CANDIDATES="docs/business-os/strategy/${BIZ}/assessment/naming-workbench/product-naming-candidates-${DATE}.md"
OUT="docs/business-os/strategy/${BIZ}/assessment/naming-workbench/product-naming-tm-${DATE}.txt"

# Extract Line Name column (col 2) from markdown table, skip header rows
grep "^|" "$CANDIDATES" \
  | tail -n +3 \
  | awk -F'|' '{gsub(/^ +| +$/, "", $2); print $2}' \
  | grep -v "^$\|^Line Name$\|^#" \
  | TM_BUSINESS="${BIZ}" \
    TM_RUN_DATE="${DATE}" \
    TM_ROUND=1 \
    TM_SIDECAR_DIR="docs/business-os/strategy/${BIZ}/assessment/naming-workbench/product-naming-sidecars" \
    npx ts-node scripts/src/startup-loop/naming/tm-prescreen-cli.ts \
  | tee "$OUT"

echo ""
echo "TM pre-screen direction generated for $(wc -l < "$OUT" | tr -d ' ') candidates."
echo "Sidecar events written to docs/business-os/strategy/${BIZ}/assessment/naming-workbench/product-naming-sidecars/${DATE}-round-1.jsonl"
```

The TM pre-screen direction file (`product-naming-tm-<date>.txt`) contains EUIPO search URL, WIPO GBD search URL, and UIBM bancadati direction for each candidate. Nice Classification classes default to 25 and 26 — override with `TM_NICE_CLASSES=<classes>` if the product falls in a different class.

Gate: `product-naming-tm-<date>.txt` exists before proceeding to Part 4.

---

### Part 4 — Shortlist

Read the candidates table. Produce the final shortlist:

1. Sort all 75 candidates by Score descending
2. For ties, sort by I (ICP resonance) descending, then by C (Category signal) descending, then alphabetically
3. Take the top 20 as the working shortlist
4. For each shortlist entry, embed the EUIPO and WIPO GBD search URLs from the TM direction file

Save to `docs/business-os/strategy/<BIZ>/assessment/naming-workbench/product-naming-shortlist-<YYYY-MM-DD>.user.md` with this structure:

```markdown
---
Type: Product-Naming-Shortlist
Stage: ASSESSMENT-13-pipeline
Business-Unit: <BIZ>
Business-Name: <confirmed business name>
Status: Draft
Created: <YYYY-MM-DD>
Updated: <YYYY-MM-DD>
Owner: Pete
Source-Candidates: docs/business-os/strategy/<BIZ>/assessment/naming-workbench/product-naming-candidates-<YYYY-MM-DD>.md
Source-TM: docs/business-os/strategy/<BIZ>/assessment/naming-workbench/product-naming-tm-<YYYY-MM-DD>.txt
Source-Spec: docs/business-os/strategy/<BIZ>/assessment/naming-workbench/<YYYY-MM-DD>-product-naming-spec.md
---

# <Business Name> Product Naming Shortlist (Round N)

<Brief summary of the run: N candidates generated across M territories. Top 20 presented below. TM pre-screen direction pre-generated for all candidates — review the EUIPO and WIPO links for your preferred choices before confirming a selection.>

**Operator action required:** Review the shortlist below. For each finalist, complete the TM pre-screen by visiting the EUIPO URL and WIPO URL in `product-naming-tm-<YYYY-MM-DD>.txt`. Record results in the TM Pre-Screen Status column. Then confirm a selection in Section C.

---

## A) Shortlist — Top 20 Candidates by DWPEIC Score

| Rank | Line Name | Full Compound | Territory | Score | D | W | P | E | I | C | TM Pre-Screen Status |
|------|-----------|---------------|-----------|------:|---|---|---|---|---|---|----------------------|
| 1 | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | Pending operator check |
...

---

## B) Curator's Analysis — Top Candidates by Territory

<For each territory represented in the top 20, write 2–3 sentences: which candidates stood out, why, and which is the lead recommendation for that territory. Reference the DWPEIC dimension scores specifically.>

---

## C) Operator Selection

**Instructions:** Review the TM pre-screen links in `product-naming-tm-<YYYY-MM-DD>.txt` before confirming a selection. Record TM results in Section A's TM Pre-Screen Status column, then confirm below.

**Operator selected:** {TBD — to be confirmed by operator after TM pre-screen review}

**Selection rationale:** {To be filled by operator}

**Next step after selection:** Run `/lp-do-assessment-14-logo-brief --business <BIZ>` to produce the logo design brief.

---

## D) Score Distribution

- ≥ 24: N names
- 18–23: N names
- ≤ 17: N names

## E) Territory Breakdown

- <Territory 1>: N names
- <Territory 2>: N names
...

## F) TM Pre-Screen Direction Reference

Full TM direction output (EUIPO, WIPO GBD, UIBM for all candidates):
`docs/business-os/strategy/<BIZ>/assessment/naming-workbench/product-naming-tm-<YYYY-MM-DD>.txt`

Sidecar events:
`docs/business-os/strategy/<BIZ>/assessment/naming-workbench/product-naming-sidecars/<YYYY-MM-DD>-round-N.jsonl`

Recommended Nice Classification classes: <from spec §5>
```
