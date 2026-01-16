# Brikette Improvement Work - Test Plans

**Document Type:** Test Strategy & Plans
**Created:** 2026-01-12
**Status:** Draft
**Owner:** Engineering Team

---

## Table of Contents

1. [Quick Wins Validation](#1-quick-wins-validation)
2. [i18n Bundle Optimization](#2-i18n-bundle-optimization)
3. [Route Consolidation](#3-route-consolidation)
4. [Image Optimization](#4-image-optimization)
5. [Type Safety Improvements](#5-type-safety-improvements)
6. [RTL Support](#6-rtl-support)
7. [Performance Testing](#7-performance-testing)
8. [Security Testing](#8-security-testing)
9. [Accessibility Testing](#9-accessibility-testing)
10. [Integration Test Suite](#10-integration-test-suite)

---

## 1. Quick Wins Validation

### 1.1 Test Parallelization

**Priority:** P0 | **Duration:** 30 min

#### Manual Testing

**Test 1.1.1: Verify Parallel Execution**
```bash
# Run tests with timing
time pnpm --filter @apps/brikette test:unit

# Expected: < 4 minutes (was 5-8 minutes)
# Success criteria: Tests complete faster than baseline
```

**Test 1.1.2: Verify Test Isolation**
```bash
# Run tests multiple times to ensure no race conditions
for i in {1..3}; do
  echo "Run $i"
  pnpm --filter @apps/brikette test:unit
done

# Expected: All runs pass consistently
# Success criteria: 100% pass rate across all runs
```

**Test 1.1.3: Coverage Generation**
```bash
# Verify coverage reports still generate correctly
pnpm --filter @apps/brikette test:unit

# Expected: Coverage summary displayed
# Success criteria: Coverage files created in correct location
```

#### Automated Testing

**Test 1.1.4: CI/CD Integration**
- Push changes to branch
- Verify GitHub Actions test job completes
- Check execution time in CI logs
- Expected: < 5 minutes in CI environment

**Acceptance Criteria:**
- [ ] Tests run 40%+ faster than previous baseline
- [ ] All tests pass with parallel execution
- [ ] Coverage reports generate correctly
- [ ] No race conditions or flaky tests
- [ ] CI/CD pipeline completes successfully

---

### 1.2 Performance Budgets

**Priority:** P0 | **Duration:** 2 hours

#### Manual Testing

**Test 1.2.1: Local Lighthouse Audit**
```bash
# Build and start server
pnpm --filter @apps/brikette build
pnpm --filter @apps/brikette start &

# Wait for server
sleep 10

# Run Lighthouse
pnpm --filter @apps/brikette lighthouse

# Expected: All assertions pass
# Success criteria: No budget violations
```

**Test 1.2.2: Bundle Size Check**
```bash
# Build app
pnpm --filter @apps/brikette build

# Check bundle sizes
pnpm --filter @apps/brikette bundlesize

# Expected: All bundles within limits
# Success criteria: No size limit exceeded
```

**Test 1.2.3: Performance Metrics Review**
- Visit http://localhost:3014/en
- Open Chrome DevTools > Performance
- Record page load
- Check Core Web Vitals:
  - FCP < 1.5s ✓
  - LCP < 2.5s ✓
  - CLS < 0.1 ✓
  - TBT < 300ms ✓

#### Automated Testing

**Test 1.2.4: Lighthouse CI Workflow**
- Create PR with performance impact
- Verify workflow runs automatically
- Check Lighthouse results in artifacts
- Expected: Workflow uploads results

**Test 1.2.5: Budget Violation Detection**
- Temporarily increase bundle size (add large dependency)
- Run Lighthouse CI
- Expected: Build fails with budget violation
- Rollback change

**Acceptance Criteria:**
- [ ] Lighthouse scores meet thresholds (85%+ performance)
- [ ] Bundle sizes within defined limits
- [ ] Core Web Vitals pass all thresholds
- [ ] CI workflow runs on every PR
- [ ] Budget violations block merges

---

### 1.3 Skip-to-Content Links

**Priority:** P0 | **Duration:** 1 hour

#### Manual Testing

**Test 1.3.1: Keyboard Navigation (English)**
```
1. Visit http://localhost:3014/en
2. Press Tab key (no mouse)
3. Expected: "Skip to main content" link appears
4. Verify link is visible and styled
5. Press Enter
6. Expected: Focus moves to main content
7. Press Tab again
8. Expected: Focus on first interactive element in main
```

**Test 1.3.2: Keyboard Navigation (All Languages)**
```
For each language: en, es, de, fr, it, ja, ko, pt, ru, zh, ar, hi, vi, pl, sv, no, da, hu
1. Visit /{lang}
2. Press Tab
3. Expected: Skip link appears in correct language
4. Verify translation is correct
5. Test navigation works
```

**Test 1.3.3: Screen Reader Testing**
```
VoiceOver (macOS):
1. Enable VoiceOver (Cmd+F5)
2. Visit http://localhost:3014/en
3. Navigate with VO+Right Arrow
4. Expected: "Skip to main content" announced first
5. Activate link (VO+Space)
6. Expected: Announces "main content" landmark

NVDA (Windows):
1. Enable NVDA
2. Visit http://localhost:3014/en
3. Press Insert+F7 (Elements List)
4. Navigate to Links
5. Expected: Skip links listed first
6. Activate and verify navigation
```

**Test 1.3.4: Visual Testing**
```
Test focus styles:
1. Tab to skip link
2. Verify appearance:
   - ✓ High contrast background
   - ✓ Visible text
   - ✓ Focus ring visible
   - ✓ z-index brings to front
   - ✓ Positioned correctly (top-left)

Test dark mode:
1. Enable dark mode
2. Tab to skip link
3. Expected: Proper contrast in dark mode
```

**Test 1.3.5: Mobile Testing**
```
iOS Safari:
1. Connect keyboard to iPhone/iPad
2. Visit site
3. Press Tab
4. Expected: Skip link appears

Android Chrome:
1. Connect keyboard to Android device
2. Visit site
3. Press Tab
4. Expected: Skip link appears
```

#### Automated Testing

**Test 1.3.6: E2E Test with Playwright**
```typescript
// apps/brikette/tests/e2e/accessibility.spec.ts
test('skip links are keyboard accessible', async ({ page }) => {
  await page.goto('/en');

  // Tab to first skip link
  await page.keyboard.press('Tab');

  // Verify skip link is focused
  const skipLink = page.locator('a[href="#main-content"]');
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();
  await expect(skipLink).toHaveText('Skip to main content');

  // Activate skip link
  await page.keyboard.press('Enter');

  // Verify focus moved to main content
  const mainContent = page.locator('#main-content');
  await expect(mainContent).toBeFocused();
});

test('skip links work in all languages', async ({ page }) => {
  const languages = ['en', 'es', 'de', 'fr', 'it', 'ja'];

  for (const lang of languages) {
    await page.goto(`/${lang}`);
    await page.keyboard.press('Tab');

    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeVisible();
    await expect(skipLink).toBeFocused();
  }
});
```

**Test 1.3.7: Axe Accessibility Audit**
```typescript
// Add to Playwright tests
import { injectAxe, checkA11y } from 'axe-playwright';

test('skip links meet WCAG 2.1 AA', async ({ page }) => {
  await page.goto('/en');
  await injectAxe(page);

  await checkA11y(page, null, {
    detailedReport: true,
    rules: {
      'bypass': { enabled: true }, // Skip link rule
    },
  });
});
```

**Acceptance Criteria:**
- [ ] Skip links appear on Tab focus
- [ ] Links navigate to correct targets
- [ ] Translations present for all 18 languages
- [ ] Screen readers announce links correctly
- [ ] Visual styling meets contrast requirements (4.5:1 ratio)
- [ ] Works in dark mode
- [ ] Works on mobile with keyboard
- [ ] E2E tests pass
- [ ] Axe audit passes with no violations

---

### 1.4 Security Audit

**Priority:** P0 | **Duration:** 1 hour

#### Manual Testing

**Test 1.4.1: Verify Next.js Version**
```bash
# Check installed version
cat apps/brikette/package.json | grep '"next":'

# Expected: "next": "^16.1.1" or higher
# Success criteria: Version >= 16.1.1 (fixes CVE)
```

**Test 1.4.2: Run Security Audit**
```bash
# Run audit for critical vulnerabilities
pnpm audit --filter @apps/brikette --audit-level=critical

# Expected: 0 critical vulnerabilities in Brikette dependencies
# Success criteria: No critical issues in production dependencies
```

**Test 1.4.3: Verify Security Workflow**
```bash
# Check workflow file exists
ls -la .github/workflows/security-audit.yml

# Push to branch
git push origin feature/security-improvements

# Expected: Workflow runs automatically
# Success criteria: Workflow completes and uploads report
```

**Test 1.4.4: Dependency Update Check**
```bash
# Check for updates
pnpm outdated --filter @apps/brikette

# Expected: List of packages with available updates
# Document: Note any security-related updates needed
```

#### Automated Testing

**Test 1.4.5: CI Security Checks**
- Create PR with the changes
- Verify security-audit.yml workflow triggers
- Check workflow:
  - Runs pnpm audit
  - Uploads artifacts
  - Comments on PR with results
- Expected: PR comment with security summary

**Test 1.4.6: Critical Vulnerability Blocking**
- Simulate critical vulnerability (update test package to vulnerable version)
- Push to PR
- Expected: CI fails and blocks merge
- Rollback change

**Acceptance Criteria:**
- [ ] Next.js updated to 16.1.1+ (CVE fixed)
- [ ] 0 critical vulnerabilities in production dependencies
- [ ] Security workflow runs weekly
- [ ] Security workflow runs on dependency changes
- [ ] PR comments include security summary
- [ ] Critical vulnerabilities block CI/CD
- [ ] Security audit report documented

---

## 2. i18n Bundle Optimization

**Priority:** P0 | **Duration:** 3-4 weeks

### 2.1 Baseline Measurements

**Test 2.1.1: Current Bundle Analysis**
```bash
# Build production bundle
pnpm --filter @apps/brikette build

# Analyze bundle with webpack-bundle-analyzer
npx next-bundle-analyzer

# Document baseline:
# - Total bundle size
# - Locale bundle sizes
# - Number of locale files (currently 4,190)
# - First load JS size per route
```

**Test 2.1.2: Network Performance Baseline**
```bash
# Use Lighthouse to measure baseline
pnpm --filter @apps/brikette lighthouse

# Document:
# - Time to Interactive
# - Total Blocking Time
# - First Contentful Paint
# - Largest Contentful Paint
```

---

### 2.2 Phase 1: Bundle Consolidation Testing

**Test 2.2.1: Consolidated Bundle Size**
```bash
# After consolidating locale files
pnpm --filter @apps/brikette build

# Measure:
# - New total bundle size
# - Reduction percentage
# - File count (target: 300 files)

# Expected: 50-60% reduction in file count
# Success criteria: < 500 locale files
```

**Test 2.2.2: Translation Loading**
```typescript
// Test dynamic import still works
test('consolidated translations load correctly', async () => {
  const { t } = await import('@/i18n');
  await t.changeLanguage('es');

  const text = t('guides:beaches.title');
  expect(text).toBeTruthy();
  expect(text).not.toBe('guides:beaches.title'); // Not missing
});
```

**Test 2.2.3: Fallback Behavior**
```typescript
// Test fallback chain still works
test('translation fallback chain works', async () => {
  // Load language with incomplete translation
  const { t } = await import('@/i18n');
  await t.changeLanguage('ar'); // Might be incomplete

  // Should fall back to English
  const text = t('some.missing.key');
  expect(text).toBe('[expected English fallback]');
});
```

**Test 2.2.4: Performance Impact**
```bash
# Run Lighthouse again
pnpm --filter @apps/brikette lighthouse

# Compare metrics:
# - TTI improvement: target 20-30%
# - TBT improvement: target 25-35%
# - Bundle size: target 50-70% reduction
```

---

### 2.3 Phase 2: CDN Strategy Testing

**Test 2.3.1: CDN Delivery**
```typescript
// Test translations load from CDN
test('translations load from CDN', async () => {
  const response = await fetch('/locales/es/guides.json');

  expect(response.ok).toBe(true);
  expect(response.headers.get('cache-control')).toContain('max-age');

  const data = await response.json();
  expect(data).toBeTruthy();
});
```

**Test 2.3.2: Cache Behavior**
```typescript
// Test cache headers
test('locale files have proper cache headers', async () => {
  const response = await fetch('/locales/es/translation.json');

  const cacheControl = response.headers.get('cache-control');
  expect(cacheControl).toContain('public');
  expect(cacheControl).toMatch(/max-age=\d+/);

  // Should cache for at least 1 week
  const maxAge = parseInt(cacheControl.match(/max-age=(\d+)/)[1]);
  expect(maxAge).toBeGreaterThan(604800); // 7 days
});
```

**Test 2.3.3: Cache Invalidation**
```bash
# Update a translation
# Deploy
# Verify old cache invalidated
# Expected: New translation appears within 5 minutes
```

---

### 2.4 Load Testing

**Test 2.4.1: Concurrent Language Loading**
```typescript
// Test loading multiple languages simultaneously
test('handles concurrent language switches', async () => {
  const { i18n } = await import('@/i18n');

  // Simulate rapid language switching
  const promises = [
    i18n.changeLanguage('en'),
    i18n.changeLanguage('es'),
    i18n.changeLanguage('de'),
    i18n.changeLanguage('fr'),
  ];

  await Promise.all(promises);

  // Should not crash or cause race conditions
  expect(i18n.language).toBeTruthy();
});
```

**Test 2.4.2: Large Page with Many Translations**
```typescript
// Test guide page with 100+ translations
test('guide page loads efficiently', async ({ page }) => {
  await page.goto('/en/experiences/backpacker-itineraries');

  // Should load within budget
  const metrics = await page.metrics();
  expect(metrics.JSEventListeners).toBeLessThan(1000);

  // Check for translation loading errors
  const errors = [];
  page.on('pageerror', err => errors.push(err));

  await page.waitForLoadState('networkidle');
  expect(errors).toHaveLength(0);
});
```

---

### 2.5 Acceptance Criteria

- [ ] File count reduced from 4,190 → < 500
- [ ] Total bundle size reduced by 50-70%
- [ ] All translations load correctly
- [ ] Fallback chain works as expected
- [ ] TTI improved by 20-30%
- [ ] No translation loading errors
- [ ] CDN cache headers configured correctly
- [ ] Cache invalidation works
- [ ] No performance regressions on any route
- [ ] All E2E tests pass

---

## 3. Route Consolidation

**Priority:** P0 | **Duration:** 2-3 weeks

### 3.1 Pre-Migration Testing

**Test 3.1.1: Current Route Inventory**
```bash
# Document all current routes
find apps/brikette/src/routes -name "*.tsx" | wc -l
# Expected: ~253 routes

# List guide routes
find apps/brikette/src/routes/guides -name "*.tsx"
# Expected: ~150 guide routes

# Document route to URL mapping
npm run routes:analyze > route-inventory.txt
```

**Test 3.1.2: SEO URL Audit**
```bash
# Build sitemap
pnpm --filter @apps/brikette build

# Extract all URLs
# Document for redirect mapping later
```

---

### 3.2 Dynamic Route Implementation

**Test 3.2.1: Dynamic Route Resolution**
```typescript
// Test dynamic slug resolution
test('dynamic guide route resolves correctly', async ({ page }) => {
  // Old URL format
  await page.goto('/en/experiences/arienzo-beach');

  // Should still work with dynamic route
  await expect(page.locator('h1')).toBeVisible();

  // Verify correct content loaded
  const title = await page.locator('h1').textContent();
  expect(title).toContain('Arienzo Beach');
});
```

**Test 3.2.2: Slug Validation**
```typescript
// Test invalid slug handling
test('invalid slug returns 404', async ({ page }) => {
  const response = await page.goto('/en/experiences/nonexistent-guide');

  expect(response.status()).toBe(404);
  await expect(page.locator('h1')).toContainText('Not Found');
});
```

**Test 3.2.3: Language-Specific Slugs**
```typescript
// Test slug works in all languages
test('guide slugs work in all languages', async ({ page }) => {
  const tests = [
    { lang: 'en', slug: 'arienzo-beach', title: 'Arienzo Beach' },
    { lang: 'es', slug: 'playa-arienzo', title: 'Playa Arienzo' },
    { lang: 'de', slug: 'arienzo-strand', title: 'Arienzo Strand' },
  ];

  for (const { lang, slug, title } of tests) {
    await page.goto(`/${lang}/experiences/${slug}`);
    const h1 = await page.locator('h1').textContent();
    expect(h1).toContain(title);
  }
});
```

---

### 3.3 Redirect Testing

**Test 3.3.1: Old URL Redirects**
```typescript
// Test permanent redirects from old structure
test('old URLs redirect to new structure', async ({ page }) => {
  const response = await page.goto('/en/experiences/old-slug-format', {
    waitUntil: 'networkidle',
  });

  // Should redirect with 301
  expect(response.status()).toBe(301);
  expect(page.url()).toContain('/en/experiences/new-slug-format');
});
```

**Test 3.3.2: Redirect Chain Testing**
```bash
# Test redirect chains don't exceed 3 hops
curl -I http://localhost:3014/en/old-url

# Expected: 1-2 redirects max
# Success criteria: No redirect chains > 2 hops
```

**Test 3.3.3: SEO Redirect Validation**
```typescript
// Verify redirect headers are SEO-friendly
test('redirects have proper SEO headers', async () => {
  const response = await fetch('http://localhost:3014/en/old-url', {
    redirect: 'manual',
  });

  expect(response.status).toBe(301); // Permanent
  expect(response.headers.get('location')).toBeTruthy();
  expect(response.headers.get('cache-control')).toContain('max-age');
});
```

---

### 3.4 Build Performance Testing

**Test 3.4.1: Build Time Comparison**
```bash
# Before consolidation
time pnpm --filter @apps/brikette build
# Document: Build time (baseline)

# After consolidation
time pnpm --filter @apps/brikette build
# Expected: 40-50% faster
# Success criteria: Build time reduced significantly
```

**Test 3.4.2: Build Output Size**
```bash
# Before
du -sh apps/brikette/.next

# After
du -sh apps/brikette/.next

# Expected: 30-40% smaller .next directory
```

---

### 3.5 Load Testing

**Test 3.5.1: Route Resolution Performance**
```typescript
// Test dynamic route doesn't slow down resolution
test('dynamic route resolution is fast', async ({ page }) => {
  const start = Date.now();
  await page.goto('/en/experiences/arienzo-beach');
  await page.waitForLoadState('domcontentloaded');
  const duration = Date.now() - start;

  // Should load within 2 seconds
  expect(duration).toBeLessThan(2000);
});
```

**Test 3.5.2: Parallel Route Loading**
```typescript
// Test multiple routes load efficiently
test('loading multiple guide routes in parallel', async () => {
  const routes = [
    '/en/experiences/arienzo-beach',
    '/en/experiences/fornillo-beach',
    '/en/experiences/path-of-gods',
  ];

  const promises = routes.map(route =>
    fetch(`http://localhost:3014${route}`)
  );

  const responses = await Promise.all(promises);

  // All should succeed
  responses.forEach(response => {
    expect(response.ok).toBe(true);
  });
});
```

---

### 3.6 Acceptance Criteria

- [ ] Route count reduced from 253 → < 40
- [ ] All guide URLs resolve correctly
- [ ] Language-specific slugs work
- [ ] Invalid slugs return 404
- [ ] Old URLs redirect with 301
- [ ] No redirect chains > 2 hops
- [ ] Build time reduced by 40-50%
- [ ] Build output size reduced by 30-40%
- [ ] Dynamic route resolution < 2s
- [ ] All E2E tests pass
- [ ] SEO validation passes
- [ ] No broken links in sitemap

---

## 4. Image Optimization

**Priority:** P1 | **Duration:** 1-2 weeks

### 4.1 Current State Analysis

**Test 4.1.1: Image Inventory**
```bash
# Count images
find apps/brikette/public -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.webp" \) | wc -l

# Measure total size
du -sh apps/brikette/public/img
```

**Test 4.1.2: Current LCP Measurement**
```bash
# Run Lighthouse
pnpm --filter @apps/brikette lighthouse

# Document LCP scores for key pages:
# - Home page
# - Experiences page
# - Guide page (with hero image)
```

---

### 4.2 next/image Integration Testing

**Test 4.2.1: Image Component Rendering**
```typescript
// Test next/image renders correctly
test('next/image renders with Cloudflare loader', async ({ page }) => {
  await page.goto('/en');

  // Find hero image
  const img = page.locator('img[alt*="Positano"]').first();

  // Check image loaded
  await expect(img).toBeVisible();

  // Verify srcset generated
  const srcset = await img.getAttribute('srcset');
  expect(srcset).toBeTruthy();
  expect(srcset).toContain('w='); // Width descriptor
});
```

**Test 4.2.2: Blur Placeholder**
```typescript
// Test blur placeholder shows while loading
test('images show blur placeholder', async ({ page }) => {
  // Throttle network
  await page.route('**/*.jpg', route => {
    setTimeout(() => route.continue(), 2000); // Delay 2s
  });

  await page.goto('/en');

  // Check blur placeholder visible
  const img = page.locator('img').first();
  const placeholder = await img.evaluate(el =>
    window.getComputedStyle(el).getPropertyValue('background-image')
  );

  expect(placeholder).toContain('blur');
});
```

**Test 4.2.3: Lazy Loading**
```typescript
// Test below-fold images are lazy loaded
test('below-fold images lazy load', async ({ page }) => {
  await page.goto('/en/experiences');

  // Get all images
  const images = await page.locator('img').all();

  // Check loading attribute
  for (const img of images.slice(5)) { // Below fold
    const loading = await img.getAttribute('loading');
    expect(loading).toBe('lazy');
  }
});
```

**Test 4.2.4: Priority Images**
```typescript
// Test hero images have priority
test('hero images have priority attribute', async ({ page }) => {
  await page.goto('/en');

  const heroImg = page.locator('[data-testid="hero-image"]').first();
  const fetchpriority = await heroImg.getAttribute('fetchpriority');

  expect(fetchpriority).toBe('high');
});
```

---

### 4.3 Format Optimization Testing

**Test 4.3.1: WebP/AVIF Format**
```typescript
// Test modern formats delivered when supported
test('delivers WebP to supporting browsers', async ({ page }) => {
  await page.goto('/en');

  const img = page.locator('img').first();
  const src = await img.getAttribute('src');

  // Should contain format parameter
  expect(src).toMatch(/format=(webp|avif)/);
});
```

**Test 4.3.2: Responsive Images**
```typescript
// Test srcset for different viewport sizes
test('generates srcset for responsive images', async ({ page }) => {
  await page.goto('/en');

  const img = page.locator('img').first();
  const srcset = await img.getAttribute('srcset');

  // Should have multiple sizes
  const sizes = srcset.split(',').length;
  expect(sizes).toBeGreaterThan(2);

  // Verify sizes are appropriate
  expect(srcset).toMatch(/640w|750w|828w|1080w|1200w/);
});
```

---

### 4.4 Performance Impact Testing

**Test 4.4.1: LCP Improvement**
```bash
# Run Lighthouse after optimization
pnpm --filter @apps/brikette lighthouse

# Compare LCP scores:
# - Home page: target 20-30% improvement
# - Guide pages: target 25-35% improvement

# Expected: LCP < 2.5s on all pages
```

**Test 4.4.2: CLS Improvement**
```typescript
// Test CLS score with proper image dimensions
test('images have width and height to prevent CLS', async ({ page }) => {
  await page.goto('/en');

  // Check all images have dimensions
  const images = await page.locator('img').all();

  for (const img of images) {
    const width = await img.getAttribute('width');
    const height = await img.getAttribute('height');

    expect(width).toBeTruthy();
    expect(height).toBeTruthy();
  }
});
```

**Test 4.4.3: Bandwidth Savings**
```bash
# Measure image payload before and after
# Use Chrome DevTools Network tab

# Document:
# - Total image bytes loaded (before)
# - Total image bytes loaded (after)
# - Expected: 25-35% reduction
```

---

### 4.5 Acceptance Criteria

- [ ] All images use next/image component
- [ ] Blur placeholders show while loading
- [ ] Below-fold images lazy load
- [ ] Hero images have priority attribute
- [ ] WebP/AVIF delivered to supporting browsers
- [ ] Responsive srcsets generated
- [ ] All images have width/height attributes
- [ ] LCP improved by 20-30%
- [ ] CLS improved by 40-50%
- [ ] Image bandwidth reduced by 25-35%
- [ ] No layout shift on image load
- [ ] All E2E tests pass

---

## 5. Type Safety Improvements

**Priority:** P2 | **Duration:** 3-4 weeks

### 5.1 Current State Analysis

**Test 5.1.1: Count `any` Usage**
```bash
# Count total any usages
grep -r "any" apps/brikette/src --include="*.ts" --include="*.tsx" | wc -l

# Expected: ~1,149 (baseline)
# Target: < 400 (60-70% reduction)
```

**Test 5.1.2: Identify Hotspots**
```bash
# Find files with most any usage
grep -r "any" apps/brikette/src --include="*.ts" --include="*.tsx" | \
  cut -d: -f1 | sort | uniq -c | sort -rn | head -20

# Document top 20 files for targeted improvement
```

---

### 5.2 Guide Content Type Safety

**Test 5.2.1: Zod Schema Validation**
```typescript
// Test guide content schema
import { GuideContentSchema } from '@/types/guide-content';

test('guide content validates against schema', () => {
  const validGuide = {
    intro: 'Test intro',
    sections: [
      {
        heading: 'Section 1',
        content: 'Content here',
        image: '/img/test.jpg',
      },
    ],
    faq: [
      {
        question: 'Test question?',
        answer: 'Test answer',
      },
    ],
  };

  const result = GuideContentSchema.safeParse(validGuide);
  expect(result.success).toBe(true);
});

test('invalid guide content fails validation', () => {
  const invalidGuide = {
    intro: 123, // Should be string
    sections: 'invalid', // Should be array
  };

  const result = GuideContentSchema.safeParse(invalidGuide);
  expect(result.success).toBe(false);
  expect(result.error.issues).toBeTruthy();
});
```

**Test 5.2.2: Runtime Type Checking**
```typescript
// Test guide content loads with type checking
test('guide content validated at load time', async () => {
  const loadGuide = async (slug: string) => {
    const content = await import(`@/locales/en/guides/content/${slug}.json`);
    return GuideContentSchema.parse(content);
  };

  // Should not throw for valid guide
  await expect(loadGuide('arienzo-beach')).resolves.toBeTruthy();

  // Should throw for malformed guide
  await expect(loadGuide('invalid-guide')).rejects.toThrow();
});
```

---

### 5.3 i18n Type Safety

**Test 5.3.1: Translation Key Types**
```typescript
// Test translation key autocomplete
import { useTranslation } from 'react-i18next';

test('translation keys are type-safe', () => {
  const { t } = useTranslation();

  // Should have autocomplete for keys
  const text: string = t('accessibility.skipToMain');
  expect(text).toBeTruthy();

  // TypeScript should error on invalid key (compile-time check)
  // @ts-expect-error - invalid key should fail
  const invalid = t('invalid.key.that.does.not.exist');
});
```

**Test 5.3.2: Namespace Type Safety**
```typescript
// Test namespace-specific translations
test('namespace translations are typed', () => {
  const { t } = useTranslation(['translation', 'guides']);

  // Translation namespace
  expect(t('translation:header.title')).toBeTruthy();

  // Guides namespace
  expect(t('guides:beaches.title')).toBeTruthy();
});
```

---

### 5.4 Type Coverage Testing

**Test 5.4.1: TypeScript Strict Mode**
```json
// Verify strict mode enabled in tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

**Test 5.4.2: Type Check All Files**
```bash
# Run TypeScript compiler
pnpm --filter @apps/brikette typecheck

# Expected: 0 errors
# Success criteria: Clean build with strict mode
```

**Test 5.4.3: Measure Type Coverage**
```bash
# Use type-coverage tool
npx type-coverage --project apps/brikette

# Expected: > 95% coverage
# Success criteria: Significant improvement from baseline
```

---

### 5.5 Acceptance Criteria

- [ ] `any` usage reduced from 1,149 → < 400 (60%+ reduction)
- [ ] Guide content has Zod schemas
- [ ] Translation keys are type-safe
- [ ] i18n namespaces properly typed
- [ ] TypeScript strict mode enabled
- [ ] Type coverage > 95%
- [ ] 0 TypeScript errors
- [ ] All tests pass with strict types
- [ ] IDE autocomplete works for all typed areas

---

## 6. RTL Support

**Priority:** P2 | **Duration:** 1-2 weeks

### 6.1 Pre-Testing Setup

**Test 6.1.1: Arabic Language Setup**
```bash
# Verify Arabic is configured
cat apps/brikette/src/i18n.config.ts | grep ar

# Expected: Arabic (ar) in supported languages
```

**Test 6.1.2: RTL Detection**
```typescript
// Test dir attribute detection
test('Arabic sets dir=rtl', async ({ page }) => {
  await page.goto('/ar');

  const html = page.locator('html');
  const dir = await html.getAttribute('dir');

  expect(dir).toBe('rtl');
});

test('English sets dir=ltr', async ({ page }) => {
  await page.goto('/en');

  const html = page.locator('html');
  const dir = await html.getAttribute('dir');

  expect(dir).toBe('ltr');
});
```

---

### 6.2 Visual Testing

**Test 6.2.1: Layout Direction**
```
Manual visual test in Arabic:

1. Visit http://localhost:3014/ar
2. Verify layout flows right-to-left:
   - ✓ Text alignment (right-aligned)
   - ✓ Navigation menu (right side)
   - ✓ Icons (flipped horizontally)
   - ✓ Margins/padding (reversed)
   - ✓ Flex layouts (reversed)

3. Check key pages:
   - Home page
   - Experiences listing
   - Guide detail page
   - Rooms page
   - Footer

4. Compare to English version
5. Document any layout issues
```

**Test 6.2.2: Text Direction**
```
Manual test for mixed text:

1. Visit Arabic page with English words
2. Verify:
   - ✓ Arabic text flows RTL
   - ✓ English words within Arabic text render correctly
   - ✓ Numbers display correctly
   - ✓ Punctuation positioned correctly

3. Test long paragraphs
4. Test headings
5. Test list items
```

**Test 6.2.3: Component Positioning**
```
Check component alignment in RTL:

Components to test:
- Header navigation
- Breadcrumbs
- Cards/tiles
- Buttons
- Forms
- Modals
- Dropdowns
- Carousels/sliders
- Tables
- Icons

For each:
- ✓ Positioned correctly
- ✓ Padding/margins reversed
- ✓ Icons point correct direction
- ✓ Text alignment correct
```

---

### 6.3 Logical Properties Testing

**Test 6.3.1: CSS Logical Properties Audit**
```bash
# Find directional properties that should be logical
grep -r "margin-left\|margin-right\|padding-left\|padding-right\|left:\|right:" \
  apps/brikette/src --include="*.tsx" --include="*.css"

# Document: Files using physical properties
# Action: Convert to logical properties (margin-inline-start, etc.)
```

**Test 6.3.2: Tailwind Logical Classes**
```typescript
// Test Tailwind logical utilities work
test('Tailwind logical utilities in RTL', async ({ page }) => {
  await page.goto('/ar');

  // Find element with ms-4 (margin-inline-start)
  const element = page.locator('.ms-4').first();

  const style = await element.evaluate(el =>
    window.getComputedStyle(el).marginRight
  );

  // In RTL, margin-inline-start should be margin-right
  expect(style).toBe('1rem');
});
```

---

### 6.4 Icon Direction Testing

**Test 6.4.1: Directional Icons**
```
Manual test for icons that should flip:

Icons that SHOULD flip in RTL:
- Arrow right/left icons
- Chevron right/left
- Navigation arrows
- Back/forward buttons
- Next/previous buttons

Icons that should NOT flip:
- Close (X) button
- Checkmarks
- Plus/minus
- Search icon
- Social media icons

Test each icon type in Arabic mode
```

---

### 6.5 Automated RTL Testing

**Test 6.5.1: Screenshot Comparison**
```typescript
// Take screenshots in LTR and RTL
test('visual regression test for RTL', async ({ page }) => {
  // LTR screenshot
  await page.goto('/en');
  const ltrScreenshot = await page.screenshot();

  // RTL screenshot
  await page.goto('/ar');
  const rtlScreenshot = await page.screenshot();

  // Should be visually different (mirrored)
  expect(ltrScreenshot).not.toEqual(rtlScreenshot);

  // Compare with baseline
  expect(rtlScreenshot).toMatchSnapshot('arabic-homepage.png');
});
```

**Test 6.5.2: Layout Test**
```typescript
// Test layout positioning in RTL
test('header navigation in RTL position', async ({ page }) => {
  await page.goto('/ar');

  const nav = page.locator('nav[id="navigation"]');
  const box = await nav.boundingBox();

  // Navigation should be on right side in RTL
  const viewportWidth = page.viewportSize().width;
  expect(box.x + box.width).toBeGreaterThan(viewportWidth * 0.7);
});
```

---

### 6.6 Translation Quality

**Test 6.6.1: Arabic Translation Completeness**
```bash
# Check Arabic translation coverage
pnpm --filter @apps/brikette i18n:coverage

# Expected: Arabic at similar % as other languages
# Success criteria: > 80% translation coverage
```

**Test 6.6.2: Text Overflow**
```typescript
// Test Arabic text doesn't overflow containers
test('Arabic text fits in containers', async ({ page }) => {
  await page.goto('/ar');

  // Get all text elements
  const elements = await page.locator('p, h1, h2, h3, button, a').all();

  for (const element of elements) {
    const box = await element.boundingBox();
    const parent = await element.evaluateHandle(el => el.parentElement);
    const parentBox = await parent.asElement().boundingBox();

    // Text should not overflow parent
    if (box && parentBox) {
      expect(box.width).toBeLessThanOrEqual(parentBox.width);
    }
  }
});
```

---

### 6.7 Accessibility in RTL

**Test 6.7.1: Screen Reader in RTL**
```
Manual test with Arabic screen reader:

1. Enable Arabic TTS voice
2. Navigate Arabic page
3. Verify:
   - ✓ Content read in correct order
   - ✓ Links announced correctly
   - ✓ Navigation makes sense
   - ✓ Skip links work

Tools:
- VoiceOver (macOS) with Arabic voice
- NVDA (Windows) with Arabic voice
```

**Test 6.7.2: Keyboard Navigation in RTL**
```
Manual keyboard test in Arabic:

1. Visit Arabic page
2. Tab through interactive elements
3. Verify:
   - ✓ Tab order follows visual order (RTL)
   - ✓ Arrow keys work correctly in menus
   - ✓ Shortcuts don't conflict

4. Test specific components:
   - Navigation menu
   - Carousel controls
   - Dropdown menus
   - Modal dialogs
```

---

### 6.8 Acceptance Criteria

- [ ] HTML dir attribute set correctly (rtl/ltr)
- [ ] All layouts flow correctly in RTL
- [ ] Text aligns to right in Arabic
- [ ] Margins/padding reversed appropriately
- [ ] Physical CSS properties converted to logical
- [ ] Directional icons flip correctly
- [ ] Non-directional icons don't flip
- [ ] Arabic translation > 80% complete
- [ ] No text overflow issues
- [ ] Screen reader works in RTL
- [ ] Keyboard navigation works in RTL
- [ ] Visual regression tests pass
- [ ] No layout breaks in any component

---

## 7. Performance Testing

**Priority:** Ongoing | **Duration:** Continuous

### 7.1 Core Web Vitals Monitoring

**Test 7.1.1: Lighthouse CI Integration**
```yaml
# Verify workflow runs
# Check .github/workflows/lighthouse-brikette.yml

# On every PR:
- Build app
- Start server
- Run Lighthouse on key routes
- Assert performance budgets
- Upload results

# Success criteria: All routes pass budgets
```

**Test 7.1.2: Real User Monitoring**
```typescript
// Verify Web Vitals tracking
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

test('Web Vitals are tracked', () => {
  const metrics = [];

  getCLS(metric => metrics.push(metric));
  getFID(metric => metrics.push(metric));
  getFCP(metric => metrics.push(metric));
  getLCP(metric => metrics.push(metric));
  getTTFB(metric => metrics.push(metric));

  // Trigger page interaction
  // ...

  // Metrics should be collected
  expect(metrics.length).toBeGreaterThan(0);
});
```

---

### 7.2 Bundle Size Monitoring

**Test 7.2.1: Automated Bundle Size Checks**
```bash
# On every build
pnpm --filter @apps/brikette build
pnpm --filter @apps/brikette bundlesize

# Success criteria: All bundles within limits
# Fail build if limits exceeded
```

**Test 7.2.2: Bundle Analysis**
```bash
# Periodic deep analysis
pnpm --filter @apps/brikette build
npx next-bundle-analyzer

# Review:
# - Largest chunks
# - Duplicate dependencies
# - Tree-shaking opportunities
# - Code splitting effectiveness
```

---

### 7.3 Load Testing

**Test 7.3.1: Concurrent Users**
```bash
# Use k6 or Artillery for load testing
k6 run load-test.js

# Test scenarios:
# - 100 concurrent users
# - 1000 requests/minute
# - Mix of pages (home, guides, rooms)

# Success criteria:
# - 95th percentile response time < 2s
# - 0% error rate
# - Server stays responsive
```

**Test 7.3.2: Cold Start Performance**
```bash
# Test performance with cold cache
# Clear all caches
# Load page
# Measure TTI

# Repeat 10 times
# Calculate average, median, p95

# Success criteria: p95 TTI < 3.5s
```

---

### 7.4 Acceptance Criteria

- [ ] Lighthouse CI runs on every PR
- [ ] All routes pass performance budgets
- [ ] Core Web Vitals tracked in production
- [ ] Bundle sizes monitored automatically
- [ ] Load testing shows acceptable performance
- [ ] Cold start TTI < 3.5s (p95)
- [ ] No performance regressions detected

---

## 8. Security Testing

**Priority:** Ongoing | **Duration:** Continuous

### 8.1 Dependency Auditing

**Test 8.1.1: Weekly Security Scans**
```bash
# Automated via GitHub Actions
# .github/workflows/security-audit.yml runs weekly

# Manual trigger:
pnpm audit --audit-level=moderate

# Review results
# Create tickets for high/critical issues
# Track remediation
```

**Test 8.1.2: Dependency Update Testing**
```bash
# Update dependencies
pnpm update --recursive

# Run full test suite
pnpm test
pnpm --filter @apps/brikette test:unit
pnpm --filter @apps/brikette typecheck
pnpm --filter @apps/brikette build

# Success criteria: All tests pass with updates
```

---

### 8.2 Penetration Testing

**Test 8.2.1: OWASP Top 10**
```
Test for common vulnerabilities:

1. Injection (SQL, XSS, Command)
   - Test all form inputs
   - Test URL parameters
   - Test API endpoints

2. Broken Authentication
   - Test session management
   - Test password policies

3. Sensitive Data Exposure
   - Check for exposed env vars
   - Review client-side code

4. XML External Entities (XXE)
   - N/A (no XML processing)

5. Broken Access Control
   - Test unauthorized access
   - Test privilege escalation

6. Security Misconfiguration
   - Review headers
   - Check error messages
   - Review CORS policy

7. XSS
   - Test user-generated content
   - Test reflected parameters

8. Insecure Deserialization
   - Review data parsing
   - Test JSON handling

9. Using Components with Known Vulnerabilities
   - Check pnpm audit results

10. Insufficient Logging & Monitoring
    - Review error tracking
    - Check security event logging
```

---

### 8.3 Content Security Policy Testing

**Test 8.3.1: CSP Headers**
```typescript
// Test CSP headers are set
test('CSP headers present', async () => {
  const response = await fetch('http://localhost:3014/en');

  const csp = response.headers.get('content-security-policy');
  expect(csp).toBeTruthy();

  // Should restrict inline scripts
  expect(csp).toContain("script-src");

  // Should restrict inline styles
  expect(csp).toContain("style-src");
});
```

**Test 8.3.2: CSP Violation Testing**
```typescript
// Test CSP blocks malicious content
test('CSP blocks inline scripts', async ({ page }) => {
  const violations = [];
  page.on('console', msg => {
    if (msg.text().includes('CSP')) violations.push(msg.text());
  });

  await page.goto('/en');

  // Try to inject inline script
  await page.evaluate(() => {
    const script = document.createElement('script');
    script.innerHTML = 'alert("XSS")';
    document.body.appendChild(script);
  });

  // Should be blocked
  expect(violations.length).toBeGreaterThan(0);
});
```

---

### 8.4 Acceptance Criteria

- [ ] Security audit runs weekly
- [ ] Critical vulnerabilities fixed within 7 days
- [ ] High vulnerabilities fixed within 30 days
- [ ] OWASP Top 10 testing completed
- [ ] CSP headers configured
- [ ] No exposed secrets or API keys
- [ ] Security event logging implemented
- [ ] Penetration test report documented

---

## 9. Accessibility Testing

**Priority:** P1 | **Duration:** Ongoing

### 9.1 WCAG 2.1 Compliance

**Test 9.1.1: Automated Axe Testing**
```typescript
// Run Axe on all pages
import { injectAxe, checkA11y } from 'axe-playwright';

const pages = [
  '/en',
  '/en/experiences',
  '/en/experiences/arienzo-beach',
  '/en/rooms',
  '/en/deals',
];

for (const url of pages) {
  test(`${url} passes WCAG 2.1 AA`, async ({ page }) => {
    await page.goto(url);
    await injectAxe(page);

    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });
}
```

**Test 9.1.2: Manual WCAG Checklist**
```
Test WCAG 2.1 Level AA criteria:

Perceivable:
- [ ] 1.1.1 Non-text content has alt text
- [ ] 1.3.1 Info, structure, relationships conveyed
- [ ] 1.4.3 Contrast ratio at least 4.5:1
- [ ] 1.4.4 Text can be resized 200%
- [ ] 1.4.10 Content reflows (no horizontal scroll)
- [ ] 1.4.11 Non-text contrast at least 3:1

Operable:
- [ ] 2.1.1 Keyboard accessible
- [ ] 2.1.2 No keyboard trap
- [ ] 2.4.1 Bypass blocks (skip links)
- [ ] 2.4.2 Page titled
- [ ] 2.4.3 Focus order logical
- [ ] 2.4.4 Link purpose from context
- [ ] 2.4.7 Focus visible

Understandable:
- [ ] 3.1.1 Language of page specified
- [ ] 3.1.2 Language of parts specified
- [ ] 3.2.1 On focus predictable
- [ ] 3.2.2 On input predictable
- [ ] 3.3.1 Error identification
- [ ] 3.3.2 Labels or instructions

Robust:
- [ ] 4.1.1 Parsing (valid HTML)
- [ ] 4.1.2 Name, role, value
- [ ] 4.1.3 Status messages
```

---

### 9.2 Screen Reader Testing

**Test 9.2.1: VoiceOver (macOS)**
```
Test with VoiceOver:

1. Enable VoiceOver (Cmd+F5)
2. Visit each key page
3. Navigate with:
   - VO+Right Arrow (next item)
   - VO+Left Arrow (previous item)
   - VO+U (rotor/navigation menu)
   - VO+Space (activate element)

4. Verify:
   - ✓ All content announced
   - ✓ Links described clearly
   - ✓ Images have alt text
   - ✓ Form labels read
   - ✓ Headings in logical order
   - ✓ Landmarks identified
   - ✓ Skip links work

5. Test in multiple languages
6. Document issues
```

**Test 9.2.2: NVDA (Windows)**
```
Test with NVDA:

1. Launch NVDA
2. Visit each key page
3. Navigate with:
   - Down Arrow (next item)
   - H (next heading)
   - K (next link)
   - F (next form field)
   - Insert+F7 (elements list)

4. Verify same items as VoiceOver
5. Test in multiple languages
6. Document issues
```

---

### 9.3 Keyboard Navigation Testing

**Test 9.3.1: Tab Order**
```
Manual keyboard test:

1. Visit page
2. Press Tab repeatedly (no mouse)
3. Verify:
   - ✓ Skip links appear first
   - ✓ Tab order follows visual order
   - ✓ All interactive elements reachable
   - ✓ No keyboard trap
   - ✓ Focus visible at all times
   - ✓ Hidden content skipped

4. Test reverse tab (Shift+Tab)
5. Test in RTL languages
```

**Test 9.3.2: Keyboard Shortcuts**
```
Test keyboard functionality:

Components to test:
- Navigation menu (Arrow keys)
- Dropdown (Space/Enter to open, Esc to close)
- Modal (Esc to close, Tab traps focus)
- Carousel (Arrow keys to navigate)
- Form controls (Space to check, Arrow keys for radio)

For each:
- ✓ Standard shortcuts work
- ✓ Custom shortcuts announced
- ✓ Shortcuts documented
```

---

### 9.4 Visual Accessibility

**Test 9.4.1: Color Contrast**
```bash
# Use automated tool
npx pa11y http://localhost:3014/en --standard WCAG2AA

# Manual spot checks with contrast checker
# Test:
# - Text on background (4.5:1)
# - Large text on background (3:1)
# - UI components (3:1)
# - Focus indicators (3:1)

# Test in dark mode
# Repeat all contrast checks
```

**Test 9.4.2: Text Resizing**
```
Manual test:

1. Visit page
2. Zoom to 200% (Cmd/Ctrl + +)
3. Verify:
   - ✓ All text scales
   - ✓ No horizontal scrolling
   - ✓ Content doesn't overlap
   - ✓ All functionality available
   - ✓ Images scale appropriately

4. Test at 150%, 175%, 200%
5. Test on mobile viewport
```

---

### 9.5 Acceptance Criteria

- [ ] Axe audit passes on all pages (0 violations)
- [ ] WCAG 2.1 AA checklist completed
- [ ] VoiceOver test completed (no critical issues)
- [ ] NVDA test completed (no critical issues)
- [ ] Keyboard navigation works on all components
- [ ] Color contrast ratios meet requirements
- [ ] Text scales to 200% without breaking
- [ ] Skip links functional
- [ ] Lighthouse accessibility score > 90
- [ ] No accessibility regressions

---

## 10. Integration Test Suite

**Priority:** P1 | **Duration:** Ongoing

### 10.1 E2E Critical User Journeys

**Test 10.1.1: Guide Discovery Flow**
```typescript
// User finds and reads a guide
test('user discovers and reads guide', async ({ page }) => {
  // Land on home page
  await page.goto('/en');
  await expect(page.locator('h1')).toBeVisible();

  // Navigate to experiences
  await page.click('text=Experiences');
  await expect(page).toHaveURL(/\/en\/experiences/);

  // Search for guide
  await page.fill('input[type="search"]', 'beach');
  await page.waitForTimeout(500); // Debounce

  // Click guide
  await page.click('text=Arienzo Beach');
  await expect(page).toHaveURL(/\/en\/experiences\/arienzo-beach/);

  // Verify content loaded
  await expect(page.locator('h1')).toContainText('Arienzo');
  await expect(page.locator('main')).toContainText('beach');

  // Check images loaded
  const images = page.locator('main img');
  expect(await images.count()).toBeGreaterThan(0);
});
```

**Test 10.1.2: Language Switching**
```typescript
// User switches languages
test('user switches between languages', async ({ page }) => {
  // Start in English
  await page.goto('/en');

  // Open language menu
  await page.click('[aria-label="Language menu"]');

  // Switch to Spanish
  await page.click('text=Español');
  await expect(page).toHaveURL(/\/es/);

  // Verify content in Spanish
  await expect(page.locator('h1')).not.toContainText('Book Direct');

  // Switch to Arabic
  await page.click('[aria-label="Language menu"]');
  await page.click('text=العربية');
  await expect(page).toHaveURL(/\/ar/);

  // Verify RTL
  const dir = await page.locator('html').getAttribute('dir');
  expect(dir).toBe('rtl');
});
```

**Test 10.1.3: Responsive Behavior**
```typescript
// Test mobile vs desktop
test('responsive layout works correctly', async ({ page }) => {
  // Desktop
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/en');

  const desktopNav = page.locator('nav');
  await expect(desktopNav).toBeVisible();

  // Mobile
  await page.setViewportSize({ width: 375, height: 667 });

  // Mobile menu should appear
  const mobileMenuButton = page.locator('[aria-label="Mobile menu"]');
  await expect(mobileMenuButton).toBeVisible();

  // Open mobile menu
  await mobileMenuButton.click();
  await expect(page.locator('nav')).toBeVisible();
});
```

---

### 10.2 Error Scenarios

**Test 10.2.1: 404 Handling**
```typescript
// Test invalid URLs
test('404 page displays correctly', async ({ page }) => {
  const response = await page.goto('/en/nonexistent-page');
  expect(response.status()).toBe(404);

  // Verify 404 content
  await expect(page.locator('h1')).toContainText('Not Found');
  await expect(page.locator('a[href="/en"]')).toBeVisible();
});
```

**Test 10.2.2: Network Errors**
```typescript
// Test offline behavior
test('graceful degradation on network error', async ({ page }) => {
  // Simulate offline
  await page.route('**/*', route => route.abort());

  await page.goto('/en');

  // Should show error state
  await expect(page.locator('text=network error')).toBeVisible();
});
```

---

### 10.3 Acceptance Criteria

- [ ] All critical user journeys pass
- [ ] Language switching works correctly
- [ ] Responsive behavior works on all viewports
- [ ] Error scenarios handled gracefully
- [ ] 404 pages display correctly
- [ ] Network errors don't crash app
- [ ] All E2E tests pass in CI
- [ ] Tests run on every PR

---

## Test Execution Schedule

### Daily (Automated)
- Unit tests on every commit
- Type checking on every commit
- Linting on every commit

### Per PR (Automated)
- Full unit test suite
- E2E critical paths
- Lighthouse CI
- Bundle size check
- Security audit (if dependencies changed)
- Accessibility audit (Axe)

### Weekly (Automated)
- Full E2E suite
- Performance benchmarks
- Security dependency scan
- Bundle analysis

### Monthly (Manual)
- Comprehensive accessibility audit
- Cross-browser testing
- RTL language review
- Screen reader testing
- Load testing
- Security penetration testing

### Quarterly (Manual)
- Full WCAG 2.1 compliance audit
- User acceptance testing
- Translation quality review
- Performance optimization review

---

## Test Environment Requirements

### Local Development
- Node.js 20+
- pnpm 10+
- Chrome/Firefox/Safari
- VoiceOver (macOS) or NVDA (Windows)
- Docker (for load testing)

### CI/CD
- GitHub Actions runners
- Playwright browsers
- Lighthouse CI
- Security scanning tools

### Tools & Libraries
- **Unit Testing:** Vitest
- **E2E Testing:** Playwright
- **Visual Testing:** Playwright Screenshots
- **Accessibility:** Axe, pa11y
- **Performance:** Lighthouse CI, bundlesize
- **Security:** pnpm audit, Snyk (optional)
- **Load Testing:** k6 or Artillery

---

## Success Metrics

### Test Coverage
- Unit test coverage: > 85%
- E2E coverage: Critical paths 100%
- Type coverage: > 95%

### Quality Gates
- 0 TypeScript errors
- 0 ESLint errors
- 0 critical security vulnerabilities
- Lighthouse performance score > 85
- Lighthouse accessibility score > 90
- Bundle sizes within limits

### Performance Targets
- FCP < 1.5s
- LCP < 2.5s
- CLS < 0.1
- TBT < 300ms
- Test execution time < 5 min (unit)
- E2E execution time < 15 min

---

## Reporting

### Test Reports Generated
- Unit test coverage reports
- E2E test results with screenshots
- Lighthouse CI reports
- Bundle size reports
- Security audit reports
- Accessibility audit reports

### Report Locations
- Coverage: `apps/brikette/coverage/`
- E2E: `apps/brikette/test-results/`
- Lighthouse: GitHub Actions artifacts
- Security: `apps/brikette/SECURITY-AUDIT.md`

---

**Document prepared:** 2026-01-12
**Last updated:** 2026-01-12
**Status:** Ready for Review

For questions or feedback, contact the engineering team.
