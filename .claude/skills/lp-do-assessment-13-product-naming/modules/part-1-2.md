# Parts 1–2 — Spec and Generate

### Part 1 — Spec

Read all available ASSESSMENT artifacts and write `docs/business-os/strategy/<BIZ>/assessment/naming-workbench/<YYYY-MM-DD>-product-naming-spec.md`.

The spec must contain:

**§1. Brand-product name relationship**
- The approved business name and its expansion-headroom rationale (why it is not product-specific)
- The compound pattern chosen: `[Business Name] [Line Name]`
- Naming convention for future SKUs (how additional products in the line will be named)

**§2. Product context**
- Hero product type, category, price point, quality tier
- ICP primary audience summary (not re-elicited — extracted from intake docs)
- Distribution channels and any naming constraints they impose (e.g., Etsy 140-char limit, Instagram handle availability)

**§3. DWPEIC scoring rubric**
Six dimensions (max 30). Dimensions D–E are universal; I and C must be written from the ASSESSMENT docs.

- **D — Distinctiveness (1–5):** TM ownability; not confusable with competitors or common words in the category
- **W — Wordmark quality (1–5):** 7–12 characters, visual rhythm, works as a handle and in compound with business name
- **P — Phonetic quality (1–5):** Flows naturally in launch language(s), soft vowels, 2–4 syllables, memorable aurally
- **E — Expansion headroom (1–5):** Works for adjacent products in the brand's extension range without feeling product-trapped
- **I — ICP resonance (1–5):** Written from ASSESSMENT docs — would the primary buyer stop scrolling at this name? Reference specific buyer, platform, and context
- **C — Category signal (1–5):** How clearly does the name, in compound with the business name, signal the product category to a new buyer on a product listing page?

Composite: sum D+W+P+E+I+C. Maximum 30.

**§4. Naming territories and morpheme pools**
Define 4–6 naming territories specific to this product. For each territory:
- Territory name and rationale (why it is relevant to this product and ICP)
- 10–15 candidate seeds or morpheme fragments drawn from the brand's relevant vocabulary
- Target count: ~15 names per territory

Example territories for a CI accessory brand: Italian product-type (form-factor vocabulary), Italian benefit (functional benefit vocabulary), Italian routine (habitual wear vocabulary), coined diminutive (warmth + energy), international loan words

**§5. Hard blockers and elimination list**

5.1 Regulatory / category hard blockers (specific to this product — e.g., EU MDR proximity for medical-adjacent products)
5.2 Anti-patterns the brand explicitly rejects (extracted from brand profile "NOT" constraints)
5.3 Eliminated names from prior rounds (format: `Round N (date): Name1 (reason), Name2 (reason)`)

**§6. Output format**
Produce a markdown table with exactly these columns. One row per name. 75 rows total.

```
| # | Line Name | Full Compound | Territory | D | W | P | E | I | C | Score | Provenance |
```

Sort by Score descending. After the table, write a one-paragraph summary covering territory distribution, score distribution (≥24 / 18–23 / ≤17), and which territories produced the strongest candidates.

---

If `<YYYY-MM-DD>-product-naming-spec.md` already exists from a prior round, update it in place: add eliminated names to §5.3, update ICP if changed, increment the round note. Do not create a new spec from scratch.

Gate: spec exists and is dated today before proceeding to Part 2.

---

### Part 2 — Generate

Spawn a **general-purpose agent** (model: opus) with the following prompt, substituting `<BIZ>` and `<SPEC_PATH>`:

> Read `<SPEC_PATH>` in full before doing anything else. Then generate exactly 75 product line name candidates following the spec exactly — §3 DWPEIC scoring rubric, §4 naming territories and morpheme pools, §5 hard blockers and elimination list, §6 output format. Every name must have a territory label, provenance note, and six dimension scores. The Line Name and Full Compound columns are both required for every row. Sort the output table by Score descending. After the table, write the one-paragraph summary required by §6. Save the complete output (table + summary) to `docs/business-os/strategy/<BIZ>/assessment/naming-workbench/product-naming-candidates-<YYYY-MM-DD>.md`. Do not stop early. Do not skip the provenance notes. Do not reuse any name from §5.3.

Do not proceed to Part 3 until the candidates file exists and contains a table with ≥ 65 rows.

Gate: `product-naming-candidates-<date>.md` exists with ≥ 65 rows.
