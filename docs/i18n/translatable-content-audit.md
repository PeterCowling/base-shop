Type: Audit
Status: Reference

# I18N-PIPE-01: Comprehensive Translatable Content Audit

## Executive Summary

This audit maps all translatable content surfaces across the Base-Shop monorepo, documenting the structure, types, and patterns needed for the translation pipeline extraction and management system.

**Key Findings:**
- **TranslatableText Usage:** 34 UI components use TranslatableText in packages/ui
- **Locale System:** 19 supported content locales (18 languages with zh split into Hans/Hant)
- **Brikette Namespaces:** 51-75 JSON namespace files per language (content support varies)
- **Guide Content:** 129 guide files per language in guides/content/
- **Data-Driven Content:** Pages, navigation, and sections use inline TranslatableText
- **Locale Support:** UI_LOCALES (en, it) vs CONTENT_LOCALES (19 locales including variants)

---

## 1. TranslatableText Definition & Type System

### Location
`packages/types/src/i18n.ts`

### Type Definition
```typescript
export type LocalizedString = Readonly<Partial<Record<ContentLocale, string>>>;

export type KeyRef = Readonly<{
  type: "key";
  key: string;
  params?: Record<string, unknown>;
}>;

export type Inline = Readonly<{
  type: "inline";
  value: LocalizedString;
}>;

// Backwards-compat: allow plain string as legacy value
export type TranslatableText = KeyRef | Inline | string;
```

### Three Forms of TranslatableText

1. **Legacy String (Backwards Compatible)**
   ```
   "Shop now"
   ```
   Treated as inline with English default; shows dev warning.

2. **KeyRef (i18next key reference)**
   ```json
   {
     "type": "key",
     "key": "home.hero.cta",
     "params": { "storeName": "Brikette" }
   }
   ```
   Resolved via i18next namespace lookup with optional interpolation.

3. **Inline (Multi-locale value)**
   ```json
   {
     "type": "inline",
     "value": {
       "en": "Shop now",
       "de": "Jetzt kaufen",
       "it": "Acquista ora"
     }
   }
   ```
   Values provided directly; walker follows fallback chain for missing locales.

### Resolution Logic
- Located in `packages/i18n/src/resolveText.ts`
- Two functions: `resolveText()` (legacy) and `resolveContentText()` (new)
- Fallback chain for missing translations (e.g., de → en)
- Development warnings for missing values

---

## 2. Locale System Architecture

### Location
`packages/types/src/constants.ts`

### Supported Locales

**UI_LOCALES** (Full UI translation bundles)
```typescript
["en", "it"]
```
Only these locales have complete UI chrome translations.

**CONTENT_LOCALES** (Content translation support)
```typescript
[
  "en", "it",        // Core (also UI locales)
  "de", "es", "fr", "pt", "ja", "ko", "ru",
  "ar", "hi", "vi", "pl", "sv", "da", "hu",
  "nb",              // Norwegian Bokmål (canonical for "no" dirs)
  "zh-Hans", "zh-Hant"  // Chinese script variants
]
```

### Brikette i18n Configuration

Location: `apps/brikette/src/i18n.config.ts`

```typescript
const SUPPORTED_LANGUAGES = [
  "en", "es", "de", "fr", "it", "ja", "ko", "pt", "ru", "zh",
  "ar", "hi", "vi", "pl", "sv", "no", "da", "hu"
] as const;

export const i18nConfig = {
  supportedLngs: [...SUPPORTED_LANGUAGES],
  fallbackLng: "en",
  defaultNS: "translation",
  interpolation: { escapeValue: false },
  returnNull: false,
  returnObjects: false
} satisfies InitOptions;
```

### Locale Normalization
- "no" → "nb" (Norwegian Bokmål)
- "zh" → "zh-Hans" (defaults to Simplified)
- "zh-cn" / "zh-tw" / "zh-hk" handled via aliases

---

## 3. Brikette Locale Files Structure

### Directory Organization
```
apps/brikette/src/locales/
├── {lang}/               # 18 language directories
│   ├── *.json           # Top-level namespaces
│   ├── guides/          # Guide-specific namespaces
│   │   ├── content/     # Individual guide translations (129 files)
│   │   ├── breadcrumbs.json
│   │   ├── components.json
│   │   ├── labels.json
│   │   └── ...
│   └── guides/content/  # 129 individual guide JSON files
├── _guides/             # Guide bundle infrastructure
├── _how-to-get-here/    # Route guide infrastructure
└── guides.*.ts          # Guide loading utilities
```

### Language Coverage

