---
name: lp-do-assessment-05-name-selection
description: Produce a <YYYY-MM-DD>-naming-generation-spec.md for a business. Reads ASSESSMENT stage docs, extracts ICP, product, brand personality, competitive set, and any prior eliminated names, then writes a fully-structured agent-executable spec that generates 250 scored candidate names. Part 1 of a 4-part naming pipeline (spec → generate → RDAP batch check → rank).
---

# lp-do-assessment-05-name-selection — Name Selection (ASSESSMENT-05)

Produces a `<YYYY-MM-DD>-naming-generation-spec.md` tailored to a specific business. The spec is the input to a name-generation agent that produces 250 scored candidates, which are then batch-checked for .com availability via RDAP and ranked.

This skill replaced the former naming research prompt approach (obsolete since deep research tools cannot verify domain availability).

## When to use

Use when a brand name is open (not yet committed) and the business has sufficient ASSESSMENT stage context. Requires at minimum: a problem statement, a product/option decision, and a brand personality sketch.

Run on user instruction: `/lp-do-assessment-05-name-selection --business <BIZ>`

## The four-part naming pipeline

This skill produces Part 1 only. The full pipeline is:

| Part | What | Who runs it |
|------|------|-------------|
| **1 — Spec** | This skill. Reads ASSESSMENT docs, writes `<YYYY-MM-DD>-naming-generation-spec.md` | This skill |
| **2 — Generate** | Agent reads the spec and produces 250 scored candidate names | Spawn a general-purpose agent with the spec as input |
| **3 — RDAP batch check** | Shell loop hits `https://rdap.verisign.com/com/v1/domain/<name>.com` for all 250; 404 = available, 200 = taken | Bash tool |
| **4 — Rank** | Filter to available names, sort by score, produce final shortlist | Agent or inline |

## Operating mode

**SPEC AUTHORING ONLY**

**Allowed:** read ASSESSMENT docs, synthesize context, write `<YYYY-MM-DD>-naming-generation-spec.md`.

**Not allowed:** generate candidate names, check domains, make naming recommendations.

## Required inputs (pre-flight)

Read and synthesise from:

- `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-problem-statement.user.md` — falsifiable problem, user segments
- `docs/business-os/strategy/<BIZ>/s0c-option-select.user.md` — selected product option(s), price points
- `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-brand-identity-dossier.user.md` — brand personality, positioning, visual direction
- `docs/business-os/strategy/<BIZ>/s0a-research-appendix.user.md` — segment truth, purchase triggers, competitive set
- `docs/business-os/strategy/<BIZ>/s1-readiness.user.md` — ICP confirmation, outcome contract

Also check for prior naming rounds (any `*-naming-shortlist*.user.md` files under the strategy dir). If present, extract all eliminated names into the spec's elimination list.

If any file is missing, note the gap in a preflight comment at the top of the spec but proceed with available context. Do not halt.

## Output

Save to:

```
docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-naming-generation-spec.md
```

If the file already exists (a prior naming round was run), **update it in place**: add newly eliminated names to the elimination list, update the ICP section if it has changed, and increment the round note at the top. Do not overwrite a spec from scratch.

---

## Spec structure (mandatory sections)

The output spec must contain all of the following sections. Sections §3, §4, and §5 are business-specific and must be populated from the ASSESSMENT docs. Sections §3.3 and §5 (generation patterns and output format) are universal infrastructure — copy them verbatim from the template below, do not rewrite.

---

### §1. What this brand is

A dense, precise summary distilled from the ASSESSMENT docs. Cover:

- **The product** — physical description, primary use cases, price points
- **The gap being filled** — the price/quality vacuum the brand occupies (state it specifically: what is below it, what is above it)
- **Primary buyer** — age range, income/lifestyle signal, motivation (functional vs identity-expressive vs occasion-driven), purchase deliberation window, discovery channels
- **Secondary buyer** (if present) — context, purchase window, what they are buying for
- **Brand personality** — the locked personality descriptors from the brand dossier
- **What the brand must NOT sound like** — extracted from anti-criteria in ASSESSMENT docs + any regulatory constraints (e.g. EU MDR proximity, luxury-house adjacency, clinical framing)
- **Growth intent** — what categories the brand may extend into beyond the initial product

