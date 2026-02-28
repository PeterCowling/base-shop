---
Type: Build-Record
Status: Complete
Feature-Slug: startup-loop-product-identity-gap
Completed-date: 2026-02-26
artifact: build-record
---

# Build Record: Startup Loop Product Identity Gap

## Outcome Contract

- **Why:** The startup loop produced a business name and brand visual identity but stopped short of the product-level identity deliverables operators need to brief a designer, create product labels, or prepare packaging for retail. This left a practical gap between ASSESSMENT completion and being ready to manufacture and sell.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After this plan is built, the startup loop ASSESSMENT chain has three new stages that produce a product naming document, a logo design brief, and a product packaging brief. Operators running a physical product business reach MEASURE entry with the full set of identity deliverables needed to commission a designer and prepare for production.
- **Source:** operator

## What Was Built

**Wave 1a — TASK-04 (Regulatory Reference Data):** Created `.claude/skills/lp-do-assessment-15-packaging-brief/regulatory-requirements.md`. This 4-category reference file covers EU-primary regulatory requirements for fashion/leather goods (EU Textile Regulation 1007/2011, ISO 3758 care symbols), homeware/ceramics (EU Ceramics Directive 84/500/EEC), cosmetics/skincare (EU Cosmetics Regulation 1223/2009, CPNP), and food/beverage (EU Food Information Regulation 1169/2011). Each category includes mandatory label fields, jurisdiction notes (UK/US divergence), structural packaging recommendations, and specific regulation references. A multi-category edge-case section and out-of-scope category list (medical devices, pharmaceuticals, electrical goods, toys) are included.

**Wave 1b — TASK-01 (ASSESSMENT-13 Product Naming Skill):** Created `.claude/skills/lp-do-assessment-13-product-naming/SKILL.md`. WRITE-FIRST ELICIT mode, following the ASSESSMENT-10 pattern. The skill reads brand strategy and product option selection, produces 3–5 product name candidates (at least 1 compound, 1 non-compound), provides TM pre-screen direction with jurisdiction-specific links and Nice Classification guidance, and captures a naming convention for future SKUs. ASSESSMENT-03 gate prevents execution before product selection is confirmed.

**Wave 1b — TASK-02 (ASSESSMENT-14 Logo Brief Skill):** Created `.claude/skills/lp-do-assessment-14-logo-brief/SKILL.md`. EXECUTE mode, synthesising brand identity dossier, brand profile, and product naming into a 7-section designer-ready brief. Mark type is derived from brand personality using a decision table (wordmark vs symbol+wordmark for early-stage brands). Colour Specification maps directly from brand dossier token names. Use Case List is derived from distribution channels. ASSESSMENT-13 gate prevents execution before product naming is confirmed.

**Wave 1b — TASK-05 (Brand Language Template):** Added `## Logo Brief` and `## Packaging Brief` sections to `.claude/skills/_shared/brand-language-template.md` after the existing `## App Coverage` section. Both sections use stub fields with TBD placeholders consistent with the template style, and include usage notes pointing to the full artifact paths. Change is additive only — zero modifications to existing sections.

**Wave 1c — TASK-03 (ASSESSMENT-15 Packaging Brief Skill):** Created `.claude/skills/lp-do-assessment-15-packaging-brief/SKILL.md`. MIXED mode (deterministic derivation + targeted operator elicitation). Conditionality gate halts cleanly for non-physical-product businesses. Structural format is derived from a product-type-to-packaging mapping table. Regulatory requirements are read from the external reference data file — not embedded inline. Three targeted questions elicit surface design preferences. EAN barcode requirement is derived from distribution channels.

**Wave 2 — TASK-06 (loop-spec.yaml):** Updated `docs/business-os/startup-loop/loop-spec.yaml` from spec_version 3.13.0 to 3.14.0. ASSESSMENT container stages extended to `[ASSESSMENT-10, ASSESSMENT-11, ASSESSMENT-13, ASSESSMENT-14, ASSESSMENT-15]`. Ordering constraint chain updated: `ASSESSMENT-11 → ASSESSMENT-13 → ASSESSMENT-14 → ASSESSMENT-15 → ASSESSMENT` (previous `ASSESSMENT-11 → ASSESSMENT` final constraint replaced). Three new stage entries added. GATE-ASSESSMENT-01 comment block updated to include all new required outputs with explicit conditionality note for ASSESSMENT-15 and explicit note that ASSESSMENT-12 (dossier promotion, skill-only) is not enforced by the gate.

