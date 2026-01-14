# SEO & Machine-Readable Implementation Plan

> **Goal**: Achieve world-class SEO and AI/machine-readable capabilities across all customer-facing apps through automation and centralization.

## Executive Summary

This plan establishes a **centralized SEO infrastructure** that:
1. Consolidates all SEO logic into a single shared package (`@acme/seo`)
2. Automates generation of machine-readable files (sitemaps, robots.txt, llms.txt, OpenAPI specs)
3. Provides CMS-driven configuration to minimize per-app code changes
4. Enables AI crawlers (GPTBot, ClaudeBot, etc.) across all properties

---

## Current State Assessment

| App | SEO Maturity | Key Gaps |
|-----|--------------|----------|
| **Brikette** | World-class | Reference implementation |
| **Cover-Me-Pretty** | Good | Missing llms.txt, OpenAPI, comprehensive JSON-LD |
| **Cochlearfit** | Basic | Missing robots.ts, sitemap.ts, structured data, AI support |
| **Skylar** | Minimal | Missing everything except static metadata |
| **Storefront** | Minimal | No discernible SEO infrastructure |

### Reference Files (Brikette)
- [apps/brikette/src/components/seo/SeoHead.tsx](../apps/brikette/src/components/seo/SeoHead.tsx) - Unified head builder
- [apps/brikette/src/utils/seo.ts](../apps/brikette/src/utils/seo.ts) - Core SEO utilities
- [apps/brikette/public/llms.txt](../apps/brikette/public/llms.txt) - AI discovery file
- [apps/brikette/public/.well-known/ai-plugin.json](../apps/brikette/public/.well-known/ai-plugin.json) - ChatGPT plugin manifest

---

## Architecture: Centralized SEO Package

### Phase 1: Create `@acme/seo` Package

Create a new shared package that consolidates all SEO functionality:

```
packages/seo/
├── src/
│   ├── index.ts                    # Main exports
│   ├── config/
│   │   └── schema.ts               # SEO configuration schema (Zod)
│   │
│   ├── head/
│   │   ├── SeoHead.tsx             # Universal head component (Next.js + React Router)
│   │   ├── buildMeta.ts            # Meta tag builders
│   │   ├── buildLinks.ts           # Canonical + hreflang builders
│   │   └── types.ts                # TypeScript interfaces
│   │
│   ├── structured-data/
│   │   ├── index.ts                # All schema builders
│   │   ├── product.ts              # Product/Offer schema
│   │   ├── organization.ts         # Organization/LocalBusiness
│   │   ├── breadcrumb.ts           # BreadcrumbList
│   │   ├── faq.ts                  # FAQPage
│   │   ├── article.ts              # Article/BlogPosting
│   │   ├── event.ts                # Event schema
│   │   ├── hotel.ts                # Hotel/Hostel/Lodging (from Brikette)
│   │   └── service.ts              # Service schema
│   │
│   ├── generators/
│   │   ├── robots.ts               # robots.txt generator
│   │   ├── sitemap.ts              # Sitemap generator
│   │   ├── llms-txt.ts             # llms.txt generator
│   │   ├── ai-plugin.ts            # AI plugin manifest generator
│   │   └── openapi.ts              # OpenAPI spec generator
│   │
│   └── cli/
│       └── generate.ts             # CLI for generating static files
│
├── package.json
└── tsconfig.json
```

### Key Design Principles

1. **Configuration-Driven**: All SEO settings live in shop settings (CMS), not app code
2. **Framework-Agnostic**: Works with Next.js App Router, Pages Router, and React Router
3. **Zero Per-App Duplication**: Apps import from `@acme/seo`, never implement SEO logic locally
4. **Build-Time Generation**: Static files (llms.txt, robots.txt) generated at build time from CMS config

---

## Phase 2: Centralized Configuration Schema

### Shop Settings Extension

Extend the existing shop settings schema to include comprehensive SEO configuration:

