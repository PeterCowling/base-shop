---
Type: Fact-Find
Status: Archived
Outcome: Three new deliverable types (product naming, logo design, product packaging) need explicit assessment stages in the startup loop. Current ASSESSMENT chain ends brand work at ASSESSMENT-12 (dossier promotion) with no path to these outputs.
Execution-Track: BOS
Deliverable-Type: doc
Feature-Slug: startup-loop-product-identity-gap
Dispatch-ID: IDEA-DISPATCH-20260226-0018
artifact: fact-find
---

# Fact-Find — Startup Loop Product Identity Gap

## 1. Scope

**What this fact-find covers:**
- The current state of naming, brand, and visual identity deliverables in the startup loop ASSESSMENT chain (ASSESSMENT-01 through ASSESSMENT-12)
- Gaps in the chain for three specific deliverables: product naming, logo design, and product packaging design
- Where each new deliverable fits in the existing sequence and what inputs each needs
- The build complexity and skill design for each gap

**What this fact-find does not cover:**
- S1–S10 operating stages (these gaps are pre-launch identity concerns only)
- Packaging for digital/service businesses (physical product profile only)
- Full logo production tooling (e.g., AI generation, Figma integration) — scope is the design brief/specification deliverable, not the production pipeline
- Regulatory compliance detail for packaging (beyond naming the requirement as an input gate)

---

## 2. Evidence Audit

### ASSESSMENT-04 — Candidate Names (`lp-do-assessment-04-candidate-names`)

Source: `/Users/petercowling/base-shop/.claude/skills/lp-do-assessment-04-candidate-names/SKILL.md`

Produces:
- `naming-candidates-<date>.md` — 250 scored brand name candidates
- `naming-rdap-<date>.txt` — RDAP domain availability results for all candidates
- `naming-shortlist-<date>.user.md` — top 20 domain-verified candidates, scored on D/W/P/E/I dimensions
- `naming-shortlist-<date>.user.html` — operator-facing HTML rendering

The name being generated here is the **business/brand name** (the company name). The skill scores against five dimensions: Distinctiveness, Wordmark quality, Phonetics, Expansion headroom, and ICP resonance. "Expansion headroom" is explicitly defined as "works for the brand beyond the initial product." This means business names are deliberately chosen to be category-agnostic, not product-specific.

**Gap noted:** The skill explicitly avoids product-specific names — expansion headroom is penalised if a name is "trapped to a specific product form." Product names are a different register entirely and are not produced here.

Downstream integration note: `lp-do-assessment-04-candidate-names` feeds into ASSESSMENT-06 (distribution profiling) once a name is confirmed. No product naming handoff.

---

### ASSESSMENT-05 — Name Selection Spec (`lp-do-assessment-05-name-selection`)

Source: `/Users/petercowling/base-shop/.claude/skills/lp-do-assessment-05-name-selection/SKILL.md`

Produces:
- `<YYYY-MM-DD>-naming-generation-spec.md` — the structured specification that drives the ASSESSMENT-04 generation agent

Inputs read: problem statement, product/option decision, brand identity dossier, research appendix, readiness doc.

Scope is limited to the naming generation spec for the business name. The I-dimension (ICP resonance) is written specifically to the buyer persona for the business/brand, not to a product.

**Gap noted:** No product naming dimension. The scoring rubric does not have a concept of "product name appropriateness." The skill explicitly generates business names designed to work across the full brand's product range.

---

### ASSESSMENT-10 — Brand Profiling (`lp-do-assessment-10-brand-profiling`)

Source: `/Users/petercowling/base-shop/.claude/skills/lp-do-assessment-10-brand-profiling/SKILL.md`

Produces:
- `<YYYY-MM-DD>-brand-profile.user.md` — confirmed operating name, audience definition, personality pairs, voice and tone

Inputs: ASSESSMENT intake packet, naming shortlist, problem statement, option selection, operator evidence.

Key facts:
- Section A confirms the **business name** (the operating name from the shortlist). No product name field.
- Section B (Audience) covers demographic/psychographic, device, and context. No product name field.
- Section E (Positioning Constraints) captures aesthetic constraints and brand inspirations. Includes imagery prominence, origin claim, and aesthetic constraints. Still no product name field.