**Wave 3 — TASK-07 (artifact-registry.md):** Added three new rows to the Core Artifact Registry table: `product-naming`, `logo-brief`, `packaging-brief`. All three follow the dated-artifact path namespace rule. The `packaging-brief` row includes explicit absent-file safety note for non-physical businesses. Updated the `Last-updated` frontmatter and extended the Producer/Consumer Dependency Graph comment to show the full ASSESSMENT-10 → 11 → 13 → 14 → 15 chain.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `python3 -c "import yaml; yaml.safe_load(open('docs/business-os/startup-loop/loop-spec.yaml'))"` | Pass | YAML validates cleanly after TASK-06 edits |
| `git diff .claude/skills/_shared/brand-language-template.md` | Pass (additive only) | TASK-05 VC-02: zero modifications to existing sections confirmed |
| Grep for ASSESSMENT-13/14/15 in loop-spec.yaml | Pass | All three stage IDs present with correct structure |
| Grep for ASSESSMENT-15 → ASSESSMENT in ordering_constraints | Pass | Final constraint updated correctly |
| Grep for product-naming/logo-brief/packaging-brief in artifact-registry.md | Pass | All three new artifact rows present |
| Section checks for all SKILL.md files | Pass | All required sections present in ASSESSMENT-13/14/15 SKILL.md files |
| Regulatory reference data category coverage check | Pass | Each of 4 categories has ≥11 mandatory label fields; specific regulation citations present |

## Validation Evidence

### TASK-04
- VC-01: Category coverage — all 4 categories have ≥11 mandatory label fields (Category 1: 12, Category 2: 13, Category 3: 11, Category 4: 15)
- VC-02: Regulation citations — EU Textile Regulation 1007/2011, EU Ceramics Directive 84/500/EEC, EU Cosmetics Regulation 1223/2009 (+ CPNP), EU Food Information Regulation 1169/2011, ISO 3758, Italian Law 166/2009, GS1 — all present with specific article/number references

### TASK-01
- VC-01: Product naming sections — all required sections present (Operating Mode, Required Inputs, Steps, Output Contract, Quality Gate, Completion Message, Integration)
- VC-02: Integration chain — ASSESSMENT-11 upstream and ASSESSMENT-14 downstream correctly referenced

### TASK-02
- VC-01: Logo brief sections — all 7 required output sections present (Mark Type, Colour Specification, Typography Specification, Use Case List, Forbidden Territory, Reference Inspirations, Optional Wordmark Note)
- VC-02: Colour reference accuracy — Colour Specification explicitly maps token names from brand identity dossier (`--color-primary`, `--color-accent`) — not invented colours

### TASK-05
- VC-01: Template completeness — both `## Logo Brief` and `## Packaging Brief` sections present with all required stub fields
- VC-02: Existing sections unchanged — git diff is additive only; zero modifications to sections before `## App Coverage`

### TASK-03
- VC-01: Conditionality gate — skip message for non-physical-product business present; skill halts without creating output artifact
- VC-02: Regulatory checklist completeness — skill reads from external reference data file; Quality Gate requires ≥3 items sourced from reference data with regulation references present

### TASK-06
- VC-01: YAML validity — `python3 yaml.safe_load` exits 0
- VC-02: New stage entries — ASSESSMENT-13, ASSESSMENT-14, ASSESSMENT-15 all present as `id:` entries
- VC-03: Ordering constraints — `ASSESSMENT-15 → ASSESSMENT` present; `ASSESSMENT-11 → ASSESSMENT` (old final constraint) occurrence count = 0 (replaced by `ASSESSMENT-11 → ASSESSMENT-13`)

### TASK-07
- VC-01: New artifact rows — `product-naming`, `logo-brief`, `packaging-brief` all present in Core Artifact Registry table
- VC-02: Canonical paths follow dated-artifact namespace rule — all 3 paths use `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-<artifact>.user.md` pattern

## Scope Deviations

None. All 7 tasks executed within planned scope. No controlled scope expansions required.
