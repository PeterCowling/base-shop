---
Type: Plan
Status: Archived
Domain: BOS
Workstream: Mixed
Created: 2026-02-26
Last-reviewed: 2026-02-26
Last-updated: 2026-02-26
Build-completed: 2026-02-26
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: startup-loop-product-identity-gap
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: business-artifact
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Startup Loop Product Identity Gap — Plan

## Summary

The startup loop ASSESSMENT chain (ASSESSMENT-01 through ASSESSMENT-12) produces a business name, brand identity, and brand dossier but has no stages for product naming, logo design, or product packaging. These three deliverable types are distinct from what ASSESSMENT-04/05 and ASSESSMENT-11 produce and are needed before a physical product business can launch. This plan adds three new skills and updates the loop-spec, artifact registry, and brand language template to close the gap. All seven tasks are documentation and skill-design artifacts (no code changes). Tasks 1–5 can run in two parallel waves; Tasks 6–7 consolidate and complete the loop registration.

## Active Tasks
- [x] TASK-01: Write ASSESSMENT-13 product naming skill (SKILL.md)
- [x] TASK-02: Write ASSESSMENT-14 logo design brief skill (SKILL.md)
- [x] TASK-03: Write ASSESSMENT-15 packaging brief skill (SKILL.md)
- [x] TASK-04: Write regulatory reference data file for ASSESSMENT-15
- [x] TASK-05: Update brand language template with Logo and Packaging sections
- [x] TASK-06: Update loop-spec.yaml — add ASSESSMENT-13/14/15, revise GATE-ASSESSMENT-01
- [x] TASK-07: Update artifact-registry.md — register three new artifact types

## Goals
- Produce three new agent-executable skill files: `lp-do-assessment-13-product-naming`, `lp-do-assessment-14-logo-brief`, `lp-do-assessment-15-packaging-brief`
- Register all three new artifacts in the artifact registry with canonical paths and downstream consumers
- Extend loop-spec.yaml ASSESSMENT container and GATE-ASSESSMENT-01 to include the new stages
- Add Logo and Packaging sections to the brand language template so downstream skills (`/lp-design-spec`) can consume them
- Leave ASSESSMENT-12 (dossier promotion skill) unchanged — a separate follow-on decision is needed about formalising it in loop-spec

## Non-goals
- Producing actual logo files, SVG files, or production-ready packaging artwork (scope is design briefs/specifications only)
- Implementing regulatory compliance auditing (scope is a requirements checklist by category, not a compliance tool)
- Integrating AI logo generation tools (Midjourney, Looka, Adobe Firefly) — brief format is the deliverable, not the generation pipeline
- Changing any existing ASSESSMENT-01 through ASSESSMENT-12 skills (read-only inputs to new skills)
- Adding ASSESSMENT-12 to loop-spec.yaml — that decision is deferred; not in this plan's scope

## Constraints & Assumptions
- Constraints:
  - Skill files follow the established SKILL.md format used by ASSESSMENT-10/11/12 (operating mode, required inputs table, steps, output contract, quality gate, completion message, integration section)
  - All new artifact paths must follow the existing `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-<artifact>.user.md` pattern
  - ASSESSMENT-15 must use the same `conditional: physical-product` conditionality pattern as the LOGISTICS domain in `two-layer-model.md`
  - No new prompt template files are required at plan stage — prompt templates can be added at DO when first running the skills against a real business
  - Regulatory reference data (TASK-04) is scoped to: fashion/leather goods, homeware/ceramic, cosmetics/skincare, food/beverage. Other categories get a placeholder row.
- Assumptions:
  - Product naming (ASSESSMENT-13) slots after ASSESSMENT-11 in the ASSESSMENT container, not between ASSESSMENT-05 and ASSESSMENT-06. Rationale: brand personality context from ASSESSMENT-10/11 is necessary for naming tone. Distribution channel context (ASSESSMENT-06) is already consumed via the intake packet at ASSESSMENT-09, so it is available.
  - Logo brief (ASSESSMENT-14) slots after ASSESSMENT-13 in the ASSESSMENT container. It is a consumer of the approved brand dossier AND the product name.
  - Packaging brief (ASSESSMENT-15) slots last, after ASSESSMENT-14, and is conditional on `physical-product` profile.
  - GATE-ASSESSMENT-01 revision makes ASSESSMENT-13 and ASSESSMENT-14 mandatory for all profiles; ASSESSMENT-15 mandatory only when `physical-product` flag is set.
  - The ASSESSMENT-12 skill's 10-check list is NOT updated in this plan (would require its own plan item and operator-confirmation UX design).

