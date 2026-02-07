Type: Reference
Status: Reference

# Brikette URL Coverage Matrix

Generated: 2026-01-21

## Summary

- **Total Public URLs**: 5,705
- **Supported Languages**: 18 (ar, da, de, en, es, fr, hi, hu, it, ja, ko, no, pl, pt, ru, sv, vi, zh)

## Route Categories

### 1. Root-Level Routes (No Language Prefix)
**Count**: 1
- `/404` - 404 page (static)

Note: `/cookie-policy` and `/privacy-policy` (redirect routes) and `/directions/*` routes are in the full inventory but filtered in public URLs.

### 2. Language Home Pages
**Pattern**: `/:lang`
**Count**: 18 (one per supported language)
**Example**: `/en`, `/de`, `/fr`

### 3. Section Routes per Language

| Section | URLs per lang | Total | Pattern |
|---------|---------------|-------|---------|
| guides | 126 | 2,268 | `/:lang/guides/:slug` |
| experiences | 79 | 1,422 | `/:lang/experiences/:slug`, `/:lang/experiences/tags/:tag` |
| help/assistance | 51 + 13 = 64 | ~1,152 | `/:lang/:helpSlug/:articleSlug` |
| how-to-get-here | 25 | 450 | `/:lang/:htghSlug/:slug` |
| rooms | 11 | 198 | `/:lang/:roomsSlug`, `/:lang/:roomsSlug/:id` |
| deals | 1 | 18 | `/:lang/:dealsSlug` |
| careers | 1 | 18 | `/:lang/:careersSlug` |
| about | 1 | 18 | `/:lang/:aboutSlug` |
| terms | 1 | 18 | `/:lang/:termsSlug` |
| privacy-policy | 1 | 18 | `/:lang/:privacySlug` |
| cookie-policy | 1 | 18 | `/:lang/:cookieSlug` |
| bar-menu | 1 | 18 | `/:lang/:barMenuSlug` |
| breakfast-menu | 1 | 18 | `/:lang/:breakfastSlug` |
| house-rules | 1 | 18 | `/:lang/:houseRulesSlug` |

## Catch-All Replacement Strategy

### Current Architecture (Pages Router)
The current setup uses these catch-all routes:
1. `pages/[lang]/[...segments].tsx` - Main catch-all for localized routes
2. `pages/[lang]/[section]/index.tsx` - Section index pages
3. `pages/[lang]/[section]/[...segments].tsx` - Deep section routes
4. `pages/[lang]/guides/[slug].tsx` - Guide legacy redirects
5. `pages/directions/[slug].tsx` - Language-agnostic directions

### Proposed App Router Structure

```
app/
├── layout.tsx                          # Root layout (from _app.tsx + _document.tsx)
├── page.tsx                            # Static language gateway (replaces index.tsx SSR)
├── 404.tsx                             # Static 404
├── [lang]/
│   ├── layout.tsx                      # Per-language layout
│   ├── page.tsx                        # Home page
│   ├── [section]/
│   │   ├── page.tsx                    # Section index (rooms, deals, etc.)
│   │   └── [...slug]/
│   │       └── page.tsx                # Deep routes (room details, etc.)
│   ├── guides/
│   │   └── [slug]/
│   │       └── page.tsx                # Guide legacy redirects
│   └── _catchall/
│       └── [...segments]/
│           └── page.tsx                # Fallback catch-all
└── directions/
    └── [slug]/
        └── page.tsx                    # Directions pages
```

### Key Decisions

1. **Section routing**: Use `[section]` dynamic segment to handle localized section slugs (rooms→zimmer→chambres etc.)

2. **guides section**: Dedicated route for legacy `/guides` redirects (all redirect to experiences)

3. **Catch-all fallback**: A `_catchall` route handles any remaining patterns not matched by explicit routes

4. **generateStaticParams()**: Each route will enumerate all combinations of:
   - 18 languages
   - Localized slugs per section
   - Dynamic content (room IDs, guide slugs, tag names)

## Migration Priority

1. **High Priority** (most traffic):
   - Home pages (`/:lang`)
   - Room pages (`/:lang/rooms`, `/:lang/rooms/:id`)
   - Experience pages (`/:lang/experiences/*`)

2. **Medium Priority**:
   - How-to-get-here pages
   - Assistance/help pages
   - Guide legacy redirects

3. **Low Priority** (static content):
   - Legal pages (terms, privacy, cookie)
   - Menu pages (bar, breakfast)
   - About, careers, deals

## Cloudflare _redirects

The following redirects will be added to `public/_redirects`:

```
# Legacy redirects (handled at edge, not in Next.js)
/cookie-policy /en/cookie-policy 302
/privacy-policy /en/privacy-policy 302

# Draft routes (internal only)
/:lang/draft/* /404 404
```