**Gap noted:** The brand profile locks in the business/brand identity but makes no mention of product names. Product names are a distinct layer that is not addressed.

---

### ASSESSMENT-11 — Brand Identity (`lp-do-assessment-11-brand-identity`)

Source: `/Users/petercowling/base-shop/.claude/skills/lp-do-assessment-11-brand-identity/SKILL.md`

Produces:
- `<YYYY-MM-DD>-brand-identity-dossier.user.md` — colour palette (light+dark), typography, shape/elevation, imagery direction, token overrides
- `<YYYY-MM-DD>-brand-identity-preview.user.html` — visual HTML rendering

Inputs: brand profile (ASSESSMENT-10), ASSESSMENT intake packet, brand language template, optional theme tokens and existing app UI.

**What it produces in detail:**
- Colour palette: Primary, Accent, Background, plus full dark mode token set (minimum 6 tokens each mode)
- Typography: body font family and heading treatment (Google Fonts or system stacks only)
- Shape and elevation: corner radius, shadow intent
- Imagery direction: 2-4 Do and 2-4 Don't directives

**What it explicitly does NOT produce:**
- A logo, logo mark, wordmark, or logo specification
- A product name or product naming direction
- Packaging design or packaging specification
- Signature patterns (these are deferred: "TBD — patterns emerge through lp-design-spec work")
- Any production-ready files (SVG, print-ready PDF)

The CONFIG object in the HTML preview has a `namingJourney` field (populated from naming shortlist if available) but no product names field and no logo field.

**Gap confirmed:** ASSESSMENT-11 is the most complete brand identity stage and it stops at colour/type/imagery. No logo. No product name. No packaging.

---

### ASSESSMENT-12 — Brand Dossier Promotion (`lp-do-assessment-12-promote`)

Source: `/Users/petercowling/base-shop/.claude/skills/lp-do-assessment-12-promote/SKILL.md`

Produces:
- In-place update to `<YYYY-MM-DD>-brand-identity-dossier.user.md` — changes Status from Draft to Active

Inputs: the existing Draft dossier.

**What it validates:** 10 completeness checks covering frontmatter, audience, personality, colour palette (light+dark), typography, imagery direction, voice and tone, and token overrides. Logo specification is not among the 10 checks. Product name is not among the 10 checks. Packaging is not among the 10 checks.

**Important note:** ASSESSMENT-12 is defined as a skill (`lp-do-assessment-12-promote`) but does NOT appear as a stage in `loop-spec.yaml`. It is a standalone operator-invoked gate. The ASSESSMENT container in loop-spec.yaml contains only ASSESSMENT-10 and ASSESSMENT-11. GATE-ASSESSMENT-01 enforces those two at the ASSESSMENT→MEASURE transition.

**Gap confirmed:** The entire ASSESSMENT→MEASURE chain has no stage for product naming, logo, or packaging. The promotion gate does not include them as completeness requirements.

---

### Loop-Spec ASSESSMENT Container (from `loop-spec.yaml`)

The ASSESSMENT container definition (lines 313–329 of loop-spec.yaml) lists:
```yaml
stages:
  - ASSESSMENT-10
  - ASSESSMENT-11
ordering_constraints:
  - ASSESSMENT-10 → ASSESSMENT-11
  - ASSESSMENT-11 → ASSESSMENT
```

GATE-ASSESSMENT-01 (Hard) at ASSESSMENT→MEASURE-01 enforces:
- `<YYYY-MM-DD>-brand-profile.user.md` exists and meets quality minimum
- `<YYYY-MM-DD>-brand-identity-dossier.user.md` exists and meets quality minimum

Neither gate condition mentions logo, product name, or packaging.

---

### Brand Language Template (`_shared/brand-language-template.md`)

Source: `/Users/petercowling/base-shop/.claude/skills/_shared/brand-language-template.md`

The shared template has sections: Audience, Personality, Visual Identity (Imagery Strategy, Colour Palette, Typography, Shape/Elevation, Imagery Direction), Voice and Tone, Token Overrides, Signature Patterns, App Coverage, References.