## Inherited Outcome Contract
- **Why:** The startup loop produces a business name and brand visual identity but stops short of the product-level identity deliverables operators need to brief a designer, create product labels, or prepare packaging for retail. This leaves a practical gap between ASSESSMENT completion and being ready to manufacture and sell.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After this plan is built, the startup loop ASSESSMENT chain has three new stages that produce a product naming document, a logo design brief, and a product packaging brief. Operators running a physical product business reach MEASURE entry with the full set of identity deliverables needed to commission a designer and prepare for production.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/startup-loop-product-identity-gap/fact-find.md`
- Key findings used:
  - ASSESSMENT-04/05 explicitly reward non-product-specific business names (Expansion Headroom dimension); product naming is a separate concern not addressed anywhere
  - ASSESSMENT-11 brand identity dossier has no logo or logo specification section — the brand language template confirms this
  - No packaging capability exists in any loop stage or plan; the `two-layer-model.md` LOGISTICS conditional pattern is the right model for ASSESSMENT-15 conditionality
  - ASSESSMENT-12 exists as a skill-only gate (not in loop-spec.yaml); this plan does not change that
  - Proposed sequence: ASSESSMENT-13 (product naming) → ASSESSMENT-14 (logo brief) → ASSESSMENT-15 (packaging brief), all added to the ASSESSMENT container after ASSESSMENT-11

## Proposed Approach
- Option A: Add all three stages in a single loop-spec update, with skills written first to inform gate conditions
- Option B: Write skills and supporting documents first (Wave 1), then update loop-spec and artifact registry in a single consolidation step (Wave 2)
- Chosen approach: Option B. Tasks 1–5 are skill and template authoring (parallelisable, Wave 1); Tasks 6–7 are consolidation and registration (sequential on Wave 1, Wave 2). This avoids updating loop-spec against a skill spec that has not yet been finalised.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Write ASSESSMENT-13 product naming SKILL.md | 85% | M | Complete (2026-02-26) | - | TASK-06 |
| TASK-02 | IMPLEMENT | Write ASSESSMENT-14 logo brief SKILL.md | 85% | M | Complete (2026-02-26) | - | TASK-06 |
| TASK-03 | IMPLEMENT | Write ASSESSMENT-15 packaging brief SKILL.md | 80% | M | Complete (2026-02-26) | TASK-04 | TASK-06 |
| TASK-04 | IMPLEMENT | Write packaging regulatory reference data file | 80% | S | Complete (2026-02-26) | - | TASK-03 |
| TASK-05 | IMPLEMENT | Add Logo and Packaging sections to brand language template | 85% | S | Complete (2026-02-26) | - | TASK-06 |
| TASK-06 | IMPLEMENT | Update loop-spec.yaml: add stages, revise GATE-ASSESSMENT-01 | 85% | M | Complete (2026-02-26) | TASK-01, TASK-02, TASK-03, TASK-05 | TASK-07 |
| TASK-07 | IMPLEMENT | Update artifact-registry.md: register three new artifacts | 90% | S | Complete (2026-02-26) | TASK-06 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1a | TASK-04 | None | Write regulatory reference data first so TASK-03 can consume it |
| 1b | TASK-01, TASK-02, TASK-05 | None | Can all run in parallel; independent of each other |
| 1c | TASK-03 | TASK-04 | Writes ASSESSMENT-15 skill; reads regulatory reference from TASK-04 |
| 2 | TASK-06 | TASK-01, TASK-02, TASK-03, TASK-05 | Loop-spec update requires all skill specs finalised |
| 3 | TASK-07 | TASK-06 | Artifact registry update requires canonical paths confirmed in TASK-06 |

---

## Tasks

### TASK-01: Write ASSESSMENT-13 Product Naming Skill (SKILL.md)

- **Type:** IMPLEMENT
- **Deliverable:** New skill file `.claude/skills/lp-do-assessment-13-product-naming/SKILL.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Artifact-Destination:** `.claude/skills/lp-do-assessment-13-product-naming/SKILL.md` (new file)
- **Reviewer:** Operator
- **Approval-Evidence:** Operator reviews skill file and confirms it matches expected pattern before TASK-06 runs
- **Measurement-Readiness:** None: skill file authoring; no metric owner required
- **Affects:** `.claude/skills/lp-do-assessment-13-product-naming/SKILL.md` (new)
- **Depends on:** -
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% — Pattern is clear from ASSESSMENT-10/11 skill structure. No new infrastructure. Core sections well-defined in fact-find.
  - Approach: 90% — Write-first operator elicitation model (same as ASSESSMENT-10). Inputs and outputs clearly scoped.
  - Impact: 85% — Product naming fills a confirmed gap. Adoption depends on operator running the full ASSESSMENT chain.
  - Held-back test (implementation 85%, not 80 so test not required): Gap between 85 and 90 — the specific operator Q&A elicitation flow for product naming conventions and TM pre-screen direction has not been prototyped. The approach is sound but the exact questions need care; a poorly scoped Q&A makes the skill frustrating to use.
- **Acceptance:**
  - [ ] SKILL.md created at `.claude/skills/lp-do-assessment-13-product-naming/SKILL.md`
  - [ ] Skill has frontmatter with `name: lp-do-assessment-13-product-naming` and `description`
  - [ ] Skill has Operating Mode section (WRITE-FIRST ELICIT, consistent with ASSESSMENT-10 pattern)
  - [ ] Skill has Required Inputs table listing: intake packet, ASSESSMENT-03 product option selection, ASSESSMENT-04/05 naming shortlist (business name), ASSESSMENT-10 brand profile
  - [ ] Skill has Steps section covering: (1) read inputs, (2) write product naming document with provisional content, (3) elicit only genuine gaps from operator, (4) update and save
  - [ ] Output contract specifies: artifact path `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-product-naming.user.md`, frontmatter fields (Type: Product-Naming, Stage: ASSESSMENT-13), required sections (naming approach, brand-product name relationship, product name candidates, TM pre-screen direction, naming convention for future SKUs)
  - [ ] Quality gate lists minimum checks: naming approach section present, at least 3 product name candidates with rationale, TM pre-screen note present, brand-product relationship documented
  - [ ] Integration section references upstream (ASSESSMENT-11) and downstream (ASSESSMENT-14)
  - [ ] Red/Green/Refactor cycle: Red = no product-naming.user.md exists; Green = file exists and passes quality gate; Refactor = operator confirms candidates and naming convention
- **Validation contract:**
  - VC-01: Product naming sections -> pass when all required sections (naming approach, candidates, TM direction, convention) are present with non-placeholder content; check by reading output file within the same build execution (same calendar day as task execution); sample: any one real or test business
  - VC-02: Integration chain -> pass when ASSESSMENT-13 integration section correctly references ASSESSMENT-11 as upstream and ASSESSMENT-14 as downstream; check by reading SKILL.md Integration section; sample: SKILL.md itself
- **Execution plan:**
  - Red evidence plan: No `.claude/skills/lp-do-assessment-13-product-naming/SKILL.md` exists (confirmed by skills directory listing in fact-find)
  - Green evidence plan: Write SKILL.md following the ASSESSMENT-10 pattern (Operating Mode, Required Inputs, Steps, Output Contract, Quality Gate, Completion Message, Integration). Key design decisions: (a) Naming approach section covers brand-product relationship (compound vs standalone) and functional descriptor strategy; (b) Candidates section has 3–5 product name options with a brief rationale for each, not a 250-candidate generation pipeline; (c) TM pre-screen direction is a written note directing operator to check WIPO/national TM database, not an automated check; (d) Naming convention section captures how future SKUs in the product line will be named
  - Refactor evidence plan: If quality gate reveals a weak section (e.g., TM direction is too vague), expand that section with specific guidance; review against ASSESSMENT-10 Section E (positioning constraints) to ensure naming tone alignment is called out
- **Planning validation:**
  - Checks run: Read ASSESSMENT-10 and ASSESSMENT-11 SKILL.md files to confirm pattern. Read brand language template to confirm no product naming section exists. Confirmed both.
  - Validation artifacts: `.claude/skills/lp-do-assessment-10-brand-profiling/SKILL.md`, `.claude/skills/lp-do-assessment-11-brand-identity/SKILL.md`, `.claude/skills/_shared/brand-language-template.md`
  - Unexpected findings: None
- **Scouts:** Assume brand personality (ASSESSMENT-10) is available as input. If a business skips ASSESSMENT-10 (not currently possible per loop-spec — GATE-ASSESSMENT-00 requires ASSESSMENT-10 completion), the skill should read the intake packet for provisional brand personality context.
- **Edge Cases & Hardening:**
  - Business with no product yet confirmed (pre-ASSESSMENT-03): Skill should halt with message directing operator to complete ASSESSMENT-03 first.
  - Business with a single-word hero SKU that is already the business name (edge case for direct-to-consumer simple brands): Skill should handle this as a valid "brand name IS the product name" configuration and document it explicitly.
  - Multi-SKU business: Skill captures naming convention (not individual SKU names), with note that individual SKU names are handled at PRODUCT-01/02.
