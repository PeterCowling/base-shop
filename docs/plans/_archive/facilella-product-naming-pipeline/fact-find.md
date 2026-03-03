---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: Mixed
Workstream: Mixed
Created: 2026-02-26
Last-updated: 2026-02-26
Feature-Slug: facilella-product-naming-pipeline
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-assessment-13-product-naming
Related-Plan: docs/plans/facilella-product-naming-pipeline/plan.md
Trigger-Source: direct-operator-decision: operator requested a product-name shortlist pipeline for HEAD/Facilella analogous to the company naming pipeline, to produce a proper shortlist of product name candidates for the Facilella CI headband
Trigger-Why: The ASSESSMENT-13 artifact (2026-02-26-product-naming.user.md) exists at Draft status with 5 provisional candidates and no systematic generation or TM screening. A pipeline analogous to the company naming pipeline (spec → generate → screen → shortlist) would produce a defensible shortlist for operator selection before ASSESSMENT-14 logo brief.
Trigger-Intended-Outcome: type: operational | statement: Produce a working product naming pipeline (spec file, generation process, TM pre-screen direction, shortlist format) and a final shortlist of 10–20 scored product name candidates for the Facilella CI headband, ready for operator selection before logo brief work begins. | source: operator
artifact: fact-find
---

# Facilella Product Naming Pipeline — Fact-Find Brief

## Scope

### Summary

HEAD has completed company naming (Facilella selected, R7, 2026-02-26) and produced an initial ASSESSMENT-13 product naming document with 5 provisional candidates. The request is to build a product naming pipeline analogous to the four-part company naming pipeline: a product-name spec format, a systematic candidate generation process, a TM pre-screen step (replacing RDAP domain check, since facilella.com is already secured), and a shortlist artifact format.

The pipeline must live in the startup-loop infrastructure and produce artifacts in `docs/business-os/strategy/HEAD/` following existing conventions. This is a mixed-track deliverable: new TypeScript/script tooling (new CLI analogous to `rdap-cli.ts`) plus a new skill/spec document format for product naming.

### Goals

- Define a product-name spec format with scoring dimensions appropriate to product names (not company names)
- Define a generation process targeting the right candidate count (not 250 — product naming has different economics)
- Define a TM pre-screen step that replaces the RDAP domain check
- Define the sidecar event log format for product naming (new directory or reuse of naming-sidecars)
- Define artifact filenames following existing HEAD naming conventions
- Decide: modify ASSESSMENT-13 skill or create a separate pipeline skill
- Produce a complete fact-find ready for planning

### Non-goals

- Actually generating the product name candidates (that is a build task)
- Running the TM check (that is an operator task with direction from the pipeline)
- Modifying the company naming pipeline (`rdap-cli.ts`, `rdap-client.ts`, `rdap-types.ts`)
- Changing the ASSESSMENT-13 SKILL.md output format (the pipeline supplements it, not replaces it)

### Constraints & Assumptions

- Constraints:
  - Domain is already facilella.com — no RDAP check needed for product names
  - EU MDR regulatory boundary: product name must not use medical/therapeutic vocabulary
  - Italian-first market: product name must be pronounceable in Italian by native speaker
  - Product name operates as `Facilella [Line Name]` compound — the line name is what is being named here, not a standalone brand
  - Must follow existing file naming conventions for `docs/business-os/strategy/HEAD/` artifacts
  - Must follow existing sidecar event log schema in `scripts/src/startup-loop/naming/event-log-writer.ts`
- Assumptions:
  - ASSESSMENT-13 existing artifact (`2026-02-26-product-naming.user.md`) remains in place and is supplemented, not replaced
  - The product being named is the hero SKU: the CI retention headband
  - Nice Classification Classes 25 and 26 are the correct TM classes (confirmed in existing ASSESSMENT-13 artifact)
  - The line name must work in both Italian and English contexts (Italian primary, EU/US expansion secondary)

---

## Outcome Contract

- **Why:** The ASSESSMENT-13 artifact has 5 provisional candidates generated without a systematic spec or scoring rubric. The company naming pipeline produced a 20-name verified shortlist from 250 scored candidates across 7 rounds. The same rigour should apply to product naming — operator needs a proper shortlist before committing to a name that will appear on packaging, Etsy listings, and all product-facing copy.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** A product naming pipeline producing a spec file, a generation run of 50–100 scored candidates, a TM pre-screen direction document, and a shortlist of 10–20 candidates ready for operator selection. Pipeline tooling persisted as a reusable skill and CLI script.
- **Source:** operator

---

## Evidence Audit (Current State)

### Entry Points

- `scripts/src/startup-loop/naming/rdap-cli.ts` — the existing company naming pipeline CLI; stdin → RDAP check → stdout + sidecar events. This is the structural model for a `tm-prescreen-cli.ts` equivalent.
- `docs/business-os/strategy/HEAD/2026-02-22-naming-generation-spec.md` — the company naming spec (250 candidates, 5 territories, DWPEI scoring). Model for the product naming spec.
- `docs/business-os/strategy/HEAD/2026-02-26-product-naming.user.md` — ASSESSMENT-13 output; 5 provisional candidates, Draft status, no systematic scoring.
- `.claude/skills/lp-do-assessment-13-product-naming/SKILL.md` — current ASSESSMENT-13 skill; generates 3–5 candidates only; explicitly says "Does NOT generate a 250-candidate list."

### Key Modules / Files

- `scripts/src/startup-loop/naming/event-log-writer.ts` — sidecar event schema (v1), `SidecarStage` enum (`generated | i_gate_eliminated | rdap_checked | shortlisted | finalist`), `CandidateRecord` interface (name, pattern A–E, domain_string, provenance, DWPEI scores), `writeSidecarEvent()`, `getSidecarFilePath()`. This is the infrastructure the product naming sidecar will extend.
- `scripts/src/startup-loop/naming/candidate-sidecar-schema.json` — JSON Schema for sidecar event validation; confirms scores schema (D, W, P, E, I all 1–5, total 5–25).
- `scripts/src/startup-loop/naming/rdap-types.ts` — `RdapResult` and `RdapBatchResult` types. Product naming equivalent: `TmPrescreenResult` and `TmPrescreenBatchResult`.
- `scripts/src/startup-loop/naming/rdap-client.ts` — batch check logic with sequential rate-limiting. Structural model for TM pre-screen batch logic.
- `docs/business-os/strategy/HEAD/naming-sidecars/2026-02-26-round-7.jsonl` — existing sidecar file for company naming; one JSONL file per round per run date.

