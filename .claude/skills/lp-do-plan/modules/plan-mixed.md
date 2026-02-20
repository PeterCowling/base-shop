# Planner Module: Mixed Track

Use for `Execution-Track: mixed`.

## Objective

Produce integrated plans that combine code and business tasks without leaking requirements between tracks.

## Routing Rule

For mixed tasks:
- Apply `plan-code.md` requirements to code-bearing tasks.
- Apply `plan-business.md` requirements to business-artifact tasks.

## Decomposition Rule

- Separate code-contract tasks from channel/approval tasks unless the same task genuinely requires both.
- Add explicit handoff dependencies between technical and business tasks.
- Add CHECKPOINT tasks at boundaries where implementation evidence should update business assumptions (or vice versa).

## Validation Rule

- Code validation uses TC-XX cases.
- Business validation uses VC-XX cases that satisfy the shared checklist.
- Cross-boundary tasks require both technical and operational acceptance evidence.
