---
Type: Deep-Research-Prompt
Stage: MARKET-01
Business-Unit: HBAG
Business-Name: Caryina
Status: Active
Created: 2026-02-23
Updated: 2026-02-23
Owner: Pete
Template-Source: docs/business-os/market-research/_templates/deep-research-competitor-mapping-prompt.md
Output-Path: docs/business-os/market-research/HBAG/market-01-competitor-mapping.user.md
---

# MARKET-01 Deep Research Prompt — Caryina (HBAG) Competitor Mapping

## Context for the research agent

**Business:** Caryina — a premium artisan bag accessories brand based in Positano, Italy.
Targeting fashion-aware women 27–42 who own aspirational handbags (LV/Gucci entry tier and above).

**Primary products at launch (90-day demand test):**
- **H1 — Bag charm:** Birkin-style mini handbag worn on handbag strap as a fashion accessory.
  Structured leather-look body, gold hardware, clip attachment. Target price: €95–€120.
- **H2 — AirPod holder:** Same physical body; sized for AirPods Pro and AirPods 4 with secure clip.
  Target price: €80–€100.

**Primary sales channel for demand test:** Etsy marketplace.

**Positioning hypothesis:** Premium artisan white space between Etsy mid-market (€15–€60) and
accessible luxury (Miu Miu €200+, Coach $95). Italian origin story and craft-quality photography
are the primary differentiators.

**Known competitor anchors (already researched — do NOT just repeat these):**
- Etsy mid-market generic sellers: €15–€60 range, no brand story
- KILLSPENCER: $55 artisan AirPod holder (functional, not fashion-first)
- Coach bag charm: $95 (accessible-luxury anchor)
- Miu Miu mini bag charm: €200–€300
- Loewe / Balenciaga bag charms: €450–€1,990 (ultra-luxury)
- Hermes AirPod case: $930 / Chanel AirPod case: $950 (ultra-luxury H2 ceiling)

**Research gaps this prompt must fill:**
- Which specific Etsy sellers are operating at €70–€150 for bag charms or mini handbag accessories
  with a premium positioning/brand story? (We know the generic mass is €15–60; we need the premium
  outliers who are our direct competition on Etsy)
- Are there any newer entrants (since Q4 2025) in the artisan premium bag charm space at €80–€150?
- What is the review count, sales velocity, and listing quality of the strongest Etsy competitors?
- What photography style, copy framing, and keywords are the top-ranking Etsy sellers using?
- For H2 specifically: are there any fashion-forward AirPod case competitors at €60–€150 on Etsy
  or Instagram beyond KILLSPENCER and the ultra-luxury tier?

---

## Research Objectives

Produce a decision-grade competitor map for Caryina (HBAG) with the specificity needed to inform
listing strategy, photography brief, pricing finalisation, and keyword/SEO choices on Etsy.

---

## Required Output Sections

### Section 1 — Direct Competitor Set (Top 5–10)

For each competitor: name / shop name, platform, product type, price point, estimated monthly
sales or review count (if ascertainable), positioning statement in their own words, and 1–2
evidence links. Flag confidence level per entry (high / medium / low).

Focus on:
- Etsy sellers with ≥50 reviews in the bag charm / mini bag accessory category at €60+ price points
- Any coherent brand (not just an Etsy shop with no story) operating in the artisan premium tier
- Instagram/TikTok native brands selling bag charms via social DM or own site at €80–€150

Do NOT list Miu Miu, Coach, Hermes, Balenciaga, Loewe — we already have these anchors.

### Section 2 — Indirect and Substitute Options

What else is a Caryina customer considering? Include:
- Alternative bag accessory categories at similar price points (e.g., key fobs, leather card holders
  for bag clips, bandeau scarves tied to handle)
- The "do nothing" option and what it looks like (keeping the bare strap — what changes their mind?)
- Gift-giving alternatives at €80–€150 for the secondary ICP (gift buyers)

### Section 3 — Feature and Positioning Comparison Matrix

Build a matrix with these rows (one per direct competitor from Section 1, plus "Caryina hypothesis"):

| Competitor | Price range | Platform | Photography quality | Origin story | Brand coherence | Etsy reviews | Social following |
|---|---|---|---|---|---|---|---|

Rate photography quality, origin story, and brand coherence as: Low / Medium / High.

### Section 4 — Observable Strengths and Weaknesses

For the top 3–5 direct competitors, provide:
- **Strengths:** What are they doing well that Caryina must match or beat?
- **Weaknesses:** Where do they fall short that Caryina can exploit?

Pay particular attention to:
- Photography (does it read as €80+ quality or does it look like Etsy mass-market?)
- Listing copy (do they tell a craft/origin story or just describe the product?)
- Hardware and materials claims (are they specific or vague?)
- Customer review themes (what are buyers complaining about or praising?)

### Section 5 — Open Questions and Confidence Tags

List any claims you could not verify with evidence. Tag each with:
- **Assumption:** claim inferred but not directly evidenced
- **Unverified:** claim plausible but no source found
- **Gap:** information would significantly change the competitor picture but is not publicly available

---

## Scope Constraints

- **Etsy is the primary lens** — this is the demand test channel. All competitors must be assessed
  for Etsy presence and listing quality first.
- **Instagram/TikTok second lens** — especially for any brand that uses social as primary
  discovery and drives to DM purchase or own site.
- **Do NOT include** generic Chinese-sourced dropship sellers with no brand identity — these are not
  direct competitors for €80+ positioning.
- **Do NOT include** ultra-luxury anchors (Hermes, Chanel, Miu Miu etc.) unless they have a
  specific Etsy-equivalent or artisan DTC strategy we haven't documented yet.
- Geography: EU + North America primary (Etsy global). Italian market secondary.
- Time horizon: focus on market as of Q1 2026; note any significant trend changes since mid-2025.

---

## Save Instructions

Save research results to:
```
docs/business-os/market-research/HBAG/market-01-competitor-mapping.user.md
```

Frontmatter required:
```yaml
---
Type: Market-Research
Stage: MARKET-01
Business-Unit: HBAG
Business-Name: Caryina
Status: Draft
Created: <date>
Updated: <date>
Owner: Pete
Prompt-Source: docs/business-os/market-research/HBAG/market-01-competitor-mapping-prompt.md
---
```

After saving, update `docs/business-os/market-research/HBAG/latest.user.md` to point to this
file as the current competitor mapping.
