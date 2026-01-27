# Guide System Documentation

Comprehensive documentation for the guide system architecture, content management, and development workflows.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Quick Start: Creating a New Guide](#quick-start-creating-a-new-guide)
- [Guide System Components](#guide-system-components)
- [Adding a New Block Type](#adding-a-new-block-type)
- [Content Structure](#content-structure)
- [Link Tokens](#link-tokens)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

The guide system is a **manifest-driven, block-based content platform** that renders 200+ guides across 3 areas (experiences, assistance, how-to-get-here) in 18 locales.

### Data Flow

```
Guide Request
    ↓
Route Handler (app/[lang]/[area]/[slug]/page.tsx)
    ↓
GuideContent Component
    ↓
GuideSeoTemplate (orchestrator)
    ├─→ useGuideManifestState() → Manifest Entry
    ├─→ useGuideContent() → Translated Content (JSON)
    ├─→ composeBlocks() → Block Composition
    ├─→ useGuideMeta() → SEO Metadata
    ├─→ useHowToJson() → Structured Data
    └─→ Render with slots (lead, article, after, head)
```

### Key Concepts

**Manifest-Driven**: Each guide has an entry in `guide-manifest.ts` that declares:
- Key, slug, content key
- Status (draft, review, live)
- Areas (howToGetHere, help, experience)
- Structured data types (Article, HowTo, FAQPage, etc.)
- Blocks (hero, genericContent, callout, gallery, etc.)

**Block-Based Composition**: Guides are composed of reusable blocks:
- `hero`: Image + intro overlay
- `genericContent`: Sections and FAQs from content JSON
- `callout`: Highlighted tips/CTAs
- `gallery`: Image galleries (with optional zoom)
- `faq`: FAQ schema with fallbacks
- And 9+ more block types

**Content Localization**: Content lives in `src/locales/{lang}/guides/content/{guideKey}.json` with automatic fallback chain:
1. Local language content
2. English fallback
3. Manual fallback (if configured)

**Type Safety**: Zod schemas validate manifest entries and block configurations at build time.

---

## Quick Start: Creating a New Guide

### Using the create-guide Script

```bash
pnpm --filter @apps/brikette create-guide myNewGuide "My Guide Title"
```

This creates:
- `src/locales/en/guides/content/myNewGuide.json` (English content stub)

### Manual Steps Required

After running the script, you must manually:

1. **Add manifest entry** to `src/routes/guides/guide-manifest.ts`:

```typescript
GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
  key: "myNewGuide",
  slug: "my-new-guide",
  contentKey: "myNewGuide",
  status: "draft",
  draftPathSegment: "experiences/my-new-guide",
  areas: ["experience"],
  primaryArea: "experience",
  structuredData: ["Article", "BreadcrumbList"],
  relatedGuides: [],
  blocks: [
    { type: "genericContent", options: { contentKey: "myNewGuide", showToc: true } }
  ],
  checklist: [
    { id: "translations", status: "inProgress" },
    { id: "content", status: "inProgress" }
  ]
})
```

2. **Add guide key** to `src/data/guides.index.ts`:

```typescript
const GUIDES_BASE = [
  // ... existing guides
  { key: "myNewGuide", tags: ["tag1", "tag2"], status: "draft" }
] as const satisfies readonly GuideMeta[];
```

3. **Create slug mapping** (if needed) in `src/data/generate-guide-slugs.ts`:

```typescript
export const GUIDE_SLUG_OVERRIDES: Partial<Record<GuideKey, string>> = {
  // ... existing overrides
  myNewGuide: "my-new-guide"
};
```

4. **Translate content** for other locales:
   - Copy `en/guides/content/myNewGuide.json` to all 18 locale directories
   - Update content with translations

---

## Guide System Components

### Core Files

| File | Purpose | LOC |
|------|---------|-----|
| [`_GuideSeoTemplate.tsx`](./GuideSeoTemplate.tsx) | Main orchestrator: content loading, localization, block composition, SEO | 542 |
| [`guide-manifest.ts`](./guide-manifest.ts) | Manifest with 200+ guide entries, Zod validation | ~1500 |
| [`blocks/composeBlocks.tsx`](./blocks/composeBlocks.tsx) | Block dispatcher with switch-case for 14 block types | 280 |
| [`blocks/types.ts`](./blocks/types.ts) | Zod schemas for all block types | 450 |
| [`content-schema.ts`](./content-schema.ts) | Content JSON schema (currently permissive) | 23 |
| [`guide-diagnostics.ts`](./guide-diagnostics.ts) | Content completeness analysis | 320 |

### Block System

Located in [`blocks/`](./blocks/):

**Block Types** (14 total):
- `hero` — Image + intro overlay
- `genericContent` — Renders sections/FAQs from content
- `faq` — FAQ schema rendering
- `gallery` — Image gallery (static or module-sourced, optional zoom)
- `callout` — Highlighted text (tip, cta, aside)
- `serviceSchema` — Structured data for services
- `breadcrumbs` — Breadcrumb list schema
- `relatedGuides` — List of related guides
- `alsoHelpful` — Tag-based recommendations
- `planChoice` — Plan/pricing selector
- `transportNotice` — Transport info banner
- `transportDropIn` — Transport components (Chiesa Nuova)
- `jsonLd` — Custom structured data
- `custom` — Generic custom block

**Block Handler Pattern**:
```typescript
export function applyMyBlock(
  acc: BlockAccumulator,
  options: MyBlockOptions,
  context: GuideSeoTemplateContext
): void {
  // 1. Translate content using context.translateGuides
  const title = context.translateGuides(`content.${context.guideKey}.myBlock.title`);

  // 2. Render to React node
  const node = <div>{title}</div>;

  // 3. Add to appropriate slot
  acc.addSlot("article", node); // or "lead", "after", "head"
}
```

### Content Structure

Located in `src/locales/{lang}/guides/content/`:

**Standard content JSON structure**:
```json
{
  "seo": {
    "title": "Guide Title | Hostel Brikette",
    "description": "Brief description for meta tags"
  },
  "linkLabel": "Short label for navigation",
  "intro": ["Paragraph one", "Paragraph two"],
  "sections": [
    {
      "id": "section-id",
      "title": "Section Title",
      "body": "Section body text with %LINK:otherGuide|link tokens%",
      "list": [
        "Bullet point one",
        "Bullet point two"
      ]
    }
  ],
  "faqs": [
    {
      "q": "Question text?",
      "a": ["Answer text"]
    }
  ],
  "callouts": {
    "tip": "Helpful tip with %URL:https://example.com|external links%"
  }
}
```

#### Content Schema Validation

Guide content is validated against a strict Zod schema (`src/routes/guides/content-schema.ts`) to ensure consistency and catch errors early.

**Required fields:**
- `seo.title` — Non-empty string for page title
- `seo.description` — Non-empty string for meta description

**Optional but validated when present:**
- `intro` — Can be:
  - Object: `{title: string, body: string | string[]}`
  - Array: `["paragraph 1", "paragraph 2"]`
  - String: `"single paragraph"`
- `sections` — Array where each item requires:
  - `id` — Unique identifier (kebab-case recommended)
  - `title` — Section heading
  - `body` — Optional string or array of strings
  - `list` — Optional array of strings
- `faqs` — Array where each item requires:
  - `q` — Question string
  - `a` — Answer (string or array of strings)
- `callouts` — Record where values must be non-empty strings

**Extra fields** are allowed via passthrough (e.g., `gallery`, `steps`, `essentialsTitle`) for flexibility.

**Running validation:**
```bash
# Validate all guides across all locales
pnpm validate-content

# Validate specific locale
pnpm validate-content --locale=en

# Show detailed output
pnpm validate-content --verbose

# Fail on violations (for CI)
pnpm validate-content --fail-on-violation
```

**Opt-out mechanism:**
Add `"_schemaValidation": false` to a content JSON to skip validation (use sparingly for edge cases).

**Validation reports:**
- File paths with violations
- Specific field errors (e.g., "seo.title is required")
- Summary: total files, validated, skipped, violations

#### Link Token Validation

Link tokens are validated to ensure all internal and external links are correct and secure.

**Token types:**
- `%LINK:guideKey|Label%` — Internal guide link (validates guideKey exists in manifest)
- `%HOWTO:slug|Label%` — How-to-get-here route link (validates slug exists in route definitions)
- `%URL:https://example.com|Label%` — External URL (validates protocol and security)

**Running link validation:**
```bash
# Validate all guides across all locales
pnpm validate-links

# Validate specific locale
pnpm validate-links --locale=en

# Show detailed output
pnpm validate-links --verbose
```

**Link validation checks:**
- **LINK tokens**: Validates guideKey exists in manifest; provides close-match suggestions
- **HOWTO tokens**: Validates slug exists in route definitions or guide slugs
- **URL tokens**: Security check (rejects javascript:, data: protocols); validates URL format
- **Suggestions**: Provides "did you mean?" suggestions for typos (e.g., "beaches" → "positanoBeaches")

**Validation reports:**
- File paths with violations and line numbers
- Token type, target, and error message
- Suggested corrections for typos
- Summary: total files, tokens found, violations

#### i18n Coverage Tracking

Translation coverage is tracked to ensure all guides are properly localized across all 18 supported locales.

**Checking coverage:**
```bash
# Run coverage check (text output)
pnpm check-i18n-coverage

# Generate JSON report
pnpm check-i18n-coverage --json --output=i18n-coverage-report.json

# Show verbose output with all missing keys
pnpm check-i18n-coverage --verbose

# Fail if missing translations found (for CI)
pnpm check-i18n-coverage --fail-on-missing
```

**Report structure (JSON):**
- `baselineLocale` — Reference locale (en)
- `locales` — Array of checked locales (all except baseline)
- `summary.totalMissingFiles` — Count of completely missing files
- `summary.totalMissingKeys` — Count of missing translation keys
- `reports[]` — Per-locale breakdown:
  - `locale` — Locale code (de, fr, it, etc.)
  - `missingFiles[]` — Array of file paths missing in this locale
  - `missingKeys` — Object mapping file paths to array of missing keys

**CI integration:**
Coverage checks run automatically on push to `main` via `.github/workflows/test.yml`:
- Generates JSON report with structured data
- Uploads report as CI artifact for historical tracking
- Displays summary in workflow logs (missing files/keys per locale)
- Does not fail builds (informational only)

**Accessing CI reports:**
1. Go to GitHub Actions → Package Quality Matrix workflow
2. Find the i18n-coverage job
3. Download the `i18n-coverage-report` artifact
4. Or view the summary in the job logs

**Coverage thresholds:**
Currently informational only. Future enhancement: enforce thresholds for new guides while grandfathering existing gaps.

### SEO & Metadata

Located in [`guide-seo/`](./guide-seo/):

**Structured Data Support**:
- **Article**: Automatic for all guides (datePublished, dateModified from checklist)
- **HowTo**: Generated from sections if `structuredData: ["HowTo"]` in manifest
- **FAQPage**: Generated from FAQs if present
- **BreadcrumbList**: Automatic breadcrumb generation
- **Service**: For service-focused guides (Chiesa Nuova, parking, etc.)
- **ItemList**: For list-based guides

**Metadata Resolution**:
- Title: `seo.title` → fallback to manifest metaKey → guideKey
- Description: `seo.description` → fallback to manifest metaKey
- OG Image: manifest `ogImage` → default hostel image
- Canonical URL: Generated with hreflang for all 18 locales

---

## Adding a New Block Type

Adding a new block type requires editing 6 files. Follow this process:

### 1. Define Block Schema (`blocks/types.ts`)

```typescript
// Add to imports
export const MY_BLOCK_OPTIONS_SCHEMA = z.object({
  titleKey: z.string().trim().min(1),
  bodyKey: z.string().trim().min(1),
  variant: z.enum(["default", "highlighted"]).default("default")
});

export type MyBlockOptions = z.infer<typeof MY_BLOCK_OPTIONS_SCHEMA>;

// Add to GUIDE_BLOCK_TYPES
export const GUIDE_BLOCK_TYPES = [
  // ... existing types
  "myBlock"
] as const;

// Add to discriminated union in GUIDE_BLOCK_DECLARATION_SCHEMA
GUIDE_BLOCK_DECLARATION_SCHEMA = z.discriminatedUnion("type", [
  // ... existing blocks
  z.object({
    type: z.literal("myBlock"),
    options: MY_BLOCK_OPTIONS_SCHEMA
  })
]);
```

### 2. Create Block Handler (`blocks/handlers/myBlock.tsx`)

```typescript
import type { BlockAccumulator } from "../composeBlocks";
import type { GuideSeoTemplateContext } from "../_GuideSeoTemplate";
import type { MyBlockOptions } from "../types";

export function applyMyBlock(
  acc: BlockAccumulator,
  options: MyBlockOptions,
  context: GuideSeoTemplateContext
): void {
  const title = context.translateGuides(options.titleKey);
  const body = context.translateGuides(options.bodyKey);

  const node = (
    <div className={`my-block my-block--${options.variant}`}>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );

  acc.addSlot("article", node);
}
```

### 3. Export Handler (`blocks/handlers/index.ts`)

```typescript
// Add to exports
export { applyMyBlock } from "./myBlock";
```

### 4. Add to Block Dispatcher (`blocks/composeBlocks.tsx`)

```typescript
import { applyMyBlock } from "./handlers";

// Add case to switch statement
function composeBlocks(manifestEntry, context) {
  // ... existing code

  for (const block of blocks) {
    switch (block.type) {
      // ... existing cases
      case "myBlock":
        applyMyBlock(acc, block.options, context);
        break;
    }
  }
}
```

### 5. Write Tests (`test/routes/guides/__tests__/my-block.test.tsx`)

```typescript
import { render } from "@testing-library/react";
import { applyMyBlock } from "@/routes/guides/blocks/handlers";
import { BlockAccumulator } from "@/routes/guides/blocks/composeBlocks";

describe("myBlock handler", () => {
  it("renders title and body", () => {
    const acc = new BlockAccumulator();
    const context = {
      guideKey: "testGuide",
      translateGuides: (key: string) => `Translated: ${key}`,
      // ... other context fields
    };

    applyMyBlock(acc, {
      titleKey: "content.testGuide.myBlock.title",
      bodyKey: "content.testGuide.myBlock.body",
      variant: "default"
    }, context);

    const slots = acc.getSlots();
    const { container } = render(<>{slots.article}</>);

    expect(container).toHaveTextContent("Translated: content.testGuide.myBlock.title");
    expect(container).toHaveTextContent("Translated: content.testGuide.myBlock.body");
  });
});
```

### 6. Update Documentation (this file)

Add your new block type to the "Block Types" list above.

---

## Link Tokens

Link tokens allow dynamic linking within content JSON without hardcoding URLs.

### Token Format

`%TYPE:target|Label%`

- **TYPE**: `URL`, `LINK`, or `HOWTO`
- **target**: URL, guideKey, or route slug
- **Label**: Link text

### Token Types

**Internal Guide Links** (`%LINK:guideKey|Label%`):
```json
{
  "body": "Read our %LINK:pathOfTheGods|Path of the Gods guide% for details."
}
```

**How-To Get Here Links** (`%HOWTO:slug|Label%`):
```json
{
  "body": "Check the %HOWTO:how-to-get-here|transport overview% for all options."
}
```

**External URLs** (`%URL:href|Label%`):
```json
{
  "body": "Visit %URL:https://example.com|Example Site% for more info."
}
```

### Token Rendering

Tokens are parsed and rendered by [`utils/_linkTokens.tsx`](./utils/_linkTokens.tsx):
- `renderGuideLinkTokens()` converts tokens to React Link components
- Security: Only `http://`, `https://`, and `mailto:` URLs are allowed
- Invalid tokens render as plain text

---

## Testing

### Test Structure

Tests are located in [`test/routes/guides/`](../../test/routes/guides/):

**Test Categories**:
- **Block tests**: `__tests__/callout-block.test.tsx`, `__tests__/gallery-block-zoomable.test.tsx`
- **Manifest tests**: `__tests__/guide-manifest.draft-status.test.ts`
- **Coverage tests**: `__tests__/coverage/{guide-name}.coverage.test.tsx`
- **Integration tests**: `__tests__/block-template-wiring.test.tsx`

### Running Tests

```bash
# Run all guide tests
pnpm --filter @apps/brikette test -- --testPathPattern="guides"

# Run specific test file
pnpm --filter @apps/brikette test -- --testPathPattern="callout-block"

# Run coverage tests
pnpm --filter @apps/brikette test -- --testPathPattern="coverage"
```

### Test Harness

Use `guideTestHarness.ts` for rendering guides with mocked context:

```typescript
import { renderGuide } from "@/test/routes/guides/guideTestHarness";

const { container } = renderGuide({
  guideKey: "testGuide",
  lang: "en",
  manifestEntry: { /* ... */ }
});
```

---

## Troubleshooting

### Issue: Guide not rendering (404)

**Symptoms**: Route returns 404, guide appears to exist in manifest

**Causes & Solutions**:

1. **Missing in GUIDES_INDEX**
   - Check `src/data/guides.index.ts`
   - Add entry: `{ key: "yourGuide", tags: [], status: "published" }`

2. **Wrong primaryArea**
   - Check manifest `primaryArea` matches URL area
   - `primaryArea: "help"` → URL: `/assistance/{slug}`
   - `primaryArea: "experience"` → URL: `/experiences/{slug}`
   - `primaryArea: "howToGetHere"` → URL: `/how-to-get-here/{slug}`

3. **Slug mismatch**
   - Check manifest `slug` matches URL slug
   - Or add override in `src/data/generate-guide-slugs.ts`

4. **Draft status without draftPathSegment**
   - If `status: "draft"`, must include `draftPathSegment`
   - Draft routes accessible at `/draft/{draftPathSegment}`

---

### Issue: Content not translating

**Symptoms**: English content shows in other locales, or keys render as strings

**Causes & Solutions**:

1. **Missing locale JSON file**
   - Create `src/locales/{lang}/guides/content/{guideKey}.json`
   - Copy from `en/` and translate

2. **Incorrect content key**
   - Check manifest `contentKey` matches JSON filename
   - Example: `contentKey: "pathOfTheGods"` → `pathOfTheGods.json`

3. **Wrong translation key**
   - Content keys are namespaced: `content.{guideKey}.{field}`
   - Example: `content.pathOfTheGods.intro.title`
   - Use `translateGuides()` with full key path

4. **Fallback chain issues**
   - System falls back: local → EN → manual → empty
   - Check EN content exists as fallback
   - Set `suppressFaqWhenUnlocalized: true` to hide untranslated FAQs

---

### Issue: Block not rendering

**Symptoms**: Block declared in manifest but doesn't appear on page

**Causes & Solutions**:

1. **Missing block handler**
   - Check block type is in `blocks/types.ts` GUIDE_BLOCK_TYPES
   - Verify handler is imported in `blocks/handlers/index.ts`
   - Confirm case exists in `blocks/composeBlocks.tsx` switch

2. **Invalid block options**
   - Block options must match Zod schema in `blocks/types.ts`
   - Check console for validation errors

3. **Content missing**
   - `genericContent` block needs content in locale JSON
   - `faq` block needs FAQs in content
   - `gallery` block needs items array or source module

4. **Wrong slot**
   - Check which slot block targets (`lead`, `article`, `after`, `head`)
   - Some blocks only render in specific slots

---

### Issue: Link tokens not working

**Symptoms**: Tokens render as plain text like `%LINK:guide|Label%`

**Causes & Solutions**:

1. **Invalid token format**
   - Format must be: `%TYPE:target|Label%`
   - No spaces around `|` separator
   - Label cannot contain `%` character

2. **Wrong token type**
   - Use `LINK` for guide keys, not `URL`
   - Use `HOWTO` for how-to-get-here routes
   - Use `URL` only for external http/https URLs

3. **Target doesn't exist**
   - `%LINK:guideKey%` — check guideKey exists in manifest
   - `%HOWTO:slug%` — check slug exists in route definitions
   - Tokens render as text if target is invalid

4. **Security block**
   - `javascript:` and `data:` URLs are blocked for security
   - Only `http://`, `https://`, and `mailto:` allowed

---

### Issue: Build failing with Zod errors

**Symptoms**: Build fails with validation errors from manifest

**Causes & Solutions**:

1. **Missing required fields**
   - Check manifest entry has all required fields
   - Required: `key`, `slug`, `contentKey`, `status`, `areas`, `primaryArea`

2. **Invalid enum values**
   - `status` must be: `"draft"`, `"review"`, or `"live"`
   - `areas` must be subset of: `["howToGetHere", "help", "experience"]`
   - Check structured data types are valid

3. **Invalid block configuration**
   - Each block type has specific required options
   - Check `blocks/types.ts` for schema
   - Example: `genericContent` requires `contentKey`

4. **Circular dependencies**
   - `relatedGuides` cannot reference self
   - Check for circular guide references

---

### Issue: Images not loading

**Symptoms**: Hero or gallery images show broken image icon

**Causes & Solutions**:

1. **Wrong image path**
   - Images must be in `apps/brikette/public/`
   - Path should start with `/` (e.g., `/img/guides/example.jpg`)
   - Path is relative to public directory

2. **Missing image file**
   - Verify image exists at specified path
   - Check filename matches exactly (case-sensitive)

3. **Cloudflare transformation error**
   - Check image format is supported (jpg, png, webp, gif)
   - Verify aspect ratio is valid (e.g., "16/9", "4/3")
   - Check quality setting (0-100)

4. **Gallery module not found**
   - If using `source` in gallery block
   - Check module exists in `GALLERY_MODULES` mapping
   - Module must export `items` array

---

## Additional Resources

- **Guide Manifest Schema**: See Zod schemas in [`guide-manifest.ts`](./guide-manifest.ts)
- **Block Types Reference**: See all schemas in [`blocks/types.ts`](./blocks/types.ts)
- **SEO Components**: See [`guide-seo/`](./guide-seo/) for metadata and structured data
- **Migration Tools**: See [`scripts/migrate-transport-route.ts`](../../../scripts/migrate-transport-route.ts) for content migration patterns

---

## Contributing

When modifying the guide system:

1. **Update this README** if adding new concepts or changing architecture
2. **Add tests** for new block types or significant functionality
3. **Update Zod schemas** to maintain type safety
4. **Document migration path** if changes affect existing guides
5. **Test across locales** to verify translation handling

For questions or issues, refer to the fact-find brief at `docs/plans/guide-system-improvements-fact-find.md`.