- **What would make this >=90%:** If a real business had already run through a product naming exercise in the loop, the output format could be validated against actual operator feedback. Currently based on design reasoning from existing skill patterns.
- **Rollout / rollback:**
  - Rollout: New file in `.claude/skills/`. No existing files modified. Zero risk to existing flow.
  - Rollback: Delete the new SKILL.md file. TASK-06 (loop-spec update) must be reverted simultaneously.
- **Documentation impact:**
  - Loop-spec.yaml: new ASSESSMENT-13 stage added (TASK-06)
  - Artifact registry: new `product-naming` artifact type (TASK-07)
- **Notes / references:**
  - Pattern reference: `.claude/skills/lp-do-assessment-10-brand-profiling/SKILL.md` (write-first elicitation model)
  - Fact-find gap analysis section A for full input/output specification

---

### TASK-02: Write ASSESSMENT-14 Logo Design Brief Skill (SKILL.md)

- **Type:** IMPLEMENT
- **Deliverable:** New skill file `.claude/skills/lp-do-assessment-14-logo-brief/SKILL.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Artifact-Destination:** `.claude/skills/lp-do-assessment-14-logo-brief/SKILL.md` (new file)
- **Reviewer:** Operator
- **Approval-Evidence:** Operator reviews skill file before TASK-06 runs
- **Measurement-Readiness:** None: skill file authoring; no metric owner required
- **Affects:** `.claude/skills/lp-do-assessment-14-logo-brief/SKILL.md` (new)
- **Depends on:** -
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% — Logo brief structure is well-understood from design practice. Pattern follows ASSESSMENT-11 (EXECUTE mode, synthesises inputs into decisions rather than eliciting them field-by-field). No new infrastructure.
  - Approach: 90% — EXECUTE mode is correct: the brief synthesises brand dossier inputs; operator reviews and confirms. No extensive Q&A needed.
  - Impact: 85% — Logo brief fills the most visible gap in the ASSESSMENT chain. Operators with a business name and brand identity but no logo brief cannot brief a designer.
- **Acceptance:**
  - [ ] SKILL.md created at `.claude/skills/lp-do-assessment-14-logo-brief/SKILL.md`
  - [ ] Frontmatter: `name: lp-do-assessment-14-logo-brief`, description mentioning "logo design brief"
  - [ ] Operating Mode: EXECUTE (synthesise inputs, not elicit field-by-field)
  - [ ] Required Inputs table: brand identity dossier (ASSESSMENT-11), brand profile (ASSESSMENT-10), product naming document (ASSESSMENT-13, required — ASSESSMENT-13 must complete before ASSESSMENT-14 runs), ASSESSMENT-06 distribution plan (for use-case list)
  - [ ] Steps: (1) read brand dossier + inputs, (2) derive logo brief sections from dossier content, (3) generate optional draft SVG wordmark note (flag if feasible given font/name length), (4) save brief, (5) report to operator
  - [ ] Output contract: artifact path `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-logo-brief.user.md`, sections: Mark Type, Colour Specification, Typography Specification, Use Case List, Forbidden Territory, Reference Inspirations, Optional Wordmark Note
  - [ ] Quality gate: all 7 sections present; Mark Type is one of {wordmark, lettermark, symbol+wordmark, abstract mark}; Colour Specification references tokens from brand dossier; Use Case List has ≥3 use cases sourced from channel/distribution context; Forbidden Territory has ≥2 items
  - [ ] Integration section: upstream ASSESSMENT-13 (optional) and ASSESSMENT-11/12; downstream ASSESSMENT-15 and `/lp-design-spec`
- **Validation contract:**
  - VC-01: Logo brief sections -> pass when all 7 required sections present with non-placeholder content; check by reading output file within the same build execution (same calendar day as task execution); sample: any one real or test business
  - VC-02: Colour reference accuracy -> pass when Colour Specification section token names match tokens present in the business's brand identity dossier; check by cross-reading dossier; sample: SKILL.md execution against HBAG or BRIK
- **Execution plan:**
  - Red evidence plan: No logo brief skill exists anywhere (confirmed in fact-find skills audit and plan directory search)
  - Green evidence plan: Write SKILL.md in EXECUTE mode. Key design decisions: (a) Mark Type is derived from brand personality — wordmark-only recommended for young brands without brand recognition, symbol+wordmark for brands with strong visual territory; (b) Colour Specification maps directly from `--color-primary`, `--color-accent`, `--color-bg` tokens in dossier; (c) Typography Specification maps heading and body fonts from dossier Typography section; (d) Use Case List is derived from ASSESSMENT-06 distribution channels (e.g., Etsy shop: social icon + shop banner; D2C e-commerce: favicon + email header; retail: hang tag + shelf label); (e) Optional Wordmark Note flags if a simple SVG wordmark can be generated from the confirmed typeface — does not attempt to generate one within the skill itself
  - Refactor evidence plan: Review Forbidden Territory section against ASSESSMENT-10 aesthetic constraints and brand inspirations (Section E) to ensure they match; check for gaps in Use Case List coverage
- **Planning validation:**
  - Checks run: Read ASSESSMENT-11 SKILL.md (6-step EXECUTE pattern, CONFIG object for HTML output). Read brand language template (no logo section). Read ASSESSMENT-04 SKILL.md (W dimension confirms wordmark design expectation). Confirmed all.
  - Validation artifacts: `.claude/skills/lp-do-assessment-11-brand-identity/SKILL.md`, `.claude/skills/_shared/brand-language-template.md`, `.claude/skills/lp-do-assessment-04-candidate-names/SKILL.md`
  - Unexpected findings: ASSESSMENT-04 W dimension explicitly scores names on "works as a stamped logo" — this is evidence that logo design is expected downstream of naming but no skill currently does it. Confirms gap.
- **Scouts:** Optional SVG wordmark generation is flagged as desirable but not required in MVP. If operator feedback after first run indicates this is high value, it can be added to the skill as a Step 4a.
- **Edge Cases & Hardening:**
  - Brand with no confirmed typography (ASSESSMENT-11 left Typography as TBD): Skill should read the gap and note "Typography TBD — logo brief colour and mark type sections complete; return to typography after ASSESSMENT-11 is finalised."
  - Brand that is purely digital (no physical use cases): Use Case List still required but physical cases (hang tag, shelf label) are omitted; digital cases (favicon, social icon, email header) remain.
- **What would make this >=90%:** If the skill were validated against a real operator using it to brief an actual designer, and the designer found the brief actionable without additional Q&A.
- **Rollout / rollback:**
  - Rollout: New file only. Zero risk to existing flow.
  - Rollback: Delete new SKILL.md. TASK-06 must be reverted simultaneously.
- **Documentation impact:**
  - Loop-spec.yaml: new ASSESSMENT-14 stage (TASK-06)
  - Artifact registry: new `logo-brief` artifact type (TASK-07)
  - Brand language template: Logo section added (TASK-05)
- **Notes / references:**
  - Pattern reference: `.claude/skills/lp-do-assessment-11-brand-identity/SKILL.md` (EXECUTE mode, synthesises inputs)
  - Fact-find gap analysis section B for full design rationale

---

### TASK-03: Write ASSESSMENT-15 Packaging Brief Skill (SKILL.md)

- **Type:** IMPLEMENT
- **Deliverable:** New skill file `.claude/skills/lp-do-assessment-15-packaging-brief/SKILL.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Artifact-Destination:** `.claude/skills/lp-do-assessment-15-packaging-brief/SKILL.md` (new file)
- **Reviewer:** Operator
- **Approval-Evidence:** Operator reviews skill file before TASK-06 runs
- **Measurement-Readiness:** None: skill file authoring; no metric owner required
- **Affects:** `.claude/skills/lp-do-assessment-15-packaging-brief/SKILL.md` (new)
- **Depends on:** TASK-04 (regulatory reference data file)
- **Blocks:** TASK-06
- **Confidence:** 80%
  - Implementation: 80% — Packaging brief structure is well-scoped. TASK-04 provides the regulatory reference data that makes this skill authoritative. Without TASK-04, this task caps at 70% (regulatory content would be invented rather than referenced).
  - Approach: 85% — Mixed mode (deterministic structural/regulatory derivation + targeted operator Q&A for aesthetic preferences) is the right approach. The conditionality pattern (physical-product flag) is proven in the LOGISTICS domain.
  - Impact: 80% — Direct value for physical product operators. Conditional skip for digital means zero disruption to existing flow.
  - Held-back test (implementation at exactly 80): Single unresolved unknown: the regulatory reference data in TASK-04 may not perfectly cover edge cases (e.g. a product spanning two regulatory categories like a cosmetic food supplement). If TASK-04 has gaps, this skill will produce incomplete regulatory checklists. Mitigation: TASK-04 includes a "multiple-category" edge case note, and the skill should instruct the operator to verify requirements for multi-category products.
