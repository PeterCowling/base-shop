import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('WCAG 2.1 AA Compliance', () => {
  const pages = [
    { url: '/en', name: 'Home' },
    { url: '/en/experiences', name: 'Experiences' },
    { url: '/en/rooms', name: 'Rooms' },
    { url: '/en/deals', name: 'Deals' },
  ];

  for (const { url, name } of pages) {
    test(`${name} page passes WCAG 2.1 AA`, async ({ page }) => {
      await page.goto(url);
      await injectAxe(page);

      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: { html: true },
      });
    });
  }

  test('guide page passes WCAG 2.1 AA', async ({ page }) => {
    // Test a guide with various content types
    await page.goto('/en/experiences/path-of-the-gods');
    await page.waitForLoadState('networkidle');

    await injectAxe(page);
    await checkA11y(page, null, {
      detailedReport: true,
    });
  });

  test('specific accessibility rules pass', async ({ page }) => {
    await page.goto('/en');
    await injectAxe(page);

    // Check specific WCAG rules
    await checkA11y(page, null, {
      rules: {
        'bypass': { enabled: true }, // Skip links
        'color-contrast': { enabled: true }, // Color contrast
        'document-title': { enabled: true }, // Page title
        'html-has-lang': { enabled: true }, // Language attribute
        'image-alt': { enabled: true }, // Alt text
        'label': { enabled: true }, // Form labels
        'link-name': { enabled: true }, // Link text
        'aria-allowed-attr': { enabled: true }, // ARIA attributes
        'button-name': { enabled: true }, // Button labels
      },
    });
  });

  test('no accessibility violations in dark mode', async ({ page }) => {
    await page.goto('/en');

    // Enable dark mode
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
    });
    await page.reload();

    await injectAxe(page);
    await checkA11y(page);
  });
});