Keep this section tight — 300–500 words maximum. It is read by the generation agent to calibrate scores, not by a human researcher.

---

### §2. Who the name is being evaluated for (ICP resonance anchor)

Write two concrete resonance tests — one for the primary buyer, one for the secondary buyer (if present). These tests are used by the generation agent when scoring the ICP resonance dimension (I score).

Format:

> **Primary test:** [One sentence describing the scroll-stop test specific to this ICP. Include: platform, context, what they are doing when they encounter the name, what would make them pause.]

> **Secondary test:** [One sentence for secondary ICP, or omit if no secondary.]

Example (do not copy verbatim — write from the actual ASSESSMENT docs):
> **Primary test:** Would a 32-year-old woman in London, carrying a Neverfull, stop scrolling Instagram at this name while browsing bag accessories on a Sunday morning?

---

### §3. Scoring rubric

Five dimensions. Four are universal (D, W, P, E). One (I — ICP resonance) must be rewritten per business using the resonance tests from §2. The 1–5 descriptors for D, W, P, E are fixed — copy verbatim. The 1–5 descriptors for I must reference the specific ICP from §2.

#### D — Distinctiveness (1–5)
- **5:** Fully invented, no obvious phonetic cousin in the competitive set, strong TM ownability signal
- **4:** Coined or obscure real word, low competitor confusion risk
- **3:** Somewhat unique but shares phonetic territory with known brands or common words in the category
- **2:** Sounds like it could be many things; generic feel; weak TM position likely
- **1:** Directly confused with a competitor, a dominant brand in the category, or a known generic term

#### W — Wordmark quality (1–5)
- **5:** 7–12 letters, strong visual rhythm, no awkward letter pairs, works in caps and mixed case, memorable as a handle
- **4:** Solid wordmark with minor reservations
- **3:** Functional but unremarkable; forgettable visually
- **2:** Too long (>13 letters), hard to abbreviate, or visually cluttered
- **1:** Does not work as a wordmark

#### P — Phonetic quality (1–5)
- **5:** Flows naturally in both launch languages, soft open vowels, no consonant clusters, 3–4 syllables, immediately memorable
- **4:** Mostly smooth; minor awkwardness in one language
- **3:** Pronounceable but no standout quality; forgettable aurally
- **2:** Awkward in one language; requires instruction
- **1:** Genuinely difficult or unpleasant to say in either language

#### E — Expansion headroom (1–5)
- **5:** Non-product-specific; works for any product in the brand's growth category
- **4:** Strong umbrella potential with minor category pull toward initial product
- **3:** Works broadly but feels slightly product-specific
- **2:** Only works for the initial product; would feel wrong on adjacent SKUs
- **1:** Trapped to a specific product form, function, or place

#### I — ICP resonance (1–5)
*[Write this dimension from the ASSESSMENT docs. Reference the specific buyer, platform, and context from §2. The 1–5 descriptors must describe what resonance failure and success look like for this specific ICP — not generic "fashion buyer" language.]*

Template to adapt:
- **5:** Immediately feels like a brand [specific ICP description] would follow on [platform]; [what specifically makes it feel right for this buyer]
- **4:** Appealing and on-tone; feels right for the category
- **3:** Neutral; neither repels nor attracts the ICP specifically
- **2:** Too [generic/technical/serious/wrong register] to connect with the ICP
- **1:** Actively wrong for the ICP

#### Composite score
Sum D + W + P + E + I. Maximum 25. Minimum 5.
Names with composite ≥ 18 are high-priority for RDAP batch check. Names 14–17 secondary. Names ≤ 13 low-priority but still included.

---

### §4. Generation patterns and morpheme pools

**This section has two parts: universal infrastructure (copy verbatim) and business-specific morpheme pools (write from ASSESSMENT docs).**

#### 4.1 Universal generation patterns (copy verbatim — do not rewrite)

Five patterns. Every generated name must use one. State the pattern in the output table.

**Target distribution across 250 names:**
- Pattern A: 80 names
- Pattern B: 50 names
- Pattern C: 50 names
- Pattern D: 40 names
- Pattern E: 30 names

