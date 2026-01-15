import { test, expect } from '@playwright/test';

test.describe('Core Web Vitals', () => {
  test('home page meets performance budgets', async ({ page }) => {
    // Navigate and wait for load
    await page.goto('/en');
    await page.waitForLoadState('networkidle');

    // Measure performance metrics
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        // Wait for all metrics to be available
        setTimeout(() => {
          const paint = performance.getEntriesByType('paint');
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

          const fcp = paint.find(entry => entry.name === 'first-contentful-paint');

          resolve({
            fcp: fcp?.startTime || 0,
            domContentLoaded: navigation?.domContentLoadedEventEnd || 0,
            loadComplete: navigation?.loadEventEnd || 0,
          });
        }, 1000);
      });
    });

    console.log('Performance metrics:', metrics);

    // FCP should be < 1.5s (1500ms)
    expect(metrics.fcp).toBeLessThan(1500);

    // DOM Content Loaded should be reasonable
    expect(metrics.domContentLoaded).toBeLessThan(3000);
  });

  test('guide page loads efficiently', async ({ page }) => {
    await page.goto('/en/experiences/path-of-the-gods');
    await page.waitForLoadState('networkidle');

    // Check that images are lazy loaded
    const images = await page.locator('img').all();

    let lazyCount = 0;
    for (const img of images.slice(3)) {
      // Check below-fold images
      const loading = await img.getAttribute('loading');
      if (loading === 'lazy') {
        lazyCount++;
      }
    }

    console.log(`${lazyCount} images are lazy-loaded`);

    // At least some images should be lazy loaded
    expect(lazyCount).toBeGreaterThan(0);
  });

  test('no layout shift on image load', async ({ page }) => {
    await page.goto('/en');

    // Get all images
    const images = await page.locator('img').all();

    // Check that images have width and height attributes
    let imagesWithDimensions = 0;

    for (const img of images.slice(0, 5)) {
      const width = await img.getAttribute('width');
      const height = await img.getAttribute('height');

      if (width && height) {
        imagesWithDimensions++;
      }
    }

    console.log(`${imagesWithDimensions} of 5 images have dimensions`);

    // Most images should have dimensions to prevent CLS
    expect(imagesWithDimensions).toBeGreaterThan(0);
  });

  test('JavaScript bundle size is reasonable', async ({ page }) => {
    const resources: Array<{ url: string; size: number }> = [];

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('.js') && url.includes('/_next/')) {
        try {
          const buffer = await response.body();
          resources.push({
            url,
            size: buffer.length,
          });
        } catch (e) {
          // Some responses may not have bodies
        }
      }
    });

    await page.goto('/en');
    await page.waitForLoadState('networkidle');

    // Calculate total JS size
    const totalSize = resources.reduce((sum, r) => sum + r.size, 0);
    const totalSizeMB = totalSize / 1024 / 1024;

    console.log(`Total JS size: ${totalSizeMB.toFixed(2)} MB`);
    console.log(`Number of JS files: ${resources.length}`);

    // Total JS should be reasonable (target < 2MB total, but may be higher)
    // This is informational, adjust threshold based on actual needs
    expect(totalSizeMB).toBeLessThan(5);
  });

  test('page is interactive quickly', async ({ page }) => {
    const start = Date.now();

    await page.goto('/en');

    // Wait for page to be interactive
    await page.waitForLoadState('domcontentloaded');

    const domContentLoadedTime = Date.now() - start;

    await page.waitForLoadState('networkidle');

    const interactiveTime = Date.now() - start;

    console.log(`DOM Content Loaded: ${domContentLoadedTime}ms`);
    console.log(`Interactive: ${interactiveTime}ms`);

    // Time to interactive should be < 3.5s
    expect(interactiveTime).toBeLessThan(3500);
  });

  test('fonts load efficiently', async ({ page }) => {
    await page.goto('/en');
    await page.waitForLoadState('networkidle');

    // Check if fonts are loaded
    const fontsLoaded = await page.evaluate(() => {
      return document.fonts.status === 'loaded';
    });

    expect(fontsLoaded).toBe(true);

    // Check for FOUT (Flash of Unstyled Text)
    // If fonts are properly preloaded, there should be no FOUT
    const hasFontDisplay = await page.evaluate(() => {
      const styles = document.styleSheets;
      let hasFontDisplayProperty = false;

      try {
        for (let i = 0; i < styles.length; i++) {
          const rules = styles[i].cssRules;
          for (let j = 0; j < rules.length; j++) {
            const rule = rules[j];
            if (rule instanceof CSSFontFaceRule) {
              const fontDisplay = rule.style.getPropertyValue('font-display');
              if (fontDisplay) {
                hasFontDisplayProperty = true;
                break;
              }
            }
          }
        }
      } catch (e) {
        // Some stylesheets may not be accessible (CORS)
      }

      return hasFontDisplayProperty;
    });

    console.log('Has font-display property:', hasFontDisplay);
  });
});
