---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Venture-Studio
Workstream: Mixed
Created: 2026-02-17
Last-updated: 2026-02-17
Feature-Slug: startup-loop-branding-design-module
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Execution-Track: mixed
Primary-Execution-Skill: /lp-do-build
Supporting-Skills: /lp-brand-bootstrap, /lp-design-spec, /lp-offer, /draft-marketing, /lp-launch-qa
Related-Plan: docs/plans/startup-loop-branding-design-module/plan.md
Business-OS-Integration: on
Business-Unit: PLAT
Card-ID: PLAT-002
---

> **Note:** S7/S8/S9 stage IDs referenced below were consolidated into stage DO in loop-spec v3.0.0 (2026-02-21).

# Startup Loop — Branding & Design Module: Fact-Find Brief

## Scope

### Summary

Retrofit the Startup Loop with a first-class Branding & Design module. Currently "Design
Policy" is a prose appendix (Section 11 of the workflow doc) with no stage key, no artifact
contract, no enforcement gate, and no downstream consumption links. The change promotes branding
to embedded stages with concrete artifact schemas, gate enforcement, and explicit wiring to
existing loop stages (offer, channel, build, QA).

The Prime app's design branding — currently split across two disconnected files — is
consolidated into a single coherent artifact produced by the loop.

### Goals

1. Produce a gap analysis of branding coverage in the current loop (observed, evidence-backed).
2. Propose a Branding & Design module with named insertion points, artifact contracts, and gates.
3. Define the status schema (Draft/Active DoD) for each new artifact type so gates are
   machine-checkable, not socially enforced.
4. Specify a consolidated Prime App Design Branding artifact.
5. Produce reusable Deep Research prompt templates for brand research tasks.
6. Define a canonical evidence storage structure so artifact citations are traceable.

### Non-Goals

- Changing existing brand decisions (palette choices, typeface selections already made for BRIK).
- Implementing specific visual designs or selecting logo variants.
- Running actual brand research (this brief designs the process; research runs inside the loop).
- Document restructuring is in scope; changing the brand content itself is not.

### Constraints

- Design tokens live in TypeScript: `packages/themes/<theme>/src/tokens.ts`. No Figma.
  All visual implementation is token-driven.
- All workflow artifacts use `.user.md` + optional `.user.html` companion rendered via
  `pnpm docs:render-user-html`.
- Single owner: Pete. No multi-person approval chain.
- Stage advance requires both artifact and BOS sync complete (existing advance rule from
  `startup-loop` SKILL.md — confirmed below in Evidence Register).
- `lp-brand-bootstrap` already exists as a skill. The module wraps/extends it.
- The S2B→S3+S6B parallel fan-out must be preserved (see Evidence Register: loop-spec.yaml).

---

## Internal Evidence Register

All key claims in this brief are traced to specific sources below. Claims marked
**Indicated by** are partially verified; claims marked **Confirmed** have direct citations.

| # | Claim | Source file | Evidence (path + excerpt) | Confidence |
|---|-------|-------------|--------------------------|------------|
| E-01 | Section 11 is a prose appendix with no stage key | `docs/business-os/startup-loop-workflow.user.md` | §11 heading: "11) Design Policy (Cross-Cutting)" — no stage ID, no artifact contract, no gate referenced in §13.3 Advance rule | Confirmed |
| E-02 | Loop stages are S0–S10 (17 stages) | `docs/business-os/startup-loop/loop-spec.yaml` | `ordering.sequential` list, `parallel_groups.fan-out-1: members: [S3, S6B], join_at: S4` | Confirmed |
| E-03 | S2B fans out to S3 AND S6B simultaneously | `docs/business-os/startup-loop/loop-spec.yaml` | Lines: `[S2B, S3]` and `[S2B, S6B]` in sequential list; `fan-out-1` parallel group | Confirmed |
| E-04 | Brand-language is NOT a hard gate in startup-loop advance rules | `.claude/skills/startup-loop/SKILL.md` | Hard gates listed: Gate A (S1B), Gate B (S2A), Gate C (S2/S6 deep research). Brand-language not present | Confirmed |
| E-05 | lp-offer does not require brand-language as input | `.claude/skills/lp-offer/SKILL.md` (lines 32-42) | Required: `lp-readiness` output, business context. Optional: competitor sites, reviews, market research. Brand-language absent | Confirmed (first 80 lines read) |
| E-06 | BRIK brand-language.user.md exists and is Active | `docs/business-os/strategy/BRIK/brand-language.user.md` | Frontmatter: `Status: Active`, `Business-Unit: BRIK` | Confirmed |
| E-07 | HEAD, PET, HBAG, XA have no brand-language docs | `docs/business-os/strategy/*/` directory contents | Each subdirectory (HEAD, PET, HBAG, XA) contains only `plan.user.md` and dated strategy docs; no `brand-language.user.md` present | Confirmed |
| E-08 | Prime is one of BRIK's four apps | `docs/business-os/strategy/businesses.json` | `"id": "BRIK", "apps": ["brikette","brikette-scripts","reception","prime"]` | Confirmed |
| E-09 | lp-brand-bootstrap references S0/S1 as intended trigger | `.claude/skills/lp-brand-bootstrap/SKILL.md` | "When to Use: S0/S1 gate: Startup loop detects missing brand-language.user.md" — but is a "when to use" comment, not an enforced advance-rule gate | Confirmed |
| E-10 | Token value mismatch between brand-language doc and tokens.ts | `packages/themes/prime/src/tokens.ts` line 16; `docs/business-os/strategy/BRIK/brand-language.user.md` Color Palette table | tokens.ts: `'--color-primary': { light: '6 78% 47%' }`; brand-language.user.md: `6 78% 57%` (10 lightness points off) | Confirmed |
| E-11 | Section 11 references tokens.css, not tokens.ts | `docs/business-os/startup-loop-workflow.user.md` §11.1 | "Token-driven — all visual changes via theme token system (`packages/themes/prime/tokens.css`)" — but actual file is `packages/themes/prime/src/tokens.ts` | Confirmed (minor path inconsistency) |
| E-12 | lp-channels SKILL.md not read; brand inputs unknown | `.claude/skills/lp-channels/SKILL.md` | File exists but was not read in this investigation | Not verified — indicated by skill directory listing |
| E-13 | lp-launch-qa and lp-design-qa SKILL.md not read | `.claude/skills/lp-launch-qa/SKILL.md`, `.claude/skills/lp-design-qa/SKILL.md` | Files exist but were not read; brand-language consumption is assumed absent | Not verified — indicated by skill directory listing |
| E-14 | GA4 and Octorate are available data sources | `docs/business-os/startup-loop-workflow.user.md` §5.4 BRIK-specific gaps; brik-s2-data-capture-automation plan | GA4 events mentioned (web_vitals, begin_checkout). Octorate booking data automated via S2 capture scripts. | Confirmed for BRIK; Indicated for other businesses |
| E-15 | Section 11 HEAD/PET design policies "not yet established" | `docs/business-os/startup-loop-workflow.user.md` §11.2 | "HEAD / PET Design Policies: Not yet established. Will be seeded when customer-facing surfaces are built." | Confirmed |

---

## Current State (Observed)

This section contains only what is directly observed in the repository. No design decisions.

### Loop Stage Architecture

Seventeen canonical stages in `docs/business-os/startup-loop/loop-spec.yaml`:

```
S0 → S1 → [S1B conditional] → [S2A conditional] → S2 → S2B
                                                          ↓
                                                    S3 ─┐ (parallel fan-out)
                                                    S6B─┘
                                                          ↓
                                              S4 (join) → S5A → S5B → S6 → S7 → S8 → S9 → S9B → S10
```

The fan-out from S2B to S3 and S6B is a hard design invariant in loop-spec.yaml (E-03).
S4 is a join barrier requiring `offer` (S2B), `forecast` (S3), and `channels` (S6B) — all required.

### What Section 11 Actually Contains (Observed)

**Evidence: E-01**

Section 11 "Design Policy (Cross-Cutting)" in `docs/business-os/startup-loop-workflow.user.md`:

