## Skylar SRL — Implementation Overview

This file describes the shared foundations for `apps/skylar`. Locale-specific visual systems live in separate documents:

- [English guide](./AGENTS.en.md) — warm red on cream, poster-style typography
- [Italian guide](./AGENTS.it.md) — typographic sibling to EN with warmer palette tweaks
- [Chinese guide](./AGENTS.zh.md) — dark/gold treatment based on the bilingual business card

### Core repo facts

- Monorepo: `PeterCowling/base-shop`
- App: `apps/skylar` (Next.js 15 App Router + React 19)
- Locales: `en`, `it`, `zh` (default `en`, `/[lang]` routing)
- Shared packages: Tailwind tokens via `@acme/tailwind-config`, translations in `apps/skylar/i18n/*.json`
- Layout: `src/app/[lang]/layout.tsx` handles translations, theming, header, footer

### Canonical content sources

Important strings for the two 'people' that should be included on each version of the site:

- Infinity logo block: `SKYLAR SRL`, `斯凯拉有限公司`, `Since 2015`
- English card lines:
  - Cristiana Marzano — Product Design & Sourcing Director
  - “Product Design & Sourcing”
  - “Custom Distribution & Sales Platforms for Global Markets”
  - “3-Hour Website Launch · Multilingual Markets”
  - Contacts: `+39 334 904 8692`, `cmcowling@me.com`, `skylarsrl.com`

- Infinity logo block: `SKYLAR SRL`, `斯凯拉有限公司`, `Since 2015`
- English card lines:
  - Peter Cowling — Distribution & Platforms Director
  - “Product Design & China Sourcing”
  - “Custom Distribution & Sales Platforms”
  - “3-Hour Website Launch · Multilingual Markets”
  - Contacts: `+39 351 640 9673`, `peter.cowling1976@gmail.com`, `skylarsrl.com`

### Route structure

| Route                 | Description                                                                                                                                           |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/[lang]`             | Landing page. Oversized hero typography, intro columns (“Flywheel / Products / Real Estate”), category cards, split sections, CTA to Hostel Brikette. |
| `/[lang]/products`    | Deep dive into product design, sourcing, distribution platforms, 3-hour launch, multilingual markets. Minimal imagery.                                |
| `/[lang]/real-estate` | Hostel Brikette overview with CTA linking to `https://hostel-positano.com` (new tab).                                                                 |
| `/[lang]/people`      | Two equal profile cards (Cristiana & Peter) with roles, bios, contact info.                                                                           |

### Implementation guardrails

- Use `clamp()` for typographic scaling; paragraphs use locale-specific CSS variables for body size/line-height.
- Ensure widths stay inside the viewport (use responsive padding rather than fixed max widths).
- Images should be lightweight, mostly hero/category shots. Hostel CTA always external.
- Performance targets Cloudflare free tier: avoid heavy scripts, optimise Next Image.
- For strings that need nuanced styling (e.g., intro columns), keep translations split into `heading` and `body`.

Refer to the locale docs for palette, typography, and tone rules unique to each language.

### Deployment via GitHub Actions

- CI workflow: `.github/workflows/skylar.yml` builds the full workspace, runs `OUTPUT_EXPORT=1 pnpm --filter @apps/skylar build` to produce a static export in `apps/skylar/out`, then deploys that folder to Cloudflare Pages with `wrangler pages deploy` (no `@cloudflare/next-on-pages` required).
- Trigger: automatic on pushes to `main`, or manual via **Actions → Deploy Skylar → Run workflow** when you need an ad‑hoc publish.
- Secrets required in the repo: `CLOUDFLARE_ACCOUNT_ID` (Pages account ID) and `CLOUDFLARE_API_TOKEN` (token scoped with Pages Write + Workers Pages permissions for the `skylar` project).
- Cloudflare setup: create/rename the Pages project to `skylar`, connect the custom domain, and keep DNS managed in Cloudflare so deployments become live immediately after the action finishes.

Skylar is intentionally deployed as a fully static, read‑only reference site (no auth, APIs, or dashboards), so Cloudflare Pages’ static hosting is sufficient and easier to reason about than a full Next.js runtime. We deliberately avoid `@cloudflare/next-on-pages` here because we do not need SSR, API routes, middleware, or the dynamic image optimizer for this app.
