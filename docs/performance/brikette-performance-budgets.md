# Brikette Performance Budgets

**Status:** ✅ Active
**Date Established:** 2026-01-12
**Last Updated:** 2026-01-12
**Enforcement:** CI/CD Pipeline

---

## Executive Summary

Brikette has comprehensive performance budgets enforced via **Lighthouse CI** and **bundlesize** in the CI/CD pipeline. All pull requests are automatically validated against these budgets before merge.

**Tools:**
- **Lighthouse CI**: Performance, accessibility, SEO, and best practices scores
- **bundlesize**: JavaScript bundle size limits

**Enforcement:**
- ✅ Automated checks on every PR
- ✅ Blocks merge if budgets exceeded
- ✅ Uploads reports for review

---

## Performance Budget Overview

### Core Web Vitals (Error Level)

| Metric | Budget | Why It Matters |
|--------|--------|----------------|
| **Largest Contentful Paint (LCP)** | ≤ 2.5s | Main content visibility - directly impacts perceived load speed |
| **First Contentful Paint (FCP)** | ≤ 1.5s | First paint - user sees content is loading |
| **Cumulative Layout Shift (CLS)** | ≤ 0.1 | Visual stability - prevents annoying layout jumps |
| **Total Blocking Time (TBT)** | ≤ 300ms | Interactivity - how long before user can interact |
| **Speed Index** | ≤ 3.0s | Visual progress - how quickly content is visually displayed |
| **Time to Interactive (TTI)** | ≤ 3.5s | Full interactivity - when page is fully usable |

### Category Scores (Error Level)

| Category | Minimum Score | Current Focus |
|----------|---------------|---------------|
| **Performance** | 85/100 | Core Web Vitals, load time, resource optimization |
| **Accessibility** | 90/100 | ARIA, color contrast, keyboard navigation, screen readers |
| **Best Practices** | 85/100 | HTTPS, console errors, deprecated APIs |
| **SEO** | 90/100 | Meta tags, crawlability, mobile-friendliness |

### Bundle Size Limits (Error Level)

| Bundle | Max Size (gzipped) | Purpose |
|--------|-------------------|---------|
| **App Bundle** (`_app-*.js`) | 250 KB | Main application code |
| **Homepage** (`[lang]/index-*.js`) | 200 KB | Landing page specific code |
| **Experiences Page** | 150 KB | Experiences page code |
| **Framework** (`framework-*.js`) | 150 KB | React and Next.js runtime |
| **Main** (`main-*.js`) | 50 KB | Webpack runtime |

---

## Configuration Files

### Lighthouse CI Configuration

**File:** `apps/brikette/.lighthouserc.json`

**Test URLs:**
- `http://localhost:3014/en` (Homepage)
- `http://localhost:3014/en/experiences`
- `http://localhost:3014/en/rooms`
- `http://localhost:3014/en/deals`

**Runs:** 3 per URL (median value used)
**Preset:** Desktop

### bundlesize Configuration

**File:** `apps/brikette/.bundlesizerc.json`

**Monitored Bundles:**
- `_app-*.js`: Core application
- `[lang]/index-*.js`: Homepage
- `[lang]/experiences-*.js`: Experiences page
- `framework-*.js`: React/Next.js
- `main-*.js`: Webpack runtime

**Compression:** gzip

---

## CI/CD Enforcement

### Workflow: Performance Budget Check

**File:** `.github/workflows/lighthouse-brikette.yml`

**Triggers:**
- Pull requests modifying:
  - `apps/brikette/**`
  - `packages/ui/**`
  - `packages/next-config/**`
  - `packages/tailwind-config/**`
  - `packages/design-tokens/**`
  - `packages/themes/**`
- Push to `main` branch (same paths)

**Steps:**
1. Build Brikette app
2. **Check bundle sizes** (bundlesize)
3. Start production server
4. **Run Lighthouse CI** on 4 key pages (3 runs each)
5. Upload results as artifacts

**Enforcement:**
- ❌ **Fails PR** if any bundle exceeds size limit
- ❌ **Fails PR** if Lighthouse scores below thresholds
- ✅ **Passes PR** only if all budgets met

### Running Locally

```bash
# Build the app
pnpm --filter @apps/brikette build

# Check bundle sizes
pnpm --filter @apps/brikette bundlesize

# Run Lighthouse CI
pnpm --filter @apps/brikette lighthouse
```

---

## Performance Assertions

### Resource Optimization (Error Level)

| Check | Level | Description |
|-------|-------|-------------|
| `unminified-css` | error | CSS must be minified in production |
| `unminified-javascript` | error | JS must be minified in production |
| `uses-text-compression` | error | Text assets must be compressed (gzip/brotli) |