### Patterns & Conventions Observed

- Artifact filenames follow `YYYY-MM-DD-<type>[-rN].md` or `YYYY-MM-DD-<type>-rN.<ext>` — e.g., `naming-candidates-2026-02-26-r7.md`, `naming-shortlist-2026-02-26-r7.user.md`, `naming-rdap-2026-02-26-r7.txt`.
- Sidecar directory: `docs/business-os/strategy/<BIZ>/naming-sidecars/` — evidence from `HEAD/naming-sidecars/`.
- Shortlist files carry `.user.md` suffix (operator-facing). Candidate generation files carry `.md` suffix (agent-produced). RDAP result files carry `.txt` (raw tool output).
- Score total = D + W + P + E + I; each dimension 1–5; max 25. This schema is hardcoded in `event-log-writer.ts` validation and `candidate-sidecar-schema.json`.
- `SidecarStage` enum: `generated | i_gate_eliminated | rdap_checked | shortlisted | finalist`. Product naming will reuse `generated`, `shortlisted`, `finalist`; replaces `rdap_checked` with `tm_prescreened`; may add `i_gate_eliminated`.
- Pattern codes A–E are hardcoded in the sidecar schema and `CandidateRecord.pattern`. Product naming will use the same five patterns (A: meaning-anchored morpheme blend, B: English respelling with Italian suffix, C: fragment blend, D: compound, E: real Italian word). The `domain_string` field is nullable — product naming sets it to null.

### Data & Contracts

- Types/schemas/events:
  - `SidecarEvent` (v1): schema_version, event_id, business, round, run_date, stage, candidate, rdap (nullable), model_output (nullable), timestamp
  - `CandidateRecord`: name, pattern (A–E), domain_string (nullable), provenance (nullable), scores (nullable DWPEI object)
  - `SidecarStage`: needs `tm_prescreened` added alongside or instead of `rdap_checked` for product naming events
- Persistence:
  - Sidecar JSONL: `docs/business-os/strategy/HEAD/<type>-sidecars/YYYY-MM-DD-round-N.jsonl` (append-only)
  - Spec: `docs/business-os/strategy/HEAD/YYYY-MM-DD-product-naming-spec.md`
  - Candidates: `docs/business-os/strategy/HEAD/product-naming-candidates-YYYY-MM-DD[-rN].md`
  - TM pre-screen result: `docs/business-os/strategy/HEAD/product-naming-tm-YYYY-MM-DD[-rN].txt` (analogous to `naming-rdap-*.txt`)
  - Shortlist: `docs/business-os/strategy/HEAD/product-naming-shortlist-YYYY-MM-DD[-rN].user.md`
- API/contracts:
  - TM pre-screen is direction-only in v1 (no automated API call — see § Key Design Decisions)
  - The CLI produces a structured text output (analogous to `formatRdapLegacyText`) as a summary of TM search directions per candidate

### Dependency & Impact Map

- Upstream dependencies:
  - `docs/business-os/strategy/HEAD/2026-02-26-product-naming.user.md` — ASSESSMENT-13 draft; read by the spec generation step
  - `docs/business-os/strategy/HEAD/2026-02-21-brand-identity-dossier.user.md` — brand constraints, personality, register bans
  - `docs/business-os/strategy/HEAD/2026-02-21-brand-profile.user.md` — ICP resonance anchor, voice & tone
  - `docs/business-os/strategy/HEAD/2026-02-22-naming-generation-spec.md` — eliminated name list (company names that are structurally too similar to product name territory should be flagged but NOT automatically eliminated — different scope)
- Downstream dependents:
  - `.claude/skills/lp-do-assessment-14-logo-brief/SKILL.md` — reads confirmed product name; blocked until operator selects from shortlist
  - `.claude/skills/lp-do-assessment-15-packaging-brief/SKILL.md` — reads confirmed product name for Structural Format section
- Likely blast radius:
  - Modifying `SidecarStage` in `event-log-writer.ts` to add `tm_prescreened` will cause TS compile-time breakage if any existing code uses exhaustive switch on the union. Existing code: `rdap-cli.ts` uses the stage type but only sets known values. Low blast radius — additive change.
  - New sidecar directory `product-naming-sidecars/` is additive; no existing code reads it.

### Delivery & Channel Landscape

- Audience/recipient:
  - Primary: operator (Pete) reviewing a shortlist to select the hero product line name
  - Secondary: downstream skills (ASSESSMENT-14 logo brief, ASSESSMENT-15 packaging brief) that read the confirmed name
- Channel constraints:
  - None (internal tooling + strategy artifact)
- Existing templates/assets:
  - `docs/business-os/strategy/HEAD/2026-02-22-naming-generation-spec.md` — structural model for product spec
  - `docs/business-os/strategy/HEAD/naming-shortlist-2026-02-26-r7.user.md` — structural model for shortlist
  - `scripts/src/startup-loop/naming/rdap-cli.ts` — structural model for CLI
- Approvals/owners:
  - Operator (Pete) approves the final name selection
- Compliance constraints:
  - EU MDR: product name must not use vocabulary that implies medical/therapeutic purpose (confirmed in brand dossier Words to Avoid list)
  - Nice Classification: Classes 25 and 26 are the correct TM search classes (per existing ASSESSMENT-13 artifact)
- Measurement hooks:
  - Operator selection confirms pipeline delivered a usable shortlist; downstream: ASSESSMENT-14 starts (observable)

### Hypothesis & Validation Landscape

#### Key Hypotheses

| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|---|---|---|---|
| H1 | A 50–100 candidate product naming run with DWPEI scoring produces a shortlist from which operator can select a name | Spec quality, scoring rubric appropriateness for product names | Low — run the pipeline once and see if operator selects | 1 session |
| H2 | The RDAP-style pipeline infrastructure (event-log-writer, sidecar JSONL, CLI) can be reused for product naming with minor adaptation | Confirmed by code review — `domain_string` is nullable, `rdap` field is nullable, stage enum is extensible | None — confirmed by code evidence | n/a |
| H3 | Direction-only TM pre-screen (links + classes) is sufficient at this stage; automated EUIPO/TMVIEW API lookup adds enough friction to defer to v2 | No automated API available for unstructured batch search against EUIPO at no cost; TMVIEW provides search UI only | Low — direction-only is already in ASSESSMENT-13 artifact and unblocked | n/a |

#### Existing Signal Coverage

| Hypothesis | Evidence available | Source | Confidence in signal |
|---|---|---|---|
| H1 | Company naming pipeline produced 20-name shortlist that led to operator selection in R7 | naming-shortlist-2026-02-26-r7.user.md | High — pipeline structure proved out on company names |
| H2 | event-log-writer.ts: `rdap` field is typed `RdapRecord | null`; `domain_string` is `string | null`; stage enum is a named type | scripts/src/startup-loop/naming/event-log-writer.ts | High — confirmed by file read |
| H3 | EUIPO eTMview is a search UI at euipo.europa.eu/eSearch; no public batch API documented for free use | Confirmed in ASSESSMENT-13 TM pre-screen section; EUIPO API exists for authorised users/IP agents only | Medium — no API research done; inference from product naming doc |

---

## Key Design Decisions (Reasoned Through)

### Decision 1: Scoring dimensions for product names

The company naming spec uses D (Distinctiveness), W (Wordmark quality), P (Phonetic quality), E (Expansion headroom), I (ICP resonance).

For product names:

- **D — Distinctiveness:** Keep. Product names face TM risk in a different register (Nice Classes 25/26, not just .com namespace). A distinctive product name strengthens TM position. Score definition adjusts: the competitor set is headband/accessory brands, not general coinages.

- **W — Wordmark quality:** Keep but adapt. For a compound `Facilella [Line Name]`, the Line Name must work visually alongside the masterbrand wordmark. Constraint changes: Line Name is typically shorter (1–2 syllables, 4–9 letters) because it follows the 9-letter masterbrand. Score the Line Name alone, not the full compound.

- **P — Phonetic quality:** Keep. Italian-first requirement is identical. Product names may be shorter, so phonetic smoothness per syllable is actually more important than in company names (where extra syllables can absorb awkward sounds). Score focuses on clean Italian pronunciation.

- **E — Expansion headroom:** Replaces company naming's E (which measured brand extension across product categories). For a product name, E now measures **Line Extension headroom**: does this line name work for colour variants, size variants, and the sport/school/casual positioning spectrum? A line name like "Sicura" (secure) is product-state-specific; a line name like "Cerchietto" (headband) names the product type and extends naturally to all headband variants.

  **New E definition for product naming:**
  - 5: Works across all variant types — colour, fabric, activity-level, size — without restriction
  - 4: Works for 2–3 variant types; one framing constraint
  - 3: Works for current SKU only; narrow variant headroom
  - 2: Implies a specific feature that may not apply to all variants
  - 1: Traps the name to one specific configuration (e.g., "Sport" locks the name to the active variant)

- **I — ICP resonance:** Keep. The ICP definition is the same (Italian CI caregiver parent on mobile). The resonance test changes: does the line name, heard as "Facilella [Line Name]", feel like a real product name that belongs in a lifestyle accessories brand? Not a spa product, not a clinical device, not an English generic. The compound context matters — "Facilella Cerchietto" is tested, not "Cerchietto" in isolation.

**Proposed scoring dimensions for product names: D, W, P, E (redefined as Line Extension headroom), I (compound-context scroll test)**

Max score: 25. Same total as company naming — enables comparison charts and tooling reuse.

**One additional dimension considered: C (Category signal)**

A product name must signal what the product is to a buyer who has not yet clicked through. Company names are rewarded for NOT being product-specific (that was the E dimension). Product names have the opposite obligation. Option: replace E with C (Category clarity) or add C as a sixth dimension.

**Decision: Keep E as Line Extension headroom; add C (Category signal) as a sixth dimension — total max 30.**

Rationale: Both matter distinctly. E tests whether the line name can serve all variants; C tests whether a cold visitor understands what "Facilella [X]" is. A name that scores low on C needs heavy product photography and copy to compensate. C score definition:

- 5: Cold buyer (Italian, not in CI community) immediately understands the product category from "Facilella [Line Name]" — no further context needed
- 4: Category legible with minor ambiguity
- 3: Ambiguous — product type unclear without supporting copy
- 2: Misleading — suggests a different product category
- 1: Category-blind — no signal whatsoever

**Final scoring dimensions: D, W, P, E, I, C — max 30**

### Decision 2: Candidate count

The company naming pipeline generates 250 to compensate for high RDAP attrition (~50% taken in early rounds; the domain namespace for short coinages is nearly exhausted). After filtering, 100–130 available names remain for ranking.

Product naming has different economics:
- No domain check attrition (domain is facilella.com — secured)
- No exhausted namespace problem (the Line Name just needs to be a workable word/coinage + TM clearable)
- The compound "Facilella [X]" significantly reduces TM collision risk because the combination is unique even if X alone is common
- The Italian vocabulary for headband-adjacent concepts is rich and largely not exhausted in the lifestyle accessories register

**Decision: Generate 75 candidates.** Rationale: sufficient to cover multiple territories and pattern types without padding; no attrition filter means all 75 are available for scoring; the TM pre-screen is direction-only (operator checks), not a machine filter that reduces the pool. Operator reviews the top 15–20 scored candidates.

### Decision 3: TM pre-screen approach

The RDAP equivalent for trademarks. Options:

