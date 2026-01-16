# cypress-image-snapshot — Agent Notes

## Purpose
Workspace fork of `cypress-image-snapshot` pinned for Cypress 14+ and Jest 29
compatibility, preserving the upstream API surface.

## Operational Constraints
- Preserve API compatibility for `addMatchImageSnapshotPlugin`,
  `addMatchImageSnapshotCommand`, and `matchImageSnapshot`.
- Keep entrypoints stable: `command.js`, `plugin.js`, `reporter.js`.
- Do not change default snapshot storage locations or naming conventions
  without updating all consumers.
- Keep env flags behavior stable (`updateSnapshots`, `failOnSnapshotDiff`).
- Avoid adding Node-only APIs that break Cypress runtime contexts.

## Safe Change Checklist
- Verify command/plugin exports still match upstream signatures.
- Keep reporter output parsable by CI logs.
- Validate against a single Cypress spec that uses snapshot commands.