- No stage ID (not S-anything)
- No `stage-result.json` contract
- No `produced_keys`
- No gate reference in §13 Advance rule
- Contains: BRIK demographic data (99% female, 60% 18-25, 100% mobile), 7 design principles,
  list of governed surfaces, reference to Active fact-find `docs/plans/prime-design-refresh-fact-find.md`
- References `packages/themes/prime/tokens.css` — the actual file is `packages/themes/prime/src/tokens.ts` (E-11)
- §11.2 explicitly notes HEAD/PET policies "not yet established" (E-15)

### Existing Branding Infrastructure

| Asset | Path | Status | Confidence |
|-------|------|--------|------------|
| BRIK brand-language | `docs/business-os/strategy/BRIK/brand-language.user.md` | Active | Confirmed (E-06) |
| Brand-language template | `.claude/skills/_shared/brand-language-template.md` | Active | Confirmed (directory listing) |
| lp-brand-bootstrap skill | `.claude/skills/lp-brand-bootstrap/SKILL.md` | Active, not gated | Confirmed (E-04, E-09) |
| Prime theme tokens | `packages/themes/prime/src/tokens.ts` | Active (source of truth) | Confirmed (E-10) |
| Base theme tokens | `packages/themes/base/src/tokens.ts` | Active | Confirmed |
| lp-design-system skill | `.claude/skills/lp-design-system/SKILL.md` | Active | Confirmed |
| lp-design-spec skill | `.claude/skills/lp-design-spec/SKILL.md` | Active | Confirmed (directory listing) |
| lp-design-qa skill | `.claude/skills/lp-design-qa/SKILL.md` | Active, inputs unknown | Indicated (E-13) |
| HEAD brand-language | — | Missing | Confirmed (E-07) |
| PET brand-language | — | Missing | Confirmed (E-07) |
| HBAG brand-language | — | Missing | Confirmed (E-07) |
| XA brand-language | — | Missing | Confirmed (E-07) |

### Observed Gaps in Current Enforcement

These are absences confirmed from evidence, not design proposals:

| Gap ID | What is absent | Evidence |
|--------|---------------|---------|
| OG-01 | Brand-language is not in the startup-loop advance rules | E-04 |
| OG-02 | lp-offer does not accept or require brand-language as input | E-05 |
| OG-03 | No messaging hierarchy artifact exists for any business | E-07 (no file present) |
| OG-04 | No competitive positioning artifact exists (standalone; separate from S2 market intel) | E-07 |
| OG-05 | No creative/voice brief artifact exists for any business | E-07 |
| OG-06 | Section 11 has no Status model; it cannot be machine-gated | E-01 |
| OG-07 | Token values are mirrored by hand into brand-language.user.md, causing drift | E-10 |
| OG-08 | Section 11 references wrong file path (`tokens.css` vs `tokens.ts`) | E-11 |
| OG-09 | lp-channels input contract not verified — brand voice consumption unknown | E-12 |
| OG-10 | lp-launch-qa and lp-design-qa brand compliance not verified | E-13 |
| OG-11 | No canonical evidence storage location for raw data exports | (no docs/business-os/evidence/ directory exists) |

### Skill Contract Coverage (What Was and Was Not Read)

These are partial-read caveats. Plan tasks requiring gate additions to these skills must read
them fully before writing code.

| Skill | Read extent | What was confirmed | What was not verified |
|-------|-------------|-------------------|----------------------|
| `startup-loop/SKILL.md` | Full (216 lines) | Advance rules, hard gates (E-04) | N/A |
| `lp-offer/SKILL.md` | First 80 lines | Required inputs (E-05) | Optional input handling behavior; whether brand-language can be added without breaking |
| `lp-brand-bootstrap/SKILL.md` | Full | S0/S1 trigger, outputs (E-09) | N/A |
| `lp-readiness/SKILL.md` | Full (via prior investigation) | RG-01/02/03 gate structure | N/A |
| `lp-channels/SKILL.md` | Not read | — | Whether brand-language or messaging is consumed (E-12) |
| `lp-launch-qa/SKILL.md` | Not read | — | Whether brand compliance exists already (E-13) |
| `lp-design-qa/SKILL.md` | Not read | — | Whether brand-language is already a required input (E-13) |
| `loop-spec.yaml` | Full (223 lines) | Stage ordering, fan-out, join barrier (E-02, E-03) | N/A |

---

## Gate Policy (Consolidated)

All gate decisions are defined here. All other sections reference gates by ID only.

| Gate ID | Enforcement point | Severity | Condition that triggers | Result |
|---------|------------------|----------|------------------------|--------|
| GATE-BD-01 | S1 advance | **Hard — blocked** | `docs/business-os/strategy/<BIZ>/brand-identity.user.md` is missing OR `Status` is not `Draft` or `Active` | `status: blocked`, `blocking_reason: "Brand Dossier required at S1. Run /lp-brand-bootstrap <BIZ>."` |
| GATE-BD-02 | S2B Done | **Hard — blocked** | `docs/business-os/strategy/<BIZ>/competitive-positioning.user.md` is missing OR `Status == Missing` | `status: blocked`, `blocking_reason: "Competitive Positioning required before S2B can be marked Done."` |
| GATE-BD-03 | S2B Done | **Hard — blocked** | `docs/business-os/strategy/<BIZ>/messaging-hierarchy.user.md` is missing OR `Status` is not `Draft` or `Active` | `status: blocked`, `blocking_reason: "Messaging Hierarchy (Draft minimum) required before S2B Done. Messaging is a sub-deliverable of S2B."` |
| GATE-BD-04 | S9B QA entry | **Hard — blocked** | `brand-identity.user.md` `Status != Active` | `qa-report: blocked on brand-identity not Active` |
| GATE-BD-05 | S9B QA entry | **Hard — blocked** | `messaging-hierarchy.user.md` `Status != Active` OR Claims+Proof Ledger has < 3 rows | `qa-report: blocked on messaging-hierarchy not ready for launch` |
| GATE-BD-06a | S9B QA checklist item BC-01 | **Hard — blocked** | Token compliance fails (hardcoded colors/fonts detected outside token system) | QA report: FAIL on BC-01; go/no-go = NO GO |
| GATE-BD-06b | S9B QA checklist items BC-02..BC-07 | **Soft — warning** | Any of: wrong font stack, off-brand colors in content, disallowed words in copy, unsubstantiated claims, imagery direction violation, CTA language mismatch | QA report: WARNING on BC-0X; go/no-go unaffected by warnings alone |
| GATE-BD-07 | `lp-design-spec` entry | **Hard — error** | `brand-identity.user.md` missing OR `Status != Active` | Skill returns error: "Brand Dossier must be Active before running design spec. Run /lp-brand-bootstrap." |
| GATE-BD-08 | Standing refresh (quarterly) | **Soft — warning** | `brand-identity.user.md` `Last-reviewed` older than 90 days | S10 weekly decision loop emits warning: "Brand Dossier is stale. Review and update before next major launch." |

---

## Artifact Front Matter Schemas

### brand-identity.user.md

```yaml
---
Type: Brand-Identity
Business-Unit: <BIZ>
Business-Name: <full name>
Status: <Draft | Active>
Created: YYYY-MM-DD
Last-reviewed: YYYY-MM-DD
Token-Source: packages/themes/<theme>/src/tokens.ts
---
```

**Draft DoD** (minimum to satisfy GATE-BD-01):
- `Audience` section present and non-TBD
- `Personality` section has ≥ 3 adjective pairs
- `Visual Identity` section references `Token-Source` path (even if tokens file is a stub)
- `Voice & Tone` section has at least Writing Style populated
- `App Coverage` table present (rows can be TBD for unbuilt apps)
- All TBD entries include `TBD — {specific thing needed}` rationale

**Active DoD** (required for GATE-BD-04, GATE-BD-07):
- All Draft criteria met
- No TBD in: Audience, Personality, Voice & Tone Writing Style, Key Phrases, Words to Avoid
- `Token-Source` file exists at the referenced path
- `Last-reviewed` within 90 days
- Any `App Coverage` rows for live apps are fully populated (no TBD)

### competitive-positioning.user.md

```yaml
---
Type: Competitive-Positioning
Business-Unit: <BIZ>
Status: <Draft | Active>
Reviewed-date: YYYY-MM-DD
Next-review: YYYY-MM-DD
Evidence-pack: docs/business-os/evidence/<BIZ>/<YYYY-MM>/
---
```