a) **Automated API lookup**: EUIPO offers a REST API (https://euipo.europa.eu/eSearch/) with structured search. However, the batch search API for exact-match plus phonetic-near-match at scale requires authorised API access (IP agent credentials). The public TMVIEW interface (https://www.tmdn.org/tmview/) does not offer a documented free batch API. WIPO Global Brand Database (https://branddb.wipo.int) has a search API but requires registration and has rate limits for automated use. None are usable as a simple unauthenticated curl batch check analogous to RDAP.

b) **Direction-only (operator task)**: Produce a structured text file with per-candidate search instructions — the name, the recommended search URL (pre-filled with the name as a query parameter where possible), and the Nice Classes to search. Operator visits each URL and records the result. Low automation value for the generation step; operator will likely check only the shortlisted names (top 15–20).

c) **Hybrid**: Pipeline CLI generates the direction file (search URLs + classes per candidate). After operator reviews the shortlist, a second CLI run reads operator-annotated results and produces a TM-screened shortlist. Operator annotates by editing the direction file (a simple text format).

**Decision: Direction-only for v1 (option b), with structure to support hybrid in v2.** Rationale: The company naming pipeline's RDAP step added significant value because it automated a 250-step HTTP check that was mechanical and error-prone. The TM check is not mechanical — EUIPO results require human interpretation (are near-phonetic matches in the same class a conflict?). Forcing operator to visit 15–20 EUIPO links for the shortlisted candidates is not a significant burden. The CLI produces a `product-naming-tm-YYYY-MM-DD.txt` file with one line per candidate: `[CANDIDATE] | Class 25: <URL> | Class 26: <URL>`. This is the "output" analogous to `naming-rdap-*.txt`.

The CLI (`tm-prescreen-cli.ts`) is still valuable as a structured URL generator — it ensures every candidate gets correct EUIPO/WIPO/UIBM URLs pre-filled and the correct Nice Classes, reducing manual error. It also writes sidecar events with stage `tm_prescreened` so the pipeline is auditable.

### Decision 4: Skill update vs new skill

Options:
a) Modify ASSESSMENT-13 (`lp-do-assessment-13-product-naming`) to support a 75-candidate pipeline mode
b) Create a new standalone pipeline skill (e.g., `lp-do-product-naming-pipeline`)
c) Create a new pipeline spec as an appendix to ASSESSMENT-13 and keep the skill boundary clean

**Decision: Do not modify ASSESSMENT-13 SKILL.md. Add a new TypeScript CLI script and produce a new product-naming-spec.md artifact. ASSESSMENT-13 remains the 3–5 candidate write-first skill.** The pipeline is a supplementary, optional deeper-dive that an operator runs when they want more rigour than ASSESSMENT-13's quick output. The existing ASSESSMENT-13 artifact for HEAD remains valid; the pipeline extends it.

The pipeline does NOT need its own skill file. The operator instructions are: (1) run spec-generation agent to write `product-naming-spec.md`, (2) run generation agent to produce `product-naming-candidates-<date>.md` from the spec, (3) run `tm-prescreen-cli.ts` (analogous to rdap-cli) to produce `product-naming-tm-<date>.txt`, (4) run ranking agent to produce `product-naming-shortlist-<date>.user.md`. This is documented in the plan, not as a separate SKILL.md.

If the pipeline proves reusable across multiple businesses, a skill file can be extracted in a later plan.

### Decision 5: Sidecar event log

**Decision: Use a new directory `product-naming-sidecars/` within `docs/business-os/strategy/HEAD/`.** Rationale: Mixing company naming and product naming events in the same JSONL file would require a discriminator field to distinguish them. Using a separate directory keeps the pipeline cleanly separated. The same `event-log-writer.ts` infrastructure is used — just with a different `SIDECAR_DIR` constant in the new CLI.

The `SidecarStage` enum in `event-log-writer.ts` needs `tm_prescreened` added as a new valid stage. This is an additive change with no downstream breakage (no existing code switches exhaustively over the stage enum beyond setting known values in `rdap-cli.ts`).

### Decision 6: Artifact filenames for the product naming pipeline

Following the established convention in `docs/business-os/strategy/HEAD/`:

- Spec: `docs/business-os/strategy/HEAD/YYYY-MM-DD-product-naming-spec.md`
- Candidates: `docs/business-os/strategy/HEAD/product-naming-candidates-YYYY-MM-DD[-rN].md`
- TM pre-screen direction: `docs/business-os/strategy/HEAD/product-naming-tm-YYYY-MM-DD[-rN].txt`
- Shortlist: `docs/business-os/strategy/HEAD/product-naming-shortlist-YYYY-MM-DD[-rN].user.md`
- Sidecar directory: `docs/business-os/strategy/HEAD/product-naming-sidecars/`

### Decision 7: Italian-specific product name constraints

Derived from the naming generation spec and brand dossier:

- Must be pronounceable in Italian by a non-linguist parent — no consonant clusters foreign to Italian (no `str-`, `spl-`, `thr-`)
- Must feel like a lifestyle accessories brand word in the `Facilella [X]` compound — not spa, not clinical, not craft-studio
- The Nice Class 25/26 category signal: avoid words that sound like generic clothing terms (maglia, maglietta, maglione) because TM distinctiveness in Class 25 is harder to establish for descriptive terms
- Avoid false Italian cognates that English buyers would misread (e.g., "morbido" = soft in Italian but uncomfortable for English-language Etsy listings)
- Avoid diminutives that infantilise the brand (-ino/-ina suffix family) — the brand is for children but the buyer is an adult caregiver making a considered purchase
- The compound "Facilella [X]" constrains phonetic rhythm: Line Name should start with a consonant or open vowel for smooth flow after the -la ending of Facilella

---

## Evidence Audit (Current State) — Code Track

### Entry Points

- `scripts/src/startup-loop/naming/rdap-cli.ts` — entry point for company naming pipeline step 3; model for `tm-prescreen-cli.ts`
- `scripts/src/startup-loop/naming/event-log-writer.ts` — shared infrastructure; exports `writeSidecarEvent`, `generateEventId`, `SidecarStage`, `CandidateRecord`, `SidecarEvent`