```typescript
// packages/seo/src/config/schema.ts
import { z } from "zod";

export const SeoConfigSchema = z.object({
  // Basic SEO
  siteTitle: z.string(),
  siteDescription: z.string(),
  canonicalBase: z.string().url(),

  // Social/OG defaults
  defaultOgImage: z.string().optional(),
  twitterHandle: z.string().optional(),
  facebookAppId: z.string().optional(),

  // Organization
  organization: z.object({
    name: z.string(),
    legalName: z.string().optional(),
    logo: z.string().url().optional(),
    sameAs: z.array(z.string().url()).default([]), // Social profiles
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
  }),

  // Local Business (if applicable)
  localBusiness: z.object({
    enabled: z.boolean().default(false),
    type: z.enum(["LocalBusiness", "Store", "Restaurant", "Hotel", "Hostel"]).default("LocalBusiness"),
    address: z.object({
      streetAddress: z.string(),
      addressLocality: z.string(),
      postalCode: z.string(),
      addressCountry: z.string(),
    }).optional(),
    geo: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).optional(),
    openingHours: z.array(z.string()).default([]),
    priceRange: z.string().optional(),
  }).optional(),

  // Machine-Readable / AI
  machineReadable: z.object({
    // llms.txt configuration
    llmsTxt: z.object({
      enabled: z.boolean().default(true),
      description: z.string(),
      endpoints: z.array(z.object({
        label: z.string(),
        path: z.string(),
        description: z.string().optional(),
      })).default([]),
    }),

    // AI plugin (ChatGPT, etc.)
    aiPlugin: z.object({
      enabled: z.boolean().default(false),
      nameForHuman: z.string(),
      nameForModel: z.string(),
      descriptionForHuman: z.string(),
      descriptionForModel: z.string(),
      logoUrl: z.string().url().optional(),
      legalInfoUrl: z.string().url().optional(),
    }).optional(),

    // OpenAPI spec
    openApi: z.object({
      enabled: z.boolean().default(false),
      specPath: z.string().default("/.well-known/openapi.yaml"),
    }).optional(),
  }),

  // Robots configuration
  robots: z.object({
    allowAll: z.boolean().default(true),
    allowAiBots: z.boolean().default(true), // GPTBot, ClaudeBot, etc.
    disallowPaths: z.array(z.string()).default(["/api/", "/admin/"]),
    additionalSitemaps: z.array(z.string()).default([]),
  }),

  // Per-language overrides
  languageOverrides: z.record(z.string(), z.object({
    siteTitle: z.string().optional(),
    siteDescription: z.string().optional(),
  })).default({}),
});

export type SeoConfig = z.infer<typeof SeoConfigSchema>;
```

### CMS Integration

Add SEO configuration to the existing CMS shop settings UI:

```
apps/cms/src/app/cms/shop/[shop]/settings/
├── seo/                    # Existing
│   ├── page.tsx
│   └── ...
├── machine-readable/       # NEW
│   ├── page.tsx           # llms.txt, AI plugin, OpenAPI config
│   ├── LlmsTxtEditor.tsx
│   ├── AiPluginEditor.tsx
│   └── OpenApiEditor.tsx
```

---

## Phase 3: Automated File Generation

### Build-Time Generation Script

Create a CLI tool that generates all static SEO files from CMS configuration:

```typescript
// packages/seo/src/cli/generate.ts
import { generateRobotsTxt } from "../generators/robots";
import { generateLlmsTxt } from "../generators/llms-txt";
import { generateAiPlugin } from "../generators/ai-plugin";
import { generateOpenApiSpec } from "../generators/openapi";

export async function generateSeoFiles(shopId: string, outputDir: string) {
  const config = await fetchShopSeoConfig(shopId);

  // Generate robots.txt
  await writeFile(
    join(outputDir, "robots.txt"),
    generateRobotsTxt(config)
  );

  // Generate llms.txt
  if (config.machineReadable.llmsTxt.enabled) {
    await writeFile(
      join(outputDir, "llms.txt"),
      generateLlmsTxt(config)
    );
  }

  // Generate AI plugin manifest
  if (config.machineReadable.aiPlugin?.enabled) {
    await writeFile(
      join(outputDir, ".well-known/ai-plugin.json"),
      JSON.stringify(generateAiPlugin(config), null, 2)
    );
  }

  // Generate OpenAPI spec (if configured)
  if (config.machineReadable.openApi?.enabled) {
    await writeFile(
      join(outputDir, ".well-known/openapi.yaml"),
      generateOpenApiSpec(config)
    );
  }
}
```

