# Outcome B Module: Briefing

Use this module for `Outcome: briefing` (understanding-only).

## Objective

Create a concise system briefing that explains current behavior with evidence pointers, without creating planning tasks.

## Workflow

1. Convert request into explicit questions (3-8).
2. Trace the relevant flow end-to-end:
- request lifecycle, data flow, side effects, controls.
3. Document structure and invariants:
- components, contracts, config/flags, failure modes.
4. Capture test coverage and known gaps.
5. Mark unknowns with exact verification path.
6. Optionally add a short "If changed later" section (no implementation plan).

## Output Requirements

Use `docs/briefs/_templates/briefing-note.md`.

Fill with evidence and keep concise. Omit empty sections or collapse to one-line `Not investigated` notes.