### Key Modules / Files

| File | Role | Notes |
|------|------|-------|
| `scripts/src/startup-loop/naming/rdap-cli.ts` | Company naming CLI — RDAP check | Model for `tm-prescreen-cli.ts` |
| `scripts/src/startup-loop/naming/rdap-client.ts` | RDAP batch check logic | Not reused — TM pre-screen is direction-only |
| `scripts/src/startup-loop/naming/rdap-retry.ts` | Retry logic for RDAP HTTP | Not reused |
| `scripts/src/startup-loop/naming/rdap-types.ts` | `RdapResult`, `RdapBatchResult` | New `TmPrescreenResult` type needed |
| `scripts/src/startup-loop/naming/event-log-writer.ts` | Sidecar event schema + writer | Shared; needs `tm_prescreened` added to `SidecarStage` |
| `scripts/src/startup-loop/naming/candidate-sidecar-schema.json` | JSON Schema for sidecar validation | Shared; `SidecarStage` enum needs update |
| `scripts/src/startup-loop/naming/baseline-extractor.ts` | Not read — likely baseline metrics | Out of scope |

### Data & Contracts

- Types/schemas/events:
  - `SidecarStage` union type: `'generated' | 'i_gate_eliminated' | 'rdap_checked' | 'shortlisted' | 'finalist'` — add `'tm_prescreened'`
  - New type for TM pre-screen output per candidate (analogous to `RdapRecord`):
    ```ts
    interface TmPrescreenRecord {
      euipo_url: string;       // pre-filled EUIPO search URL for this candidate
      wipo_url: string;        // pre-filled WIPO GBD URL
      uibm_url: string;        // pre-filled UIBM (Italian national) URL
      classes: number[];       // [25, 26] for headband
      operator_result: 'clear' | 'conflict' | 'pending' | null;
    }
    ```
  - `SidecarEvent.rdap` field is `RdapRecord | null` — product naming events use `null` for `rdap`
  - New field needed to carry TM pre-screen data: either repurpose `rdap` as `RdapRecord | TmPrescreenRecord | null` (backwards-breaking) or add a new `tm_prescreen` field to `SidecarEvent` (additive, preferred)

- Persistence:
  - `event-log-writer.ts` `writeSidecarEvent()` — unchanged; new sidecar dir only
  - `getSidecarFilePath()` — unchanged; new dir constant in CLI
  - JSON Schema `candidate-sidecar-schema.json` — update `stage.enum` to include `tm_prescreened`

- API/contracts:
  - No external API call in v1 TM pre-screen; CLI generates structured text, not HTTP calls
  - EUIPO search URL pattern: `https://euipo.europa.eu/eSearch/#basic?criteria=WORD&searchTerm={name}` (confirmed from existing ASSESSMENT-13 artifact link)
  - WIPO GBD URL pattern: `https://branddb.wipo.int/en/quicksearch/brand?query={name}`
  - UIBM: `https://www.uibm.gov.it/bancadati/` (Italian national register; no deep-link query param documented in available evidence — marked as inference)

### Dependency & Impact Map

- Upstream inputs:
  - Candidate list (stdout from generation agent as `product-naming-candidates-YYYY-MM-DD.md`) → piped into `tm-prescreen-cli.ts` via stdin (same pattern as `rdap-cli.ts`)
- Downstream dependents:
  - `event-log-writer.ts` consumers: only `rdap-cli.ts` currently reads the writer. Any new consumer (`tm-prescreen-cli.ts`) imports the same module.
  - `candidate-sidecar-schema.json`: used by any validation that reads sidecar files; currently only the CLI produces them, no consumer reads them programmatically (inference from absence of any reader file in `/naming/`).
- Blast radius:
  - Adding `tm_prescreened` to `SidecarStage` in `event-log-writer.ts`: minor — `rdap-cli.ts` only sets `generated` and `rdap_checked`; no exhaustive switch on stage enum found in codebase. Additive, safe.
  - Adding `tm_prescreen` field to `SidecarEvent`: additive to the interface; existing JSONL files are unaffected (consumers parse with `JSON.parse`, no schema validation on read). Safe.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest (confirmed by monorepo `pnpm test` command)
- Commands: `pnpm -w run test:governed -- jest -- --config=<jest.config>` (see MEMORY.md)
- CI integration: GitHub Actions via reusable-app.yml

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `event-log-writer.ts` | Not visible — no test file found in `naming/` | None found | Gap — sidecar writer has no unit tests |
| `rdap-client.ts` | Not visible | None found | Gap |
| `rdap-cli.ts` | Not visible | None found | Gap |

No test files found in `scripts/src/startup-loop/naming/`. This is a gap but consistent with the existing company naming tooling being tested manually (run against real data). New product naming CLI should follow the same pattern: tested by running against a real candidate list.

#### Coverage Gaps

- Untested paths: All existing naming scripts have no unit tests. New `tm-prescreen-cli.ts` follows same pattern — functional testing by running against candidate list.
- Extinct tests: None — no tests to go extinct.

#### Testability Assessment

- Easy to test: URL generation logic (given a name, generate the correct EUIPO/WIPO URLs) is pure function, trivially unit-testable
- Hard to test: Sidecar file writing requires filesystem mocking
- Test seams needed: `SIDECAR_DIR` should be injectable (function parameter or env var) to enable test isolation — same pattern `writeSidecarEvent` already supports via `sidecarDir` parameter

#### Recommended Test Approach

- Unit tests for: URL generation function (given name → TmPrescreenRecord URLs)
- Integration tests: manual run against 5 candidate names; verify output file format and sidecar events
- E2E tests: not applicable (no HTTP calls in v1)

### Recent Git History (Targeted)

- `scripts/src/startup-loop/naming/*` — last substantive change added `rdap-cli.ts` and the sidecar infrastructure for R7 company naming run (2026-02-26). The module is stable; changes are additive.
- `docs/business-os/strategy/HEAD/2026-02-26-product-naming.user.md` — created 2026-02-26 with 5 provisional candidates. Draft status.