### Generator Implementations

#### robots.txt Generator

```typescript
// packages/seo/src/generators/robots.ts
import type { SeoConfig } from "../config/schema";

export function generateRobotsTxt(config: SeoConfig): string {
  const lines: string[] = [];

  // Default user-agent
  lines.push("User-agent: *");
  if (config.robots.allowAll) {
    lines.push("Allow: /");
  }
  for (const path of config.robots.disallowPaths) {
    lines.push(`Disallow: ${path}`);
  }
  lines.push("");

  // AI bots (explicit allow)
  if (config.robots.allowAiBots) {
    const aiBots = ["GPTBot", "ClaudeBot", "ChatGPT-User", "Google-Extended", "Amazonbot"];
    for (const bot of aiBots) {
      lines.push(`User-agent: ${bot}`);
      lines.push("Allow: /");
      lines.push("");
    }
  }

  // Sitemaps
  lines.push(`Sitemap: ${config.canonicalBase}/sitemap.xml`);
  if (config.machineReadable.llmsTxt.enabled) {
    lines.push(`Sitemap: ${config.canonicalBase}/ai-sitemap.xml`);
  }
  for (const sitemap of config.robots.additionalSitemaps) {
    lines.push(`Sitemap: ${config.canonicalBase}${sitemap}`);
  }

  return lines.join("\n");
}
```

#### llms.txt Generator

```typescript
// packages/seo/src/generators/llms-txt.ts
import type { SeoConfig } from "../config/schema";

export function generateLlmsTxt(config: SeoConfig): string {
  const { llmsTxt } = config.machineReadable;
  const lines: string[] = [];

  // Header
  lines.push(`# ${config.organization.name}`);
  lines.push(`> ${llmsTxt.description}`);
  lines.push("");

  // Machine-readable sources
  lines.push("## Machine-readable sources");
  for (const endpoint of llmsTxt.endpoints) {
    const desc = endpoint.description ? ` — ${endpoint.description}` : "";
    lines.push(`- [${endpoint.label}](${endpoint.path})${desc}`);
  }
  lines.push("");

  // Standard endpoints (auto-generated)
  lines.push("## Standard endpoints");
  lines.push(`- [Sitemap](/sitemap.xml)`);
  if (config.machineReadable.openApi?.enabled) {
    lines.push(`- [OpenAPI spec](${config.machineReadable.openApi.specPath})`);
  }
  if (config.machineReadable.aiPlugin?.enabled) {
    lines.push(`- [AI plugin manifest](/.well-known/ai-plugin.json)`);
  }
  lines.push("");

  return lines.join("\n");
}
```

### Package.json Scripts

Add generation scripts to each app's package.json:

```json
{
  "scripts": {
    "prebuild": "pnpm run generate:seo",
    "generate:seo": "seo-generate --shop $NEXT_PUBLIC_SHOP_ID --output public"
  }
}
```

---

## Phase 4: Universal SEO Components

### SeoHead Component (Framework-Agnostic)

```typescript
// packages/seo/src/head/SeoHead.tsx
import React from "react";
import { buildMeta, buildLinks } from "./builders";
import type { SeoHeadProps } from "./types";

/**
 * Universal SEO head component.
 * Works with Next.js (via generateMetadata) and React Router (via direct rendering).
 */
export function SeoHead({
  lang,
  title,
  description,
  url,
  image,
  ogType = "website",
  twitterCard = "summary_large_image",
  isPublished = true,
  config,
}: SeoHeadProps): JSX.Element {
  const links = buildLinks({ lang, origin: config.canonicalBase, path: url });
  const meta = buildMeta({ lang, title, description, url, image, ogType, twitterCard });

  return (
    <>
      <title>{title}</title>
      {meta.map((m, i) => <meta key={i} {...m} />)}
      {links.map((l, i) => <link key={i} {...l} />)}
      {!isPublished && <meta name="robots" content="noindex,follow" />}
    </>
  );
}

/**
 * Next.js App Router metadata generator.
 * Use this in generateMetadata() functions.
 */