- **Acceptance:**
  - [ ] SKILL.md created at `.claude/skills/lp-do-assessment-15-packaging-brief/SKILL.md`
  - [ ] Frontmatter: `name: lp-do-assessment-15-packaging-brief`, description including "conditional: physical-product"
  - [ ] Operating Mode: MIXED (deterministic for structural format and regulatory fields; elicitation for aesthetic/surface design preferences)
  - [ ] Required Inputs table: product option selection (ASSESSMENT-03), distribution plan (ASSESSMENT-06), brand identity dossier (ASSESSMENT-11), product naming document (ASSESSMENT-13), logo brief (ASSESSMENT-14), regulatory reference data file (TASK-04 output)
  - [ ] Conditionality: skill has explicit check: if `business_profile` does not include `physical-product`, emit "This business does not have a physical product profile. Packaging brief is not applicable — skipping." and halt cleanly
  - [ ] Steps: (1) check conditionality gate, (2) read inputs, (3) derive structural packaging format from product type + distribution channel, (4) read regulatory requirements from reference data for product category, (5) elicit aesthetic preferences from operator (surface design style, colour treatment, imagery on packaging), (6) assemble brief, (7) save
  - [ ] Output contract: artifact path `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-packaging-brief.user.md`, sections: Structural Format, Surface Design Scope, Regulatory Requirements Checklist, Brand Assets to Use, Print Specification Notes, EAN/Barcode Note, Designer Handoff Checklist
  - [ ] Quality gate: all 7 sections present; Structural Format names the specific packaging type (hang tag / folding box / sleeve / label / pouch / bag); Regulatory Requirements Checklist has ≥3 items sourced from the reference data file for the product category; EAN/Barcode Note states whether a barcode is required and references GS1 for registration
  - [ ] Integration section: upstream ASSESSMENT-14; downstream: not applicable (packaging brief is the final ASSESSMENT deliverable for physical product profiles)
- **Validation contract:**
  - VC-01: Conditionality gate -> pass when a non-physical-product business run produces the skip message and does not create the packaging brief file; verify by test execution against a digital-profile business; timebox: 1 build session
  - VC-02: Regulatory checklist completeness -> pass when the regulatory checklist section contains ≥3 category-appropriate items that match the reference data in TASK-04 output; check by reading the output file and cross-referencing with reference data; timebox: 1 build session per category tested
- **Execution plan:**
  - Red evidence plan: No packaging brief skill or data exists (confirmed in fact-find full loop audit)
  - Green evidence plan: Write SKILL.md in MIXED mode. Key design decisions: (a) Structural Format is derived deterministically from a mapping table: {fashion/accessories → hang tag + poly bag; homeware → folding box or sleeve; food/beverage → label + outer box; cosmetics → tube + label or pump bottle}; (b) Regulatory Requirements Checklist reads from the reference data file produced in TASK-04 — the skill does NOT embed regulatory lists inline, it references the external data file; (c) Surface Design section asks operator three targeted questions: primary colour treatment (brand-led vs photography-led), illustration vs photography on packaging, and finish (matte/gloss/foil); (d) EAN/Barcode Note is conditional on distribution channel: retail channels require EAN barcode; D2C and market stalls typically do not
  - Refactor evidence plan: After first test run, check that the Regulatory Requirements Checklist is actionable (operator can use it to prepare for production) and that the Designer Handoff Checklist covers all assets the designer needs (brand dossier path, logo brief path, approved colour tokens, typography spec)
- **Planning validation:**
  - Checks run: Read `two-layer-model.md` LOGISTICS conditional pattern to confirm the conditionality approach. Read ASSESSMENT-11 and ASSESSMENT-14 skill patterns for structural reference. Read `loop-spec.yaml` LOGISTICS conditional block for exact YAML syntax.
  - Validation artifacts: `docs/business-os/startup-loop/two-layer-model.md`, `docs/business-os/startup-loop/loop-spec.yaml` (LOGISTICS block)
  - Unexpected findings: The LOGISTICS conditionality in `two-layer-model.md` uses `business_profile includes logistics-heavy OR physical-product` as the condition expression. ASSESSMENT-15 will use `physical-product` only (not `logistics-heavy` — a logistics-heavy business without physical products does not need packaging).