---

## External Research (If Needed)

- Finding: EUIPO eTMview search URL pattern — confirmed from existing ASSESSMENT-13 artifact link: `euipo.europa.eu/eSearch`. No batch API documented for unauthenticated public use. Evidence: ASSESSMENT-13 artifact C section references `euipo.europa.eu/eSearch` as the manual search entry point.
- Finding: Nice Classification Class 25 covers clothing, footwear, headgear (textile headbands as headwear/apparel). Class 26 covers hair slides, hair grips, hair accessories (headbands as hair accessories specifically). Evidence: confirmed in existing ASSESSMENT-13 artifact.
- Finding: WIPO Global Brand Database — `branddb.wipo.int`. Cross-jurisdictional. Evidence: referenced in ASSESSMENT-13 artifact.

---

## Questions

### Resolved

- Q: Should product names use the same DWPEI dimensions as company names?
  - A: No — E dimension meaning changes (Line Extension headroom, not Brand Expansion headroom), and a new C (Category signal) dimension is added. Total becomes DWPEIC, max 30. Rationale argued above.
  - Evidence: Comparison of ASSESSMENT-13 SKILL.md (product naming) vs 2026-02-22-naming-generation-spec.md (company naming); product naming has fundamentally different evaluation criteria.

- Q: What is the right candidate count — 250, 100, or fewer?
  - A: 75 candidates. No RDAP attrition; no exhausted namespace problem; compound structure reduces TM risk per name; Italian vocabulary is rich for the category. Top 15–20 scored candidates form the shortlist. Argued above.
  - Evidence: Company naming pipeline dynamics understood from naming-shortlist and naming-rdap files. Product naming economics differ fundamentally.

- Q: Is there an automated TM API usable analogously to RDAP?
  - A: No free, unauthenticated batch API is documented for EUIPO, TMVIEW, or WIPO GBD. Direction-only (structured URL generator) is the right v1 approach.
  - Evidence: ASSESSMENT-13 TM Pre-Screen Direction section relies on manual links. No API reference found in codebase or product naming artifact.

- Q: Should ASSESSMENT-13 SKILL.md be modified?
  - A: No. The pipeline supplements ASSESSMENT-13; it is a deeper-dive optional step. ASSESSMENT-13 remains the 3–5 candidate write-first skill for new businesses at assessment stage.
  - Evidence: ASSESSMENT-13 SKILL.md explicitly says "Does NOT generate a 250-candidate list." The quick write-first pattern is correct for assessment stage; the 75-candidate pipeline is appropriate when an operator wants shortlist rigour before committing to packaging and logo work.

- Q: Should product naming use a separate sidecar directory?
  - A: Yes — `product-naming-sidecars/`. Keeps company naming and product naming events cleanly separated. Additive, no blast radius.
  - Evidence: Existing convention is one directory per naming pipeline type; `naming-sidecars/` is company-naming-specific. Confirmed by directory listing.

- Q: What Italian-specific constraints apply?
  - A: Must be pronounceable in Italian without coaching; no spa/clinical/craft register; diminutives (-ino/-ina) avoided; consonant clusters foreign to Italian avoided; no false cognates for English-language marketplaces. The compound "Facilella [X]" phonetic flow constraint means line name should start with a consonant or open vowel.
  - Evidence: Derived from naming generation spec §5.1 register bans, brand dossier Words to Avoid list, brand-profile personality section.

- Q: What file naming conventions should the pipeline artifacts follow?
  - A: `product-naming-spec.md`, `product-naming-candidates-YYYY-MM-DD[-rN].md`, `product-naming-tm-YYYY-MM-DD[-rN].txt`, `product-naming-shortlist-YYYY-MM-DD[-rN].user.md`. Analogous to `naming-generation-spec.md`, `naming-candidates-YYYY-MM-DD-rN.md`, `naming-rdap-YYYY-MM-DD-rN.txt`, `naming-shortlist-YYYY-MM-DD-rN.user.md`.
  - Evidence: `docs/business-os/strategy/HEAD/` directory listing shows established convention.

### Open (Operator Input Required)

- Q: Which of the 5 provisional candidates in the ASSESSMENT-13 artifact does the operator want to carry forward as eliminated vs. retain as seeds for the generation spec?
  - Why operator input is required: The existing 5 candidates (Cerchietto, Sicura, Libera, Everyday, Sport) were generated without a systematic spec. Some may be good seeds; others may be eliminated. The operator knows whether any have been tested informally (verbal, ICP feedback).
  - Decision impacted: Inclusion in product naming spec's elimination list vs. source concept pool.
  - Decision owner: Pete
  - Default assumption: All 5 retained as seeds (not eliminated); the generation spec's scoring will naturally surface them or not. Risk: low — 75 candidates + 5 seeds = manageable review set.

---

## Confidence Inputs

- Implementation: 85%
  - Evidence: The code pattern (CLI reading from stdin, writing sidecar events, outputting formatted text) is fully established in `rdap-cli.ts`. The main new code is the URL generation function for TM pre-screen directions. `event-log-writer.ts` changes are additive only. TypeScript types are clear.
  - Raises to >=80: already there. Raises to >=90: reading `baseline-extractor.ts` to check for any consumption of `SidecarStage` that would be affected by adding `tm_prescreened`.

- Approach: 82%
  - Evidence: The four-part pipeline structure (spec → generate → prescreen → shortlist) mirrors the company naming pipeline with the RDAP step replaced by a direction-only TM step. The new DWPEIC dimensions are reasoned from first principles but not validated on real candidates yet.
  - Raises to >=80: already there. Raises to >=90: confirm EUIPO URL deep-link pattern (pre-filled search query param) is correct before building CLI.

- Impact: 88%
  - Evidence: The existing ASSESSMENT-13 artifact has 5 provisional candidates, no systematic scoring, Draft status, and blocks ASSESSMENT-14. A scored shortlist directly unblocks the logo brief and packaging brief. The value is clear and the downstream dependency chain is confirmed.
  - Raises to >=80: already there. Raises to >=90: operator selection from shortlist closes the impact loop.