export function buildNextMetadata(props: SeoHeadProps): Metadata {
  return {
    title: props.title,
    description: props.description,
    metadataBase: new URL(props.config.canonicalBase),
    alternates: {
      canonical: props.url,
      languages: buildHreflangMap(props),
    },
    openGraph: {
      title: props.title,
      description: props.description,
      url: props.url,
      type: props.ogType as "website",
      locale: props.lang,
      images: props.image ? [props.image] : undefined,
    },
    twitter: {
      card: props.twitterCard as "summary_large_image",
      title: props.title,
      description: props.description,
      images: props.image ? [props.image.src] : undefined,
    },
    robots: props.isPublished ? undefined : { index: false, follow: true },
  };
}
```

### Structured Data Components

Create reusable structured data builders that work across all apps:

```typescript
// packages/seo/src/structured-data/product.ts
import type { Product, Offer, AggregateRating } from "schema-dts";

export interface ProductSchemaInput {
  name: string;
  description?: string;
  url?: string;
  images?: string[];
  brand?: string;
  sku?: string;
  gtin?: string;
  price?: number;
  priceCurrency?: string;
  availability?: "InStock" | "OutOfStock" | "PreOrder";
  rating?: { value: number; count: number };
}

export function buildProductSchema(input: ProductSchemaInput): Product {
  return {
    "@type": "Product",
    name: input.name,
    description: input.description,
    url: input.url,
    image: input.images,
    brand: input.brand ? { "@type": "Brand", name: input.brand } : undefined,
    sku: input.sku,
    gtin: input.gtin,
    offers: input.price ? {
      "@type": "Offer",
      price: input.price,
      priceCurrency: input.priceCurrency ?? "EUR",
      availability: `https://schema.org/${input.availability ?? "InStock"}`,
    } as Offer : undefined,
    aggregateRating: input.rating ? {
      "@type": "AggregateRating",
      ratingValue: input.rating.value,
      reviewCount: input.rating.count,
    } as AggregateRating : undefined,
  };
}

// React component wrapper
export function ProductStructuredData({ product }: { product: ProductSchemaInput }) {
  const schema = buildProductSchema(product);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", ...schema }) }}
    />
  );
}
```

---

## Phase 5: Per-App Integration

### Next.js Apps (Cover-Me-Pretty, Cochlearfit, Skylar)

#### 1. Add `robots.ts` (Automated)

```typescript
// src/app/robots.ts
import { generateRobotsTxtRoute } from "@acme/seo/next";
import { getShopSeoConfig } from "@acme/seo/config";

export default async function robots() {
  const config = await getShopSeoConfig(process.env.NEXT_PUBLIC_SHOP_ID!);
  return generateRobotsTxtRoute(config);
}
```

#### 2. Add `sitemap.ts` (Automated)

```typescript
// src/app/sitemap.ts
import { generateSitemapRoute } from "@acme/seo/next";
import { getShopSeoConfig } from "@acme/seo/config";
import { getProducts } from "@platform-core/repositories/products.server";

export default async function sitemap() {
  const shopId = process.env.NEXT_PUBLIC_SHOP_ID!;
  const config = await getShopSeoConfig(shopId);
  const products = await getProducts(shopId);

  return generateSitemapRoute(config, {
    // Dynamic content providers
    products: products.map(p => ({
      slug: p.slug,
      lastModified: p.updated_at,
    })),
  });
}
```

#### 3. Update Layout with Centralized SEO

```typescript
// src/app/[lang]/layout.tsx
import { buildNextMetadata } from "@acme/seo";
import { getShopSeoConfig } from "@acme/seo/config";
import { OrganizationStructuredData, LocalBusinessStructuredData } from "@acme/seo/structured-data";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const config = await getShopSeoConfig(process.env.NEXT_PUBLIC_SHOP_ID!);
  return buildNextMetadata({
    lang: params.lang,
    title: config.siteTitle,
    description: config.siteDescription,
    url: `/${params.lang}`,
    config,
  });
}