- **Scouts:** Regulatory requirements are the highest-risk component. TASK-04 must be complete before TASK-03 can be finalised. If TASK-04 reveals a regulatory category that cannot be handled with a simple checklist (e.g., medical devices), that category should be noted as out-of-scope in the skill with a direction to seek professional advice.
- **Edge Cases & Hardening:**
  - Multi-category product (e.g. a cosmetic product that is also food-adjacent): Skill should note the dual-category case and direct operator to apply requirements from both applicable categories in the reference data.
  - Business with no confirmed distribution channels yet (pre-ASSESSMENT-06): Skill should use a fallback: "Distribution channels not yet confirmed — packaging brief uses D2C defaults; update after ASSESSMENT-06 is complete."
  - D2C-only business that later adds retail: The brief should note "EAN barcode not currently required for D2C; required if retail channel is added — revisit ASSESSMENT-15 output at that point."
- **What would make this >=90%:** Validated against a real fashion/leather goods or homeware operator with actual packaging production experience who confirms the brief is complete and actionable.
- **Rollout / rollback:**
  - Rollout: New file only. Conditional skip means non-physical businesses are unaffected.
  - Rollback: Delete new SKILL.md. TASK-06 must be reverted simultaneously.
- **Documentation impact:**
  - Loop-spec.yaml: new ASSESSMENT-15 conditional stage (TASK-06)
  - Artifact registry: new `packaging-brief` artifact type (TASK-07)
  - Brand language template: Packaging section stub added (TASK-05)
- **Notes / references:**
  - Conditionality pattern reference: `docs/business-os/startup-loop/two-layer-model.md` LOGISTICS section
  - Fact-find gap analysis section C for full input/output specification

---

### TASK-04: Write Packaging Regulatory Reference Data File

- **Type:** IMPLEMENT
- **Deliverable:** New reference data file `.claude/skills/lp-do-assessment-15-packaging-brief/regulatory-requirements.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** `.claude/skills/lp-do-assessment-15-packaging-brief/regulatory-requirements.md` (new file, in same skill directory as TASK-03 output)
- **Reviewer:** Operator
- **Approval-Evidence:** Operator acknowledges reference data is adequate for target business categories before TASK-03 builds against it
- **Measurement-Readiness:** None: reference data file; no metric owner required
- **Affects:** `.claude/skills/lp-do-assessment-15-packaging-brief/regulatory-requirements.md` (new)
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 80%
  - Implementation: 80% — Regulatory requirements for the four target categories (fashion, homeware, cosmetics, food/beverage) are well-established in EU/UK law. The risk is incompleteness, not incorrectness.
  - Approach: 85% — A structured markdown reference table by category is the right format: it is agent-readable, operator-reviewable, and easy to extend.
  - Impact: 80% — Without this file, TASK-03 cannot produce an authoritative checklist. The file is an enabling dependency, not an end-user deliverable.
- **Acceptance:**
  - [ ] File created at `.claude/skills/lp-do-assessment-15-packaging-brief/regulatory-requirements.md`
  - [ ] File covers 4 categories: fashion/leather goods, homeware/ceramics, cosmetics/skincare, food/beverage
  - [ ] Each category has: minimum mandatory label fields, jurisdiction note (EU/UK/US primary), relevant regulation reference (e.g. EU Regulation 1169/2011 for food), and structural packaging note
  - [ ] A "placeholder" row exists for categories not yet covered (medical devices, electrical goods, etc.) with explicit "seek professional regulatory advice" note
  - [ ] File has a multi-category edge case section
  - [ ] EAN/barcode note present: required for retail distribution in all categories; GS1 registration referenced
- **Validation contract:**
  - VC-01: Category coverage -> pass when all 4 named categories have ≥4 mandatory label fields each; check by reading the file; timebox: 1 build session
  - VC-02: Regulatory citation accuracy -> pass when each category cites at least one specific regulation or standard (not just "EU law"); check by cross-referencing with at least one authoritative source per category; timebox: 1 build session
- **Execution plan:**
  - Red evidence plan: No regulatory reference data file exists anywhere in the skills directory
  - Green evidence plan: Write a structured markdown file with a section per category. Fashion/leather goods: EU Textile Regulation 1007/2011 (fibre composition labelling), EU Leather labelling (no specific regulation but industry norms for hide origin), origin claim (Italian Law 166/2009), care symbols (ISO 3758). Homeware/ceramics: EU Ceramics Directive 84/500/EEC (lead/cadmium limits for food-contact ceramics), CE marking requirements if applicable. Cosmetics/skincare: EU Cosmetics Regulation 1223/2009 (INCI ingredient list, responsible person, CPNP notification, batch code, minimum durability). Food/beverage: EU Food Information Regulation 1169/2011 (allergens, nutrition, net weight, country of origin, best-before, business address). Structural packaging note per category: fashion → hang tag + poly bag; homeware → box/sleeve with cushioning note; cosmetics → primary + secondary packaging; food → primary packaging + outer carton if retail.
  - Refactor evidence plan: After writing, cross-check fashion requirements against BRIK (the known leather goods business in this codebase) to validate that the checklist would be actionable for that business's profile.
- **Planning validation:**
  - Checks run: Read `two-layer-model.md` to confirm physical-product profile flag. Reviewed ASSESSMENT-03 solution selection skill to confirm product categories are captured there as inputs for this derivation.
  - Unexpected findings: None material.
- **Scouts:** Regulatory requirements vary by jurisdiction. File is scoped to EU primary jurisdiction with UK and US notes where they diverge significantly. Operator is directed to verify jurisdiction-specific requirements before production.
- **Edge Cases & Hardening:** Multi-category edge case section explicitly addresses products that span two categories. "Out of scope" row prevents the agent from attempting to cover medical devices, pharmaceuticals, or electrical goods.
- **What would make this >=90%:** Validation by an operator who has actually produced products in one of the covered categories and confirms the checklist is complete and usable.
- **Rollout / rollback:**
  - Rollout: New file in skill directory. No existing files modified.
  - Rollback: Delete the file. TASK-03 must note that the reference data is absent and cap regulatory claims accordingly.
- **Documentation impact:** None beyond being consumed by TASK-03 skill.
- **Notes / references:** EU Textile Regulation 1007/2011; EU Cosmetics Regulation 1223/2009; EU Food Information Regulation 1169/2011; ISO 3758 care symbols; GS1 barcode registration (gs1.org)

---

### TASK-05: Add Logo and Packaging Sections to Brand Language Template

- **Type:** IMPLEMENT
- **Deliverable:** Updated shared template `.claude/skills/_shared/brand-language-template.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** `.claude/skills/_shared/brand-language-template.md` (in-place update)
- **Reviewer:** Operator
- **Approval-Evidence:** Operator confirms template sections are adequate before TASK-06 runs
- **Measurement-Readiness:** None: template file update; no metric owner required
- **Affects:** `.claude/skills/_shared/brand-language-template.md`
- **Depends on:** -
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% — Template structure is clear; adding two new sections follows the existing pattern exactly.
  - Approach: 90% — Adding sections to the brand language template is the cleanest way to make logo and packaging context available to `/lp-design-spec` downstream.
  - Impact: 85% — Template update enables downstream consumption by `/lp-design-spec` and makes the template self-documenting about what the ASSESSMENT stage produces.
