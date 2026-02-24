# Outcome A Module: Website First-Build Backlog

Use this module only when:
- `Outcome: planning`
- `Startup-Deliverable-Alias: website-first-build-backlog`

This is a dedicated branch. Do not run generic code/business checklist text first.

## Objective

Generate a planning-ready first-build backlog that converts an active WEBSITE-01 contract into executable V1 implementation work.

## Prerequisite Checks

1. WEBSITE-01 builder prompt exists and is active:
- `docs/business-os/strategy/<BIZ>/site-v1-builder-prompt.user.md`

2. Strategy index row is active for the same artifact:
- `docs/business-os/strategy/<BIZ>/index.user.md` (`Site V1 Builder Prompt` row status = `Active`)

If either prerequisite is missing, stale, or not active:
- Stop and route back to WEBSITE-01 handoff prompt:
  - `docs/business-os/workflow-prompts/_templates/website-first-build-framework-prompt.md`
- Include exact save path:
  - `docs/business-os/strategy/<BIZ>/site-v1-builder-prompt.user.md`

## Required Output Slices

1. First-build contract inputs
- Active WEBSITE-01 builder prompt pointer
- Active brand dossier pointer
- Startup baseline pointers (offer/channels/measurement/intake)
- Existing app scaffold pointers
- Legacy baseline pointers (routes, data, analytics seams)

2. Assembly contract extraction matrix
- Required surface area
- Source reference
- Reuse or new-build decision
- Acceptance check
- Risk/unknown
- Owner

3. Prioritized V1 implementation backlog candidates
- Priority, item, rationale, acceptance criteria, dependencies, evidence refs

4. Risks and unknowns
- Missing env/config, data, or integration decisions that can block build
- Explicit default assumptions and validation path

## Hand-off Rule

If WEBSITE-01 prerequisites are active and decision-grade, emit `fact-find.md` at `Ready-for-planning` and hand off directly to `/lp-do-plan`.