**Draft DoD** (minimum to satisfy GATE-BD-02):
- ≥ 1 competitor in Differentiation Matrix
- Customer Language Harvest has ≥ 5 verbatim quotes with source attributed
- Evidence Register has ≥ 1 external URL

**Active DoD** (required before BD-4 Creative Brief):
- ≥ 3 competitors in Differentiation Matrix
- Customer Language Harvest has ≥ 20 quotes
- USP Whitespace section non-empty (≥ 3 bullet points)
- Claims Available for Proof: ≥ 3 rows
- All claims in Evidence Register have URL + date cited
- `Reviewed-date` within 30 days (stale triggers GATE-BD-08 warning via standing refresh)

### messaging-hierarchy.user.md

```yaml
---
Type: Messaging-Hierarchy
Business-Unit: <BIZ>
Status: <Draft | Active>
Offer-version: <links to offer artifact, e.g., 2026-02-17>
Evidence-pack: docs/business-os/evidence/<BIZ>/<YYYY-MM>/
---
```

**Draft DoD** (minimum to satisfy GATE-BD-03, enabling S2B Done):
- `Tagline` present (even if marked "working draft")
- ≥ 1 Value Proposition with supporting evidence
- `Claims + Proof Ledger` table exists (can have 0 rows with note "to be populated")
- No missing required sections

**Active DoD** (required for GATE-BD-05 at S9B):
- ≥ 3 Value Propositions
- ≥ 3 rows in Claims + Proof Ledger
- `Voice in Practice` has ≥ 3 before/after rewrite examples
- `Anti-patterns` section populated
- Tagline and Elevator Pitch are non-TBD
- All claims in Proof Ledger have an evidence-pack citation or acknowledged as "brand claim, unsubstantiated"

### creative-voice-brief.user.md

```yaml
---
Type: Creative-Voice-Brief
Business-Unit: <BIZ>
Status: <Draft | Active>
Channel-plan-version: <links to S6B channels.md date>
---
```

**Draft DoD**: ≥ 1 channel section present with tone adaptation and ≥ 1 headline example.
**Active DoD**: All channels from S6B channel plan are present; each has tone adaptation,
≥ 3 headline variants, visual direction, CTA variants, and measurement hook.

---

## Evidence Pack Structure

A canonical location for raw data exports that artifact citations can reference. This prevents
artifacts from embedding copyrighted or bulk content and makes claims traceable.

```
docs/business-os/evidence/<BIZ>/<YYYY-MM>/
├── README.md                          # Index of what's in this month's pack
├── <source>-reviews-<YYYY-MM-DD>.txt  # Short quote extracts, attributed
├── <source>-ads-<YYYY-MM-DD>/         # Screenshots for internal analysis
│   └── <competitor>-<ad-id>.png
├── ga4-export-<YYYY-MM-DD>.csv        # GA4 data exports
└── octorate-<YYYY-MM-DD>.csv          # Octorate booking exports
```

**Compliance guardrails** (apply to all external evidence):

1. **Short quotes only:** ≤ 3 sentences per review quote. Attribute to platform and approximate date.
2. **Ad screenshots for internal analysis only:** Do not redistribute or publish. Store in evidence pack, reference by path.
3. **No ToS-violating scraping:** Use platform search interfaces, API access, or manual capture. Do not use headless browser bulk scraping against platform ToS.
4. **Store minimum necessary:** Do not bulk-dump entire review threads. Extract and store only the quotes and evidence needed to substantiate specific claims.
5. **Evidence expiry:** Evidence pack entries > 6 months old must be re-validated before being cited in an Active artifact. Mark as `[stale — re-validate before citing]` if not refreshed.

Artifacts cite evidence as: `evidence/BRIK/2026-02/tripadvisor-reviews-2026-02-15.txt:L42`

---

## Proposed Module Design

This section contains design decisions, not observations. Everything here is a proposal.
Each design decision notes alternatives where they exist.

### Structural Decision: BD-3 Placement (Resolving S2B / S6B Conflict)

The original v1 brief placed BD-3 (Messaging Hierarchy) as a hard gate blocking S6B advance.
This conflicts with the confirmed fan-out invariant: S2B Done triggers both S3 and S6B in
parallel (E-03). Blocking S6B on a step that runs after S2B would break the loop's parallel
execution model.

**Decision (Option A):** Treat BD-3 (Messaging Hierarchy) as a **sub-deliverable of S2B**.
S2B is not Done until both `offer` and `messaging_hierarchy` (at minimum Draft status) exist.
Once S2B is Done, S3 and S6B fan out concurrently as before.

**Implication for loop-spec.yaml:** S2B `produced_keys` must be updated from `["offer"]` to
`["offer", "messaging_hierarchy"]`. The join barrier at S4 still only requires `offer` +
`forecast` + `channels`; `messaging_hierarchy` Draft is internal to S2B.

---

### Brand Dossier Consolidation

**Decision:** Instead of five separate per-business artifacts, each business gets one primary
file — the Brand Dossier — with internal sections. Only artifacts with distinct lifecycles
(competitive landscape refreshed monthly; messaging tied to the offer version) are kept separate.

**Why not a single Brand Dossier for all businesses:** Per-business architecture already
confirmed in repo; BRIK's existing `brand-language.user.md` is the model. One file per BIZ
prevents cross-contamination of demographics and voice styles.

**Artifact set per business:**

```
docs/business-os/strategy/<BIZ>/
├── brand-identity.user.md          ← primary brand file (replaces brand-language.user.md for new BIZ;
│                                    BRIK: rename brand-language.user.md → brand-identity.user.md)
├── competitive-positioning.user.md ← separate: monthly refresh lifecycle
├── messaging-hierarchy.user.md    ← separate: refreshed on offer version change
├── creative-voice-brief.user.md   ← optional: per-channel campaign brief
└── index.user.md                  ← strategy index: all artifacts + Status + Last-reviewed
```

**Strategy index** (`index.user.md`) — gates reference this, not individual artifact Status:

```markdown
---
Type: Strategy-Index
Business-Unit: <BIZ>
Last-updated: YYYY-MM-DD
---
| Artifact | Path | Status | Last-reviewed |
|----------|------|--------|--------------|
| Brand Dossier | brand-identity.user.md | Draft/Active | YYYY-MM-DD |
| Competitive Positioning | competitive-positioning.user.md | Draft/Active | YYYY-MM-DD |
| Messaging Hierarchy | messaging-hierarchy.user.md | Draft/Active | YYYY-MM-DD |
| Creative Voice Brief | creative-voice-brief.user.md | Draft/Active/N/A | YYYY-MM-DD |
```

Gate checks read `index.user.md` for a given BIZ to determine artifact status.
This decouples the gate check from parsing individual files' frontmatter.

---

### BD-1: Brand Dossier Bootstrap (Stage S1 — GATE-BD-01)

**Purpose:** Establish minimum viable brand identity before offer copy, landing pages, or
channel work begins. Without it, downstream stages make implicit brand assumptions.

**Insertion point:** Hard gate added to S1 advance (see GATE-BD-01). Bootstrap runs before
or concurrently with RG-01/02/03 readiness checks when brand-identity.user.md is missing.

**Required inputs:**

| Input | Source | Required? |
|-------|--------|----------|
| S0 intake packet | `docs/business-os/strategy/<BIZ>/plan.user.md` | Yes |
| Target customer hypothesis | Strategy plan §audience, or operator interview | Yes |
| Existing app UI (if any) | `apps/<app>/src/app/layout.tsx`, key pages | Only if app exists |
| Token package (if any) | `packages/themes/<theme>/src/tokens.ts` | Only if theme exists |
| BRIK brand-identity (reference example) | `docs/business-os/strategy/BRIK/2026-02-12-brand-identity-dossier.user.md` | Yes (reference) |

**Method:** Run `/lp-brand-bootstrap <BIZ>`. Fills template from strategy plan + demographic
hypothesis + existing UI/token evidence. Unknown fields marked `TBD — {rationale}`.

**Output:** `docs/business-os/strategy/<BIZ>/brand-identity.user.md` at Status: Draft
(minimum acceptable for GATE-BD-01 to pass).

