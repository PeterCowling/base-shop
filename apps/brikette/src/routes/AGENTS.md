<!-- /src/routes/AGENTS.md -->

# Agents – Routing & Pages

## Human checklist
- Routing is defined by the manifest in `src/routes.tsx`; deviating costs typed loaders and code-splitting.
- Keep every locale scoped under `/{lang}`; rely on `$lang._guard.tsx` to normalise invalid prefixes.
- Use `<Link prefetch>` wisely to balance bundle size with perceived speed; intent for critical flows, viewport for always-visible links.
- Remove `action` exports unless switching the project to SSR; build strips them today.

## Machine cues
<!-- MACHINE_READABLE:ROUTES:START -->
```json
{
  "languagePrefixes": "required",
  "prerender": true,
  "ssr": true,
  "guards": ["src/routes/$lang._guard.tsx"],
  "metaPlaceholders": true
}
```
<!-- MACHINE_READABLE:ROUTES:END -->

## 1 · Framework mode (React Router 7 + @react-router/dev)
- Adopted **2025-05-21**.
- Build-time crawler scans `src/routes.tsx` → fully typed manifest.
- `prerender: true` produces HTML and `.data` for every concrete path.

| File | Purpose |
| ---- | ------- |
| `react-router.config.ts` | Global build options (`ssr: false`, `prerender: true`). Must stay at repo root. |
| `src/routes.tsx` | Declarative manifest built with `prefix()`, `route()`, `index()`. File-based routing remains compatible. |

> If you abandon the manifest for a manual `<Routes>` tree you lose automatic code-splitting and typed loader signatures from `@react-router/dev`.

## 2 · Language prefixes
- Every locale lives under `/en`, `/fr`, … for SEO clarity and predictable SSG output.

| Path | Behaviour |
| ---- | --------- |
| `/` | Handled at the edge (Cloudflare Pages Function). Humans receive a 302 to `/<best-locale>` based on `Accept-Language`; bots/crawlers receive a static index with `<link rel="alternate" hreflang="…">` for all locales. |
| `/xx/*` (invalid) | `$lang._guard.tsx` loader redirects immediately to the default locale. |

Helper export:
```ts
// src/i18n/supported.ts
export const SUPPORTED = ["de", "en", "es", "fr", "it", "ja", "ko", "pt", "ru", "zh"] as const;
```

## 3 · Route metadata patterns
- Head comes from route exports, not inline JSX.
- Every route must export:
  - `meta()` → returns title, description, OG + Twitter tags; `og:type="article"` for article‑like routes.
  - `links()` → returns canonical + full hreflang cluster incl. `x-default`.
- Do not import or use `@/components/seo/SeoHead` from routes.
- Do not inline `<title>`, `<meta>`, `<link rel="canonical">`, or JSON‑LD scripts in route JSX.

Ensure the root document renders `<Meta />` and `<Links />` placeholders so head tags flush correctly on navigation.

## 4 · Prefetch & bundling
- Use `<Link prefetch="intent">` or `<PrefetchPageLinks page="/en/contact" />` for critical flows.
- `prefetch="viewport"` suits footer links that are visible immediately on mobile.
- Prerendered routes emit `.data` alongside `.html`; the router hydrates from those payloads to avoid duplicate network requests.

## 5 · Forms & actions
- With `ssr: false`, any `action()` export is stripped at build time (warning only).
- Convert forms to `<form method="dialog">` plus client handler, or use `useFetcher()` for optimistic posts (planned).

## 6 · Accessibility & i18n (page layer)
- Root layout sets `<html lang={params.lang} dir={params.lang === "ar" ? "rtl" : "ltr"}>`.
- Per‑route `links()` emits `<link rel="alternate" hreflang="…">` for every supported locale.
- ESLint + `jsx-a11y` enforce semantic landmarks (`<main>`, `<nav>`…) and WCAG contrast.

## 7 · Sample locale guard loader
```ts
// src/routes/$lang._guard.tsx
import { redirect, type LoaderFunctionArgs } from "react-router-dom";
import { SUPPORTED, DEFAULT } from "~/i18n/supported";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const maybeLang = params.lang?.toLowerCase();
  if (!maybeLang || !SUPPORTED.includes(maybeLang as any)) {
    const url = new URL(request.url);
    const rest = url.pathname.replace(/^\/[^/]+/, ""); // drop invalid segment
    throw redirect(`/${DEFAULT}${rest}`, { replace: true });
  }
  return null;
}
```
This guarantees that non-existent prefixes never hydrate with the wrong strings.

## 8 · Troubleshooting checklist
| Symptom | Fix |
| ------- | --- |
| Hydration mismatch warnings | Ensure prerendered HTML never embeds timestamps or random IDs. |
| Unexpected behaviour on `/` | Confirm the edge function is deployed and `VITE_SITE_DOMAIN` is set. The handler varies on `Accept-Language, User-Agent`. |
| Unexpected full-page reload on nav | Confirm the route lives in the manifest and is not excluded from the prerender list. |

