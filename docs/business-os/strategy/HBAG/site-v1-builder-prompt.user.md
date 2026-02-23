---
Type: Site-Build-Brief
Status: Active
Business-Unit: HBAG
Business-Name: Caryina
Created: 2026-02-23
Updated: 2026-02-23
Owner: Pete
Review-trigger: Before first production launch for caryina
---

# Caryina Website V1 Builder Prompt (Agent-Ready)

## Purpose

This is the assembly brief for building the **first complete Caryina website version** without re-running discovery.  
It maps what exists, where it lives, what to reuse, and what must be created.

Use this document as the single prompt source for any agent doing V1 build work.

## What This Document Must Do

- Provide a **framework-first** build contract (not feature-by-feature micro-specs).
- Map existing assets by layer and path so work can be slotted in.
- Define boundaries for V1 scope, build order, and acceptance.
- Prevent duplicate discovery by pointing to canonical source docs.

## What This Document Must Not Do

- Re-state business/brand/content details already captured in canonical docs.
- Replace detailed implementation specs for individual complex features.
- Override stage gates and artifact statuses from strategy index.

## Non-Negotiable Build Guardrails

- Do not drift from `brand-dossier.user.md` token/language constraints.
- Do not invent business facts when source artifacts are missing; mark unknowns and continue with safe defaults.
- No arbitrary colors/sizing; use theme/design-system tokens.
- Keep reduced-motion and accessibility behavior intact during visual enhancements.
- Keep scope to V1 framework; defer non-core experiments unless they unblock conversion.

## Out of Scope for V1

- Blog/editorial expansion and content merchandising beyond baseline wiring.
- Account-area expansion beyond what is required for core conversion flow.
- Reviews/UGC, wishlist, personalization engines.
- CMS/page-builder authoring enhancements.
- Multi-currency and advanced localization experiments not required for initial launch.

## Build & Run Contract

### Toolchain

- Package manager: `pnpm` (workspace root).
- Runtime baseline: use current repo defaults and existing app scripts; do not introduce alternate build systems.

### Commands (minimum required)

1. `pnpm install`
2. `pnpm --filter @apps/caryina dev`
3. `pnpm --filter @apps/caryina typecheck`
4. `pnpm --filter @apps/caryina lint`
5. `pnpm --filter @apps/caryina test -- --runInBand --testPathPattern=\"BrandMark.test.tsx\"`
6. `pnpm --filter @apps/caryina build`

If touching legacy baseline code in `apps/cover-me-pretty`, also run:

1. `pnpm --filter @apps/cover-me-pretty typecheck`
2. `pnpm --filter @apps/cover-me-pretty lint`
3. Targeted tests only (`pnpm --filter @apps/cover-me-pretty test -- <pattern>`) with `--runInBand` or `--maxWorkers=2`.

### Environment baseline (expected keys in legacy flow)

