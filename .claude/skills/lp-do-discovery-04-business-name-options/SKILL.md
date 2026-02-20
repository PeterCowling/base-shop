---
name: lp-do-discovery-04-business-name-options
description: Produce a deep research prompt for business name exploration. Reads the target business's startup loop docs, encodes product, ICP, market, regulatory constraints, and competitive landscape, then outputs a structured research prompt ready to paste into a deep research tool (OpenAI Deep Research or equivalent).
---

# lp-do-discovery-04-business-name-options — Business Name Options (DISCOVERY-04)

Produces a research-grounded naming brief — not a list of invented names, but a framework for evidence-based name evaluation.

## When to use

Use when a brand name is open (not yet committed) and you need to brief a deep research tool or naming designer. Requires sufficient startup loop context to be present for the target business.

## Operating mode

**RESEARCH BRIEF AUTHORING ONLY**

**Allowed:** read startup loop docs, synthesize context, produce research prompt artifact.

**Not allowed:** generate candidate names, make naming recommendations, implement any changes.

## Required inputs (pre-flight)

Before writing the prompt, read and synthesize from the business's loop docs:

- `docs/business-os/startup-baselines/<BIZ>-intake-packet.user.md` — ICP, product, region, outcome contract
- `docs/business-os/market-research/<BIZ>/` — competitor names, price range, market sizing
- `docs/business-os/strategy/<BIZ>/brand-dossier.user.md` — brand personality, positioning, visual/copy direction
- `docs/business-os/strategy/<BIZ>/index.user.md` — brand artifact status (what's done vs TBD)
- Any fact-find or plan docs that contain product/funnel/regulatory findings

If any of these is missing, note the gap in the output but proceed with available context. Do not halt on a missing file.

## Output

Save to:

```
docs/business-os/strategy/<BIZ>/naming-research-prompt.md
```

## Prompt structure (mandatory sections)

The output prompt must contain all of the following sections in this order:

### 1. Role and method

Instruct the researcher to:
- Produce a research-grounded framework, not a name list
- Cite sources for all factual claims and competitor/domain/trade mark checks
- Separate clearly: (a) what was checked, (b) what was inferred, (c) what remains unknown without counsel

### 2. Business context

Cover, at minimum:
- Product description (physical, functional, what it does for the user)
- Critical positioning statement (lifestyle accessory vs medical device if applicable; any regulatory framing)
- **EU MDR / regulatory nuance** — if the product is an accessory for a medical device or adjacent to one, encode this explicitly: flag any naming territory that implies medical function, treatment, therapy, or that the product is necessary for the device to work. This is not optional for health-adjacent products.
- ICP (primary and secondary)
- Launch geography (with note on language requirements)
- Price range
- Emotional territory (the brand personality in 5 descriptors)
- Community scale / market size — **label as verify-and-cite, not assumed true**; require the researcher to verify and date figures
- Growth intent beyond the initial product

### 3. Current working name (if any)

State the working name, treat it as a baseline comparator only, and explain its weaknesses. Do not frame it as a constraint.

### 4. Naming criteria

List explicit criteria. Always include:
- Pronunciation and phonetics in primary + launch language(s)
- No medical function implication
- Warm and human tone (not clinical)
- Extensibility beyond current product
- Distinctiveness within the category
- Plausible ownability (domain + trade mark preliminary screen)

**Trade mark scope:** Always require Nice Classification Class 25 (clothing/headwear) and any other clearly relevant class. Require the researcher to use authoritative class headings. Note this is a risk flag, not a legal clearance.

**Distinctiveness spectrum:** Always require assessment against generic → descriptive → suggestive → arbitrary → coined. Descriptive terms are weaker for trade mark purposes and may face EU refusal if they convey characteristics/purpose of the goods.

### 5. Anti-criteria (hard constraints)

Encode the brand-specific hard constraints. Always include at minimum:
- Avoid the manufacturer's brand name if a dominant manufacturer exists in the category (e.g., "Cochlear" for CI; "Philips" for hearing aids)
- Avoid clinical/pharmaceutical framing
- Avoid concealment language if the brand's positioning is normalisation/inclusion
- Avoid generic/unsearchable combinations
- Flag cross-language connotation risks (Italian + Spanish/French/German for EU)

### 6. Competitive naming landscape

List known competitors. Always add:
- **Manufacturer official accessory naming as a separate comparator class** — this establishes the baseline functional naming register and creates potential confusion vectors. Research and include what major manufacturers call their own accessories.
- For each competitor: naming territory, emotional tone, confusion risks

Conclude with a structured crowded-vs-open territory map.

### 7. Research tracks (five standard tracks)

Always include these five tracks:

**Track 1 — Naming convention analysis:** Dominant patterns in the category; crowded vs open territory; evidence-grounded.

**Track 2 — Naming territory exploration:** Five territories (adapt labels to the specific product/market):
- A: Functional/retention language (elevated, non-clinical)
- B: Lifestyle/normalisation (no device reference)
- C: Community identity (warm, insider; flag sensitivity risks)
- D: Sensory/metaphor (relevant to the product's domain; flag medical-function drift risk)
- E: Coined/invented (EN + launch-language friendly phonetics; extensible)

For each territory: 3–5 name directions (illustrative, not final), strategic logic, risks, distinctiveness spectrum placement, expansion fit.

**Track 3 — Launch-market suitability:** Top 10–15 directions assessed for phonetics, unintended meanings, cross-language risk scan (Italian + Spanish/French/German for EU), accessibility to non-English speakers.

**Track 4 — Domain and trade mark risk flags:** For top 10–15 directions:
- Domain: is .com taken; confusion risk level (low/medium/high); observe and date
- Trade marks: obvious conflicts in relevant Nice Classes; EU language descriptiveness risk
- Always separate domain availability from trade mark availability
- Label confidence: checked vs inferred vs unknown

**Track 5 — Expansion headroom:** Which territories support product range expansion; which trap the brand; use any known analogous brand as benchmark.

### 8. Deliverables format

Require the researcher to output:
1. Market sizing verification (verified + cited + dated)
2. Competitive naming map (with crowded/open conclusions; manufacturer class separate)
3. Territory evaluation (all five, with directions, rationale, risks, distinctiveness spectrum)
4. Launch-market suitability notes (top 10–15)
5. Domain and trade mark risk flags (top 10–15; label confidence)
6. Distinctiveness spectrum summary table for shortlisted directions
7. Recommended shortlist (5–8 directions ranked by: differentiation, local accessibility, expansion headroom, ownability)
8. Recommended territory — forced choice with concrete description of what the brand feels like to the target customer finding it in a relevant channel

Require: en-GB language, citations throughout, current date stated, time-sensitive findings (domain status, trade marks) dated.

## Quality gate

- [ ] All eight prompt sections present
- [ ] EU MDR / regulatory nuance encoded (for health-adjacent products)
- [ ] Distinctiveness spectrum instruction present
- [ ] Manufacturer official accessory naming included in competitive landscape
- [ ] Market sizing flagged as verify-and-cite
- [ ] Anti-criteria encode cross-language connotation risk
- [ ] Domain and trade mark confidence levels required from researcher
- [ ] Growth/expansion intent encoded in criteria and Track 5

## Completion message

> "Naming research prompt ready: `docs/business-os/strategy/<BIZ>/naming-research-prompt.md`. Drop into a deep research tool (OpenAI Deep Research or equivalent). All eight sections present; regulatory nuance, distinctiveness spectrum, and manufacturer naming comparators encoded."

## Integration

**Upstream (DISCOVERY-03):** Runs after `/lp-do-discovery-03-option-picking --business <BIZ>` produces a decision record selecting the product option.

**Downstream:** `/lp-do-discovery-05-distribution-planning --business <BIZ>` runs after naming research results are received and the operator has a working name shortlist. DISCOVERY-05 is the next mandatory sub-stage before DISCOVERY GATE.