**Gap confirmed:** No Logo section. No Product Name section. No Packaging section.

---

### HBAG Brandmark Plan

Source: `docs/plans/hbag-brandmark-particle-animation/` — directory exists but contains only `artifacts/` subdirectory (empty). This is a UI animation plan for an existing brandmark, not a logo design process.

**Conclusion from plan search:** No existing plans in `docs/plans/` address product naming, logo design process, or packaging design process in the startup loop context.

---

## 3. Gap Analysis

### A. Product Naming

**Current state:**
ASSESSMENT-04/05 produce a business/brand name (the company name). The scoring rubric deliberately requires Expansion Headroom (E score) — names scoring high on E are *non-product-specific* and work "for any product in the brand's growth category." This means the business name is explicitly designed to NOT function as a product name.

A product name (e.g. "Aqua Pro 500ml," "Le Sac Classique," "Studio Kit") is a different layer: it describes a specific SKU or product line, often includes functional descriptors, and may need to work within the brand name as a compound ("BrandName ProductName").

**Proposed deliverable:**
A product naming document that covers:
- Product name candidates for the primary SKU(s) confirmed in ASSESSMENT-03
- Naming convention for the product line (if multiple SKUs planned)
- Relationship to business/brand name (standalone name vs. compound "Brand + Product")
- Functional descriptor strategy (does the name describe material, size, function?)
- Trademark/conflict check direction (the name needs a TM pre-screen, not just a domain check)

Unlike business naming, product naming does not require a domain availability check. It does require avoiding registered trademarks in the product category and jurisdiction.

**Proposed ASSESSMENT slot:**
ASSESSMENT-13, positioned after ASSESSMENT-05 (name selection confirmed) and before ASSESSMENT-06 (distribution profiling). Rationale: distribution channel requirements (e.g., Amazon listing conventions, Etsy SEO) influence product naming conventions, so product naming should precede or run alongside ASSESSMENT-06, not after it. The business name must be confirmed (ASSESSMENT-04/05) before product naming begins, because the product name relationship to the brand name is a key design decision.

**Alternative:** Could slot between ASSESSMENT-03 (solution selection) and ASSESSMENT-04 (business naming). Argument: product naming is sometimes done before business naming to understand what the business name needs to support. Counter-argument: in the startup loop, business name drives brand identity which drives product name positioning. The dependency is asymmetric — product naming needs the brand name as an anchor.

**Inputs needed:**
- Confirmed business name (ASSESSMENT-04/05 output)
- Selected product option(s) with physical description (ASSESSMENT-03 output)
- ICP profile including vocabulary and expectations (ASSESSMENT-01/02)
- Distribution channels (ASSESSMENT-06, if run first) — or at minimum channel candidates
- Competitive product names in the category (from ASSESSMENT-02 research)
- Brand personality (ASSESSMENT-10, if run first — or provisional from brand profile)

**Open questions:**
- Does product naming need operator confirmation or is it AI-generated and reviewed? (Likely operator-confirmed like business naming)
- Does it need a domain check equivalent (e.g. trademark search)? (Likely a pre-screen direction, not an automated check at this stage)
- For multi-SKU businesses, does this stage cover naming conventions or individual SKU names? (Likely naming conventions at ASSESSMENT stage, individual SKU names at PRODUCT-01/02)

---

### B. Logo Design

