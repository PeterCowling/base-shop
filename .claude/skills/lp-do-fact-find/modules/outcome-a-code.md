# Outcome A Module: Code Track

Use this module for `Outcome: planning` with `Execution-Track: code` (and for the code side of `mixed`).

## Objective

Produce evidence that lets `/lp-do-analysis` compare viable approaches and lets `/lp-do-plan` later create safe, testable implementation tasks.

## Required Evidence Slices

1. Entry points
- Routes, handlers, jobs, or commands that initiate the target flow.

2. Key modules and responsibilities
- Keep to max 10 primary files/modules.

3. Contracts and state
- Types/schemas/events/API shapes; source of truth boundaries.

4. Dependency and blast radius map
- Upstream inputs and downstream dependents.
- Include integration boundaries (queues/webhooks/external APIs) when relevant.

5. Engineering coverage matrix
- Use the canonical rows from `../../_shared/engineering-coverage-matrix.md`.
- For each row, capture current-state evidence plus the likely gap/risk.

6. Security, observability, and performance boundaries
- Auth/authz points, untrusted input validation.
- Logging/metrics/audit seams and current operator visibility.
- Potential hot paths, caching seams, and N+1 risk surfaces.

7. Test landscape
- Existing tests (unit/integration/e2e).
- Coverage gaps for touched paths.
- Extinct tests (obsolete assertions) to be removed/updated during build.
- Testability constraints and required seams.

8. Targeted git context
- Recent relevant changes in the affected area and implications.

## External Research Rule

Use external docs only if repository evidence is insufficient. Prefer official documentation.

## Confidence Inputs (must justify each)

Provide numeric scores with evidence:
- Implementation
- Approach
- Impact
- Delivery-Readiness
- Testability

Also include:
- What raises each score to >=80 (build-eligible planning)
- What raises each score to >=90 (high confidence)

## Output Section Requirements

Ensure these sections in the planning brief are filled (or explicitly marked not investigated):
- `## Evidence Audit (Current State)`
- `### Entry Points`
- `### Key Modules / Files`
- `### Data & Contracts`
- `### Dependency & Impact Map`
- `## Engineering Coverage Matrix`
- `### Test Landscape`
- `### Recent Git History (Targeted)`
- `## Scope Signal` (`constrained | right-sized | limited-thinking`; include 1-3 expansion suggestions only when `limited-thinking`)
- `## Confidence Inputs`
- `## Risks`

## Mixed-Track Rule

If `Execution-Track: mixed`, pair this module with `outcome-a-business.md` and merge findings into one brief.
