---
Type: Micro-Build
Status: Complete
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: startup-loop-cap02-message-variants
Execution-Track: business-artifact
Deliverable-Type: business-artifact
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260309114901-9305
Related-Plan: none
---

# Startup Loop CAP-02 Message Variants Micro-Build

## Scope

- Change: make CAP-02 real by adding a canonical message-variants schema, upgrading the marketing/sales capability contract, seeding product-loop artifacts, and retrofitting the core consumer skills plus the ideas queue/build record.
- Non-goals: no paid-channel activation decisions, no deep rewrite of offer/channel artifact registries beyond CAP-02-touching rows, no package-level validation.

## Execution Contract

- Affects:
  - docs/business-os/startup-loop/schemas/message-variants-schema.md
  - docs/business-os/startup-loop/contracts/marketing-sales-capability-contract.md
  - docs/business-os/startup-loop/schemas/demand-evidence-pack-schema.md
  - docs/business-os/startup-loop/artifact-registry.md
  - docs/business-os/strategy/HBAG/message-variants.user.md
  - docs/business-os/strategy/HEAD/message-variants.user.md
  - docs/business-os/strategy/PET/message-variants.user.md
  - docs/business-os/strategy/HBAG/index.user.md
  - docs/business-os/strategy/HEAD/index.user.md
  - docs/business-os/strategy/PET/index.user.md
  - .claude/skills/lp-channels/SKILL.md
  - .claude/skills/draft-marketing/SKILL.md
  - .claude/skills/draft-outreach/SKILL.md
  - .claude/skills/lp-weekly/modules/orchestrate.md
  - docs/business-os/startup-loop/ideas/trial/queue-state.json
  - docs/plans/startup-loop-cap02-message-variants/build-record.user.md
  - docs/plans/startup-loop-cap02-message-variants/results-review.user.md
  - docs/plans/startup-loop-cap02-message-variants/results-review.signals.json
  - docs/plans/startup-loop-cap02-message-variants/pattern-reflection.user.md
  - docs/plans/startup-loop-cap02-message-variants/pattern-reflection.entries.json
  - docs/plans/startup-loop-cap02-message-variants/build-event.json
- Acceptance checks:
  - CAP-02 has a canonical schema and canonical artifact path.
  - HBAG has a seeded ledger that captures the Luisa Positano boutique signal and planned next message frames.
  - HEAD and PET have scaffold ledgers so the same product-loop capability exists outside HBAG.
  - Core skills (`lp-channels`, `draft-marketing`, `draft-outreach`, `lp-weekly`) explicitly consume or initialize the CAP-02 artifact.
  - The ideas queue and build-output record reflect this direct-build cycle.
- Validation commands:
  - rg -n "message-variants|CAP-02" docs/business-os/startup-loop .claude/skills docs/business-os/strategy/HBAG docs/business-os/strategy/HEAD docs/business-os/strategy/PET
  - test -s <each new artifact path>
- Rollback note: revert the files above; no runtime or data migration required.

## Outcome Contract

- **Why:** CAP-02 was being referenced as if it existed, but there was still no canonical schema, seeded ledger, or producer/consumer contract behind it. That left message learning stranded in chat and made boutique, website, and social framing impossible to track consistently.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** CAP-02 now has a canonical message-variants schema, seeded product-loop artifacts, and explicit skill consumers so message testing can be logged and reused instead of living only in chat.
- **Source:** operator
