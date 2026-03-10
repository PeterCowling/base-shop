---
Status: Complete
Feature-Slug: startup-loop-cap02-message-variants
Completed-date: 2026-03-09
artifact: build-record
Build-Event-Ref: docs/plans/startup-loop-cap02-message-variants/build-event.json
---

# Build Record: startup-loop-cap02-message-variants

## What Was Built

Created the canonical CAP-02 schema at `docs/business-os/startup-loop/schemas/message-variants-schema.md`. The new contract defines the required sections, row fields, denominator policy, qualitative-offline handling, and the paid-activation pass floor for message testing.

Upgraded the marketing/sales capability contract and DEP references so CAP-02 is no longer a proposed path. `marketing-sales-capability-contract.md` now points to the live schema and canonical ledger path, includes downstream consumers, and records current product-loop coverage. `artifact-registry.md` now recognizes `message-variants` as a first-class startup-loop artifact.

Seeded the per-business ledgers for HBAG, HEAD, and PET. HBAG now includes the Luisa Positano boutique sale as a qualitative CAP-02 signal plus the next planned fashion, gifting, and supportive-utility frames. HEAD and PET now have scaffold files so the same capture mechanism exists in the other product-oriented loops.

Retrofitted the main consumer skills. `lp-channels` now initializes or refreshes the CAP-02 ledger when strategy work depends on message testing. `draft-marketing` and `draft-outreach` now read the live ledger before drafting, and `/lp-weekly` now checks whether the message-variants artifact is missing, stale, or denominator-bearing.

Completed the direct-build workflow record by writing the micro-build, build event, results review, pattern reflection, and queue-state dispatch entry for this CAP-02 build.

## Tests Run

- No package typecheck, lint, or Jest runs. This was a docs-and-skill-contract build only.
- Targeted document validation:
  - `rg -n "message-variants|CAP-02" docs/business-os/startup-loop .claude/skills docs/business-os/strategy/HBAG docs/business-os/strategy/HEAD docs/business-os/strategy/PET`
  - file-existence checks on all new artifacts

## Validation Evidence

- Canonical schema exists and defines the CAP-02 row model, pass floor, and offline qualitative policy.
- Marketing/sales contract now treats CAP-02 as schema-defined rather than missing.
- DEP schema now references the CAP-02 ledger as the row-level source of message evidence.
- HBAG ledger contains the live Luisa Positano observation and planned next frames tied to explicit hypotheses.
- HEAD and PET both have matching scaffold ledgers at the canonical path.
- `lp-channels`, `draft-marketing`, `draft-outreach`, and `lp-weekly` all contain explicit CAP-02 references after the retrofit.
- Queue-state contains the completed `lp-do-ideas -> lp-do-build` dispatch entry for this work.

## Scope Deviations

None.

## Outcome Contract

- **Why:** CAP-02 was being referenced as if it existed, but there was still no canonical schema, seeded ledger, or producer/consumer contract behind it. That left message learning stranded in chat and made boutique, website, and social framing impossible to track consistently.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** CAP-02 now has a canonical message-variants schema, seeded product-loop artifacts, and explicit skill consumers so message testing can be logged and reused instead of living only in chat.
- **Source:** operator
