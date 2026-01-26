Type: Plan
Status: Completed
Domain: Brikette
Last-reviewed: 2026-01-25
Relates-to charter: docs/runtime/runtime-charter.md
Created: 2026-01-25
Created-by: Codex
Completed: 2026-01-25

# Brikette Guides De-legacy Plan

## Summary
Stop generating legacy `/[lang]/guides/[slug]` URLs (internal links, canonicals/alternates, structured data, sitemap) and treat the namespace routes (`/experiences`, `/how-to-get-here`, `/help`) as the only canonical guide URLs. Make legacy `/guides` handling an explicit decision (default: remove the shim and return not-found because this is new content), while preserving guide rendering parity and restoring/confirming dev-only on-screen editing UI behavior.

## Findings (Investigation)
- Experiences listings and assistance cross-links now use `guideHref` (namespace-aware) instead of `/guides` (BRK-GUIDE-002).
- Legacy `/[lang]/guides/[slug]` routes have been removed; inbound `/guides` requests now return not-found per policy (no redirect).
- Canonical URL fallback now delegates to the centralized resolver (no `/guides` base when pathname is absent).
- `buildLinks` now resolves guide hreflang alternates via `guideNamespace`, so alternates for assistance/how-to-get-here guides point to the correct base even when the incoming path is legacy `/guides` or `help`.
- Guardrail: added a migration test that fails if `"/guides"` appears in source code (excluding tests/locales) to prevent regressions.
- The guide “back” link now uses the experiences base for experience guides and assistance base for help guides (BRK-GUIDE-002).
- Guide routing and content are manifest/i18n driven. There is no separate legacy content set for `/guides`; the content comes from `apps/brikette/src/locales/<lang>/guides.json` via the shared guide template. The legacy route is only an entry point.
- On-screen editing elements are gated:
  - `DevStatusPill` renders only when `IS_DEV` is true (see `apps/brikette/src/routes/guides/guide-seo/components/DevStatusPill.tsx` and `apps/brikette/src/config/env.ts`).
  - `GuideEditorialPanel` renders only when a manifest entry exists **and** the guide is either in `/draft/*` or has `status !== "live"` (see `useGuideManifestState` in `apps/brikette/src/routes/guides/guide-seo/template/useGuideManifestState.ts`).
  - If a guide lacks a manifest entry or is marked `live`, the editorial panel will not appear even in dev.

## Completed Work (2026-01-25)
- Manifest coverage: every guide key now has a manifest entry and all entries are set to `status: "draft"` (including fallback entries).
- Editorial UI: because all guides are draft, `GuideEditorialPanel` now renders for every guide route (per `useGuideManifestState` gating).
- Regression guard: added a test that asserts every guide manifest entry is `draft`.
- Guide URL resolver: added `guidePath` as the single source of truth and made `guideHref`/`guideAbsoluteUrl` delegate to it.
- Internal links: migrated primary in-app guide links (experiences listings, assistance cross-links, tag chips, guide cards, and link tokens) to `guideHref` and namespace-aware tag paths.
- SEO alternates: updated `buildLinks` to translate guide alternates using `guideNamespace` (including assistance guides) and refreshed tests to avoid `/guides` bases.
- Legacy route removal: deleted the `/[lang]/guides/[slug]` shim route and updated URL fixtures so `/guides` is no longer advertised or tested as served.
- Regression guardrail: added `no-legacy-guides-path.test.ts` to block `/guides` string usage in source.
- Implemented namespace-aware serving for assistance/how-to-get-here guides and restricted `/experiences` to experience guides only (verification pending).
- Added `/[lang]/guides/[...slug]` not-found route to enforce 404 for legacy guide paths (verification pending).

## Audit Findings (Code Review)
- Canonical guide template (`GuideSeoTemplateBody`) still renders the same core UI blocks: hero/ArticleHeader, Structured TOC, guide content, tag chips, plan choice, transport notice, related guides, and “also helpful” widgets. (partial)
- Structured data remains present via `HeadSection` (Article + Breadcrumb JSON-LD) and `FaqStructuredDataBlock` in the canonical template. (partial)
- Dev status and editorial UI surfaces remain in the canonical template (`DevStatusPill`, `GuideEditorialPanel`) and are gated by manifest + draft rules. (partial)