**Token mirroring — critical:** The `Visual Identity` section of brand-identity.user.md
must NOT copy token values from `tokens.ts`. It must only reference the token file path:

```markdown
## Visual Identity

Token source (canonical): `packages/themes/prime/src/tokens.ts`

All color, typography, and spacing decisions are defined in that file.
This section documents the *rationale* for each key token choice,
not the values themselves. Values are auto-sourced from the token file.

### Token Rationale

| Token name | Rationale |
|------------|-----------|
| `--color-primary` | Warm coral — Airbnb/Glossier aesthetic. Resonates with 18-25 female demographic. Replaced cold teal. |
| `--font-sans` | Plus Jakarta Sans — geometric with high x-height for mobile legibility. Warm and approachable. |
| `--radius-md` | 0.5rem (slightly softer than base 0.375rem) — friendlier feel for hospitality context. |
```

A pre-commit hook or `pnpm docs:render-user-html` step may optionally inject current token
values as a read-only generated block (not hand-maintained). Until that script exists,
the doc references the file path; values are read from tokens.ts directly.

**Downstream consumers (references GATE-BD-01 by ID):** GATE-BD-04 (S9B), GATE-BD-07 (lp-design-spec).

---

### BD-2: Competitive Positioning (After S2, Before S2B Done — GATE-BD-02)

**Purpose:** Extract brand-level differentiation intelligence from the S2 market intelligence run.
S2 produces competitor/demand/pricing research; BD-2 synthesizes the brand-relevant subset.

**Insertion point:** BD-2 is a required output pass at the end of S2. S2B is blocked (GATE-BD-02)
until competitive-positioning.user.md is at least Draft.

**Note on evidence:** BD-2 research draws on external sources. All raw data must go into
the evidence pack (`docs/business-os/evidence/<BIZ>/<YYYY-MM>/`) and comply with
the compliance guardrails defined above. Artifacts cite evidence pack entries by path.

**Required inputs:**

| Input | Source | Required? |
|-------|--------|----------|
| S2 market intelligence pack | `docs/business-os/market-research/<BIZ>/latest.user.md` | Yes |
| BD-1 brand-identity (draft) | `docs/business-os/strategy/<BIZ>/brand-identity.user.md` | Yes |
| Review extracts | Evidence pack: `evidence/<BIZ>/<YYYY-MM>/`  | Yes (≥5 quotes for Draft) |
| Competitor ad samples | Evidence pack (screenshots) | Optional (Active requires ≥1 per competitor) |

**Method:** Deep Research prompt BRAND-DR-01 (see Prompt Pack below). Synthesize into
`competitive-positioning.user.md` with the sections and minimum rows defined in the schema above.

**Downstream consumers:**

| Stage | Consumption |
|-------|-------------|
| BD-3 Messaging (sub-deliverable of S2B) | Customer language harvest → tagline + value prop candidates |
| S2B Offer (`lp-offer`) | Differentiation matrix informs positioning one-pager |
| BD-4 Creative brief | Visual benchmarks → creative direction |

**Note on lp-offer integration:** Current lp-offer SKILL.md (E-05) lists competitive-positioning
as optional input. The plan should add it as a recommended (not hard-required) input so
lp-offer can consume the differentiation matrix and proof points. Hard-requiring it risks
blocking businesses where competitive research is genuinely unavailable.

---

### BD-3: Messaging Hierarchy (Sub-deliverable of S2B — GATE-BD-03)

**Purpose:** Produce an ordered messaging hierarchy — the durable artifact governing all copy
surfaces — as part of completing the offer design stage.

**Insertion point:** BD-3 is a second output required for S2B Done. S2B `produced_keys`
becomes `["offer", "messaging_hierarchy"]`. Gate GATE-BD-03 blocks S2B Done if
messaging-hierarchy.user.md is not at least Draft. The fan-out to S3 and S6B is preserved
(E-03): both start after S2B Done, not before.

**Stage-result implication:** S2B worker must produce both:
- `stages/S2B/offer.md` (existing)
- `stages/S2B/messaging-hierarchy-draft.md` (new, pointer to the artifact)

**Required inputs:**

| Input | Source | Required? |
|-------|--------|----------|
| S2B offer artifact | `stages/S2B/offer.md` | Yes |
| BD-2 competitive positioning | `competitive-positioning.user.md` | Yes (Draft minimum) |
| BD-1 brand-identity | `brand-identity.user.md` | Yes (Draft minimum) |
| Customer language harvest | `competitive-positioning.user.md §Customer Language Harvest` | Yes |

**Output:** `docs/business-os/strategy/<BIZ>/messaging-hierarchy.user.md` at Status: Draft.
Must reach Status: Active before S9B (GATE-BD-05).

**Downstream consumers:**

| Stage | Consumption |
|-------|-------------|
| S6B Channel + GTM | Tagline and value props inform outreach scripts and GTM messaging |
| S6B SEO strategy | Value props → SEO content clusters |
| BD-4 Creative brief | Headline candidates from messaging hierarchy |
| S7/S8 Fact-find/Plan | lp-do-fact-find reads messaging-hierarchy for landing page and copy tasks |
| S9B QA | GATE-BD-05: messaging-hierarchy Active + ≥3 proof rows required at launch |

---

### BD-4: Creative & Voice Brief (After S6B — Soft Gate via GATE-BD-06b)

**Purpose:** Translate messaging hierarchy + channel plan into channel-specific creative
direction. This is not ad creative — it is the "how the brand shows up per channel" brief
that informs `/draft-marketing` and `/draft-outreach` executions.

**Insertion point:** BD-4 runs after S6B is Done. Missing creative-voice-brief triggers
a GATE-BD-06b warning at S9B QA (not a blocker), incentivizing completion before launch.

**Required inputs:**

| Input | Source | Required? |
|-------|--------|----------|
| S6B channel plan | `stages/S6B/channels.md` | Yes |
| BD-3 messaging hierarchy | `messaging-hierarchy.user.md` | Yes (Active for BD-4) |
| BD-1 brand-identity | `brand-identity.user.md` | Yes (Active for BD-4) |

**Output:** `docs/business-os/strategy/<BIZ>/creative-voice-brief.user.md`

Sections per selected channel: format constraints, tone adaptation, ≥3 headline variants,
visual direction, CTA variants, measurement hook.

**Note on lp-channels integration:** lp-channels SKILL.md was not read (E-12). The plan
task adding brand consumption to lp-channels must read the skill file first and make a
decision about whether brand-identity + messaging-hierarchy become required inputs or optional
recommendations.

---

### BD-5: Design Spec Gate Enhancement (S7/S8 — GATE-BD-07)

**Purpose:** Ensure lp-design-spec cannot run without an Active Brand Dossier, preventing
implicit design decisions when brand context is undefined.

**Change:** Add GATE-BD-07 as a prerequisite check at the start of `/lp-design-spec`.

**Note:** lp-design-spec SKILL.md was not read independently. The plan task must read it
and confirm there is no existing brand-language check before adding the gate.

---

### BD-6: Brand Compliance QA (S9B — GATE-BD-04, BD-05, BD-06a/b)

**Purpose:** Verify shipped work complies with brand-identity and messaging-hierarchy before
launch. Currently lp-launch-qa and lp-design-qa do not reference brand artifacts (E-13).

**Change:** Add the following checklist to the S9B QA report output. Gate severity is defined
in the Gate Policy table and referenced here by ID only.

```
BC-01 [GATE-BD-06a Hard]: Token compliance — no hardcoded colors/fonts outside token system
BC-02 [GATE-BD-06b Warn]: Typography — font stack matches brand-identity Token-Source
BC-03 [GATE-BD-06b Warn]: Palette — no off-brand colors in copy surfaces
BC-04 [GATE-BD-06b Warn]: Voice — copy reviewed against Words to Avoid list
BC-05 [GATE-BD-06b Warn]: Claims — all copy claims present in messaging-hierarchy Proof Ledger
BC-06 [GATE-BD-06b Warn]: Imagery — any images follow Do/Don't from brand-identity
BC-07 [GATE-BD-06b Warn]: CTA language — primary CTA matches brand-identity Key Phrases
```