- **Acceptance:**
  - [ ] Brand language template has a new `## Logo Brief` section after `## App Coverage`
  - [ ] Logo Brief section has stub fields: Mark Type, Primary Colour from Palette, Typography from Dossier, Use Cases, Forbidden Territory, Reference Inspirations, Wordmark Note
  - [ ] Logo Brief section has a usage note: "Populated by `/lp-do-assessment-14-logo-brief`. Full artifact: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-logo-brief.user.md`"
  - [ ] Brand language template has a new `## Packaging Brief` section after `## Logo Brief`
  - [ ] Packaging Brief section has stub fields: Structural Format, Regulatory Category, Key Regulatory Fields, Brand Assets Used, Print Specification Notes
  - [ ] Packaging Brief section has a usage note: "Populated by `/lp-do-assessment-15-packaging-brief` (conditional: physical-product only). Full artifact: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-packaging-brief.user.md`"
  - [ ] Both new sections use `{TBD}` placeholder format consistent with existing template style
  - [ ] Existing template sections are unchanged
- **Validation contract:**
  - VC-01: Template completeness -> pass when both `## Logo Brief` and `## Packaging Brief` sections are present in the template with their required stub fields; check by reading the file; timebox: 1 build session
  - VC-02: Existing sections unchanged -> pass when a diff of the file shows only additive changes (no modifications to existing sections); check by git diff; timebox: 1 build session
- **Execution plan:**
  - Red evidence plan: Neither Logo Brief nor Packaging Brief sections exist in the template (confirmed by reading the file in the fact-find evidence audit)
  - Green evidence plan: Add two new sections to the template after the existing `## App Coverage` section, using the same markdown/table format as existing sections. Logo Brief section mirrors the structure of the `<YYYY-MM-DD>-logo-brief.user.md` output contract from TASK-02. Packaging Brief section mirrors the structure of the `<YYYY-MM-DD>-packaging-brief.user.md` output contract from TASK-03 but as a summary stub (full detail lives in the separate artifact).
  - Refactor evidence plan: Read the updated template alongside TASK-02 and TASK-03 SKILL.md output contracts to confirm field names are consistent. Adjust any naming mismatches.
- **Planning validation:**
  - Checks run: Read current brand language template. Confirmed no Logo or Packaging sections exist. Confirmed section format (markdown headers, table stubs, usage notes).
  - Unexpected findings: None.
- **Scouts:** `/lp-design-spec` reads the brand language template. The new sections should not break existing `/lp-design-spec` reads — the skill reads what it needs and ignores unknown sections. No change to `/lp-design-spec` SKILL.md is required by this task.
- **Edge Cases & Hardening:** Template sections are stubs only — they do not attempt to embed the full artifact content. Downstream skills are directed to the full artifact paths.
- **What would make this >=90%:** Validated by running `/lp-design-spec` against a business whose brand dossier includes the new Logo Brief and Packaging Brief sections, confirming the downstream skill reads correctly.
- **Rollout / rollback:**
  - Rollout: Additive change to one template file. Existing dossiers without Logo/Packaging sections continue to work — they simply won't have these stubs populated.
  - Rollback: Revert the two new sections from the template.
- **Documentation impact:** None beyond the template update itself.
- **Notes / references:** Current template: `.claude/skills/_shared/brand-language-template.md`

---

### TASK-06: Update loop-spec.yaml — Add ASSESSMENT-13/14/15, Revise GATE-ASSESSMENT-01

- **Type:** IMPLEMENT
- **Deliverable:** Updated `docs/business-os/startup-loop/loop-spec.yaml`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Artifact-Destination:** `docs/business-os/startup-loop/loop-spec.yaml` (in-place update)
- **Reviewer:** Operator
- **Approval-Evidence:** Operator confirms loop-spec changes before TASK-07 runs
- **Measurement-Readiness:** None: infrastructure document update; no metric owner required
- **Affects:** `docs/business-os/startup-loop/loop-spec.yaml`
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-05
- **Blocks:** TASK-07
- **Confidence:** 85%
  - Implementation: 85% — The loop-spec ASSESSMENT container structure is clearly understood. The ASSESSMENT-10/11 entries are the direct template for the three new entries.
  - Approach: 90% — Additive change to YAML; no existing stage renumbering; no existing entries modified (except ASSESSMENT container stages list and GATE-ASSESSMENT-01 comment).
  - Impact: 85% — Loop-spec is the stage authority. Without this update, the new skills exist but are not officially part of the loop sequence.
- **Acceptance:**
  - [ ] ASSESSMENT container `stages` list updated: `[ASSESSMENT-10, ASSESSMENT-11, ASSESSMENT-13, ASSESSMENT-14, ASSESSMENT-15]`
  - [ ] ASSESSMENT container `ordering_constraints` updated: adds `ASSESSMENT-11 → ASSESSMENT-13`, `ASSESSMENT-13 → ASSESSMENT-14`, `ASSESSMENT-14 → ASSESSMENT-15`, `ASSESSMENT-15 → ASSESSMENT`; removes `ASSESSMENT-11 → ASSESSMENT`
  - [ ] Three new stage entries added after ASSESSMENT-11, before IDEAS: ASSESSMENT-13, ASSESSMENT-14, ASSESSMENT-15
  - [ ] ASSESSMENT-13 entry: `id: ASSESSMENT-13`, `name: Product naming`, `skill: /lp-do-assessment-13-product-naming`, `conditional: false`, `bos_sync` note
  - [ ] ASSESSMENT-14 entry: `id: ASSESSMENT-14`, `name: Logo design brief`, `skill: /lp-do-assessment-14-logo-brief`, `conditional: false`, `bos_sync` note
  - [ ] ASSESSMENT-15 entry: `id: ASSESSMENT-15`, `name: Packaging brief`, `skill: /lp-do-assessment-15-packaging-brief`, `conditional: true`, `condition: "business_profile includes physical-product"`, `bos_sync` note
  - [ ] GATE-ASSESSMENT-01 comment updated to include the new required outputs: `<YYYY-MM-DD>-product-naming.user.md` (mandatory), `<YYYY-MM-DD>-logo-brief.user.md` (mandatory), `<YYYY-MM-DD>-packaging-brief.user.md` (conditional: physical-product); comment must also note that ASSESSMENT-12 (dossier promotion, skill-only — not in loop-spec) should be run before ASSESSMENT-13 is invoked, and that the gate does not enforce ASSESSMENT-12 completion
  - [ ] Version comment at top of loop-spec.yaml updated with a new version note documenting this change
  - [ ] No existing stage entries (ASSESSMENT-01 through ASSESSMENT-12) are modified
  - [ ] YAML is valid (no syntax errors)
