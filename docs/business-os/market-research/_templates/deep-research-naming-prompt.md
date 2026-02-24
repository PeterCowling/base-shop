---
Type: Template
Status: Reference
Domain: Business-OS
Last-reviewed: 2026-02-18
Data-Richness: S0-only
---

# Deep Research Prompt — Business Naming

Replace all `{{...}}` placeholders with values from the S0 intake packet (and S2B offer artifact
when available), then submit to Deep Research.

Optional fields marked `[optional]` may be left as their fallback value if not yet known.

---

## Price tier definitions (required for Research task 1)

Use these thresholds when classifying competitor price tier. Apply to the primary product price
in the relevant market. Convert to EUR using the ECB reference rate at the time of research
(ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates).

| Tier | EUR range |
|---|---|
| budget | < €25 |
| mid | €25 – €60 |
| premium | €60 – €150 |
| ultra-luxury | > €150 |

---

## Trademark and domain evidence standards

Use these definitions for all LOW/MEDIUM/HIGH trademark risk ratings and domain and handle
availability calls.

**Trademark risk:**
- LOW = no identical or near-identical marks found in EUIPO eSearch and UKIPO search in the
  applicable classes for the relevant goods category
- MEDIUM = similar marks exist in a different category or with weak overlap; or a close mark
  exists but in a different class
- HIGH = identical or very close mark exists in the applicable classes for substantially similar
  goods

**Near-identical** means: same pronunciation; same root with only a common suffix or prefix added
(e.g. -ly, -co, -ify, -pet); pluralisation difference only; single-character substitution that
does not alter the phonetic root (e.g. "Lumi" vs "Lumie"); or transliteration of the same word.

Every rating must include: the search tool used (EUIPO / UKIPO), the query string, and the closest
match found (name, class, link). If the search cannot be completed, write
`unknown — search blocked; manual check required`.

Class notes (include all that apply to the product roadmap):
- Class 18: leather goods, bags, harnesses, collars, leashes
- Class 28: toys, pet accessories used for play
- Class 35: online retail services — always check this class for e-commerce brands
- Class 25: apparel and clothing accessories — include if roadmap covers apparel for owner or pet
- Class 14: precious metals and jewellery, decorative charms — include if roadmap covers charms
  or jewellery-adjacent accessories

**Evidence staging (apply this graduated burden):**
- Long-list (B1/B2): full trademark search is encouraged. Where lookups are blocked, write
  `unknown — shortlist check required` and note the reason. This is acceptable at the long-list
  stage.
- Shortlist top 5 (Section C): EUIPO + UKIPO search with query string and closest match is
  REQUIRED for each name in all applicable classes. Do not advance a candidate with an unresolved
  `unknown` unless the entry is explicitly marked `search blocked; manual check required`.

**Domain availability:**
Specify the registrar or WHOIS tool used and the result (available / taken / unknown). Never
infer availability from name uniqueness alone. Preferred TLD: .com. Acceptable fallback: .co
or .eu. If the lookup cannot be completed, write `unknown — check required`.

Evidence staging for domain:
- Long-list: .com check encouraged; `unknown — check required` acceptable if blocked.
- Shortlist top 5: .com WHOIS result is REQUIRED.

**Instagram/TikTok handle availability:**
Method: attempt to load the handle's public profile page directly.
- If the page displays a profile → handle is **taken**.
- If the platform returns a 'Page not found' / HTTP 404 equivalent → record as **available**.
- If the response is a login wall or consent screen (not a clear 404) → write
  `unknown — login wall; cannot verify`.
- If the check is blocked by rate limiting → write `unknown — rate-limited`.

Do not infer availability from any of the above ambiguous states. Check @[name] and @[name].dog
on Instagram; check @[name] on TikTok.

Evidence staging for handles:
- Long-list: available / taken / unknown acceptable.
- Shortlist top 5: handle check is REQUIRED for @[name] and @[name].dog. Do not record as
  available without a confirmed non-profile 404 response.