**Note on lp-launch-qa and lp-design-qa:** These skills were not read (E-13). Plan tasks
for BD-6 must read both skill files and confirm BC-01..07 are genuinely absent before
writing additions.

---

### Prime App Design Branding (BRIK-specific Consolidated Artifact)

**What it is:** A single document that consolidates how BRIK's brand applies specifically
to the Prime guest portal. Not a separate brand — a targeted projection of brand-identity.

**Path:** `docs/business-os/strategy/BRIK/prime-app-design-branding.user.md`

**What it contains:**

1. **Scope declaration** — which surfaces are governed vs not governed (migrated from §11.1
   of the workflow doc, corrected to reference `packages/themes/prime/src/tokens.ts` not
   `tokens.css`, evidence E-11)
2. **Design principles** — the 7 principles from §11.1, migrated here and cross-referenced
   to brand-identity (brand-identity is the source of Personality; principles are derived from it)
3. **Token source reference only** — `packages/themes/prime/src/tokens.ts`. No table of
   values. Rationale for each key token is documented (as in BD-1 above). Pre-commit hook
   or render script may optionally inject a generated snapshot.
4. **Signature patterns** — documented as they accumulate during lp-design-spec feature work
5. **Link to brand-identity** — for non-Prime-specific brand decisions
6. **Review cadence** — update when: token file changes, new surfaces are added, or brand
   principles are revised

**How it is produced:** BD-1 BRIK extension. After running `/lp-brand-bootstrap BRIK` (or
updating the existing BRIK brand-language.user.md → brand-identity.user.md rename), a
companion task produces prime-app-design-branding.user.md by extracting Prime-specific content
from §11.1 and linking to brand-identity for the rest.

---

## Deliverable B — Artifact Taxonomy

```
docs/business-os/strategy/<BIZ>/
├── index.user.md                           [Loop gate reference point]
├── brand-identity.user.md                   [BD-1; replaces brand-language.user.md]
├── competitive-positioning.user.md         [BD-2; separate lifecycle: monthly refresh]
├── messaging-hierarchy.user.md             [BD-3; separate lifecycle: per offer version]
├── creative-voice-brief.user.md            [BD-4; optional; per campaign cycle]
└── prime-app-design-branding.user.md       [BD-1 BRIK extension; BRIK only]

docs/business-os/evidence/<BIZ>/<YYYY-MM>/
├── README.md                               [Index of evidence in this month's pack]
├── <source>-reviews-<YYYY-MM-DD>.txt       [Review quote extracts, attributed]
├── <source>-ads-<YYYY-MM-DD>/              [Ad creative screenshots]
└── <source>-<data>-<YYYY-MM-DD>.csv        [Analytics/booking exports]

packages/themes/<theme>/src/tokens.ts       [Source of truth for all token values]
```

**Artifact lifecycle summary:**

| Artifact | Produced by | Refresh trigger | Active DoD minimum |
|----------|-------------|----------------|--------------------|
| brand-identity | BD-1 (lp-brand-bootstrap) | Strategy change or 90-day staleness | No TBD in core sections, token-source valid |
| competitive-positioning | BD-2 (Deep Research prompt) | Monthly or competitor major move | ≥3 competitors, ≥20 quotes, ≥3 proof rows |
| messaging-hierarchy | BD-3 (synthesis from offer + BD-2) | Offer version change | ≥3 value props, ≥3 proof rows, voice examples |
| creative-voice-brief | BD-4 (after S6B Done) | Channel plan change | All S6B channels covered |
| prime-app-design-branding | BD-1 BRIK extension | Token file change or new surfaces | Token-source valid, surfaces correct |

---

## Deliverable C — Data + Source Inventory

### Per Artifact

#### brand-identity.user.md

| Information needed | Internal source | External source | Evidence pack? |
|--------------------|----------------|----------------|---------------|
| Target demographics | GA4 age/gender; Octorate nationality; operator onsite notes | Booking platform guest demographics | No — reference docs only |
| Device/access patterns | GA4 device category; Cloudflare device type | Industry mobile benchmarks | No |
| Personality hypothesis | Strategy plan §vision, §positioning | Competitor personality analysis (from BD-2) | No |
| Token rationale | `packages/themes/<theme>/src/tokens.ts` (token values are in the file, not copied) | N/A | No |

#### competitive-positioning.user.md

| Information needed | Internal source | External source | Evidence pack? |
|--------------------|----------------|----------------|---------------|
| Competitor features | S2 market intel pack (`latest.user.md`) | Competitor product pages | No |
| Competitor pricing | S2 market intel; parity CSVs (BRIK) | Booking.com, Hostelworld listings | No |
| Customer verbatim quotes | Support/inquiry emails | TripAdvisor, Google Maps, Booking reviews | **Yes — short extracts** |
| Competitor ad samples | — | Meta Ad Library, Google Ads Transparency | **Yes — screenshots** |
| Visual benchmarks | — | Competitor websites/Instagram | **Yes — screenshots** |

#### messaging-hierarchy.user.md

| Information needed | Internal source | External source | Evidence pack? |
|--------------------|----------------|----------------|---------------|
| Pain points | BD-2 customer language harvest | Review platform extracts (in evidence pack) | Citation only |
| Value promises | S2B offer artifact §Pain/Promise mapping | N/A | No |
| Proof/evidence for claims | Historical baseline; booking data; GA4 | Published review scores; review quotes | **Yes — for claims from external sources** |

#### creative-voice-brief.user.md

| Information needed | Internal source | External source | Evidence pack? |
|--------------------|----------------|----------------|---------------|
| Channel format specs | S6B channel plan | Platform ad specs (official docs) | No |
| Measurement hooks | GA4 event taxonomy; S1B/S2A analytics setup | Platform conversion event docs | No |

---

## Deliverable D — Deep Research Prompt Pack

### Prompt 1: Competitor + Positioning Research

**Canonical path:** `docs/business-os/workflow-prompts/_templates/brand-competitor-positioning-prompt.md`

**Template:**

```
---
Prompt-ID: BRAND-DR-01
Stage: BD-2 (Competitive Positioning)
Business: {{BIZ}}
As-of: {{DATE}}
Evidence-pack-target: docs/business-os/evidence/{{BIZ}}/{{YYYY-MM}}/
---

Objective:
Identify USP whitespace, differentiation gaps, and competitor messaging patterns for {{BIZ}}
in {{MARKET}} to populate competitive-positioning.user.md.

Sources to consult (in order):
1. S2 market intel: docs/business-os/market-research/{{BIZ}}/latest.user.md — competitors listed
2. Competitor product/booking pages (top 3-5 from market intel): pricing, features, guarantees
3. Review platforms: TripAdvisor, Google Maps, Booking.com for {{BIZ}} and top 3 competitors
4. Meta Ad Library: search {{COMPETITOR_NAMES}} for active ads in {{TARGET_COUNTRY}}
5. Instagram/TikTok: search {{RELEVANT_HASHTAGS}} for visual aesthetic and demographic data

Compliance: Extract ≤3 sentences per review quote. Save quotes + ad screenshots to
evidence-pack-target. Do not bulk-scrape.

Output format:
1. USP Whitespace — 3-5 bullet points on what no competitor clearly owns
2. Differentiation Matrix — table: Feature/Claim vs ≥3 competitors (Y/N/Partial)
3. Competitor Voice & Tone Audit — for each competitor: tone label + 2-3 example phrases
4. Visual Aesthetic Benchmarks — palette mood, typography style, imagery type per competitor
5. Customer Language Harvest — ≥20 verbatim quotes (pain/delight/surprise) with platform attribution
6. Claims Available for Proof — table: claim, source in evidence pack, confidence (High/Med/Low)
7. Evidence Register — URL + access date for every external citation

Stop conditions (sufficient when):
- ≥3 competitors in Differentiation Matrix
- ≥20 quotes in Customer Language Harvest
- ≥1 ad creative sample per competitor (or confirmed "no ads running")
- Visual benchmark documented for all 3 competitors
- All claims in Evidence Register have a URL
```

---

### Prompt 2: Customer Profiling / ICP

**Canonical path:** `docs/business-os/workflow-prompts/_templates/brand-icp-profiling-prompt.md`

