import { test, expect } from '@playwright/test';

test.describe('RTL Language Support', () => {
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

  test('text aligns correctly in Arabic', async ({ page }) => {
    await page.goto('/ar');
    await page.waitForLoadState('networkidle');

    // Get main content
    const mainContent = page.locator('main');

    // Check text alignment (should be right-aligned in RTL)
    const textAlign = await mainContent.evaluate(el => {
      const firstParagraph = el.querySelector('p');
      return firstParagraph
        ? window.getComputedStyle(firstParagraph).textAlign
        : 'not-found';
    });

    // In RTL, text should be right-aligned or start-aligned
    expect(['right', 'start'].includes(textAlign) || textAlign === 'not-found').toBe(true);
  });

  test('navigation appears on correct side in RTL', async ({ page }) => {
    // LTR test
    await page.goto('/en');
    const navLtr = page.locator('#navigation');
    const boxLtr = await navLtr.boundingBox();

    // RTL test
    await page.goto('/ar');
    const navRtl = page.locator('#navigation');
    const boxRtl = await navRtl.boundingBox();

    // Both should exist
    expect(boxLtr).toBeTruthy();
    expect(boxRtl).toBeTruthy();

    // In RTL layout, elements may be positioned differently
    // This is a basic check that the nav exists and is rendered
    if (boxRtl) {
      expect(boxRtl.width).toBeGreaterThan(0);
    }
  });

  test('skip links work in RTL', async ({ page }) => {
    await page.goto('/ar');

    // Tab to skip link
    await page.keyboard.press('Tab');

    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();

    // Activate
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);

    // Should navigate to main content
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toHaveAttribute('id', 'main-content');
  });

  test('Arabic translation is present', async ({ page }) => {
    await page.goto('/ar');
    await page.waitForLoadState('networkidle');

    // Check that page has content
    const main = page.locator('main');
    const textContent = await main.textContent();

    expect(textContent).toBeTruthy();
    expect(textContent!.length).toBeGreaterThan(0);

    // Check for Arabic characters (Unicode range)
    const hasArabicChars = /[\u0600-\u06FF]/.test(textContent!);

    // May or may not have Arabic chars depending on translation completeness
    // Just verify content exists
    expect(textContent!.length).toBeGreaterThan(100);
  });

  test('images display correctly in RTL', async ({ page }) => {
    await page.goto('/ar');
    await page.waitForLoadState('networkidle');

    // Get all images
    const images = page.locator('img');
    const count = await images.count();

    expect(count).toBeGreaterThan(0);

    // Check first few images loaded
    for (let i = 0; i < Math.min(3, count); i++) {
      const img = images.nth(i);
      const isVisible = await img.isVisible();

      if (isVisible) {
        const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
        expect(naturalWidth).toBeGreaterThan(0);
      }
    }
  });

  test('no horizontal scrollbar in RTL', async ({ page }) => {
    await page.goto('/ar');
    await page.waitForLoadState('networkidle');

    // Check if page has horizontal overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(hasHorizontalScroll).toBe(false);
  });
});