export default async function RootLayout({ children, params }) {
  const config = await getShopSeoConfig(process.env.NEXT_PUBLIC_SHOP_ID!);

  return (
    <html lang={params.lang}>
      <body>
        <OrganizationStructuredData config={config} />
        {config.localBusiness?.enabled && <LocalBusinessStructuredData config={config} />}
        {children}
      </body>
    </html>
  );
}
```

### React Router Apps (Brikette)

Brikette already has excellent SEO. The goal is to:
1. Extract reusable logic to `@acme/seo`
2. Keep Brikette-specific features (hotel schema, guides) local
3. Share common patterns with other apps

---

## Phase 6: Automation & CI/CD Integration

### Pre-Build SEO Generation

Add to CI/CD pipeline:

```yaml
# .github/workflows/deploy.yml
jobs:
  build:
    steps:
      - name: Generate SEO files
        run: pnpm run generate:seo --all-shops

      - name: Validate SEO files
        run: pnpm run validate:seo
```

### SEO Validation Script

```typescript
// packages/seo/src/cli/validate.ts
export async function validateSeoFiles(outputDir: string) {
  const errors: string[] = [];

  // Check robots.txt exists
  if (!existsSync(join(outputDir, "robots.txt"))) {
    errors.push("Missing robots.txt");
  }

  // Validate llms.txt format
  const llmsTxt = readFileSync(join(outputDir, "llms.txt"), "utf-8");
  if (!llmsTxt.startsWith("#")) {
    errors.push("llms.txt must start with a title (#)");
  }

  // Validate AI plugin JSON
  if (existsSync(join(outputDir, ".well-known/ai-plugin.json"))) {
    const plugin = JSON.parse(readFileSync(join(outputDir, ".well-known/ai-plugin.json"), "utf-8"));
    if (!plugin.schema_version || !plugin.name_for_human) {
      errors.push("ai-plugin.json missing required fields");
    }
  }

  if (errors.length > 0) {
    throw new Error(`SEO validation failed:\n${errors.join("\n")}`);
  }
}
```

### CMS Webhook for Regeneration

When SEO settings change in CMS, trigger regeneration:

```typescript
// apps/cms/src/app/api/webhooks/seo-changed/route.ts
export async function POST(request: Request) {
  const { shopId } = await request.json();

  // Trigger rebuild for the affected app
  await triggerDeploy(shopId);

  // Optionally, regenerate and upload static files directly
  await regenerateSeoFiles(shopId);

  return Response.json({ success: true });
}
```

---

## Implementation Checklist

### Package Creation (Week 1)
- [ ] Create `packages/seo/` directory structure
- [ ] Define `SeoConfigSchema` in Zod
- [ ] Implement core meta/link builders (extract from Brikette)
- [ ] Implement robots.txt generator
- [ ] Implement llms.txt generator
- [ ] Implement AI plugin manifest generator
- [ ] Create CLI tool for generation
- [ ] Add unit tests for all generators

### CMS Integration (Week 2)
- [ ] Extend shop settings schema with SEO config
- [ ] Create Machine-Readable settings UI page
- [ ] Add llms.txt endpoint editor
- [ ] Add AI plugin configuration form
- [ ] Add validation and preview

### App Integration - Cover-Me-Pretty (Week 3)
- [ ] Add `@acme/seo` dependency
- [ ] Replace local robots.ts with centralized version
- [ ] Replace local sitemap.ts with centralized version
- [ ] Add llms.txt generation to build
- [ ] Add Organization/LocalBusiness structured data
- [ ] Add Product structured data to PDPs
- [ ] Verify all meta tags in browser DevTools

### App Integration - Cochlearfit (Week 4)
- [ ] Add `@acme/seo` dependency
- [ ] Create robots.ts using centralized generator
- [ ] Create sitemap.ts using centralized generator
- [ ] Add llms.txt generation to build
- [ ] Add Organization structured data
- [ ] Add Product structured data to PDPs
- [ ] Add FAQ structured data where applicable
- [ ] Verify all meta tags in browser DevTools

### App Integration - Skylar (Week 4)
- [ ] Add `@acme/seo` dependency
- [ ] Create robots.ts using centralized generator
- [ ] Create sitemap.ts using centralized generator
- [ ] Add llms.txt generation to build
- [ ] Add Organization structured data
- [ ] Implement per-page metadata generation
- [ ] Verify all meta tags in browser DevTools

### CI/CD & Validation (Week 5)
- [ ] Add SEO generation to CI pipeline
- [ ] Add SEO validation step
- [ ] Set up CMS webhook for regeneration
- [ ] Create monitoring for SEO file freshness
- [ ] Document the system

---

## Files to Create

| File | Purpose |
|------|---------|
| `packages/seo/package.json` | Package manifest |
| `packages/seo/src/index.ts` | Main exports |
| `packages/seo/src/config/schema.ts` | Zod config schema |
| `packages/seo/src/head/SeoHead.tsx` | Universal head component |
| `packages/seo/src/head/buildMeta.ts` | Meta tag builders |
| `packages/seo/src/head/buildLinks.ts` | Link tag builders |
| `packages/seo/src/generators/robots.ts` | robots.txt generator |
| `packages/seo/src/generators/sitemap.ts` | Sitemap generator |
| `packages/seo/src/generators/llms-txt.ts` | llms.txt generator |
| `packages/seo/src/generators/ai-plugin.ts` | AI plugin generator |
| `packages/seo/src/structured-data/*.ts` | JSON-LD schema builders |
| `packages/seo/src/cli/generate.ts` | CLI tool |
| `packages/seo/src/cli/validate.ts` | Validation tool |
| `packages/seo/src/next/index.ts` | Next.js-specific utilities |

## Files to Modify

| File | Change |
|------|--------|
| `packages/platform-core/src/repositories/shops/schema.json` | Add SEO config fields |
| `apps/cms/src/app/cms/shop/[shop]/settings/` | Add machine-readable settings UI |
| `apps/cover-me-pretty/src/app/robots.ts` | Use centralized generator |
| `apps/cover-me-pretty/src/app/sitemap.ts` | Use centralized generator |
| `apps/cochlearfit/src/app/robots.ts` | Create using centralized generator |
| `apps/cochlearfit/src/app/sitemap.ts` | Create using centralized generator |
| `apps/skylar/src/app/robots.ts` | Create using centralized generator |
| `apps/skylar/src/app/sitemap.ts` | Create using centralized generator |

---

## Maintenance Benefits

### Before (Current State)
- SEO logic scattered across 5+ apps
- Each app implements its own robots.txt, sitemap logic
- No centralized AI crawler support
- Changes require updating multiple codebases
- No validation or consistency checks

### After (Centralized)
- **Single source of truth**: All SEO logic in `@acme/seo`
- **CMS-driven**: Settings changes don't require code deploys
- **Automated generation**: Static files generated at build time
- **Consistent AI support**: All apps support GPTBot, ClaudeBot, etc.
- **Validated**: CI catches missing or malformed SEO files
- **Self-documenting**: llms.txt tells AI crawlers exactly what's available

### Ongoing Maintenance
1. **Adding new apps**: Import `@acme/seo`, configure in CMS, done
2. **Updating SEO standards**: Change once in package, all apps updated
3. **Adding new AI bots**: Update robots.ts generator, regenerate all
4. **Adding new schema types**: Add to `@acme/seo/structured-data`, available everywhere

---

## Success Metrics

After implementation, verify:

1. **All public apps have**:
   - [ ] Valid robots.txt with AI bot allowances
   - [ ] Dynamic sitemap with hreflang alternates
   - [ ] llms.txt discovery file
   - [ ] Organization/LocalBusiness structured data
   - [ ] Product/Service structured data on relevant pages
   - [ ] Breadcrumb structured data

2. **Google Search Console shows**:
   - [ ] No coverage errors
   - [ ] All pages indexed
   - [ ] Rich results for products/FAQs

3. **AI crawlers can**:
   - [ ] Discover llms.txt
   - [ ] Access machine-readable endpoints
   - [ ] Parse OpenAPI specs (where applicable)

---

## Appendix: AI Bot User-Agents

Include these in robots.txt for comprehensive AI crawler support:

```
GPTBot          # OpenAI's crawler
ChatGPT-User    # ChatGPT browsing
ClaudeBot       # Anthropic's crawler
Google-Extended # Google AI training
Amazonbot       # Amazon AI
CCBot           # Common Crawl (used by many AI)
FacebookBot     # Meta AI
Bytespider      # ByteDance AI
```