**Root diversity rule:** No more than 4 names may share the same opening root (first 3 letters).

**Suffix diversity rule:** No more than 6 names may use the same suffix ending.

**Pattern A — Extended coinages (9–12 letters)**
Combine two morpheme fragments from the pools in §4.2. Neither fragment should be a common standalone word. Result must feel phonetically natural, not concatenated. 9–12 letters total.

**Pattern B — Phonetic respelling of a brand-relevant concept word**
Start from a real word in the source concept pool (§4.2). Apply at least one respelling rule: transpose an internal vowel; change a double consonant; replace the ending with an Italian-phonetic brand suffix (-ova, -ella, -ina, -ora, -eva, -elo, -ari, -eno); or truncate to two syllables and add a new suffix. Document: source word, meaning, rule(s) applied, resulting token.

**Pattern C — Non-obvious root blend**
Blend two phonotactically Italian fragments where neither is a common standalone word. Fragment 1: 3–5 letters, ends in vowel or soft consonant (l, r, n, v). Fragment 2: 3–6 letters, begins with vowel or soft consonant. Total: 7–11 letters. Must not accidentally form a word in any relevant language.

**Pattern D — Compound domain strategy**
Generate a shorter coined root (6–8 letters) and pair it with a brand suffix to form the domain: `<root><suffix>.com`. Permitted domain suffixes: co, studio, atelier, casa, arte, mano, filo. The spoken/wordmark name is the root; the domain is the compound. Score the root on all five dimensions. List both spoken name and domain string in output.

**Pattern E — Obscure real word (the Polène approach)**
Find a real word from a niche domain relevant to this business (see §4.2 for the source domains to mine). The word must: not be commonly known in commercial use; not be descriptive of the product in TM terms; have a story the operator can tell in 10 seconds; and sound premium and on-brand to the primary buyer. Cite the source and explain why it is non-descriptive.

---

#### 4.2 Business-specific morpheme pools and source domains

*[Write this subsection from the ASSESSMENT docs. It is the primary business-specific content in this section.]*

**First-element morpheme pool (for Pattern A):**
*[Generate 25–30 morpheme fragments drawn from the business's relevant vocabulary — place names, craft terminology, product domain, brand emotional territory. Each fragment should be 4–7 characters, end in a vowel or soft consonant, and feel phonetically consistent with the brand's launch language(s). Do not include common dictionary words.]*

**Second-element morpheme pool (for Pattern A):**
*[Generate 15–20 suffix fragments that work as the second element of a compound. Should vary — not all -ova, -ella, -ina. Include a range of lengths and endings.]*

