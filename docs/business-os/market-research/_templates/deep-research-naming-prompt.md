---
Type: Template
Status: Reference
Domain: Business-OS
Last-reviewed: 2026-02-17
Data-Richness: S0-only
---

# Deep Research Prompt — Business Naming

Replace all `{{...}}` placeholders with values from the S0 intake packet, then submit to Deep Research.

Optional fields marked `[optional]` may be left as their fallback value if not yet known — the researcher will work with whatever is provided.

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
- Target languages in region: {{TARGET_LANGUAGES}}
  [optional — if not specified, derive the top 2 languages spoken in {{REGION}} and check names against both]
- Core offer (what is sold): {{CORE_OFFER}}
- Revenue model: {{REVENUE_MODEL}}
- Price positioning: {{PRICE_POSITIONING}}
  [optional — if not specified, infer from the core offer and region context]
- Primary target customer: {{PRIMARY_ICP_WHO}}
- Customer context / occasion of use: {{PRIMARY_ICP_CONTEXT}}
  [optional — if not specified, infer a plausible use context from the customer and offer]
- Customer job-to-be-done: {{PRIMARY_ICP_JTBD}}
  [optional — if not specified, infer from the customer and core offer]
- Key differentiator hypothesis: {{KEY_DIFFERENTIATOR}}
  [optional — if not specified, note this gap and generate names that leave positioning room open]

S0+S2B additional context (populate only when Data-Richness is S0+S2B):
- Positioning statement (Moore template):
  For {{POSITIONING_FOR}} who {{POSITIONING_WHO}}, {{BUSINESS_CODE}} is a {{POSITIONING_CATEGORY}}
  that {{POSITIONING_KEY_BENEFIT}}. Unlike {{POSITIONING_COMPETITOR_FRAME}}, because {{POSITIONING_PROOF_POINT}}.
- Top 3 customer pain points: {{PAIN_1}} / {{PAIN_2}} / {{PAIN_3}}
- Brand personality: We are {{PERSONALITY_ADJECTIVE_1}}, {{PERSONALITY_ADJECTIVE_2}}. We are NOT {{ANTI_ADJECTIVE_1}}, {{ANTI_ADJECTIVE_2}}.
- Words / associations to avoid: {{WORDS_TO_AVOID}}


Research task 1 — Competitor Name Landscape (do this before generating candidates)

1a. Identify 8–12 direct and adjacent competitors operating in {{REGION}} for this type of business.
1b. For each competitor, record: name, naming archetype (see archetypes below), primary language(s) of the name.
1c. Identify naming patterns that are OVER-USED in this category (avoid these).
1d. Identify naming patterns that create WHITE SPACE (differentiation opportunity).
1e. Summarise your findings in 200 words or fewer before proceeding.


Research task 2 — Candidate Long-List

Generate 15–20 name candidates. Use AT LEAST 4 of the following 7 archetypes, spread across the list:

Archetype        Description
──────────────── ─────────────────────────────────────────────────────────────
Descriptive      Literally describes the product, outcome, or customer benefit
Evocative        Creates a mood, feeling, or world — not literal
Invented         Coined or deliberately misspelled word — unique and ownable
Metaphorical     Borrows from another domain (nature, geography, mythology, sport)
Portmanteau      Merges two meaningful root words
Founder          Uses a real or invented persona name (surname or first name)
Geographic       Place-based, signals origin, aspiration, or territory

For EACH of the 15–20 candidates, provide:

  Name:               The name (include variant spellings worth considering)
  Archetype:          Which archetype category (see above)
  Rationale:          Why this name fits the offer, customer, and positioning (2–3 sentences)
  Domain signal:      Does a clean .com, .co, or {{REGION_TLD}} appear available? (spot check only; state "check required" if uncertain — this is not legal advice)
  Trademark risk:     LOW / MEDIUM / HIGH — based on visible existing marks in the relevant class for {{REGION}} (spot check only; not legal advice)
  Cultural / linguistic check: Any negative, unintended, or hard-to-pronounce meanings in {{TARGET_LANGUAGES}}? Flag explicitly. If target languages not specified, check the top 2 languages of {{REGION}}.
  Brand story potential: One sentence on the narrative this name opens up

Do not pad. If a candidate is weak, say why briefly and move on — do not promote weak names into the shortlist.


Research task 3 — Shortlist

From the 15–20 candidates, select the TOP 5 using these weighted criteria:

  Criterion                                     Weight
  ─────────────────────────────────────────────────────
  Positioning fit — aligns with differentiation    40%
    and target customer
  Distinctiveness — not confusable with a          25%
    competitor in this category
  Memorability + pronunciation — easy to say,       20%
    spell, and remember across {{TARGET_LANGUAGES}}
  Domain / trademark viability — plausible path     15%
    to ownership

Present the top 5 in a comparison table with a score (0–10) per criterion and a total weighted score.
Rank them by total weighted score.

Shortlist table format:
  Rank | Name | Fit (40%) | Distinct (25%) | Memo (20%) | Viable (15%) | Total | Notes


Research task 4 — Recommendation

Recommend the SINGLE strongest name. Provide:
- The recommended name
- Full rationale: why it wins across all four criteria (min 150 words)
- Suggested tagline or brand descriptor to pair with it (optional — only if one comes naturally)
- The one primary risk with this name, and a concrete mitigation
- Two alternative names to consider if the top recommendation has a trademark or domain blocker


Output format (strict):

Return results in this order:

A) Competitor Name Landscape summary (max 250 words)
   - Include: over-used patterns to avoid, white-space patterns to pursue

B) Candidate long-list table (15–20 candidates)
   - All fields for each candidate as specified above

C) Shortlist comparison table (top 5)
   - Scored and ranked as specified above

D) Recommendation
   - Recommended name, full rationale, optional tagline, primary risk + mitigation, two alternatives

E) Required return artifact (machine-readable)
   - The researcher must include this YAML block at the END of the document, preceded by "---":

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
- Do not invent domain or trademark status — flag uncertainty explicitly.
- Every claim about competitor naming must cite the competitor's actual name (no paraphrasing).
- Cultural / linguistic checks are MANDATORY for each candidate. Do not skip them.
- If the optional fields are empty (fallback values), note this at the start of Section B and adjust the rationale accordingly — you are working with partial context.
- Do not pad the long-list with weak candidates to reach 20. Better to have 15 strong candidates than 20 padded ones.
- If you have strong confidence that fewer than 15 genuinely distinct candidates exist for this category and region, say so and explain why.
- Optimise for names that work in {{TARGET_LANGUAGES}} (spoken and written) and do not require explanation.
```

---

## Required return artifact

The researcher must include the following YAML front matter block at the top of their returned document
(in addition to the inline `---` block at the end of the prompt above):

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

This front matter is required for `lp-brand-bootstrap` to extract the recommended name automatically.
A document without this front matter will be accepted but the name field in the brand dossier will require
manual entry. In that case, `lp-brand-bootstrap` will emit a non-blocking advisory.

---

## Populating this template (for the loop gate)

When GATE-BD-00 triggers, the startup loop reads the S0 intake packet and populates all `{{FIELD}}`
placeholders automatically before writing the prompt to:

  `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-naming-prompt.md`

The user then copies the populated prompt into their Deep Research tool, runs the research, and saves
the returned document to:

  `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-naming-shortlist.user.md`

The loop detects the returned file on the next `/startup-loop advance` call and passes GATE-BD-00.

Seed contract reference: `docs/plans/startup-loop-business-naming/fact-find.md` § Naming Prompt Seed Contract