**Template:**

```
---
Prompt-ID: BRAND-DR-02
Stage: BD-1 (Brand Dossier), BD-3 (Messaging)
Business: {{BIZ}}
As-of: {{DATE}}
Evidence-pack-target: docs/business-os/evidence/{{BIZ}}/{{YYYY-MM}}/
---

Objective:
Build an evidence-backed ICP profile for {{BIZ}} — demographics, psychographics,
jobs-to-be-done, buying triggers, language patterns.

Sources to consult (in order):
1. GA4 audience reports: age, gender, geography, device, session behavior
2. Octorate: guest nationality and booking lead-time data (if available)
3. Support/inquiry emails or messages from guests
4. Review platform text: TripAdvisor, Google Maps, Booking reviews for {{BIZ}} and 2-3 competitors
5. Reddit/travel forums: r/solotravel, r/shoestring, r/italy (or relevant) — search {{LOCATION}} + {{PRODUCT_TYPE}}
6. Instagram hashtag: {{RELEVANT_HASHTAGS}} — who is posting, what language they use

Compliance: Short extracts only. No bulk download of forum threads. Attribute every quote.

Output format:
1. ICP Summary Table — 1-2 ICPs: demographics, psychographics, primary JTBD, buying trigger, budget sensitivity
2. Language Patterns — ≥10 phrases customers use to describe the pain this product solves
3. Delight Triggers — what makes them rate 5 stars (from review analysis)
4. Friction Points — what triggers complaints (from review analysis)
5. Purchase Decision Factors — ranked with ≥1 data point per factor
6. Channel Presence — where they discover/decide (platforms)
7. Evidence Register — source + date for every insight

Stop conditions:
- Both ICPs have all 6 ICP Summary Table fields filled with evidence
- ≥10 verbatim customer phrases captured
- Delight and friction points drawn from ≥15 reviews
- Purchase decision factors ranked with ≥1 data point per factor
```

---

### Prompt 3: Claim / Proof Validation

**Canonical path:** `docs/business-os/workflow-prompts/_templates/brand-claim-proof-validation-prompt.md`

**Template:**

```
---
Prompt-ID: BRAND-DR-03
Stage: BD-3 (Messaging Hierarchy — Claims + Proof Ledger)
Business: {{BIZ}}
As-of: {{DATE}}
---

Objective:
Validate that each proposed claim in the messaging-hierarchy.user.md draft has
defensible evidence. Identify unsupported claims and find proof or downgrade the claim.

Claims to validate: [paste from messaging-hierarchy.user.md draft]

Sources to consult:
1. docs/business-os/strategy/{{BIZ}}/{{DATE}}-historical-performance-baseline.user.md
2. Octorate booking data (channel breakdown, lead times, review scores)
3. GA4 goal completions and conversion rates
4. Review platform scores (TripAdvisor, Google Maps) — number of reviews + average score
5. Industry benchmarks if claiming a category position ("best" / "most")

Output format — Claims + Proof Ledger table:
| Claim | Evidence found | Source (file path or URL) | Evidence type | Confidence | Verdict |
Where: Evidence type = Data/Quote/Citation/Benchmark
Verdict = Substantiated / Weakened (provide revised wording) / Remove

Stop conditions:
- Every proposed claim has a ledger row
- All Substantiated claims cite ≥1 source with path or URL
- Weakened claims have suggested rewrites
- Remove-verdict claims are flagged and removed from the messaging-hierarchy draft
```

---

### Prompt 4: Messaging + Creative Angles

**Canonical path:** `docs/business-os/workflow-prompts/_templates/brand-messaging-creative-angles-prompt.md`

**Template:**

```
---
Prompt-ID: BRAND-DR-04
Stage: BD-3 (Messaging), BD-4 (Creative Brief)
Business: {{BIZ}}
As-of: {{DATE}}
---

Required inputs before running:
- competitive-positioning.user.md (USP Whitespace + Customer Language Harvest)
- messaging-hierarchy.user.md draft (value props)
- brand-identity.user.md (personality + voice)

Objective:
Generate ≥6 distinct messaging angles grounded in ICP research and differentiation
whitespace. Inform headline testing, ad creative selection, content strategy.

Sources to consult:
1. BD-2 Customer Language Harvest — verbatim phrases as message seeds
2. BD-2 competitor ad analysis — which angles are already saturated
3. BD-3 value proposition set — what we are actually promising
4. BD-1 brand voice — which style each angle must adopt

Output format:
1. Messaging Angles Table — ≥6 angles: name, hook, target ICP, differentiator, example headline, example CTA
2. Saturation Assessment — which angles are overused by competitors (deprioritize)
3. Recommended primary angle — with rationale grounded in whitespace + ICP
4. Channel fit per angle — which platforms this angle works best on
5. A/B test hypothesis — primary vs one challenger angle

Stop conditions:
- ≥6 distinct angles produced
- Saturation assessed against BD-2 findings
- ≥2 headline examples per angle
- Primary angle recommended with rationale
```

---

### Prompt 5: UX/Design Benchmarking for Prime

**Canonical path:** `docs/business-os/workflow-prompts/_templates/brand-ux-design-benchmark-prime-prompt.md`

**Template:**

```
---
Prompt-ID: BRAND-DR-05
Stage: BD-1 (brand-identity visual identity rationale), pre-BD-5 (lp-design-spec)
Business: BRIK
As-of: {{DATE}}
Evidence-pack-target: docs/business-os/evidence/BRIK/{{YYYY-MM}}/
---

Objective:
Establish the mobile UX and visual design quality bar for Prime, benchmarked against
best-in-class apps serving the same demographic (99% female, 18-25, mobile-only, travel/lifestyle).

Benchmark apps to analyze (≥4 required):
- Airbnb (iOS/Android): onboarding, discovery, booking confirmation UX
- Pinterest: card layouts, color warmth, font choices, scroll interactions
- Hostelworld: guest-facing hospitality on mobile (peer competitor)
- Instagram: navigation patterns, thumb-zone conventions, image presentation
- Glossier mobile site: color warmth, CTA style, typography (optional 5th)

Document for each benchmark:
- Dominant palette mood (warm/cool, saturated/muted)
- Typography classification (geometric sans, humanist, slab, etc.)
- Primary interaction pattern (tab bar, bottom sheet, card stack, etc.)
- Radius/shadow style (sharp/medium/generous)
- Animation style (snappy/fluid/minimal)
- Evidence of demographic fit (app store reviews or research citations if available)

Output format:
1. Benchmark comparison table (app × design attribute)
2. "Minimum quality bar" — what Prime must match to feel native-quality on mobile
3. "Aspirational bar" — what Prime could achieve to feel premium
4. Token implications — for each benchmark finding, which Prime token it informs
   (reference tokens.ts token names, not values)
5. Patterns to avoid — ≥3 design choices from benchmarks that would feel off-brand for Prime

Stop conditions:
- ≥4 benchmark apps documented with all 6 attributes
- Minimum quality bar defined with specific token name recommendations
- ≥3 "patterns to avoid" with rationale
```

---

## Deliverable E — Gap Analysis

### Prioritized Gap Table

**P1 = blocks launch / P2 = blocks scale / P3 = hygiene**

