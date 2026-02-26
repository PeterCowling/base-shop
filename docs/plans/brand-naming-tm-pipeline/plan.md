---
slug: brand-naming-tm-pipeline
status: Active
foundation-gate: Pass
build-gate: Pass
---

# brand-naming-tm-pipeline

Replace RDAP domain checking with TM pre-screen in the brand/company naming pipeline. Brand naming does not need domain lookup — it needs TM (trademark) lookup instead. The `tm-prescreen-cli.ts` already exists from the product naming pipeline build.

## Tasks

### Wave 1 (parallel)

#### TASK-01: Update lp-do-assessment-04 SKILL.md
- **Effort:** S
- **Confidence:** 90
- **Type:** business-artifact
- **Status:** Pending
- Replace "RDAP check" with "TM pre-screen" throughout
- Part 3: Replace bash RDAP loop with tm-prescreen-cli.ts invocation
- Part 4: Rank all candidates by score (no domain filter); top 20 by score
- Resume logic: Replace `naming-rdap-*` with `naming-tm-*`
- New round: Remove "domain taken" as auto-elimination reason
- Quality gate: Remove RDAP checks; add `naming-tm-<date>.txt` gate
- Shortlist format: Remove domain column; add TM Status column
- HTML Part 5: Remove domain chip; update footer to TM direction date
- Completion message: Remove domain column; replace "domain-verified" with "TM direction provided"

#### TASK-02: Update lp-do-assessment-05 SKILL.md
- **Effort:** S
- **Confidence:** 90
- **Type:** business-artifact
- **Status:** Pending
- Description frontmatter: Replace "RDAP batch check" with "TM pre-screen direction"
- Pipeline table: Replace RDAP with tm-prescreen-cli.ts
- §5.1: Replace "Domain availability gate" with "TM pre-screen direction"
- §5.2: Reframe around TM distinctiveness (not domain exhaustion)
- §5.3: Remove "(.com taken)" as valid reason; add "(TM conflict)"
- §6: Keep "Domain string (Pattern D only)" — still valid as wordmark strategy
- Quality gate: Remove "RDAP" reference from §5.1 check
- Completion message: Replace "RDAP batch check" with "TM pre-screen"
- Integration downstream: Update Parts 3 and 4 references

### Wave 2 (parallel, independent of Wave 1)

#### TASK-03: Update tm-prescreen-cli.ts
- **Effort:** XS
- **Confidence:** 92
- **Type:** code
- **Status:** Pending
- Add `TM_NICE_CLASSES` env var support (comma-separated, e.g. "35,25,26")
- Default for backward compat: "25,26"
- Parse classes dynamically; use in search URL building and output

#### TASK-04: Update candidate-sidecar-schema.json if needed
- **Effort:** XS
- **Confidence:** 85
- **Type:** code
- **Status:** Pending
- Check if `domain_string` is required or optional
- If required, make it optional/nullable
- Result: `domain_string` is already nullable (`["string", "null"]`) and not in the `required` array — no change needed
