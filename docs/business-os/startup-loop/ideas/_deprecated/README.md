# Deprecated Ideas Schemas

This directory contains deprecated schema files retained for historical reference.

## Contents

### lp-do-ideas-dispatch.schema.json (dispatch.v1)

- **Deprecated:** 2026-03-03
- **Replaced by:** `../schemas/lp-do-ideas-dispatch.v2.schema.json` (dispatch.v2)
- **Reason:** v2 adds required `why` and `intended_outcome` fields with `source` attribution, enabling outcome tracking through the dispatch lifecycle.
- **Why retained:** 129 historical v1 packets exist in `../trial/queue-state.json`. The v1 compat layer in `scripts/src/startup-loop/ideas/lp-do-ideas-routing-adapter.ts` (`extractCompatV1WhyFields()`) maps v1 fields to v2 equivalents at runtime. This schema documents the structure of that historical data.
- **Runtime note:** TypeScript types for dispatch packets are defined inline in `scripts/src/startup-loop/ideas/lp-do-ideas-trial.ts` — this JSON schema is reference documentation only, not imported by any code.