| Gap | Current workflow area | Missing process | Missing inputs | Proposed step | New artifact(s) | Gate | Priority |
|-----|----------------------|----------------|----------------|--------------|-----------------|------|---------|
| G-01 | S1 Readiness | No brand identity gate — S1 can pass without brand-identity | Target audience hypothesis | Add GATE-BD-01 to startup-loop SKILL.md advance rules | brand-identity.user.md (Draft) | GATE-BD-01 | **P1** |
| G-02 | S2 Market intelligence | Competitive positioning not extracted as brand artifact | S2 market intel pack, evidence pack | BD-2 required before S2B Done | competitive-positioning.user.md | GATE-BD-02 | **P1** |
| G-03 | S2B Offer design | No brand-identity input; lp-offer skill does not accept it | brand-identity.user.md (Active) | Read lp-offer SKILL.md; add brand-identity as recommended input | None (consume existing) | Recommended input, not hard gate | **P1** |
| G-04 | S2B Offer design | No messaging hierarchy produced as part of offer stage | Offer artifact, BD-2, customer language | BD-3 as S2B sub-deliverable; update S2B produced_keys in loop-spec.yaml | messaging-hierarchy.user.md | GATE-BD-03 | **P1** |
| G-05 | S9B QA gates | No brand compliance checklist in lp-launch-qa or lp-design-qa | brand-identity (Active), messaging-hierarchy (Active) | BD-6: add BC-01..07 to QA report; read both skill files first | BC-01..07 pass/fail table in QA report | GATE-BD-04, BD-05, BD-06a (hard) / BD-06b (warning) | **P1** |
| G-06 | All non-BRIK businesses | No brand-identity for HEAD, PET, HBAG, XA | Strategy plans + demographic hypothesis | BD-1 bootstrapped at each business's S1 entry | brand-identity.user.md per BIZ | GATE-BD-01 per BIZ | **P1** |
| G-07 | Section 11 (Design Policy) | Standalone appendix with no stage key or artifact contract | N/A (process redesign) | Retire §11; migrate content to prime-app-design-branding.user.md; embed BD-1..BD-6 in §4 stage table | prime-app-design-branding.user.md | N/A (editorial change) | **P2** |
| G-08 | S6B Channel + GTM | Channel plan not informed by brand voice (unknown — lp-channels not read) | messaging-hierarchy (Active), brand-identity (Active) | Read lp-channels SKILL.md; add brand inputs if absent | None (consume existing) | TBD after reading skill | **P2** |
| G-09 | S7 Fact-find / lp-design-spec | lp-design-spec has no brand-identity Active prerequisite | brand-identity.user.md (Active) | Add GATE-BD-07 check to lp-design-spec | None (gate enhancement) | GATE-BD-07 | **P2** |
| G-10 | loop-spec.yaml | S2B produced_keys only has `offer` | messaging-hierarchy as sub-deliverable | Update loop-spec.yaml: S2B produced_keys = `["offer", "messaging_hierarchy"]` | Updated loop-spec.yaml | N/A (spec change) | **P1** |
| G-11 | workflow-prompts/_templates/ | No brand-specific Deep Research prompt templates | N/A | Create 5 templates (BRAND-DR-01..05) | 5 prompt template files | Referenced from §10 Prompt Hand-Off Map | **P2** |
| G-12 | Evidence storage | No canonical evidence store for raw data exports | N/A | Create `docs/business-os/evidence/` convention | evidence/<BIZ>/<YYYY-MM>/ directory + README template | Compliance guardrails (soft; no hard gate) | **P2** |
| G-13 | Token mirroring (BRIK) | brand-language.user.md copies token values from tokens.ts; already diverged (E-10) | tokens.ts as source of truth | Rename brand-language.user.md → brand-identity.user.md; remove duplicated values; add token rationale section only | Updated brand-identity.user.md | GATE-BD-07 (brand-identity Active requires token-source valid) | **P1** |
| G-14 | §11 path inconsistency | §11.1 references `tokens.css`; actual file is `tokens.ts` (E-11) | N/A | Fix path reference when retiring §11 | N/A (editorial fix) | N/A | **P3** |
| G-15 | Standing refresh | No brand refresh cadence | Updated competitor landscape | Add brand-identity quarterly review to §12 Standing Refresh table | Updated brand-identity.user.md | GATE-BD-08 (warning at S10) | **P3** |

### Dependency Ordering (what must exist before build/launch)

```
P1 chain (sequential within BRIK):
G-13 (fix token mirroring in brand-identity) → G-01 (brand-identity at Draft) → G-02 (competitive positioning)
→ G-04 (messaging hierarchy) → G-10 (loop-spec update) → G-05 (QA gates)

P1 chains (parallel, one per non-BRIK business):
G-06 HEAD ∥ G-06 PET ∥ G-06 HBAG — independent, each needs strategy plan as input

P1 prerequisite (must read first, before writing gate changes):
G-03 (read lp-offer full SKILL.md before adding input)
G-05 (read lp-launch-qa + lp-design-qa before adding BC checklist)

P2 gaps depend on P1 being done:
G-08 (lp-channels read + brand inputs added) requires G-04 (messaging hierarchy exists)
G-07 (retire §11) requires G-13 (brand-identity complete) + prime-app-design-branding.user.md produced
G-09 (lp-design-spec gate) can be added anytime

P2 gaps that can run in parallel:
G-11 (prompt templates) — no dependencies; can be created immediately
G-12 (evidence directory convention) — no dependencies; can be set up immediately
```

---

## Hypothesis & Validation Landscape

This module produces process artifacts, not market hypotheses. Its "hypotheses" are process
design bets:

| # | Process Hypothesis | Falsification signal | Cost to test |
|---|-------------------|---------------------|--------------|
| H1 | A 1-day Brand Dossier sprint at S1 is achievable and produces a useful Draft | First BD-1 run for HEAD or PET (try it) | Low |
| H2 | Gating S2B Done on messaging-hierarchy Draft does not materially slow the loop | Measure time-to-S2B Done before vs after | Low (observe) |
| H3 | lp-channels does not already consume brand voice (i.e., gap G-08 is real) | Read lp-channels SKILL.md | Near-zero |
| H4 | BC-01 (token compliance) can be checked programmatically from the QA skill | Check lp-design-qa for existing hardcoded-value detection | Low |

All four hypotheses are testable in the investigation phase of the first plan tasks (read
skill files). No market spend required.

---

## Delivery & Channel Landscape

- **Audience:** Pete (operator/owner) as both producer and consumer of all brand artifacts
- **Channel:** Repository markdown files; Business OS D1 stage docs
- **Approval path:** Single-owner; Pete approves via startup-loop advance confirmation
- **Compliance:** External evidence subject to guardrails defined in Evidence Pack section above
- **Measurement:** Gate GATE-BD-01..08 pass/fail rates observable in S1/S2B/S9B advance logs.
  Qualitative: does messaging-hierarchy reduce copy iteration cycles in S9 builds?

---

## Confidence Inputs (for /lp-do-plan)

- **Implementation:** 78%
  - Strong: Loop spec and advance rules fully read. Branding infrastructure well-understood.
    lp-brand-bootstrap skill exists and covers BD-1. Artifact schemas are concrete.
  - Capping at 78%: lp-offer, lp-channels, lp-launch-qa, lp-design-qa SKILL.md files not read
    in full (E-12, E-13). Plan tasks for gate additions to these skills are INVESTIGATION tasks
    until those files are read. Build task confidence cannot exceed 80% until confirmed.

- **Approach:** 77%
  - Strong: Option A for BD-3 resolves the fan-out conflict cleanly. Brand Dossier consolidation
    reduces sprawl without losing lifecycle separation. Gate policy table resolves severity
    inconsistency.
  - Capping at 77%: BD-4 (creative-voice-brief) timing and gating depend on lp-channels contract
    not yet read. Strategy index pattern is proposed but unvalidated against BOS card
    reading patterns.

- **Impact:** 88%
  - High confidence: Gap analysis is evidence-backed (E-01..E-15). All gaps are attributable
    to specific missing artifacts or missing gates. No speculative gaps.
  - Minor uncertainty: Whether lp-design-qa already implements BC-01 (would eliminate G-05
    for the hard gate).

- **Delivery-Readiness:** 82%
  - Clear owner (Pete), clear artifact paths, clear skill routing for all BD stages.
  - lp-brand-bootstrap runs for non-BRIK businesses are straightforward (skill exists).
  - Gaps requiring skill reads before implementation: G-03, G-05, G-08 (≤4 file reads).

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| BD-3 (messaging hierarchy as S2B sub-deliverable) adds unexpected latency | Medium | Medium | Allow S2B Done with messaging at Draft (not Active); Active required only at S9B via GATE-BD-05 |
| lp-offer SKILL.md (beyond first 80 lines) has incompatible input handling for brand-identity | Low | Medium | Read full skill file in plan investigation task before writing the gate; if incompatible, keep as "recommended" not "required" |
| lp-design-qa already implements BC-01 token compliance (G-05 partial overlap) | Medium | Low (positive risk) | Read skill file; if check exists, reference it instead of duplicating |
| Brand-dossier quarterly review cadence not followed → stale brand → GATE-BD-08 warnings ignored | Medium | Low | Standing refresh warning at S10 (soft gate); if warnings ignored 3+ cycles, escalate to hard gate at next S9B |
| BRIK brand-language.user.md rename (→ brand-identity.user.md) breaks existing references | Medium | Low | grep for `brand-language.user.md` references before renaming; update all references in same PR |
| Evidence pack files grow large over time | Low | Low | Enforce minimum-necessary rule at pack creation; add gitignore pattern for binary files >500KB |