## 9 · Template Enforcement
- Purpose: prevent hand‑rolled pages; enforce consistent templates and SEO wiring.
- Lint rules:
  - `import/no-handrolled-howto` → require `makeHowToGuidePage` in `src/routes/how-to-get-here/*.tsx` and an exported `clientLoader`.
  - `import/no-handrolled-experience-guides` → require `_GuideSeoTemplate` usage in `src/routes/guides/*.tsx` plus `export const GUIDE_KEY` and `GUIDE_SLUG`.
  - `import/no-handrolled-assistance` → require `_ArticleFactory` usage and an exported `clientLoader` in `src/routes/assistance/*.tsx`.
  - `import/no-inline-head` → forbid inline `<title>/<meta>/<link rel="canonical">` in routes.
  - `import/require-route-head-exports` → require `meta()` and `links()` exports in routes.
  - `import/require-og-article` → enforce `og:type=article` for article‑like routes.
  - `import/require-twitter-card` → require `twitter:card` in `meta()`.
  - `import/require-xdefault-canonical` → require `x-default` entry in `links()`.
  - `import/no-inline-jsonld` → forbid inline JSON‑LD in routes.
- Scope/Exclusions:
  - How‑to infra and dynamic route are excluded; tests excluded everywhere.
  - Guides infra (`_GuideSeoTemplate`, `guide-seo/*`, `tags.$tag.tsx`) excluded.
  - Assistance hub/infra excluded.
- Rollout: rules currently emit warnings. After migrations, we will raise to `error`.
- Draft workflow: manifest-backed guides surface an editorial panel on `/draft/*` routes showing status, publishing areas, and checklist progress so editors can promote guides without touching route code. The `/[lang]/draft` dashboard lists every guide with outstanding tasks, draft URLs, and target sections; keep it in sync with manifest fields when adding new workflow metadata.

## 10 · Route test scaffolding
- When a route test needs to mock guide-specific components (e.g., `CheapEatsMeta`) **reset the module cache before importing the route** so previous suites cannot pre-load the real implementation. Typical pattern:
  ```ts
  await vi.resetModules();
  vi.doMock("@/routes/guides/foo/FooMeta", () => ({ FooMeta: metaSpy }));
  // … additional doMock calls …
  const module = await import("@/routes/guides/foo");
  const FooRoute = module.default;
  ```
- Tests that assert mocked invocations should `await waitFor(...)` after calling `renderPage` because StrictMode may invoke bridge components more than once.
- Shared coverage suites that import many guides (for example, breadcrumbs JSON-LD) **must import routes lazily inside each test** to avoid pre-populating the module cache before guide-specific suites run.

## 11 · Manifest-driven guides
- Blocks live in `src/routes/guides/blocks/types.ts`. Add or modify block options there so Zod catches schema drift. The runtime composition is handled by `src/routes/guides/blocks/composeBlocks.ts`.
- Supported block catalogue:
  - `hero` → static asset path plus optional `altKey`/`alt`. Limit intro paragraphs with `introLimit` when needed.
  - `genericContent` → sets `renderGenericContent`; accepts `showToc` / `faqHeadingLevel` tweaks.
  - `faq` → declare the fallback key; `alwaysProvideFallback` keeps JSON-LD populated even for localized FAQ arrays.
  - `gallery` → either inline `items` (`image`, `alt`, `caption`) or a `source` module when bespoke builders still exist.
  - `serviceSchema` → connects Service JSON-LD via `serviceTypeKey`, `areaServedKey`, etc.
  - `planChoice` / `transportNotice` → toggle their respective footer widgets.
  - `alsoHelpful` → requires `tags` (optionally `excludeGuide`, `includeRooms`).
- Use `pnpm tsx scripts/scaffold.ts guide:blocks` (or `--list-blocks`) to view the current block catalogue, default options, and notes before scaffolding.
- Scaffold new guides with `pnpm tsx scripts/scaffold.ts guide --key <GuideKey> --blocks hero,genericContent,faq`. The generator seeds EN content JSON, appends the manifest entry, writes the thin route wrapper (`defineGuideRoute` + manifest lookup), and stubs a route test that uses the shared harness.
- Migrate legacy guide wrappers with `pnpm tsx scripts/scaffold.ts guide:migrate --key <GuideKey> --slug <slug> --pattern <generic|manual|redirect> [--related k1,k2] [--structured Article,FAQPage] [--force]`. The migrator writes a `defineGuideRoute` wrapper tailored to the selected pattern and appends a manifest entry unless `--no-manifest` is set. Use `--dry-run` to preview output before touching the repo.
- Route tests should use `withGuideMocks()` from `src/routes/guides/__tests__/guideTestHarness.ts`. The helper resets module state, replays the guide mocks, loads the route module lazily, runs `clientLoader`, and exposes `renderRoute`, `screen`, and translation helpers. `guides.manifest-smoke.test.tsx` already ensures every manifest entry renders; bespoke suites should focus on override logic only.
- `pnpm content:lint` now parses every `src/locales/*/guides/content/*.json` file against the shared Zod schema (`src/routes/guides/content-schema.ts`). Fix schema violations (missing `seo`, non-string FAQ entries, etc.) before shipping copy updates.