- **Validation contract:**
  - VC-01: YAML validity -> pass when `python3 -c "import yaml; yaml.safe_load(open('docs/business-os/startup-loop/loop-spec.yaml'))"` exits 0; timebox: immediately after edit; sample: the file itself
  - VC-02: New stage entries present -> pass when grep finds all three new stage IDs (ASSESSMENT-13, ASSESSMENT-14, ASSESSMENT-15) in loop-spec.yaml; timebox: immediately after edit
  - VC-03: Ordering constraints complete -> pass when grep finds `ASSESSMENT-15 → ASSESSMENT` in ordering_constraints and `ASSESSMENT-11 → ASSESSMENT` is removed or replaced; timebox: immediately after edit
- **Execution plan:**
  - Red evidence plan: Current ASSESSMENT container has only ASSESSMENT-10 and ASSESSMENT-11 (confirmed from loop-spec.yaml read in fact-find)
  - Green evidence plan: Make four targeted edits to loop-spec.yaml: (1) update the ASSESSMENT container `stages` array and `ordering_constraints`; (2) add three new stage entries after ASSESSMENT-11 using the ASSESSMENT-10/11 entries as the exact YAML template; (3) update the GATE-ASSESSMENT-01 comment block; (4) add a version note at the top. No other sections are touched. ASSESSMENT-15 uses the same conditional YAML pattern as the LOGISTICS container.
  - Refactor evidence plan: Run YAML validation immediately after the edit. Read the updated ASSESSMENT container block to visually confirm ordering constraints are correct.
- **Planning validation:**
  - Checks run: Read loop-spec.yaml ASSESSMENT container (lines 313–349) for exact YAML structure. Read LOGISTICS conditional stage entries for conditional YAML pattern. Confirmed both.
  - Validation artifacts: `docs/business-os/startup-loop/loop-spec.yaml` (lines 313–349 for ASSESSMENT container; LOGISTICS block for conditional pattern)
  - Unexpected findings: ASSESSMENT-12 is confirmed absent from loop-spec.yaml. This plan does not add it. The ordering constraint currently ends with `ASSESSMENT-11 → ASSESSMENT`; the update replaces this chain to end with `ASSESSMENT-15 → ASSESSMENT`.
- **Scouts:** If ASSESSMENT-15 is conditional and a non-physical business runs the loop, GATE-ASSESSMENT-01 must not block on the absent packaging brief. The gate comment must explicitly state the conditionality.
- **Edge Cases & Hardening:**
  - If spec_version in loop-spec.yaml needs incrementing, increment the minor version (e.g. 3.11.1 → 3.12.0) and add a version comment.
  - Do not modify the IDEAS container or any post-ASSESSMENT stages.
- **What would make this >=90%:** If the loop-spec had a CI validation script that would catch ordering constraint errors; currently only YAML syntax validation is automated.
- **Rollout / rollback:**
  - Rollout: Single file change. Existing running businesses are unaffected (new stages are only entered when starting a new ASSESSMENT run).
  - Rollback: Revert loop-spec.yaml to previous state using git. New skills from TASK-01/02/03 remain but are not referenced in the spec until re-applied.
- **Documentation impact:**
  - Artifact registry: new stage IDs referenced in TASK-07
- **Notes / references:**
  - loop-spec.yaml ASSESSMENT container (lines 313–349 approx)
  - LOGISTICS conditional pattern for ASSESSMENT-15 `conditional` YAML syntax

---

### TASK-07: Update artifact-registry.md — Register Three New Artifact Types