## Audit Findings (Manual, 2026-01-25)
- `/en/experiences/path-of-the-gods` renders with canonical + OG URL set to `/en/experiences/path-of-the-gods`, and JSON-LD includes Article + BreadcrumbList with `mainEntityOfPage` pointing at the namespace URL.
- Back link on the experiences guide points to `/en/experiences`.
- Editorial panel + plan choice widgets render on the experiences guide (dev build).
- `/en/help/ferry-schedules` renders the guide template (help guide route now served).
- `/en/how-to-get-here/ferry-dock-to-hostel-brikette-with-luggage` renders the guide template (how-to-get-here guide route now served).
- `/en/guides/path-of-the-gods` returns 404 (legacy path removed as intended).
- `/en/experiences/tags/budgeting` links to `/en/help/...` for help guides; verified `/en/help/salerno-vs-naples` now resolves after slug mapping fix.
- Trailing slash normalization: `/en/experiences/path-of-the-gods/` returns 308 to the no-slash URL; query strings on canonical pages return 200 without redirect.

## Assumptions & Decisions
- Assumption: `/[lang]/guides/[slug]` has not been publicly indexed or shared; this is new content, so we do not need to preserve inbound compatibility for legacy URLs.
- Decision (default): remove the `/[lang]/guides/[slug]` shim and return not-found (404; no redirect).
- Contingency: if evidence appears that `/guides` URLs are referenced externally (or via non-obvious internal surfaces), switch BRK-GUIDE-009 to implement a permanent 308 redirect to the namespace canonical route (no chains) for a defined deprecation window.
- Editorial UI rule: all guides have manifest entries set to `draft`, so the `GuideEditorialPanel` should render for every guide route (per `useGuideManifestState`).

## Goals
- Stop generating `/guides` URLs internally; canonical guide URLs live exclusively under namespace routes.
- Define and implement explicit behavior for inbound `/[lang]/guides/[slug]` requests (remove vs. redirect; default: remove for new content).
- Introduce a single source of truth for guide URL resolution (namespace + path + canonical) and migrate all call sites to it.
- Ensure all metadata points to canonical URLs (canonical + hreflang alternates + OpenGraph URL + structured-data URLs) and there are no redirect chains.
- Ensure sitemap advertises only canonical guide URLs (no `/guides` entries).
- Preserve all guide content and UI affordances that were available in the legacy flow.
- Restore/confirm dev-only on-screen editing UI behavior with a crisp, documented rule.

## Non-goals
- Changing guide copy or media content unless required for parity.
- Rewriting guide data structures (manifest, i18n bundles) unless needed for URL migration.