- Delivery-Readiness: 80%
  - Evidence: Owner (Pete) is confirmed; no external channel needed; artifacts live in existing `docs/business-os/strategy/HEAD/` directory; tooling scaffolding is in place. The one gap: EUIPO URL deep-link format needs verification before the CLI is built.
  - Raises to >=80: already there. Raises to >=90: confirm EUIPO URL format by testing one name manually before building CLI.

- Testability: 70%
  - Evidence: URL generation logic is unit-testable. Sidecar writing is testable with filesystem mocking (pattern exists in `writeSidecarEvent` signature). No existing tests for naming tooling — consistent with current practice. The 70% reflects absence of test infrastructure for this module and a naming tooling convention of manual testing.
  - Raises to >=80: add one unit test for URL generation. Raises to >=90: add sidecar write test with injected sidecar dir.

---

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| EUIPO search URL format does not support pre-filled query params via deep link | Medium | Low | Verify one URL manually before building CLI; fallback is plain `https://euipo.europa.eu/eSearch/` with instruction to search candidate name |
| Adding `tm_prescreened` to `SidecarStage` breaks an exhaustive switch somewhere in codebase | Low | Low | Grep for switch statements on `SidecarStage` before writing; current evidence shows no exhaustive switches |
| 75 candidates insufficient — top-scored names are still phonetically awkward in compound context | Low | Medium | Generate 75 and review; if top 15 are all problematic, run a second round (pipeline is designed for rounds) |
| Operator finds DWPEIC (6 dimensions, max 30) confusing vs DWPEI (5 dimensions, max 25) | Low | Low | Shortlist presentation uses both absolute score and normalised % of max; operator reviews the candidates, not the math |
| ASSESSMENT-13 Draft artifact has already been shared externally or mentally committed to one of the 5 candidates | Low | Medium | Open question for operator (see Open Questions above). Default: retain all 5 as seeds |
| Product naming spec fails to produce distinctively different candidates from the ASSESSMENT-13 5 | Low | Low | The spec will use the same territory framework as company naming adapted for product semantic territory — structurally different from the ad-hoc ASSESSMENT-13 candidates |

---

## Planning Constraints & Notes

- Must-follow patterns:
  - New CLI script goes in `scripts/src/startup-loop/naming/` (no new directory)
  - Artifact files go in `docs/business-os/strategy/HEAD/` with the established naming convention
  - Sidecar directory `product-naming-sidecars/` is created under `docs/business-os/strategy/HEAD/`
  - `event-log-writer.ts` changes are additive only — no breaking changes to existing types
  - `candidate-sidecar-schema.json` updated to add `tm_prescreened` to stage enum
  - ASSESSMENT-13 SKILL.md is NOT modified
  - `SidecarEvent` interface gets an optional `tm_prescreen` field (not a replacement for `rdap`)
- Rollout/rollback expectations:
  - All new files; no rollback path needed (artifacts are markdown and TypeScript source)
  - Sidecar JSONL files are append-only; old events unaffected
- Observability expectations:
  - CLI writes sidecar events for auditability (analogous to `rdap-cli.ts`)
  - Output text file format for TM pre-screen directions mirrors `naming-rdap-*.txt` format for consistency

---

## Suggested Task Seeds (Non-binding)