**Source concept pool (for Pattern B):**
*[List 15–20 real words from the brand's relevant domains — craft vocabulary, place vocabulary, emotional territory, product domain. For each word: the word, the language, the meaning, and why it is relevant to this brand. These are starting points for respelling, not final names.]*

**Source domains to mine (for Pattern E):**
*[List 6–10 specific niche domains where real obscure words relevant to this business might be found. Examples for a fashion brand: regional craft vocabulary, historical trade terminology, coastal geography, artisan technique glossaries. Be specific — not just "Italian craft" but "Campanian tanning vocabulary" or "Renaissance metalwork terminology."]*

---

### §5. Hard blockers and elimination list

#### 5.1 Domain availability gate (copy verbatim — do not rewrite)

.com availability at standard registration price is a prerequisite for shortlisting. Domain checking is a separate automated step (Part 3 of the pipeline) — the generation agent does NOT check domains. The agent generates and scores only.

**RDAP verification protocol (for Part 3):**
1. `curl -s -o /dev/null -w "%{http_code}" "https://rdap.verisign.com/com/v1/domain/<name>.com"` — 404 = unregistered, 200 = registered
2. For names passing step 1, confirm with a registrar (Namecheap, GoDaddy) that the domain is at standard registration price, not broker/aftermarket pricing
3. Document: RDAP result, registrar result, date checked

.eu and .it are desirable but secondary. .com is the only hard gate.

#### 5.2 Why short coinages fail (copy verbatim — do not rewrite)

Short pronounceable coinages (5–8 letters) with Romance-language phonotactics are almost entirely exhausted in the .com namespace. Domain investment funds systematically register every plausible 5–8 letter token with open vowels, soft consonants, and common suffixes. Three naming rounds for this business produced 80 candidates; 80/80 .com domains were taken.

**Length guidance for all patterns:**
- Prefer 9–12 letter tokens
- 6–8 letter tokens permitted only with Pattern D (compound domain) or Pattern E (obscure real word with verified domain)
- Do not generate 5-letter coinages

#### 5.3 Eliminated names

*[Populate from all prior naming rounds for this business. Format as a simple list with round and reason. If this is the first naming round, write "None — first naming run." Update this list on each subsequent run of the skill.]*

Example format:
```
**Round 1 (YYYY-MM-DD):** Name1 (.com taken), Name2 (.com taken), Name3 (active brand conflict)
**Round 2 (YYYY-MM-DD):** Name4 (.com taken), Name5 (active brand conflict)
```

---

### §6. Output format (copy verbatim — do not rewrite)

Produce a single markdown table with exactly these columns. One row per name. 250 rows total.

```
| # | Name | Pattern | Spoken name (Pattern D only) | Domain string (Pattern D only) | Provenance note | D | W | P | E | I | Score |
```

**Column definitions:**
- **#** — sequential 1–250
- **Name** — the brand name token
- **Pattern** — A, B, C, D, or E
- **Spoken name** — Pattern D only
- **Domain string** — Pattern D only (e.g. `torevaco.com`)
- **Provenance note** — one line: morphemes used (A); source word + rule (B); fragment notes (C); root + suffix (D); source word + meaning + why non-descriptive (E)
- **D / W / P / E / I** — dimension scores 1–5
- **Score** — sum D+W+P+E+I

Sort output by Score descending. Within same score, sort alphabetically.

After the table, write a one-paragraph summary: names per pattern, score distribution (≥18 / 14–17 / ≤13), observations on which patterns produced the strongest candidates.

---

## Quality gate (before saving)

- [ ] §1 populated from ASSESSMENT docs (not generic placeholder text)
- [ ] §2 resonance tests are specific to this business's ICP (not generic "fashion buyer")
- [ ] §3 ICP resonance dimension (I) references the specific buyer from §2
- [ ] §4.2 morpheme pools and source domains are business-specific (not generic Italian vocabulary)
- [ ] §5.3 elimination list populated (or explicitly marked "None — first naming run")
- [ ] All universal sections (§3 D/W/P/E, §4.1, §5.1, §5.2, §6) copied verbatim — no rewrites
- [ ] Length guidance reflected in §4.1 (no 5-letter coinage instruction present)
- [ ] Regulatory constraints encoded in §1 "what the brand must NOT sound like" if applicable

## Completion message

> "Naming generation spec ready: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-naming-generation-spec.md`. Next: spawn a general-purpose agent with this spec as input to generate 250 scored candidates. Then run the RDAP batch check. Then filter and rank."

## Integration

**Upstream (ASSESSMENT-03):** Runs after `/lp-do-assessment-03-solution-selection` produces a product decision record.

**Downstream — Part 2:** Spawn a general-purpose agent with the spec. Prompt: "Read `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-naming-generation-spec.md` in full, then generate exactly 250 brand name candidates following the spec exactly. Save to `docs/business-os/strategy/<BIZ>/naming-candidates-<YYYY-MM-DD>.md`."

**Downstream — Part 3 (RDAP batch):** Extract all names from the candidates file. Run:
```bash
while IFS= read -r name; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "https://rdap.verisign.com/com/v1/domain/${name}.com")
  echo "$status $name"
done < names.txt
```
Filter to 404s. For Pattern D names, check the domain string, not the spoken name.

**Downstream — Part 4 (rank):** Filter candidates table to domain-available names only. Sort by Score descending. Present top 20 as the working shortlist for operator review. Save to `docs/business-os/strategy/<BIZ>/naming-shortlist-<YYYY-MM-DD>.user.md`.

**Downstream (ASSESSMENT-06):** `/lp-do-assessment-06-distribution-profiling` runs after the operator has confirmed a working name from the shortlist.