---

## Planning Constraints & Notes

- All `.user.md` artifact files require an `.user.html` companion rendered via
  `pnpm docs:render-user-html`. Include in task acceptance criteria.
- loop-spec.yaml update (S2B produced_keys) requires understanding of whether the control plane
  validates produced_keys against a schema — read control-plane code before changing.
- Section 11 retirement (G-07) is an editorial change to `startup-loop-workflow.user.md`.
  Re-render HTML companion after change.
- No new skill files required: BD-1 = lp-brand-bootstrap (existing, gate-enhanced); BD-2/BD-3/BD-4
  = new prompt templates + synthesis agent runs; BD-5 = lp-design-spec gate-enhanced; BD-6 =
  lp-launch-qa/lp-design-qa checklist additions.
- BRIK brand-language.user.md → brand-identity.user.md rename: update all references in:
  - `.claude/skills/lp-brand-bootstrap/SKILL.md` (references brand-language.user.md)
  - `startup-loop-workflow.user.md` §11 (when retiring)
  - `docs/plans/prime-design-refresh-fact-find.md` (references brand-language)
  - Any other docs referencing the BRIK brand-language path

## Suggested Task Seeds (Non-binding)

1. **INVESTIGATION**: Read lp-offer, lp-channels, lp-launch-qa, lp-design-qa SKILL.md files fully.
   Confirm whether brand inputs absent; document findings. Gates S2 (G-03, G-05, G-08) build.
2. **INVESTIGATION**: Read loop-spec.yaml control-plane code to confirm produced_keys change safety.
3. **EDITORIAL**: Create evidence directory structure + README template.
4. **EDITORIAL**: Create 5 Deep Research prompt templates (BRAND-DR-01..05).
5. **EDITORIAL**: Create `index.user.md` template for strategy directory.
6. **EDITORIAL**: Update loop-spec.yaml S2B produced_keys → `["offer", "messaging_hierarchy"]`.
7. **EDITORIAL**: Add GATE-BD-01 to startup-loop SKILL.md advance rules.
8. **EDITORIAL**: Update startup-loop-workflow.user.md §4 to embed BD-1..BD-6; retire §11 content.
9. **EDITORIAL**: Create prime-app-design-branding.user.md for BRIK (extract from §11.1, correct path).
10. **EDITORIAL**: Rename BRIK brand-language.user.md → brand-identity.user.md; remove mirrored token values; add token rationale section; update all references.
11. **BUILD**: Run lp-brand-bootstrap for HEAD, PET, HBAG (three parallel agents).
12. **BUILD**: Add GATE-BD-07 to lp-design-spec (after confirming full skill contract).
13. **BUILD**: Add BC-01..07 checklist to lp-launch-qa / lp-design-qa (after confirming skills).
14. **EDITORIAL**: Add brand-identity quarterly refresh to §12 Standing Refresh Prompts table.

---

## Execution Routing Packet

- **Primary execution skill:** `/lp-do-build` (orchestrator mode — multi-deliverable)
- **Supporting skills:**
  - `/lp-brand-bootstrap` — BD-1 for HEAD/PET/HBAG (BRIK already has brand-language, rename/update)
  - `/lp-design-spec` — BD-5 gate enhancement (after confirming skill contract)
  - Research + editorial tasks: Write, Edit, Read tools — no skill needed
- **Deliverable acceptance package** (all required before card moves to Done):
  - 5 prompt template files exist at `docs/business-os/workflow-prompts/_templates/brand-DR-0{1-5}.md`
  - `startup-loop-workflow.user.md` §4 includes BD-1..BD-6 rows; §11 retired or redirected
  - `docs/business-os/strategy/BRIK/prime-app-design-branding.user.md` exists, Status: Active
  - `docs/business-os/strategy/BRIK/2026-02-12-brand-identity-dossier.user.md` exists (renamed from brand-language), Status: Active, no hand-copied token values
  - GATE-BD-01 present in startup-loop SKILL.md advance rules
  - loop-spec.yaml S2B produced_keys includes `messaging_hierarchy`
  - brand-identity.user.md exists for HEAD, PET, HBAG (Status: Draft minimum)
  - `docs/business-os/strategy/<BIZ>/index.user.md` exists for BRIK (and HEAD/PET/HBAG)
  - `docs/business-os/evidence/` directory with README template created
  - All references to `brand-language.user.md` updated or redirected
- **Post-delivery measurement:**
  - Next S1 run for any business: GATE-BD-01 blocks if brand-identity missing (testable immediately)
  - Next S2B run: GATE-BD-03 blocks if messaging-hierarchy Draft missing (testable in BRIK loop)
  - Next S9B run: BC-01..BC-07 table appears in QA report

---

## Evidence Gap Review

### Gaps Addressed in This Revision

- **BD-3/S6B fan-out conflict:** Resolved by choosing Option A. Loop-spec.yaml (E-03) confirmed
  the fan-out is a hard invariant. BD-3 is now a S2B sub-deliverable. Inconsistency eliminated.
- **Token mirroring drift:** Confirmed by E-10 (actual discrepancy: `6 78% 47%` in tokens.ts vs
  `6 78% 57%` in brand-language.user.md). Token rationale approach specified; no hand-copied values.
- **Gate severity inconsistency:** All gates now in a single Gate Policy table. Severity is defined
  once; all sections reference by gate ID.
- **Unverified "verified" claims:** Downgraded to "indicated by" for E-12, E-13. Evidence
  confidence column added to Evidence Register.
- **lp-offer full contract:** Partially confirmed (first 80 lines, E-05). Brand-language absent
  from required inputs confirmed. Full contract verification deferred to plan task.
- **Section 11 path inconsistency:** Found and documented (E-11: `tokens.css` vs `tokens.ts`).
  Added as G-14 in gap analysis.
- **Artifact sprawl:** Reduced from 5 separate files to 3 primary + 1 index + 1 optional.
  Brand Dossier consolidates audience/personality/voice/visual identity. Competitive positioning
  and messaging hierarchy remain separate (genuinely different refresh lifecycles).

### Confidence Adjustments

- **Implementation:** 85% → 78% — lp-channels, lp-launch-qa, lp-design-qa not read;
  gate addition tasks are INVESTIGATION until those files confirmed.
- **Approach:** 80% → 77% — BD-4 depends on lp-channels contract unknown; index.user.md
  pattern unvalidated against BOS card-read behavior.

### Remaining Assumptions (flagged for /lp-do-plan)

- **lp-offer additional input handling:** Assumed brand-identity can be added as a recommended
  input without breaking existing lp-offer workflow. Must be verified by reading full SKILL.md.
- **lp-channels brand consumption:** Assumed brand-identity and messaging-hierarchy are absent
  from lp-channels (indicated by, not confirmed — E-12). If already present, G-08 is resolved.
- **lp-launch-qa BC-01 overlap:** Assumed token compliance is not already checked. If it exists,
  BC-01 should reference it rather than duplicate.
- **loop-spec.yaml produced_keys extensibility:** Assumed control plane accepts new keys in S2B
  produced_keys without schema breakage. Must verify before plan task commits the change.
- **strategy/index.user.md machine-readability:** Assumed gates can parse index.user.md
  programmatically to read artifact Status. Requires verifying how gate-check scripts are
  implemented (if they exist) or specifying a parsing contract in the plan.

---

## Planning Readiness

- **Status: Ready-for-planning**
- **Blocking items:** None. Open assumptions are scoped as INVESTIGATION tasks within the plan.
- **First plan task:** Read lp-offer, lp-channels, lp-launch-qa, lp-design-qa SKILL.md files fully.
  All gate-addition build tasks are blocked until those 4 reads complete.
- **Recommended next step:** `/lp-do-plan startup-loop-branding-design-module`
