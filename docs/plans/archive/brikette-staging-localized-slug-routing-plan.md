---
Type: Plan
Status: Complete
Domain: Brikette/Routing
Last-reviewed: 2026-02-07
Relates-to:
  - docs/business-os/business-os-charter.md
Feature-Slug: brikette-staging-localized-slug-routing
Related-Fact-Find: docs/plans/brikette-staging-localized-slug-routing-fact-find.md
---

# Brikette Staging Localized Slug Routing — Implementation Plan

## Objective
Restore localized top-level and nested route behavior on static-export staging by generating deterministic Cloudflare `_redirects` rules from slug source-of-truth data.

## Constraints
- Staging must remain static export (`output: 'export'`) due current Cloudflare free-tier constraints.
- Middleware cannot be relied on in staging.
- No hardcoded per-locale manual redirect maintenance.

## Acceptance Criteria
- Localized section roots resolve on staging (via redirect) for all supported locales.
- Localized nested paths under section roots resolve on staging.
- Localized experiences tag routes (`guidesTags`) resolve to internal `tags` path.
- `_redirects` coverage is generated from code and test-enforced.
- Post-change staging smoke checks show localized links no longer 404.

## Task Breakdown

### TASK-01: Centralize section segment constants
Status: Complete
- Create shared constants for internal segment mapping and section key lists.
- Replace duplicated mappings in middleware and route inventory.

### TASK-02: Implement static-export localized redirect generator
Status: Complete
- Add generator logic that derives redirect rules from:
  - `slug-map.ts` localized slugs
  - internal segment map
  - supported locale list
- Include root + trailing slash + wildcard rules.
- Include localized `guidesTags` to internal `tags` mapping under localized experiences slug.

### TASK-03: Generate and commit `_redirects` managed block
Status: Complete
- Add script to regenerate `apps/brikette/public/_redirects`.
- Keep manual rules (`/`, `/api/health`, `/directions/:slug`) and append generated managed block.

### TASK-04: Add regression coverage
Status: Complete
- Extend URL inventory test to assert generated localized redirect rules exist in `_redirects`.
- Extend URL coverage verification script with same rule coverage assertion.

### TASK-05: Validate and ship to staging
Status: In Progress
- Run targeted validations:
  - updated tests
  - brikette typecheck/lint gates
- Commit/push to `dev`.
- Promote `dev -> staging` and verify deployment.
- Smoke-check localized routes (`/en/help`, `/fr/aide`, `/es/experiencias`, plus nested examples).

## Validation Matrix
- `pnpm --filter @apps/brikette test -- src/test/migration/url-inventory.test.ts`
- `pnpm --filter @apps/brikette test -- src/test/middleware.test.ts`
- `pnpm --filter @apps/brikette typecheck`
- `pnpm --filter @apps/brikette lint`
- Staging runtime checks against localized routes after deployment

## Risks
- Redirect ordering/precedence errors could cause multi-hop redirects or missed matches.
- Wildcard behavior in Pages redirects must match expected `:splat` semantics.

## Mitigations
- Place specific localized tags redirects before section wildcard redirects.
- Keep deterministic generation order and enforce via tests.
- Validate real staging behavior with explicit localized/nested URL probes.
