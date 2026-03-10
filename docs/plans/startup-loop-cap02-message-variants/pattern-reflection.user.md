---
Type: Pattern-Reflection
Status: Complete
Feature-Slug: startup-loop-cap02-message-variants
Reflection-date: 2026-03-09
artifact: pattern-reflection
---

# Pattern Reflection: startup-loop-cap02-message-variants

## Patterns

### Entry 1

- **pattern_summary:** Capability references drift ahead of the artifact and schema they require
- **category:** deterministic
- **routing_target:** loop_update
- **occurrence_count:** 1
- **evidence_refs:**
  - `docs/plans/startup-loop-cap02-message-variants/build-record.user.md#what-was-built`
  - `docs/business-os/startup-loop/contracts/marketing-sales-capability-contract.md`
- **idea_key:** capability-contract-before-schema-gap
- **Notes:** CAP-02 had already started appearing in skill references, but the artifact, pass floor, and producer contract were still missing. This build closes the gap. Future capability additions should land schema, artifact path, and consumer updates in the same cycle.

## Access Declarations

- None: all required inputs were local repo artifacts and skill docs.
