---
schema_version: pattern-reflection.v1
feature_slug: brik-live-pricing-activation
generated_at: 2026-02-27T00:00:00Z
entries:
  - pattern_summary: "Env var required in two places: build-cmd inline AND CF Pages binding"
    category: ad_hoc
    routing_target: defer
    occurrence_count: 1
    evidence_refs:
      - "docs/plans/brik-live-pricing-activation/plan.md#edge-cases--hardening"
      - "docs/plans/brik-live-pricing-activation/build-record.user.md#what-was-built"
    idea_key: cf-pages-env-var-parity
    classifier_input:
      idea_id: cf-pages-env-var-parity
      title: "Env var required in two places: build-cmd inline AND CF Pages binding"
      trigger: artifact_delta
      area_anchor: apps/brikette/functions/api/availability.js
      content_tags: ["cloudflare-pages", "env-vars", "feature-flags", "infra"]
---

# Pattern Reflection — BRIK Live Pricing Activation

## Patterns

- **Pattern:** Cloudflare Pages env var required in two independent channels (build-cmd inline for Next.js client-side inlining; CF Pages env var binding for Pages Function `context.env` at request time). These are not the same setting and must be configured separately.
  - **Category:** ad_hoc
  - **Occurrence count:** 1
  - **Routing:** defer (occurrence_count < 2; not yet a recurring pattern)
  - **Evidence:** Plan Risks table, Edge Cases, health check Known Limitation note in TASK-03 acceptance criteria.
  - **Idea key:** cf-pages-env-var-parity

## Access Declarations

None identified. All code and configuration accessed during this build was in the repository (no external API credentials, no third-party services requiring authenticated access beyond the standard CF deploy credentials already in CI secrets).