## Active Tasks
- [x] BRK-GUIDE-001: Inventory current guide URL usage and bases.
  - Scope: enumerate every place that builds or embeds guide URLs (internal links, back links, SEO helpers, alternates/hreflang, OpenGraph, JSON-LD, sitemap, route inventory, tests/fixtures).
  - Inventory (current `/guides` sources):
    - URL helpers: `apps/brikette/src/guides/slugs/urls.ts` (`guideHref` `forceGuidesBase`, porterServices special-case), `apps/brikette/src/routes/guides/guide-seo/useCanonicalUrl.ts` (fallbacks to `/guides`), `apps/brikette/src/utils/seo.ts` (`buildLinks` alternates for guides when path uses `/guides`).
    - Legacy redirect route: removed (BRK-GUIDE-004).
    - Experiences listing + tags: `apps/brikette/src/app/[lang]/experiences/ExperiencesPageContent.tsx`, `apps/brikette/src/app/[lang]/experiences/tags/[tag]/GuidesTagContent.tsx`, `apps/brikette/src/components/guides/TagFilterBar.tsx`.
    - Guide back link + cross-links: `apps/brikette/src/app/[lang]/experiences/[slug]/GuideContent.tsx`, `apps/brikette/src/components/guides/RelatedGuides.tsx` (fallback path), `apps/brikette/src/routes/guides/utils/_linkTokens.tsx` (forces `/guides`).
    - Assistance cross-links: `apps/brikette/src/app/[lang]/assistance/AssistanceIndexContent.tsx`, `apps/brikette/src/app/[lang]/assistance/[article]/AssistanceArticleContent.tsx`, `apps/brikette/src/components/assistance/AlsoSeeGuidesSection.tsx`.
    - How-to-get-here context: `apps/brikette/src/app/[lang]/how-to-get-here/[slug]/page.tsx` passes `guidesSlug` into `HowToGetHereContent`.
    - Tests/fixtures: `apps/brikette/src/test/utils/seo.test.ts` asserts `/guides` alternates; `apps/brikette/src/test/fixtures/app-router-urls.txt` includes `/guides/*`.
    - Locales: `apps/brikette/src/locales/*/guides.json` includes redirect page copy for the legacy shim.
  - Sitemap ownership: `apps/brikette/scripts/generate-public-seo.ts` builds `public/sitemap.xml` using `listAppRouterUrls()` and explicitly excludes legacy `/guides` slugs.
  - Redirect ownership: `/guides` shim removed; only `apps/brikette/public/_redirects` handles `/directions/*`.
  - Deliverable: a list of sources to update plus the intended “single source of truth” call each should use.

- [x] BRK-GUIDE-007: Centralize guide URL resolution (single source of truth).
  - Scope: implement an authoritative resolver for `{lang, slug} -> namespace` plus helpers for path + canonical URL (names may vary, but intent is single-call-site ownership).
  - Deliverable: resolver + unit tests covering every guide slug/namespace mapping; all internal URL generation uses this resolver.
  - Guardrail: add a lightweight “no `/guides` base” enforcement (lint rule or CI grep in validation script) to prevent regressions.

- [x] BRK-GUIDE-002: Update all internal guide links to canonical namespace bases.
  - Depends-on: BRK-GUIDE-007.
  - Scope: experiences listing, how‑to‑get‑here sections, assistance/guide cross-links, nav/footer, and any UI tokens.
  - Deliverable: all link generation uses the centralized resolver; “back” links resolve to the correct namespace base.

- [x] BRK-GUIDE-003: Align SEO/canonical handling with new bases.
  - Depends-on: BRK-GUIDE-007.
  - Scope: `useCanonicalUrl` (or replacement), Next.js Metadata API configuration (`metadataBase`, `alternates.canonical`, `alternates.languages`/hreflang), `openGraph.url`, and JSON-LD URL fields (e.g., `mainEntityOfPage`, `BreadcrumbList` item URLs).
  - Sitemap: ensure sitemap includes only namespace-canonical guide URLs and does not advertise `/guides`.
  - Deliverable: canonical/alternates/OG/JSON-LD URL fields match the served URL exactly (no redirect), for every language and namespace.

- [x] BRK-GUIDE-009: Legacy `/guides` policy and implementation layer.
  - Scope: explicitly decide what happens to inbound `/[lang]/guides/[slug]` in production (remove with 404 vs 410 vs keep permanent redirect).
  - Implementation: document which layer owns legacy handling (App Router route vs `next.config` redirects vs middleware/CDN) and ensure there are no redirect chains.
  - Deliverable: a written policy + implementation that matches the assumptions in this plan (default: remove and 404), with a clear contingency to switch to permanent redirects if needed.

- [x] BRK-GUIDE-004: Remove legacy `/guides/[slug]` redirect route and update tests/fixtures.
  - Depends-on: BRK-GUIDE-009.
  - Scope: delete or replace the redirect shim route, remove legacy URL fixtures, and update route inventory tests.
  - Deliverable: canonical namespace URLs serve directly (no redirects), and legacy `/guides` behavior matches the agreed policy.