| Language | Dir | Namespaces | Guides | Status |
|----------|-----|------------|--------|--------|
| Arabic | ar | 51 | 129 | Content only |
| Chinese | zh | 51 | 129 | Content only |
| Danish | da | 51 | 129 | Content only |
| German | de | 75 | 129 | Full (UI + content) |
| English | en | 51 | 129 | Full (UI + content) |
| Spanish | es | 75 | 129 | Full (UI + content) |
| French | fr | 75 | 129 | Full (UI + content) |
| Hindi | hi | 51 | 129 | Content only |
| Hungarian | hu | 51 | 129 | Content only |
| Italian | it | 75 | 129 | Full (UI + content) |
| Japanese | ja | 75 | 129 | Full (UI + content) |
| Korean | ko | 75 | 129 | Full (UI + content) |
| Norwegian | no | 51 | 129 | Content only |
| Polish | pl | 75 | 129 | Full (UI + content) |
| Portuguese | pt | 75 | 129 | Full (UI + content) |
| Russian | ru | 75 | 129 | Full (UI + content) |
| Swedish | sv | 75 | 129 | Full (UI + content) |
| Vietnamese | vi | 51 | 129 | Content only |

### Namespace Files (51 standard per language)

**Core Namespaces (UI & System):**
1. `_tokens.json` - Design tokens
2. `footer.json` - Footer chrome
3. `header.json` - Header chrome
4. `translation.json` - General UI strings
5. `modals.json` - Modal dialogs
6. `menus.json` - Navigation menus
7. `notificationBanner.json` - Alerts/banners

**Assistance/Help Articles (8 files):**
- `ageAccessibility.json` - Age restrictions guide
- `arrivingByFerry.json` - Ferry arrival guide
- `bookingBasics.json` - Booking FAQs
- `changingCancelling.json` - Policy changes
- `checkinCheckout.json` - Check-in procedures
- `defectsDamages.json` - Damage reporting
- `depositsPayments.json` - Payment info
- `legal.json` - Legal terms

**Page Content (15 files):**
- `landingPage.json` - Home page content
- `roomsPage.json` - Rooms page
- `experiencesPage.json` - Activities/experiences
- `careersPage.json` - Hiring/jobs
- `dealsPage.json` - Special offers
- `directionsPage.json` - Location info
- `aboutPage.json` - Company info
- `apartmentPage.json` - Specific rental
- `bookPage.json` - Booking flow
- `pages.json` - Page metadata
- `pages.rooms.json` - Room-specific pages
- `privacyPolicyPage.json` - Privacy policy
- `termsPage.json` - Terms of service
- `houseRulesPage.json` - House rules
- `cookiePolicyPage.json` - Cookie policy

**Menu/Facility Content (8 files):**
- `barMenuPage.json` - Bar offerings
- `breakfastMenuPage.json` - Breakfast items
- `menus.json` - General menu structure
- `faq.json` - General FAQ
- `testimonials.json` - Guest reviews
- `ratingsBar.json` - Rating display
- `rooms.json` - Room descriptions
- `locationModal.json` - Location picker

**Guide Namespaces (12 files in guides/ subdirectory):**
- `breadcrumbs.json` - Navigation breadcrumbs
- `components.json` - Guide component labels
- `fallbacks.json` - Fallback translations
- `indexRedirect.json` - Index redirects
- `labels.json` - Section labels (tips, FAQs, etc.)
- `preview.json` - Preview text
- `robots.json` - SEO robots directives
- `structured.json` - Structured data
- `tagPage.json` - Tag page content
- `tags.json` - Tag translations
- `tagsIndex.json` - Tag index page
- `transportNotice.json` - Transport alerts

### Guide Content Files (129 per language)

Complete list available in source. Examples:
- `amalfiTownGuide`, `arienzoBeachBusBack`, `backpackerItineraries`
- `capriDayTrip`, `cheapEats`, `fornilloBeachGuide`
- `pathOfTheGods`, `positanoBeaches`, `sunriseHike`
- Full list: 129 unique guide keys across all languages

---

## 4. TranslatableText Usage in Components

### Location
`packages/ui/src/`

### Components Using TranslatableText (34 total)

**CMS Blocks (10):**
1. `cms/blocks/AnnouncementBarBlock.tsx` - `text`
2. `cms/blocks/CertificateCheck.tsx` - `placeholder`
3. `cms/blocks/EmailReferralSection.tsx` - `headline`, `subtitle`, `giveLabel`, `getLabel`
4. `cms/blocks/Gallery.tsx` - `alt`, `caption` on images
5. `cms/blocks/ImageSlider.tsx` - `alt`, `caption`
6. `cms/blocks/NewsletterSignup.tsx` - `placeholder`, `submitLabel`, `text`
7. `cms/blocks/PromoTilesSection.tsx` - `imageAlt`, `caption`, `ctaLabel`
8. `cms/blocks/SearchBar.tsx` - `placeholder`
9. `cms/blocks/containers/Bind.tsx` - `inject`

**Templates (4):**
1. `templates/FeaturedProductTemplate.tsx` - `ctaLabel`
2. `templates/LiveShoppingEventTemplate.tsx` - `ctaLabel`
3. `templates/ProductDetailTemplate.tsx` - `ctaLabel`
4. `templates/ProductMediaGalleryTemplate.tsx` - `ctaLabel`

**Organisms (4):**
1. `organisms/AnnouncementBar.tsx`
2. `organisms/ProductCard.tsx`
3. `organisms/ProductGrid.tsx`
4. `organisms/StickyAddToCartBar.tsx`

**Atoms (2):**
1. `atoms/Alert.tsx` - `heading`, `title`
2. `molecules/SearchBar.tsx` - `placeholder`