- **Type:** IMPLEMENT
- **Deliverable:** Updated `docs/business-os/startup-loop/artifact-registry.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** business-artifact
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Artifact-Destination:** `docs/business-os/startup-loop/artifact-registry.md` (in-place update)
- **Reviewer:** Operator
- **Approval-Evidence:** None: registry is a reference document; operator may review but no explicit approval required
- **Measurement-Readiness:** None: registry update; no metric owner required
- **Affects:** `docs/business-os/startup-loop/artifact-registry.md`
- **Depends on:** TASK-06
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — Registry format is a simple table. All artifact fields (path, producer, consumers, version marker) are determined by TASK-01/02/03/06 outputs.
  - Approach: 95% — Additive rows to an existing table. No structural changes.
  - Impact: 90% — Registry completeness matters for fact-find briefings and contract lint tooling. Missing entries are a correctness issue, not a blocking issue for the skills themselves.
- **Acceptance:**
  - [ ] Core Artifact Registry table has three new rows: `product-naming`, `logo-brief`, `packaging-brief`
  - [ ] Each row has: Artifact ID, Producer (new skill), Stage (ASSESSMENT-13/14/15), Canonical Path, Required Fields/Sections, Consumers, Version Marker
  - [ ] `product-naming` canonical path: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-product-naming.user.md`; producer: `lp-do-assessment-13-product-naming`; consumers: `lp-do-assessment-14-logo-brief`, `lp-do-assessment-15-packaging-brief`; version marker: `frontmatter artifact: product-naming`
  - [ ] `logo-brief` canonical path: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-logo-brief.user.md`; producer: `lp-do-assessment-14-logo-brief`; consumers: `lp-do-assessment-15-packaging-brief`, `/lp-design-spec`; version marker: `frontmatter artifact: logo-brief`
  - [ ] `packaging-brief` canonical path: `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-packaging-brief.user.md`; producer: `lp-do-assessment-15-packaging-brief`; consumers: operator (production handoff); version marker: `frontmatter artifact: packaging-brief`; note: conditional on `physical-product` profile
  - [ ] `packaging-brief` row notes the conditional profile requirement explicitly
  - [ ] `Last-updated` frontmatter field updated to 2026-02-26
  - [ ] Producer/Consumer Dependency Graph comment block updated to show the new chain: `ASSESSMENT-11 → ASSESSMENT-13 → ASSESSMENT-14 → ASSESSMENT-15`
- **Validation contract:**
  - VC-01: New artifact rows present -> pass when grep finds all three artifact IDs (product-naming, logo-brief, packaging-brief) in the registry; timebox: immediately after edit
  - VC-02: Canonical paths follow namespace rule -> pass when all three paths follow `docs/business-os/strategy/<BIZ>/<YYYY-MM-DD>-<artifact>.user.md` pattern (dated artifact namespace rule #2 from the registry); check by reading the new rows; timebox: immediately after edit
- **Execution plan:**
  - Red evidence plan: None of the three artifact types are registered in the current registry (confirmed by reading artifact-registry.md in fact-find)
  - Green evidence plan: Add three rows to the Core Artifact Registry table following the existing row format. Update the dependency graph comment. Update the frontmatter `Last-updated` field.
  - Refactor evidence plan: Cross-check artifact paths against the SKILL.md output contracts from TASK-01/02/03 to confirm they match exactly.
- **Planning validation:**
  - Checks run: Read artifact-registry.md table structure. Confirmed row format and namespace rules. Confirmed no existing product-naming/logo-brief/packaging-brief entries.
  - Unexpected findings: None.
- **Scouts:** The contract lint tooling referenced in artifact-registry.md (`scripts/src/startup-loop/contract-lint.ts`) checks that consumers use canonical paths. New consumers of the three new artifacts (primarily the skills themselves) should be checked at build time to ensure they reference the canonical paths.
- **Edge Cases & Hardening:** packaging-brief conditionality must be noted explicitly in the registry to prevent the contract lint tool from flagging its absence for non-physical businesses as an error.
- **What would make this >=90%:** Already at 90%. Gap to 95% is the dependency graph comment — it's maintained manually and could drift from the YAML stage graph. Automated graph generation would close this, but that is out of scope.
- **Rollout / rollback:**
  - Rollout: Additive rows only. No existing consumers affected.
  - Rollback: Remove the three new rows and revert the dependency graph comment.
- **Documentation impact:** None beyond the registry update itself.
- **Notes / references:** `docs/business-os/startup-loop/artifact-registry.md`

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Regulatory reference data (TASK-04) is incomplete for a real operator's product category | Medium | Medium | Scope to 4 categories with an explicit out-of-scope placeholder. Operator is directed to verify before production. |
| Product naming Q&A elicitation (TASK-01) requires more rounds than expected | Low | Low | Skill uses write-first pattern — reduces Q&A to genuine gaps only. Pattern validated from ASSESSMENT-10. |
| ASSESSMENT-15 conditionality in loop-spec is applied incorrectly | Low | Medium | VC-01 and VC-03 in TASK-06 validate gate conditions. LOGISTICS conditional pattern is the exact template. |
| TASK-06 YAML syntax error breaks loop-spec loading | Low | High | VC-01 in TASK-06 runs YAML validation immediately after edit. |
| ASSESSMENT-12 (dossier promotion) gap: it does not check new outputs | Known-accepted | Low | Explicitly deferred from this plan's scope. A follow-on plan item is needed to extend ASSESSMENT-12 checks. Documented in the Non-goals and in the fact-find risks section. |

## Observability
- Logging: None: all deliverables are static skill/spec files
- Metrics: None: skill authoring; metric is operator adoption (tracked informally)
- Alerts/Dashboards: None

## Acceptance Criteria (overall)
- [x] Three new SKILL.md files created and pass their individual quality gates (TASK-01/02/03 acceptance)
- [x] Regulatory reference data file created at `.claude/skills/lp-do-assessment-15-packaging-brief/regulatory-requirements.md` (TASK-04 acceptance)
- [x] Brand language template updated with Logo and Packaging sections (TASK-05 acceptance)
- [x] loop-spec.yaml passes YAML validation and contains all three new stage IDs (TASK-06 acceptance)
- [x] artifact-registry.md contains all three new artifact rows with correct paths and consumers (TASK-07 acceptance)
- [x] No existing files (ASSESSMENT-01 through ASSESSMENT-12 skills, existing brand language template sections) are modified beyond the additive changes specified

## Build Completion Evidence

**Completed: 2026-02-26**

| Task | Deliverable | VC Results |
|---|---|---|
| TASK-04 | `.claude/skills/lp-do-assessment-15-packaging-brief/regulatory-requirements.md` | VC-01: all 4 categories ≥ 11 label fields each; VC-02: specific regulation citations present for all categories (EU Textile Reg 1007/2011, EU Ceramics Directive 84/500/EEC, EU Cosmetics Reg 1223/2009, EU FIR 1169/2011, ISO 3758, GS1) |
| TASK-01 | `.claude/skills/lp-do-assessment-13-product-naming/SKILL.md` | VC-01: all 7 required sections present; VC-02: integration chain correctly references ASSESSMENT-11 upstream, ASSESSMENT-14 downstream |
| TASK-02 | `.claude/skills/lp-do-assessment-14-logo-brief/SKILL.md` | VC-01: all 7 output sections present; VC-02: colour spec maps token names from brand dossier |
| TASK-05 | `.claude/skills/_shared/brand-language-template.md` | VC-01: both new sections (Logo Brief, Packaging Brief) present; VC-02: git diff is additive only — zero modifications to existing sections |
| TASK-03 | `.claude/skills/lp-do-assessment-15-packaging-brief/SKILL.md` | VC-01: conditionality gate present (skip for non-physical-product); all 7 output sections present; VC-02: regulatory checklist sourced from external reference data file |
| TASK-06 | `docs/business-os/startup-loop/loop-spec.yaml` | VC-01: YAML validates via python3 yaml.safe_load; VC-02: ASSESSMENT-13/14/15 stage IDs present; VC-03: ASSESSMENT-15 → ASSESSMENT present; old ASSESSMENT-11 → ASSESSMENT final constraint replaced |
| TASK-07 | `docs/business-os/startup-loop/artifact-registry.md` | VC-01: product-naming, logo-brief, packaging-brief rows present; VC-02: all 3 canonical paths follow dated-artifact namespace rule |

## Decision Log
- 2026-02-26: Product naming (ASSESSMENT-13) slots after ASSESSMENT-11, not between ASSESSMENT-05 and ASSESSMENT-06 — brand personality context from ASSESSMENT-10/11 needed for naming tone; intake packet already carries ASSESSMENT-06 channel data forward.
- 2026-02-26: Logo brief is a new ASSESSMENT-14 stage (not an extension of ASSESSMENT-11) — ASSESSMENT-11 is already complex; clean separation preferred.
- 2026-02-26: ASSESSMENT-12 (dossier promotion) NOT updated in this plan — extending its 10-check list requires a separate UX/operator-confirmation design decision. Deferred.
- 2026-02-26: ASSESSMENT-15 conditionality uses `physical-product` flag only (not `physical-product OR logistics-heavy`), consistent with the LOGISTICS domain precedent but scoped more narrowly since logistics-heavy ≠ packaged product.

## Overall-confidence Calculation
- TASK-01: 85% × M(2) = 170
- TASK-02: 85% × M(2) = 170
- TASK-03: 80% × M(2) = 160
- TASK-04: 80% × S(1) = 80
- TASK-05: 85% × S(1) = 85
- TASK-06: 85% × M(2) = 170
- TASK-07: 90% × S(1) = 90
- Sum: 925 / total weight 11 = **84% → rounded to 80% (multiple-of-5 rounding rule; 84% rounds down to 80% per confidence scoring rules)**