---

```text
You are a naming strategist and brand researcher for a venture studio launching new consumer businesses.

Task:
Produce a decision-grade Business Naming Pack for a new venture that does not yet have a confirmed name.
Your job is to generate a long-list of company and product name candidates, research their viability, shortlist
the strongest, and make a single clear recommendation — all grounded in the positioning and customer context below.

Data richness: {{DATA_RICHNESS}}
(S0-only = early intake data; S0+S2B = full offer design and positioning data also available below)

Business context:
- Business code (internal): {{BUSINESS_CODE}}
- Working / placeholder name (if any): {{BUSINESS_NAME}}
- Region / primary market: {{REGION}}
- Primary launch countries: {{LAUNCH_COUNTRIES}}
- Target languages in region: {{TARGET_LANGUAGES}}
  [optional — if not specified, derive the top 2 languages spoken in {{REGION}} and check names against both]
- Core offer (what is sold): {{CORE_OFFER}}
- Revenue model: {{REVENUE_MODEL}}
- Primary channels: {{CHANNELS}}
- Price positioning: {{PRICE_POSITIONING}}
  [optional — if not specified, infer from the core offer and region context]
- Primary target customer: {{PRIMARY_ICP_WHO}}
- Customer context / occasion of use: {{PRIMARY_ICP_CONTEXT}}
  [optional — if not specified, infer a plausible use context from the customer and offer]
- Customer job-to-be-done: {{PRIMARY_ICP_JTBD}}
  [optional — if not specified, infer from the customer and core offer]
- Key differentiator hypothesis: {{KEY_DIFFERENTIATOR}}
  [optional — if not specified, note this gap and generate names that leave positioning room open]
- Hard disqualifiers — do NOT include names containing or evoking: {{DISQUALIFIED_WORDS}}
- Orthography constraints: avoid diacritics (é, à, ü), apostrophes, and hyphens in the brand name;
  target 4–10 characters and 1–3 syllables where possible; ambiguous or inconsistent spelling
  requires strong justification.

S0+S2B additional context (populate only when Data-Richness is S0+S2B):
- Positioning statement (Moore template):
  For {{POSITIONING_FOR}} who {{POSITIONING_WHO}}, {{BUSINESS_CODE}} is a {{POSITIONING_CATEGORY}}
  that {{POSITIONING_KEY_BENEFIT}}. Unlike {{POSITIONING_COMPETITOR_FRAME}}, because {{POSITIONING_PROOF_POINT}}.
- Top 3 customer pain points: {{PAIN_1}} / {{PAIN_2}} / {{PAIN_3}}
- Brand personality: We are {{PERSONALITY_ADJECTIVE_1}}, {{PERSONALITY_ADJECTIVE_2}}. We are NOT {{ANTI_ADJECTIVE_1}}, {{ANTI_ADJECTIVE_2}}.
- Words / associations to avoid: {{WORDS_TO_AVOID}}


Price tier definitions (use throughout):

  budget < €25 | mid €25–€60 | premium €60–€150 | ultra-luxury > €150

  Convert to EUR using the ECB reference rate at the time of research
  (ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates).


Trademark and domain evidence standards:

Trademark risk:
  LOW = no identical or near-identical marks in the applicable classes
  MEDIUM = similar marks exist but in a different category or with weak overlap
  HIGH = identical or very close mark in the applicable classes for substantially similar goods

  Near-identical means: same pronunciation; same root with only a common suffix or prefix
  (e.g. -ly, -co, -ify, -pet); pluralisation difference only; single-character substitution that
  does not alter the phonetic root; or transliteration of the same word.

  Every rating must include: tool used (EUIPO eSearch / UKIPO), query string, closest match found
  (name, class, link). Write "unknown — search blocked; manual check required" if search fails.

  Class notes (include all that apply to the product roadmap):
    Class 18: leather goods, bags, harnesses, collars, leashes
    Class 28: toys, pet accessories used for play
    Class 35: online retail services — always check for e-commerce brands
    Class 25: apparel and clothing accessories (if roadmap covers apparel)
    Class 14: precious metals and jewellery, decorative charms (if roadmap covers charms)

  Evidence staging:
    Long-list: full search encouraged; "unknown — shortlist check required" acceptable if blocked.
    Shortlist top 5: EUIPO + UKIPO search with query + closest match is REQUIRED in all applicable
    classes. Do not advance a candidate with an unresolved unknown unless marked
    "search blocked; manual check required".

Domain availability:
  Specify the registrar or WHOIS tool used and the result: available / taken / unknown.
  Preferred TLD: .com. Acceptable fallback: .co or .eu.
  Do not infer availability from name uniqueness alone. Write "unknown — check required" if lookup
  fails.

  Evidence staging: Long-list — .com check encouraged, unknown acceptable. Shortlist top 5 —
  .com WHOIS result is REQUIRED.

Instagram / TikTok handle:
  Method: attempt to load the handle's public profile page directly.
    Profile displayed → taken.
    'Page not found' / HTTP 404 → available.
    Login wall or consent screen (not a clear 404) → "unknown — login wall; cannot verify".
    Rate-limited → "unknown — rate-limited".
  Never infer availability from an ambiguous response.
  Check @[name] and @[name].dog on Instagram; @[name] on TikTok.

  Evidence staging: Long-list — available / taken / unknown acceptable. Shortlist top 5 —
  @[name] and @[name].dog check is REQUIRED; do not record available without a confirmed 404.


Research task 1 — Competitor Name Landscape (complete before generating candidates)

1a. Identify 8–12 direct and adjacent competitors operating in {{REGION}} for this type of business.
    Seed list: {{COMPETITOR_SEED_LIST}}
    Add any additional competitors you identify through research.

1b. For each competitor, produce a table row. The table is REQUIRED in the output (see section A1 below).
    Each row must include:
      - Name
      - Naming archetype (see archetype list in Research task 2)
      - Primary language(s) of the name
      - Example product + price in original currency (and EUR equivalent)
      - Price tier: budget / mid / premium / ultra-luxury (use definitions above)
      - One source link (official site or major retailer listing)

1c. Identify naming patterns that are OVER-USED in this category. State each pattern explicitly.

1d. Identify naming patterns that create WHITE SPACE (differentiation opportunity). State each
    pattern explicitly.

1e. Before proceeding to Research task 2, write a "naming territory map" — 4–5 distinct territory
    labels that represent different creative directions the long-list could explore. These are NOT
    candidate names and must NOT be used as name tokens; they are strategic lenses only.
    Example territories (replace with category-appropriate ones):
      - Italian artisan provenance (craft quality, European warmth without pretension)
      - Urban promenade (walk culture, city aesthetic)
      - Subtle canine companionship (no "dog/pet" in name)
      - Accessory-first fashion language (luxury-adjacent without luxury pricing)
      - Warm feminine persona / founder name space

1f. Summarise your findings from 1c and 1d in 250 words or fewer. State which territories from 1e
    are underserved by current competitor names (highest white-space opportunity).


Research task 2 — Candidate Long-List

Generate 15–20 name candidates. Use AT LEAST 4 of the 7 archetypes below, spread across the list.
Distribute candidates across at least 3 of the naming territories identified in task 1e.

Archetype        Description
──────────────── ─────────────────────────────────────────────────────────────
Descriptive      Literally describes the product, outcome, or customer benefit
Evocative        Creates a mood, feeling, or world — not literal
Invented         Coined or deliberately misspelled word — unique and ownable
Metaphorical     Borrows from another domain (nature, geography, mythology, sport)
Portmanteau      Merges two meaningful root words
Founder          Uses a real or invented persona name (surname or first name)
Geographic       Place-based, signals origin, aspiration, or territory

Do not pad. If a candidate is weak, say so briefly and move on — do not promote weak names into the shortlist.

DISQUALIFICATION RULES (apply before including any candidate):
- Contains or evokes: {{DISQUALIFIED_WORDS}}
- References or evokes protected luxury house marks (e.g., Hermès, Kelly, Chanel, Dior,
  Louis Vuitton, Gucci, Prada, and their common derivatives). Do not include names that create a
  "dupe" or "knockoff" association with these houses.
- Contains diacritics, apostrophes, or hyphens (unless strongly justified — explain in rationale)
- Fewer than 4 or more than 10 characters without strong justification
- More than 3 syllables without strong justification
- High SERP noise risk with no distinctive modifier: a common dictionary word that floods search results
  with unrelated content, making it effectively unfindable without paid search (e.g., "run", "walk", "wild")

Present candidates in TWO formats:

FORMAT B1 — Compact summary table (one row per candidate):

  Name | Archetype | Territory | 1-line rationale | Domain | TM risk | Handle | SERP noise risk

  For Domain, TM risk, Handle: use the evidence standards defined above.
  SERP noise risk: low (name is distinctive in search) / med / high (common word, swamped by unrelated results)

FORMAT B2 — Per-candidate detail blocks (one block per candidate, below the table):

  ### [Name]
  Rationale: (2–3 sentences — why this name fits the offer, customer, and positioning)
  Domain evidence: <registrar/WHOIS tool used>; result: available / taken / unknown; note
  Trademark evidence: EUIPO eSearch + UKIPO search; query: "[name]"; class(es) searched: [list];
    closest match: [none / name + class + link]; risk: LOW / MEDIUM / HIGH
  Handle evidence: @[name] on Instagram: available / taken / unknown; @[name].dog: available / taken / unknown;
    @[name] on TikTok: available / taken / unknown
  Pronunciation notes: (how does this name sound in English, Italian, French? Any vowel ambiguity,
    stress variation, or systematic mispronunciation risk across target languages?)
  Linguistic check ({{TARGET_LANGUAGES}} + {{LINGUISTIC_CHECK_LANGUAGES}}):
    English: [any negative or unintended meanings? pronunciation issues?]
    Italian: [same]
    French: [same]
    Spanish: [same]
    [add other languages as relevant]
  Brand story potential: (one sentence — what narrative does this name open?)


Research task 3 — Shortlist

From the 15–20 candidates, select the TOP 5 using these weighted criteria:

  Criterion                                              Weight
  ────────────────────────────────────────────────────────────
  Positioning fit — aligns with core offer, ICP,           40%
    and key differentiator; works for full product line
    (not just product 1)
  Distinctiveness — not confusable with a competitor       25%
    in this category; low SERP noise risk
  Memorability + pronunciation — easy to say, spell,       20%
    and remember across {{TARGET_LANGUAGES}} + Spanish
  Domain / trademark viability — plausible path to         15%
    ownership in applicable classes (18, 28, 35; plus 25
    and/or 14 where the product roadmap requires)

Present the top 5 in a comparison table with a score (0–10) per criterion and a total weighted score.
Rank by total weighted score.

Shortlist table format:
  Rank | Name | Fit (40%) | Distinct (25%) | Memo (20%) | Viable (15%) | Total | Notes

For the shortlist top 5, additionally run an Etsy shop name search for each name. Note whether an
active shop with the same or very similar name already exists, and estimate the organic Etsy
discovery saturation risk (low / med / high).

Also for the shortlist top 5: complete the full evidence requirement described in the trademark,
domain, and handle evidence staging rules above. Unresolved 'unknown' entries must be resolved or
explicitly flagged as 'search blocked; manual check required'.


Research task 4 — Recommendation

Recommend the SINGLE strongest name. Provide:
- The recommended name
- Full rationale: why it wins across all four criteria (minimum 150 words)
- Suggested tagline or brand descriptor (optional — only if one comes naturally)
- The one primary risk with this name, and a concrete mitigation
- Two alternative names to consider if the top recommendation has a trademark or domain blocker


Output format (strict):

Return results in this order:

A) Competitor Name Landscape

A1: Competitor table — REQUIRED. Include all 8–12 competitors as rows.
    Columns: Name | Archetype | Name language(s) | Example product + price (orig currency + EUR) | Price tier | Source link

A2: Naming territory map — the 4–5 territories from task 1e, each with 1–2 sentences
    on white-space opportunity.

A3: Landscape summary — max 250 words. State: over-used patterns to avoid + white-space
    patterns to pursue + which territories are most underserved.

B) Candidate long-list (15–20 candidates)

B1: Compact summary table (Name | Archetype | Territory | 1-line rationale | Domain | TM risk | Handle | SERP noise risk)
B2: Per-candidate detail blocks — one block per candidate following the FORMAT B2 structure above

C) Shortlist comparison table (top 5)
   Scored and ranked per criteria above.
   Include Etsy saturation risk note for each of the 5.

D) Recommendation
   Recommended name, full rationale (min 150 words), optional tagline, primary risk + mitigation,
   two alternatives.

E) Required return artifact (machine-readable)
   Include this YAML block at the END of the document, preceded by "---":

   ---
   recommended_business_name: "<name>"
   shortlist:
     - "<name_1>"
     - "<name_2>"
     - "<name_3>"
     - "<name_4>"
     - "<name_5>"
   data_richness: "{{DATA_RICHNESS}}"
   region: "{{REGION}}"
   generated_by: "Deep Research"

   This block is required for downstream automation. Do not omit it.


Rules:
- Do not invent domain, trademark, or handle status — flag uncertainty explicitly using the
  "unknown — <reason>" convention defined in the evidence standards above.
- Every competitor entry in the A1 table must include at least one source link (official site or
  major retailer listing) and one explicit price reference with currency.
- Cultural / linguistic checks are MANDATORY for each candidate in English, Italian, French, and
  Spanish. Do not skip them.
- Names referencing or evoking protected luxury house marks (Hermès, Kelly, Chanel, Dior,
  Louis Vuitton, Gucci, Prada, etc.) are disqualified. Do not include them.
- Do not pad the long-list with weak candidates to reach 20. Better to have 15 strong candidates
  than 20 padded ones.
- If you have strong confidence that fewer than 15 genuinely distinct candidates exist for this
  category, say so and explain why.
- Optimise for names that work in English as the commercial language while being pronounceable and
  non-jarring in Italian, French, and Spanish.
- Instagram and TikTok are primary channels — prioritise names where @[name] or @[name].dog is
  plausibly available, and where Etsy shop name search returns no dominant competitor with the
  same or very similar name.
- If an Instagram or TikTok handle check is blocked by rate limiting or a login wall, note this
  explicitly. Do not assume availability.
```

---

## Required return artifact

The researcher must include the following YAML block at the END of the document:

```yaml
---
recommended_business_name: "<name>"
shortlist:
  - "<name_1>"
  - "<name_2>"
  - "<name_3>"
  - "<name_4>"
  - "<name_5>"
data_richness: "S0-only | S0+S2B"
region: "<region>"
generated_by: "Deep Research"
---
```

This block is required for `lp-assessment-bootstrap` to extract the recommended name automatically.
A document without this block will be accepted but requires manual name entry in the brand dossier.

---

## Populating this template (for the loop gate)

When GATE-BD-00 triggers, the startup loop reads the S0 intake packet and S2B offer artifact (when
available) and populates all `{{FIELD}}` placeholders before writing the prompt to:

  `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-naming-prompt.user.md`

The user then copies the populated prompt into their Deep Research tool, runs the research, and saves
the returned document to:

  `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-candidate-names.user.md`

The loop detects the returned file on the next `/startup-loop advance` call and passes GATE-BD-00.

Seed contract reference: `docs/plans/startup-loop-business-naming/fact-find.md` § Naming Prompt Seed Contract