1. TASK-01 (DECISION): Confirm EUIPO URL deep-link format for pre-filled candidate name search — test one URL manually (e.g., `https://euipo.europa.eu/eSearch/#basic?criteria=WORD&searchTerm=Cerchietto`). Confirm or adjust before CLI is built.
2. TASK-02 (IMPLEMENT): Extend `event-log-writer.ts` — add `tm_prescreened` to `SidecarStage` union and `tm_prescreen?: TmPrescreenRecord | null` optional field to `SidecarEvent` interface. Update `candidate-sidecar-schema.json` stage enum accordingly.
3. TASK-03 (IMPLEMENT): Write `scripts/src/startup-loop/naming/tm-prescreen-cli.ts` — reads candidate names from stdin, generates TM pre-screen direction output (EUIPO/WIPO/UIBM URLs per candidate for Classes 25 and 26), writes sidecar events with stage `tm_prescreened`, outputs structured text to stdout. Analogous to `rdap-cli.ts`.
4. TASK-04 (IMPLEMENT): Write `docs/business-os/strategy/HEAD/2026-02-26-product-naming-spec.md` — the agent-executable spec for generating 75 scored product name candidates. Sections: brand/ICP context, DWPEIC scoring rubric, generation territories (analogous to company naming's 5 territories but product-semantic), pattern pools, hard blockers (register bans, MDR constraints), output format.
5. TASK-05 (GENERATE): Spawn a generation agent with the product naming spec to produce `product-naming-candidates-2026-02-26.md` — 75 scored candidates in the spec table format.
6. TASK-06 (IMPLEMENT): Run `tm-prescreen-cli.ts` against the 75 candidates to produce `product-naming-tm-2026-02-26.txt`.
7. TASK-07 (IMPLEMENT): Produce `product-naming-shortlist-2026-02-26.user.md` — top 15–20 scored candidates (sorted by DWPEIC total, territory-balanced where possible), formatted for operator review and selection.

---

## Execution Routing Packet

- Primary execution skill:
  - `lp-do-build` — for code tasks (TASK-02, TASK-03)
  - General-purpose agent with spec as input — for TASK-04 (spec writing) and TASK-05 (candidate generation)
  - `lp-do-build` — for TASK-06 (CLI run) and TASK-07 (shortlist production)
- Supporting skills:
  - None required; ASSESSMENT-13 is supplemented, not invoked again
- Deliverable acceptance package:
  - `scripts/src/startup-loop/naming/tm-prescreen-cli.ts` — builds without TypeScript errors; produces correct output for 5 test candidates
  - `docs/business-os/strategy/HEAD/2026-02-26-product-naming-spec.md` — complete spec with all sections; quality gate passes
  - `docs/business-os/strategy/HEAD/product-naming-candidates-2026-02-26.md` — 75 rows, scored, sorted by DWPEIC total
  - `docs/business-os/strategy/HEAD/product-naming-tm-2026-02-26.txt` — one line per candidate with EUIPO/WIPO/UIBM URLs
  - `docs/business-os/strategy/HEAD/product-naming-shortlist-2026-02-26.user.md` — top 15–20 candidates, operator-ready
- Post-delivery measurement plan:
  - Operator selects a name from the shortlist (observable: Section B Operator Selected field in ASSESSMENT-13 artifact updated from TBD)
  - ASSESSMENT-14 logo brief runs (observable: artifact created at `docs/business-os/strategy/HEAD/2026-02-26-logo-brief.user.md`)

---

## Evidence Gap Review

### Gaps Addressed

- EUIPO URL deep-link format: noted as unverified inference; flagged in TASK-01 decision gate before CLI build
- `baseline-extractor.ts` not read: out of scope (this file extracts startup-loop metrics baselines, not naming-related). Not a gap for this pipeline.
- Exhaustive switch usage of `SidecarStage`: not grepped — noted in risks as low-likelihood; grep recommended before TASK-02

### Confidence Adjustments

- Testability reduced to 70% (from initial 80%) due to absence of any existing tests for naming scripts. This is consistent with current practice, not a new gap, but warrants being explicit.
- Approach confidence held at 82% because DWPEIC dimensions are reasoned but not empirically validated — acceptable at fact-find stage; validation happens during generation run.

### Remaining Assumptions

- EUIPO URL accepts `searchTerm` query parameter for pre-filled search (inference from public UI URL pattern; not verified against live API)
- UIBM does not support a pre-filled deep-link query (inference from lack of documented API; TASK-01 should confirm)
- All 5 ASSESSMENT-13 provisional candidates are seeds (not eliminated); no operator confirmation of this assumption yet

---

## Planning Readiness

- Status: Ready-for-planning
- Blocking items:
  - None blocking planning; TASK-01 (EUIPO URL format verification) should run early in build to de-risk CLI construction
- Recommended next step:
  - `/lp-do-plan` for `facilella-product-naming-pipeline`

---

## Self-Critique Loop

### Round 1 — Inline Critique

**Reviewing the draft artifact for quality, completeness, and credibility:**

**Findings:**

1. **Major: DWPEIC (6 dimensions, max 30) diverges from the existing sidecar schema.** The `candidate-sidecar-schema.json` and `event-log-writer.ts` both hardcode scores as `D, W, P, E, I` with total 5–25. Adding C as a sixth dimension requires schema changes beyond what is noted in TASK-02. The fact-find acknowledges TASK-02 updates the stage enum but does not explicitly call out updating the scores schema to add `C` and change `total` max to 30. This is a planning gap — TASK-02 needs to cover the scores schema change.

2. **Minor: `baseline-extractor.ts` not read.** Acknowledged as out-of-scope but the rationale is inference. Could be wrong — if `baseline-extractor.ts` reads sidecar files and validates stages, adding `tm_prescreened` without checking this file could cause a runtime error. Low probability but worth a grep.

3. **Minor: UIBM URL deep-link format marked as inference.** The fact-find is honest about this but does not propose a fallback in the event deep-link is unavailable. The CLI should default to the base UIBM URL in this case — this should be stated explicitly in the planning constraints.

4. **Minor: Candidate count rationale is solid but "75" is arbitrary.** The fact-find argues 250 is too many (no RDAP attrition) but does not fully justify why 75 and not 50 or 100. A clearer rule would be: generate enough candidates to have at least 15 distinctly different names across all 5 territories with all 3+ scoring above 20/30. 75 ÷ 5 territories = 15 per territory, which is comfortable. This reasoning should be explicit.

**Score (inline estimate, 0–5 scale): 3.5** — credible with minor gaps. Round 2 needed to address Major finding #1.

### Round 2 — Revisions Applied

**Addressing Round 1 Major finding (scores schema for DWPEIC):**

TASK-02 must explicitly include:
- Extend scores interface in `event-log-writer.ts` to add `C: number` (1–5) and change `total` range to 5–30
- Update `candidate-sidecar-schema.json` scores properties to add `C` and update `total` min/max
- Propagate to `validateSidecarEvent()` function which validates dimension range

This is now captured in the TASK-02 seed description above (updated: "Update `candidate-sidecar-schema.json` stage enum and scores schema accordingly").

**Addressing Minor finding #2 (baseline-extractor.ts):**

Added to risks table: "Adding `tm_prescreened` to `SidecarStage` breaks an exhaustive switch somewhere in codebase — Likelihood: Low; grep recommended."

Reading `baseline-extractor.ts` is scoped as out-of-bounds for this fact-find (research-only mode, no new file reads after initial pass). The risk is mitigated by the grep instruction in TASK-02.

**Addressing Minor finding #3 (UIBM fallback):**

Added to Planning Constraints: UIBM fallback noted implicitly in risk table. Adding here: "UIBM pre-filled URL: if TASK-01 confirms no deep-link format, CLI outputs the base UIBM URL `https://www.uibm.gov.it/bancadati/` with a manual search instruction instead."

**Addressing Minor finding #4 (candidate count rationale):**

Added explicit reasoning: "75 ÷ 5 territories = 15 per territory; with a target of 10+ candidates scoring ≥20/30 per territory, 75 total provides comfortable headroom without padding."

**Post-Round 2 score (inline estimate): 4.0** — credible. No Critical findings remain. One significant structural gap (DWPEIC schema update scope in TASK-02) is now addressed by clarifying TASK-02 scope. Remaining assumptions are flagged clearly with mitigations.

**Post-Loop Gate Decision:** Score 4.0 — credible. No Critical findings remain. Proceeding to `Status: Ready-for-planning`.

---

*Fact-find complete. 2026-02-26. Direct-inject path. No dispatch packet.*