- `NEXT_PUBLIC_SHOP_ID`
- `NEXT_PUBLIC_GA4_ID`
- `GA_API_SECRET`
- `NEXT_PUBLIC_LUXURY_FEATURES`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_TRYON`
- `R2_PUBLIC_BASE_URL`
- `CLOUDFLARE_ACCOUNT_ID`
- `INVENTORY_AUTHORITY_TOKEN`
- `TRYON_HEAVY_API_URL`

If any required secret/config is missing:

- Continue with framework build using safe stubs.
- Add explicit TODO markers with expected key names and source path references.
- Do not block route scaffolding on missing production secrets.

## Canonical Source Map (Consult-Only Inputs)

These artifacts are source-of-truth inputs for the build. Consult them; do not rewrite them as part of framework implementation unless explicitly requested.

### Strategy and Outcome (source of truth)

| Layer | Source path |
|------|-------------|
| Master artifact index + gate status | `docs/business-os/strategy/HBAG/index.user.md` |
| Business plan + outcome contracts | `docs/business-os/strategy/HBAG/plan.user.md` |
| Intake + constraints + missing data | `docs/business-os/startup-baselines/HBAG-intake-packet.user.md` |
| Offer definition (ICP, positioning, pricing) | `docs/business-os/startup-baselines/HBAG-offer.md` |
| Channel strategy | `docs/business-os/startup-baselines/HBAG-channels.md` |
| Measurement plan | `docs/business-os/strategy/HBAG/measurement-plan.user.md` |

### Brand and Design Language

| Layer | Source path |
|------|-------------|
| Active brand dossier (gating artifact) | `docs/business-os/strategy/HBAG/brand-dossier.user.md` |
| Brand strategy source | `docs/business-os/strategy/HBAG/brand-strategy.user.md` |
| Brand discovery render artifact | `docs/business-os/strategy/HBAG/brand-discovery-document.user.html` |
| Tagline decision rationale | `docs/business-os/strategy/HBAG/tagline-options.user.md` |

### Existing Implementation Assets

| Layer | Source path |
|------|-------------|
| Current Caryina app scaffold | `apps/caryina/` |
| Current Caryina layout | `apps/caryina/src/app/layout.tsx` |
| Current Caryina home route | `apps/caryina/src/app/page.tsx` |
| BrandMark component | `apps/caryina/src/components/BrandMark/BrandMark.tsx` |
| BrandMark styling | `apps/caryina/src/components/BrandMark/BrandMark.module.css` |
| BrandMark test seam | `apps/caryina/src/components/BrandMark/BrandMark.test.tsx` |
| Caryina global styles | `apps/caryina/src/styles/global.css` |
| Caryina theme package | `packages/themes/caryina/src/tokens.ts` |

### Full Storefront Baseline (legacy app to mine)

| Layer | Source path |
|------|-------------|
| Legacy app (full ecommerce route surface) | `apps/cover-me-pretty/` |
| Route tree | `apps/cover-me-pretty/src/app/` |
| Locale layout baseline | `apps/cover-me-pretty/src/app/[lang]/layout.tsx` |
| Home page server/client composition | `apps/cover-me-pretty/src/app/[lang]/page.tsx`, `apps/cover-me-pretty/src/app/[lang]/page.client.tsx` |
| Shop listing route | `apps/cover-me-pretty/src/app/[lang]/shop/page.tsx` |
| PDP route | `apps/cover-me-pretty/src/app/[lang]/product/[slug]/page.tsx` |
| Checkout route | `apps/cover-me-pretty/src/app/[lang]/checkout/page.tsx` |
| Success/cancel routes | `apps/cover-me-pretty/src/app/[lang]/success/page.tsx`, `apps/cover-me-pretty/src/app/[lang]/cancelled/page.tsx` |
| Shop config baseline | `apps/cover-me-pretty/shop.json` |
| Data baseline | `data/shops/cover-me-pretty/` |

### Existing Feature-Level Design Spec (do not re-solve)

| Layer | Source path |
|------|-------------|
| BrandMark particle animation fact-find | `docs/plans/_archive/hbag-brandmark-particle-animation/fact-find.md` |
| BrandMark particle animation design-spec | `docs/plans/_archive/hbag-brandmark-particle-animation/design-spec.md` |
| Prototype/perf evidence | `docs/plans/_archive/hbag-brandmark-particle-animation/artifacts/prototype/` |

## Operational Defaults (Use Unless Operator Overrides)

### Locale strategy (V1 default)

- Default to **retaining locale-segment parity** with the proven baseline (`[lang]` route structure) to avoid hidden integration regressions.
- If locale scope is intentionally reduced, do it explicitly and document the collapse plan in the implementation PR notes.

### Data strategy (V1 default)

- Default to creating `data/shops/caryina/` by controlled bootstrap from `data/shops/cover-me-pretty/`.
- Minimum required files for route skeleton rendering:
  - `shop.json`
  - `settings.json`
  - `products.json`
  - `inventory.json`
  - `pages.json`
  - `sections.json`
- Unknown business values must be marked with TODO + source reference; never fabricated.

### Analytics/measurement scope (V1 default)

- Wire baseline event flow only:
  - page view
  - product view
  - checkout start
  - purchase success
- Reuse existing analytics route and client wiring patterns from:
  - `apps/cover-me-pretty/src/app/api/analytics/event/route.ts`
  - `apps/cover-me-pretty/src/app/[lang]/checkout/CheckoutAnalytics.client.tsx`
  - `apps/cover-me-pretty/src/app/[lang]/success/SuccessAnalytics.client.tsx`
- If full analytics wiring is blocked, ship event stubs with explicit TODO markers and expected env keys.

### Legal/support pages (V1 minimum set)

- Terms
- Privacy
- Returns/Refunds
- Shipping
- Contact/Support

## V1 Framework Contract (Not Per-Feature Detail)

### Site purpose (use source docs; do not reinterpret)

- Build a brand-owned conversion surface for Caryina that can move demand from WhatsApp/social into structured web + checkout flow.

### Required V1 surface (minimum framework)

- App shell + theme + typography are Caryina-native.
- Core route framework exists for:
  - homepage
  - shop/listing
  - product detail
  - checkout
  - success/cancel
  - legal/support minimum set listed above
- Analytics/measurement hooks are wired to the V1 default scope listed above.
- BrandMark and header language follow active brand dossier.

### Reuse policy

- Reuse proven commerce wiring from `apps/cover-me-pretty` where possible.
- Re-skin and simplify to Caryina brand language; avoid inheriting unrelated legacy complexity by default.
- Keep HBAG-specific design decisions in Caryina app-level code unless clearly reusable platform-wide.

## Known Gaps to Resolve During Build

- `apps/caryina` currently has scaffold-level UI only; route framework must be established.
- No `data/shops/caryina/` dataset currently exists; apply the default bootstrap strategy unless explicitly overridden.
- Feature specs exist for BrandMark animation, but not yet for all route-level UX details; create additional design-specs only where confidence is low.

## Build Sequence (Framework-First)

1. Confirm gate status in `docs/business-os/strategy/HBAG/index.user.md` (consult only; do not edit gating artifacts during build).
2. Lock visual language by consuming `docs/business-os/strategy/HBAG/brand-dossier.user.md`.
3. Establish Caryina route framework using `apps/cover-me-pretty/src/app/` as structural baseline, preserving locale parity by default.
4. Bind Caryina theme and brand primitives across reused routes/components.
5. Bootstrap `data/shops/caryina/` using the default minimum dataset.
6. Wire baseline analytics scope (or explicit stubs if blocked).
7. Integrate already-specified BrandMark animation work per `docs/plans/_archive/hbag-brandmark-particle-animation/design-spec.md`.
8. Validate with targeted typecheck/lint/tests for changed packages.

## Traceability Convention (Required)

- For TODOs tied to missing business inputs:
  - Format: `TODO(<source-path>): <required decision/data>`
  - Example: `TODO(docs/business-os/startup-baselines/HBAG-intake-packet.user.md): confirm launch SKU color set`
- For seeded placeholder copy/data:
  - Add adjacent comment or note with `source:` path to originating artifact.
- For implementation decisions that diverge from defaults:
  - Add an inline `Decision:` note in the touched file and cite the source artifact that justified it.

## Accessibility and Motion Verification (Required)

- Keyboard focus order works through header, shop/listing, PDP, checkout.
- Visible focus state exists for interactive controls.
- `prefers-reduced-motion` disables non-essential motion and preserves readability.
- BrandMark respects reduced-motion fallback behavior.
- Touch targets are usable on mobile baseline.
- Basic text/background contrast passes for primary reading surfaces.

## Definition of Done (V1 Framework)

- `apps/caryina` contains a coherent route skeleton for the full commerce journey.
- Required V1 routes render in dev without runtime crashes:
  - `/`
  - `/[lang]/shop` (or chosen single-locale equivalent with documented rationale)
  - `/[lang]/product/[slug]`
  - `/[lang]/checkout`
  - `/[lang]/success`
  - `/[lang]/cancelled`
- Brand language and tokens are consistently applied.
- Existing reusable platform modules are integrated without architectural shortcuts.
- `pnpm --filter @apps/caryina typecheck`, `lint`, `test` (targeted), and `build` pass.
- Every imported business/content decision has a path reference via the traceability convention above.
- No hardcoded color tokens (hex/Tailwind palette shortcuts) outside documented exceptions.
- Reduced-motion behavior is verified.
- A follow-on plan can decompose page/content refinement without re-auditing baseline assets.

## Copy-Paste Prompt for Builder Agent

```md
Build the first full Caryina website version using `docs/business-os/strategy/HBAG/site-v1-builder-prompt.user.md` as the primary contract.

Execution rules:
1. Treat the Source Map in that file as authoritative; do not re-run broad discovery.
2. Build framework first (app shell + route structure + shared commerce flow), not fine content polish.
3. Reuse proven pieces from `apps/cover-me-pretty/src/app/` where appropriate, but enforce Caryina brand language from `docs/business-os/strategy/HBAG/brand-dossier.user.md` and `packages/themes/caryina/src/tokens.ts`.
4. Use default operational decisions from this brief unless explicitly overridden (locale parity, data bootstrap, analytics scope).
5. Preserve accessibility and reduced-motion behavior.
6. Keep token-driven styling only; no arbitrary values.
7. If data/content fields are missing, leave explicit TODO markers using the required traceability format instead of inventing facts.

Required outputs:
- Updated/created Caryina route framework in `apps/caryina/src/app/`.
- Supporting Caryina components and wiring needed for the framework.
- Bootstrapped `data/shops/caryina/` minimum dataset (or documented rationale for alternate approach).
- Any new design-spec docs only where uncertainty blocks implementation confidence.
- Validation evidence: targeted typecheck/lint/tests/build for touched packages.
```