### Resource Optimization (Warning Level)

| Check | Level | Description |
|-------|-------|-------------|
| `unused-css-rules` | warn | Tracks unused CSS (doesn't fail build) |
| `unused-javascript` | warn | Tracks unused JS (doesn't fail build) |
| `uses-responsive-images` | warn | Images should have appropriate sizes |
| `offscreen-images` | warn | Images below fold should lazy load |
| `modern-image-formats` | warn | Use WebP/AVIF when possible |
| `uses-optimized-images` | warn | Images should be optimized |
| `uses-rel-preconnect` | warn | Critical origins should use preconnect |
| `font-display` | warn | Fonts should use font-display |

### SEO (Error Level)

| Check | Level | Description |
|-------|-------|-------------|
| `viewport` | error | Must have viewport meta tag |
| `document-title` | error | Must have unique, descriptive title |
| `meta-description` | error | Must have meta description |
| `http-status-code` | error | Must return 200 status |
| `crawlable-anchors` | error | Links must be crawlable |
| `canonical` | error | Must have canonical URL |

### SEO (Warning Level)

| Check | Level | Description |
|-------|-------|-------------|
| `robots-txt` | warn | Should have robots.txt |
| `hreflang` | warn | Should have hreflang for i18n |

### Accessibility (Error Level)

| Check | Level | Description |
|-------|-------|-------------|
| `aria-allowed-attr` | error | ARIA attributes must be valid |
| `aria-required-attr` | error | Required ARIA attributes must be present |
| `aria-valid-attr-value` | error | ARIA attribute values must be valid |
| `aria-valid-attr` | error | ARIA attributes must exist |
| `button-name` | error | Buttons must have accessible names |
| `bypass` | error | Must have skip-to-content link |
| `html-has-lang` | error | HTML must have lang attribute |
| `html-lang-valid` | error | HTML lang must be valid |
| `image-alt` | error | Images must have alt text |
| `label` | error | Form inputs must have labels |
| `link-name` | error | Links must have accessible names |

### Accessibility (Warning Level)

| Check | Level | Description |
|-------|-------|-------------|
| `color-contrast` | warn | Text should have sufficient color contrast |

---

## Budget Rationale

### Why These Numbers?

**Core Web Vitals targets based on:**
- Google's "Good" thresholds for 75th percentile
- Desktop preset (more lenient than mobile)
- Multilingual hostel website with rich content

**Bundle size targets based on:**
- Target load time < 3 seconds on 3G
- 1.6 Mbps download speed (slow 3G)
- ~600 KB total JS budget (gzipped)

**Score targets:**
- Performance 85: Allows for rich media while maintaining speed
- Accessibility 90: High bar for inclusive experience
- Best Practices 85: Modern development standards
- SEO 90: Critical for hostel discoverability

---

## Historical Baseline

### Initial Audit (2026-01-12)

**Note:** No build available yet - budgets set based on similar projects

**Expected Performance (Desktop):**
- LCP: 1.8-2.2s
- FCP: 1.0-1.3s
- CLS: 0.05-0.08
- TBT: 150-250ms
- Speed Index: 2.0-2.8s
- TTI: 2.5-3.2s

**Expected Bundle Sizes:**
- App: 180-220 KB (budget: 250 KB)
- Homepage: 120-180 KB (budget: 200 KB)
- Experiences: 100-140 KB (budget: 150 KB)

**Action Items:**
1. Run initial build and get actual baseline
2. Update this document with real measurements
3. Adjust budgets if needed based on actual performance

---

## Monitoring & Alerts

### CI Feedback

**On PR:**
- ✅ Green check: All budgets met
- ❌ Red X: Budget exceeded (blocks merge)
- 📊 Comment: Lighthouse score comparison

**Artifacts:**
- Lighthouse HTML reports (30 day retention)
- Bundle size comparison table
- Performance trends over time

### Local Development

```bash
# Quick bundle size check
pnpm --filter @apps/brikette bundlesize

# Full Lighthouse audit
pnpm --filter @apps/brikette lighthouse

# Individual Lighthouse run
pnpm --filter @apps/brikette exec lighthouse http://localhost:3014/en --view
```

---

## Budget Violations - What to Do

### Bundle Size Exceeded

**Immediate Actions:**
1. Check what caused the increase
   ```bash
   # Compare bundles
   ls -lh apps/brikette/.next/static/chunks/pages/
   ```

2. Analyze bundle composition
   ```bash
   # Install webpack-bundle-analyzer
   pnpm add -D @next/bundle-analyzer

   # Add to next.config.mjs
   const withBundleAnalyzer = require('@next/bundle-analyzer')({
     enabled: process.env.ANALYZE === 'true',
   })

   # Run analysis
   ANALYZE=true pnpm build
   ```

3. Common fixes:
   - Remove unused dependencies
   - Dynamic import large libraries
   - Use tree-shaking friendly imports
   - Replace heavy dependencies with lighter alternatives

**Example: Dynamic Import**
```typescript
// Before (adds to main bundle)
import { HeavyComponent } from 'heavy-library';

// After (code-splits)
const HeavyComponent = dynamic(() => import('heavy-library').then(mod => mod.HeavyComponent));
```

### Performance Score Dropped

**Immediate Actions:**
1. Check which metric(s) failed
2. Review Lighthouse report (uploaded artifact)
3. Common issues:
   - Large images not optimized
   - Too much JavaScript
   - Render-blocking resources
   - Layout shifts from dynamic content

**Fixes by Metric:**

**LCP (Largest Contentful Paint):**
- Optimize hero images (WebP, proper sizing)
- Preload critical resources
- Remove render-blocking JavaScript
- Use `priority` prop on Next.js Image

**FCP (First Contentful Paint):**
- Reduce server response time
- Eliminate render-blocking resources
- Inline critical CSS

**CLS (Cumulative Layout Shift):**
- Set width/height on images
- Reserve space for dynamic content
- Avoid inserting content above fold
- Use CSS aspect-ratio

**TBT/TTI (Interactivity):**
- Reduce JavaScript execution time
- Code-split large bundles
- Defer non-critical JavaScript
- Use web workers for heavy computation

### Accessibility Score Dropped

**Check:**
1. Missing alt text on new images
2. Form inputs without labels
3. Buttons without accessible names
4. Color contrast issues
5. Missing ARIA attributes

**Tools:**
```bash
# Run axe-core locally
pnpm exec axe http://localhost:3014/en --reporter=v2
```

### SEO Score Dropped

**Check:**
1. Missing meta tags (title, description)
2. Missing structured data
3. Broken canonical URLs
4. Missing hreflang tags
5. Crawling issues

---

## Budget Evolution

### When to Adjust Budgets

**Tighten budgets (make stricter):**
- Actual performance consistently beats budget by >20%
- User metrics show room for improvement
- New optimization techniques available

**Loosen budgets (make more lenient):**
- Essential features require more resources
- Budget consistently failing despite optimization
- User experience would suffer from cuts

**Process:**
1. Propose budget change with justification
2. Team review and approval
3. Update `.lighthouserc.json` and `.bundlesizerc.json`
4. Document change in this file with date and reason

### Quarterly Review

**Schedule:** First Monday of each quarter

**Review:**
1. Budget violation frequency
2. Actual vs target performance
3. User experience metrics (if available)
4. New web performance standards
5. Competitor benchmarking

**Document findings** in `docs/performance/quarterly-reviews/`

---

## Best Practices

### For Developers

**Before Committing:**
```bash
# Check bundle size
pnpm --filter @apps/brikette bundlesize

# If you added images/media
pnpm exec imagemin apps/brikette/public/**/*.{jpg,png} --out-dir=apps/brikette/public/
```

**Code Review Checklist:**
- ✅ New images have width/height attributes
- ✅ Heavy libraries dynamically imported
- ✅ Images optimized (WebP preferred)
- ✅ New components have proper semantic HTML
- ✅ Forms have labels and ARIA attributes
- ✅ Color contrast meets WCAG AA standards

### For Designers

**Image Guidelines:**
- Use WebP format (fallback to JPEG/PNG)
- Hero images: max 100 KB (optimized)
- Thumbnails: max 20 KB each
- Provide 2x and 3x versions for Retina
- Always specify dimensions

**Performance-Friendly Patterns:**
- Lazy load images below fold
- Use system fonts when possible
- Minimize custom font weights
- Avoid layout shifts (reserve space)

---

## Related Documentation

- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci)
- [bundlesize Documentation](https://github.com/siddharthkp/bundlesize)
- [Web Vitals](https://web.dev/vitals/)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)

---

## Changelog

| Date | Change | Reason |
|------|--------|--------|
| 2026-01-12 | Initial budgets established | Set baseline performance standards |
| 2026-01-12 | Added bundlesize to CI workflow | Automated bundle size checking |
| 2026-01-12 | Enhanced CI workflow paths | Include all relevant packages |

---

**Status:** ✅ Active and enforced in CI
**Owner:** Engineering Team
**Next Review:** 2026-04-01 (Quarterly)