**Current state:**
ASSESSMENT-11 produces a colour palette, typography, shape/elevation, and imagery direction. It does NOT produce a logo or logo specification. The HTML brand preview (`CONFIG.colours`, `CONFIG.fonts`) has no logo field. The brand language template has no logo section. The completeness gate (ASSESSMENT-12's 10 checks) does not include a logo.

There is one reference to "logo" in the ASSESSMENT-04 skill: the W (Wordmark quality) scoring dimension describes names that "work as a stamped logo, Instagram handle, Etsy shop name." This is about whether the name *can become* a wordmark, not about designing one.

**What a logo deliverable looks like in this context:**
At the startup loop ASSESSMENT stage, the operator typically does not yet have a designer or a production toolchain. The appropriate deliverable is a **logo design brief** — a structured specification that:
- States the brand name and confirmed operating name
- Defines the preferred mark type: wordmark only, lettermark, symbol+wordmark, abstract mark
- Specifies colour palette to use (from ASSESSMENT-11 colour tokens)
- Specifies typography to use or consider (from ASSESSMENT-11 typography section)
- Defines forbidden territory: visual styles to avoid, competitor marks to stay clear of
- States use cases: where the logo must work (favicon, Instagram profile, product label, hang tag)
- Provides reference inspirations: 2-3 existing logos in the right register
- Optionally: a rough SVG wordmark if the name and typeface are sufficient to generate one

For AI-generation use cases (Midjourney, Adobe Firefly, Looka), the brief is also the prompt input.

**Should this extend ASSESSMENT-11 or be a new stage?**

Option A: Extend ASSESSMENT-11 as a new Step 7 that produces a logo brief section within the dossier. Advantage: single artifact. Disadvantage: ASSESSMENT-11 is already the most complex skill in the chain (6 steps, multiple tables, dual output files). Adding a logo brief step would overload it and make the skill hard to resume if interrupted.

Option B: New ASSESSMENT-13 stage that reads the brand dossier (ASSESSMENT-11) and the confirmed business name (ASSESSMENT-10) and produces `<YYYY-MM-DD>-logo-brief.user.md`. This is the preferred approach: it is a clean new stage with a clear input (the approved brand dossier) and a clear output (the logo brief). It runs after ASSESSMENT-12 promotes the dossier to Active.

Recommended: ASSESSMENT-13 (Logo Design Brief), positioned after ASSESSMENT-12 (dossier promotion) or after ASSESSMENT-11 if ASSESSMENT-12 is rolled into the gate. The logo brief is a consumer of the approved brand identity, not a prerequisite for it.

**Inputs needed:**
- Confirmed operating name (ASSESSMENT-10)
- Approved brand identity dossier with colour palette and typography (ASSESSMENT-11/12)
- Product name(s) if determined (from proposed ASSESSMENT-13 product naming stage)
- Distribution channels (ASSESSMENT-06) — to know which use cases the logo must support (e.g. product label vs. web only)
- Operator aesthetic preferences not already in brand profile (if not captured at ASSESSMENT-10 Section E)

**Open questions:**
- Does the logo brief include a draft SVG wordmark, or only the written specification? (Could generate a simple wordmark SVG from font+colour+name, but this is optional — brief is the mandatory output)
- Is there a quality gate analogous to ASSESSMENT-12? (Likely yes — operator must confirm the brief is accurate before sending to a designer)
- Should logo brief be part of or separate from the existing brand dossier? (Separate file preferred for clean downstream consumption)

---

### C. Product Packaging Design

**Current state:**
No packaging capability exists anywhere in the startup loop. The `two-layer-model.md` mentions "product specifications" and "SKU catalogue" as Product standing artifacts (PRODUCTS domain, Layer A), but these are about product line management, not packaging design.

The `lp-do-assessment-11-brand-identity` imagery direction section governs *photography style* but not physical surface design. The brand language template has no packaging section.

**What product packaging involves at the startup stage:**
Physical product packaging design at ASSESSMENT stage involves:
1. **Structural requirements** — what format the packaging takes (hang tag, box, sleeve, label, pouch, bag). Determined by the product type (ASSESSMENT-03) and distribution channel (ASSESSMENT-06: retail shelf vs. D2C post vs. market stall).
2. **Label and surface design** — what appears on the packaging surface: brand name, product name, brand mark/logo, regulatory claims (materials, country of origin, care instructions for fashion; ingredients and allergens for food; weight/volume for cosmetics), barcode/EAN (required for retail distribution)
3. **Regulatory requirements** — vary by product category and jurisdiction. Fashion: composition labelling, origin claim, care symbols. Food: nutrition, allergens, lot codes. Cosmetics: INCI list, CPNP notification. At ASSESSMENT stage, the deliverable is a *requirements checklist*, not a compliance audit.
4. **Print-ready specification** — for production: bleed, resolution, colour mode (CMYK not RGB), safe zone, dielines. At ASSESSMENT stage this is a brief/specification, not a production file.
5. **Operator-facing brief** — what to give to a designer or packaging supplier. Includes: structural format, surface design brief, brand assets to use, regulatory field list.

**Where does it fit in the ASSESSMENT sequence?**
Packaging design depends on: product definition (ASSESSMENT-03), distribution channels (ASSESSMENT-06), confirmed business and product names, approved logo/brand mark. It therefore sits after all of the above. Proposed as ASSESSMENT-14 or ASSESSMENT-15 depending on whether product naming (ASSESSMENT-13) and logo (now ASSESSMENT-14) both precede it.

Proposed sequence given three new stages:
- ASSESSMENT-13: Product Naming
- ASSESSMENT-14: Logo Design Brief
- ASSESSMENT-15: Product Packaging Brief

Alternatively, if product naming slots before ASSESSMENT-06 (see Gap A reasoning), the sequence changes slightly — see Section 4 below.

**Inputs needed:**
- Selected product form and physical description (ASSESSMENT-03)
- Distribution channels including retail channel if applicable (ASSESSMENT-06)
- Confirmed business name (ASSESSMENT-10) and product name (ASSESSMENT-13)
- Approved brand identity dossier — colour, typography (ASSESSMENT-11/12)
- Approved logo brief (ASSESSMENT-14)
- ICP context for shelf/unboxing appeal (ASSESSMENT-01/02)
- Regulatory category (inferred from product type at ASSESSMENT-03)

**Open questions:**
- For digital/service businesses, should packaging be skipped entirely? (Yes — this stage should be conditional on `physical-product` profile flag, matching the LOGISTICS domain conditionality pattern already established in `two-layer-model.md`)
- Does packaging at ASSESSMENT stage require an operator Q&A or is it generated from existing docs? (Mixed: structural format and regulatory fields are largely deterministic from product type; surface brief requires operator aesthetic input for photography/illustration style)
- Is EAN/barcode registration direction in scope? (At minimum, the brief should note whether a barcode is required and direct the operator to GS1 registration; actual registration is outside the loop's scope)
- Should the packaging brief produce any visual output (mood board, layout sketch)? (Optional HTML preview analogous to the brand identity preview is desirable but not required at MVP)

---

## 4. Sequence Map

### Current ASSESSMENT sequence (confirmed from loop-spec.yaml)

```
ASSESSMENT-01  Problem framing              /lp-do-assessment-01-problem-statement
ASSESSMENT-02  Solution profiling           /lp-do-assessment-02-solution-profiling
ASSESSMENT-03  Solution selection           /lp-do-assessment-03-solution-selection
ASSESSMENT-04  Candidate names (business)   /lp-do-assessment-04-candidate-names
ASSESSMENT-05  Name shaping spec            /lp-do-assessment-05-name-selection  [optional within loop]
ASSESSMENT-06  Distribution profiling       /lp-do-assessment-06-distribution-profiling
ASSESSMENT-07  Measurement profiling        /lp-do-assessment-07-measurement-profiling
ASSESSMENT-08  Current situation            /lp-do-assessment-08-current-situation
ASSESSMENT-09  Intake                       /startup-loop start  [gate: GATE-ASSESSMENT-00]
ASSESSMENT-10  Brand profiling              /lp-do-assessment-10-brand-profiling
ASSESSMENT-11  Brand identity               /lp-do-assessment-11-brand-identity
(ASSESSMENT-12  Dossier promotion           /lp-do-assessment-12-promote  [skill only, not in loop-spec])
→ GATE-ASSESSMENT-01 → MEASURE entry
```

### Proposed ASSESSMENT sequence with new stages

```
ASSESSMENT-01  Problem framing
ASSESSMENT-02  Solution profiling
ASSESSMENT-03  Solution selection
ASSESSMENT-04  Candidate names (business)
ASSESSMENT-05  Name shaping spec            [optional within loop]
ASSESSMENT-06  Distribution profiling
ASSESSMENT-07  Measurement profiling
ASSESSMENT-08  Current situation
ASSESSMENT-09  Intake                       [gate: GATE-ASSESSMENT-00]
ASSESSMENT-10  Brand profiling
ASSESSMENT-11  Brand identity
               (ASSESSMENT-12 dossier promotion — skill only, not changed)
[NEW] ASSESSMENT-13  Product naming         New skill: /lp-do-assessment-13-product-naming
[NEW] ASSESSMENT-14  Logo design brief      New skill: /lp-do-assessment-14-logo-brief
[NEW] ASSESSMENT-15  Packaging brief        New skill: /lp-do-assessment-15-packaging-brief [conditional: physical-product]
→ Revised GATE-ASSESSMENT-01 → MEASURE entry
```

**Dependency reasoning for ordering:**
- ASSESSMENT-13 (product naming) needs: confirmed business name (ASSESSMENT-04/05), product definition (ASSESSMENT-03), and ideally distribution channels (ASSESSMENT-06) for naming convention guidance. Running it after ASSESSMENT-11 (brand profiling complete) gives it the brand personality context needed for naming tone alignment. It must precede logo (ASSESSMENT-14) because logo brief may reference the product name for secondary wordmark treatment.
- ASSESSMENT-14 (logo brief) needs: approved brand identity (ASSESSMENT-11/12) and product name(s) (ASSESSMENT-13). It is the natural first consumer of the complete brand identity dossier and produces the design specification that feeds packaging (ASSESSMENT-15).
- ASSESSMENT-15 (packaging brief) is last because it needs everything: product definition, distribution channels, confirmed names, approved brand identity, and logo brief. It is also conditional on `physical-product` profile flag — digital/service businesses skip it.

**GATE-ASSESSMENT-01 revision:**
The gate currently enforces ASSESSMENT-10 and ASSESSMENT-11 outputs only. After new stages are added, the gate should be updated to require:
- ASSESSMENT-13 output: product naming document (for all profiles where a product name applies)
- ASSESSMENT-14 output: logo brief (for all profiles)
- ASSESSMENT-15 output: packaging brief (conditional on `physical-product` profile flag)

The promotion skill (ASSESSMENT-12) would also need its 10-check list extended to include logo brief completion and optionally product naming.

---

## 5. Confidence Inputs

### A. Product Naming

| Dimension | Score | Reasoning |
|-----------|-------|-----------|
| Evidence quality | High | The gap is clear and explicitly evidenced: ASSESSMENT-04/05 scoring rubric rewards *non-product-specific* names; no skill in the chain produces a product name |
| Build complexity | Low-Medium | Product naming follows a similar pattern to ASSESSMENT-04/05 but without the RDAP pipeline. The key new component is TM pre-screen direction and naming convention framework. No new infrastructure required. |
| Dependencies | Clear | Needs ASSESSMENT-03 (product definition), ASSESSMENT-04/05 (business name confirmed), ASSESSMENT-10 (brand personality). All three exist. |
| Overall confidence | High (85%) | The gap is real, the slot is clear, the build pattern exists (adapt from ASSESSMENT-05). Main open question is how many operator Q&A rounds are needed. |

### B. Logo Design Brief

| Dimension | Score | Reasoning |
|-----------|-------|-----------|
| Evidence quality | High | ASSESSMENT-11 explicitly does not produce a logo or logo spec. The W scoring dimension in ASSESSMENT-04 acknowledges a wordmark will exist but makes no provision for designing it. No logo section in brand language template. |
| Build complexity | Medium | Logo design brief is a structured document with no automated components (unlike RDAP checking in naming). However, the skill needs to synthesise brand dossier inputs into a crisp design brief format — this is high-quality writing work, not infrastructure work. |
| Dependencies | Clear | Needs ASSESSMENT-11 (approved colour/type palette), ASSESSMENT-10 (confirmed name), ASSESSMENT-13 (product name for context). All straightforward. |
| Overall confidence | High (82%) | Gap is confirmed. Slot is after ASSESSMENT-11/12. Key open question is whether to include an optional draft SVG wordmark — this should be decided at planning stage. |

### C. Product Packaging Brief

| Dimension | Score | Reasoning |
|-----------|-------|-----------|
| Evidence quality | High | No packaging capability anywhere in the loop. Confirmed by skills audit, loop-spec review, and plan directory search. |
| Build complexity | Medium-High | Packaging is the most complex of the three because: (1) it is conditional on product profile, (2) it requires a regulatory requirements framework that varies by product category, (3) it has more operator Q&A components than the other two stages. The regulatory dimension alone requires a reference table covering fashion, food, cosmetics, and homeware categories at minimum. |
| Dependencies | Clear but numerous | Needs ASSESSMENT-03, ASSESSMENT-06, ASSESSMENT-10/11, ASSESSMENT-13, ASSESSMENT-14. This makes it the most downstream stage. |
| Overall confidence | Medium-High (75%) | Gap is confirmed and slot is clear. Lower confidence than the other two gaps because: (1) regulatory requirements by category need to be researched at planning/build time, (2) the conditional logic (physical-product flag) mirrors an existing pattern (LOGISTICS) but that pattern has not yet been fully implemented in loop-spec; (3) structural format options need a defined taxonomy. |

---

## 6. Planning Readiness

**Ready to plan: Yes.**

All three gaps are confirmed by evidence. The ASSESSMENT sequence position is clear. The dependencies are understood. No blocking ambiguities.

**Proposed planning tasks:**

1. **Design ASSESSMENT-13 skill (`lp-do-assessment-13-product-naming`)** — Define the skill structure, output artifact schema (`<YYYY-MM-DD>-product-naming.user.md`), operator elicitation flow, and TM pre-screen direction. Adapt the ASSESSMENT-05 spec-writing pattern but simplify (no RDAP pipeline, no 250-candidate generation). Estimate: Medium complexity, 1 build task.

2. **Design ASSESSMENT-14 skill (`lp-do-assessment-14-logo-brief`)** — Define the skill structure, output artifact schema (`<YYYY-MM-DD>-logo-brief.user.md`), section structure (mark type, colour spec, typography spec, use case list, forbidden territory, reference inspirations, optional SVG wordmark). Estimate: Low-Medium complexity, 1 build task.

3. **Design ASSESSMENT-15 skill (`lp-do-assessment-15-packaging-brief`)** — Define the skill structure, output artifact schema (`<YYYY-MM-DD>-packaging-brief.user.md`), regulatory requirements framework by product category, conditional profile flag logic. Estimate: Medium-High complexity, 1-2 build tasks (may benefit from a separate regulatory reference data file).

4. **Update loop-spec.yaml** — Add ASSESSMENT-13, ASSESSMENT-14, ASSESSMENT-15 to the ASSESSMENT container. Update ordering constraints. Update GATE-ASSESSMENT-01 conditions to include the new required outputs. Mark ASSESSMENT-15 as conditional on `physical-product` profile flag. Estimate: Low complexity, 1 build task.

5. **Update brand language template** — Add a Logo section (brief structure reference) and a Packaging section stub. These are consumed by the new skills and by `/lp-design-spec` downstream. Estimate: Low complexity, 1 build task.

6. **Update ASSESSMENT-12 dossier promotion checks** — Add checks for logo brief (ASSESSMENT-14 output, mandatory) and packaging brief (ASSESSMENT-15 output, conditional). Estimate: Low complexity, part of task 4 or standalone.

7. **Update artifact-registry.md** — Register the three new artifact types (`product-naming`, `logo-brief`, `packaging-brief`) with canonical paths, producers, consumers, and version markers. Estimate: Low complexity, 1 build task.

**Suggested parallelism:** Tasks 1, 2, and 3 (skill design) can run in parallel — they are independent of each other and only converge at task 4 (loop-spec update). Tasks 5 and 7 can also run in parallel with 1-3. Task 4 and 6 are sequential (depend on 1-3 designs being agreed).

**Risks:**
- Regulatory requirements taxonomy (task 3) is the highest-risk element. If the first target business is fashion/leather goods, the requirements are well-understood. For food or cosmetics, the complexity increases substantially. Recommend scoping the first version to fashion/leather goods with a placeholder framework for other categories.
- ASSESSMENT-12 currently exists only as a skill, not a loop-spec stage. If tasks 4 and 6 are done together, a decision is needed about whether to add ASSESSMENT-12 formally to loop-spec or continue treating it as an operator-invoked standalone skill.
