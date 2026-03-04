# Parts 4–5: Rank and Render HTML

### Part 4 — Rank

Read the candidates table and the RDAP results file. Produce the final shortlist:

1. Filter the candidates table to rows where the name (or domain string for Pattern D) appears as `AVAILABLE` in the RDAP file
2. Sort by Score descending
3. For ties, sort by I (ICP resonance) descending, then alphabetically
4. Take the top 20 as the working shortlist

Save to `docs/business-os/strategy/<BIZ>/assessment/naming-workbench/naming-shortlist-<YYYY-MM-DD>.user.md` with this structure:

```markdown
---
Type: Naming-Shortlist
Business-Unit: <BIZ>
Round: <N>
Created: <YYYY-MM-DD>
Domain-check: RDAP via Verisign, <YYYY-MM-DD>
Total candidates generated: 250
Total .com available: <N>
Presented: top 20 by score
---

# <BIZ> Naming Shortlist — <YYYY-MM-DD>

## Score key

| Column | Meaning | What a 5 looks like |
|--------|---------|---------------------|
| **D** | Distinctiveness — TM ownability, not confusable with competitors | Fully invented, no phonetic cousin in the category |
| **W** | Wordmark quality — works as a stamped logo, Instagram handle, Etsy shop name | 7–12 letters, strong visual rhythm, memorable in caps |
| **P** | Phonetics — smooth to say in both launch languages, memorable aurally | Flows naturally in IT + EN, soft vowels, 3–4 syllables |
| **E** | Expansion headroom — works for the brand beyond the initial product | Non-product-specific; fits any artisan leather object |
| **I** | ICP resonance — would the primary buyer stop scrolling at this name? | Immediately feels like a brand they'd follow on Instagram |
| **Score** | Sum of D + W + P + E + I | Max 25 |

## Top 20 (domain-verified, ranked by score)

| Rank | Name | Score | D | W | P | E | I | Pattern | Domain | Provenance |
|------|------|-------|---|---|---|---|---|---------|--------|------------|
...

## Score distribution (available names only)
- ≥ 18: N names
- 14–17: N names
- ≤ 13: N names

## Pattern breakdown (available names only)
- Pattern A: N
- Pattern B: N
- Pattern C: N
- Pattern D: N (spoken name / domain string)
- Pattern E: N

## Next step
Operator reviews top 20. Select 1–3 names for registrar confirmation (standard registration price check) and TM pre-screen before committing.

To reject the shortlist and trigger a new round, the operator says any of:
- "none of these work"
- "try again"
- "I don't like these"
- or any equivalent expression of rejection

The skill treats this as a **user-triggered new round** — see §New round below.
```

---

### Part 5 — Render HTML

After Part 4 produces the `.user.md` shortlist, render a polished HTML artifact at the same path with `.user.html` extension:

`docs/business-os/strategy/<BIZ>/assessment/naming-workbench/naming-shortlist-<YYYY-MM-DD>.user.html`

**Required HTML structure:**

- **Header band** — business name, pipeline stage label ("ASSESSMENT-04 · Naming Shortlist"), round number, date, total candidates / available count
- **Score key** — rendered as a visual legend (5-dot scale, one dot per dimension), not just a table
- **Top 20 shortlist table** — each row shows: rank, name, score badge (colored by tier: 25=gold, 23-24=silver, <23=standard), individual dimension scores as filled dots, pattern label, domain string as a `monospace` chip, provenance note
- **Score distribution** — Chart.js horizontal bar chart: ≥18, 14-17, ≤13 bands
- **Pattern breakdown** — Chart.js doughnut chart: patterns A/B/C/D/E with counts
- **Research context** — collapsible section with naming territory analysis and competitive landscape notes, sourced from the corresponding `naming-candidates-<date>.md` summary paragraph
- **Meta footer** — Source file, Generated timestamp, RDAP check date

**Design requirements:**
- Brand-appropriate warm palette for the business (read from `<YYYY-MM-DD>-brand-identity-dossier.user.md` if it exists — use `--accent` and `--accent-warm` CSS vars derived from brand colours; fall back to a warm terracotta/sand palette `#c4714a` / `#f5ede4` if no brand dossier)
- Score tier colour coding: Perfect (25) = gold `#c9973a`; High (23-24) = slate-blue `#4a6fa5`; Standard (<23) = standard text
- Dimension score dots: filled `●` vs empty `○`, coloured by dimension (D=violet, W=teal, P=coral, E=green, I=amber)
- Chart.js loaded from CDN (`https://cdn.jsdelivr.net/npm/chart.js`)
- Mermaid NOT required for this document type
- Pattern filter buttons — clicking a pattern (A/B/C/D/E) filters the shortlist table to only show names of that pattern; "All" button resets
- Responsive: table scrolls horizontally on small viewports
- Print: collapse research section, hide filter buttons, show all rows

Gate: `naming-shortlist-<date>.user.html` exists and contains the score table before declaring pipeline complete.