---

## 5. Data-Driven Content Surfaces

### Location
`data/`

### Shop Data Files

**Directory Structure:**
```
data/templates/
├── default/
│   ├── shop.json       # Shop config + navigation
│   ├── pages.json      # Pages with component trees
│   ├── products.json   # Product catalog
│   ├── navigation.json # Navigation structure
│   └── settings.json   # Shop settings
└── (other templates)

data/shops/
├── default/       # Fixtures & test data
├── demo/          # Demo instance
└── (production shops)
```

### TranslatableText in Data Files

**shop.json (Navigation):**
```json
{
  "navigation": [
    {
      "label": {
        "type": "inline",
        "value": { "en": "Home", "de": "Startseite" }
      },
      "href": "/"
    }
  ]
}
```

**pages.json (Page Content):**
```json
{
  "title": {
    "type": "inline",
    "value": { "en": "Home" }
  },
  "components": [
    {
      "type": "HeroBanner",
      "slides": [
        {
          "alt": { "type": "inline", "value": { "en": "Hero image" } },
          "headlineKey": "home.hero.headline"
        }
      ]
    }
  ]
}
```

**products.json (LocalizedString format):**
```json
[
  {
    "id": "prod-1",
    "title": { "en": "Sample Product", "de": "Beispielprodukt" },
    "description": { "en": "...", "de": "..." }
  }
]
```

---

## 6. Field Path Patterns for Walker Extraction

### Pattern Categories

#### 1. Simple String Values
**Path:** `key: string`
**Example:** `"title": "Home"` (legacy)

#### 2. LocalizedString (Object with locale keys)
**Path:** `key: { "en": "...", "de": "..." }`
**Location:** products.json, settings.json

#### 3. TranslatableText - KeyRef
**Path:** `key: { type: "key", key: "namespace.key" }`
**Action:** Record reference; don't extract value

#### 4. TranslatableText - Inline
**Path:** `key: { type: "inline", value: { "en": "...", ... } }`
**Location:** shop.json, pages.json, sections.json, navigation.json

#### 5. Arrays of Objects with Text
**Path:** `items: [{ "question": "...", "answer": "..." }, ...]`
**Examples:**
- FAQ arrays: `faqs: [{ q: "...", a: [...] }]`
- Guide sections: `sections: [{ title: "...", body: [...] }]`

#### 6. Guide Content Structure
**Structure:**
```json
{
  "seo": { "title": "...", "description": "..." },
  "linkLabel": "...",
  "intro": ["...", "..."],
  "sections": [{ "id": "...", "title": "...", "body": ["...", "..."] }],
  "tips": ["...", "..."],
  "faqs": [{ "q": "...", "a": ["..."] }]
}
```

### Path Stack Examples

**Guides:**
- `guides.content.amalfiTownGuide.seo.title`
- `guides.content.amalfiTownGuide.sections[3].body[1]`
- `guides.content.amalfiTownGuide.faqs[0].q`

**Pages:**
- `pages.home.title.value.en`
- `pages.home.components[0].children[1].text.value.de`

**Navigation:**
- `navigation[0].label.value.en`

**Products:**
- `products[0].title.en`

---

## 7. Summary: What to Extract for Translation Pipeline

### By Source Type

| Source | Type | Volume | Format | Pattern |
|--------|------|--------|--------|---------|
| **Namespace JSON** | UI labels, buttons | 51-75 files/lang | Flat K-V | `key: "value"` |
| **Guide Content** | Travel guides | 129 files/lang | Nested + arrays | `sections[].body[]` |
| **Guide Metadata** | Breadcrumbs, labels | 12 files/lang | Flat K-V | `key: "value"` |
| **Page Content** | Home, help pages | 15 files/lang | Nested objects | `about.mission.heading` |
| **Shop Config** | Navigation, titles | Per shop | TranslatableText | `{ type: "inline", value: {...} }` |
| **Components** | Button labels | UI code | Props | 34 component uses |

### Extraction Priorities

1. **High Volume:**
   - Guide content (129 × 18 = 2,322 files)
   - Namespace JSON (51-75 × 18 = 918-1,350 files)

2. **High Value:**
   - Brikette locale files (core customer-facing)
   - Guide FAQs & tips

3. **Structural:**
   - FAQ arrays with Q/A pairs
   - Section hierarchies with body arrays
   - Image alt/caption pairs

---

## 8. Locale System Quick Reference

### Alias Mapping
```
"no" → "nb" (Norwegian Bokmål)
"zh" → "zh-Hans" (Simplified Chinese default)
"zh-cn" → "zh-Hans"
"zh-tw" → "zh-Hant"
"zh-hk" → "zh-Hant"
```

### Fallback Chain (ContentLocale)
```
Every non-English locale → en
English = terminal
```

### UI vs Content Locales
```
UI_LOCALES = [en, it]      // Full UI translation
CONTENT_LOCALES = [19 locales including zh-Hans, zh-Hant]
```

---

**Document Version:** 1.0
**Last Updated:** 2026-01-20
**For Task:** I18N-PIPE-01
**Status:** Complete