- [x] BRK-GUIDE-008: Monitoring and regression detection (as applicable).
  - Scope: add lightweight instrumentation and/or tests to detect accidental `/guides` URL generation and unexpected 404s under namespace routes.
  - Deliverable: a clear “done” signal (e.g., failing test/CI check) if `/guides` is reintroduced, plus optional counters/logging for legacy route hits if a redirect is kept.

- [x] BRK-GUIDE-005: Content parity audit.
  - Scope: compare legacy-redirect destination rendering vs. the canonical route and confirm all features remain (hero, TOC, tag chips, related guides, plan choice, transport notice, FAQ/structured data, canonical metadata, etc.).
  - Identify anything present in the legacy flow that is absent or degraded in the canonical flow; decide whether to port or intentionally drop.
  - URL contract checklist: no redirects for canonical pages, canonical/alternates match location, structured data URLs match canonical, namespace “back” link correct, and unknown slugs return the expected not-found behavior.
  - Normalization checks: query-string preservation (if redirects are kept), trailing slash behavior, and any locale normalization.

- [x] BRK-GUIDE-006: Dev editing UI investigation and remediation.
  - Scope: verify `IS_DEV` behavior, guide manifest coverage, and status gating.
  - Decision: define a crisp rule for dev editing UI visibility (e.g., “dev shows editorial panel for any manifest-backed guide regardless of status” vs. “draft-only surface”), and ensure it matches how dev/preview/prod environments are identified in this repo.
  - Deliverable: implementation + documented rule in this plan (and anywhere else the team expects to find it).

- [x] BRK-GUIDE-010: Serve help/how-to-get-here guide routes.
  - Scope: ensure guide slugs mapped to `assistance` and `howToGetHere` render via the guide template under `/[lang]/help/[slug]` and `/[lang]/how-to-get-here/[slug]`.
  - Considerations: resolve slug collisions with assistance articles and existing how-to-get-here routes; document precedence and add tests.
  - Deliverable: canonical help/how-to-get-here guide URLs return 200 and use guide template, with no regressions to existing assistance articles or route definitions.

## Sequencing (Safe Order of Operations)
- Complete BRK-GUIDE-001 inventory, then implement BRK-GUIDE-007 resolver + tests.
- Migrate internal links (BRK-GUIDE-002) to the resolver and add regression guardrails.
- Align metadata + sitemap + structured-data URLs (BRK-GUIDE-003) and confirm canonicals are self-referencing.
- Decide and implement legacy `/guides` handling (BRK-GUIDE-009), then remove/replace the shim route (BRK-GUIDE-004).
- Run parity + URL contract audit (BRK-GUIDE-005) and finalize dev editing UI rule/implementation (BRK-GUIDE-006).

## Acceptance Criteria
- No internal links, metadata (canonical/alternates/OG), structured data, or sitemap entries point to `/guides`.
- All guide URLs resolve directly to `/experiences`, `/how-to-get-here`, or `/help` without redirects.
- Inbound `/[lang]/guides/[slug]` behavior matches the explicit policy in BRK-GUIDE-009 (default: not-found for new content).
- No feature regression between legacy and canonical guide rendering.
- On-screen editing UI is visible in dev per the agreed rule and documented accordingly.
- Tests/fixtures align with the new URL strategy and pass.

## Risks & Mitigations
- Risk: incorrect slug→namespace mapping creates broken links or wrong “back” destinations.
  - Mitigation: centralized resolver + unit tests that enumerate every guide slug, plus parity audit URL-contract checks.
- Risk: `/guides` URLs reintroduced via future refactors.
  - Mitigation: add a guardrail (lint/CI grep/test) that fails builds if `/guides` appears in URL generation paths.
- Risk: SEO volatility if canonical URLs change.
  - Mitigation: ensure canonical tags, sitemap entries, and internal links align on the new base before removal.
- Risk: “dev-only” gating does not match real environments (local dev vs preview vs production).
  - Mitigation: document the rule and bind it to the repo’s actual environment detection (not assumptions about `NODE_ENV`).

## Pending Audit Work
- None. BRK-GUIDE-005 completed.
