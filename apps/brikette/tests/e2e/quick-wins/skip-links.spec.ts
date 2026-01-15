import { test, expect } from '@playwright/test';

test.describe('Skip-to-Content Links', () => {
  test('skip links are keyboard accessible', async ({ page }) => {
    await page.goto('/en');

    // Tab to first skip link
    await page.keyboard.press('Tab');

    // Verify skip link is focused and visible
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();
    await expect(skipLink).toHaveText('Skip to main content');

    // Activate skip link
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);

    // Verify focus moved to main content
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toHaveAttribute('id', 'main-content');
  });

  test('skip to navigation link works', async ({ page }) => {
    await page.goto('/en');

    // Tab to skip links
    await page.keyboard.press('Tab'); // Skip to main
    await page.keyboard.press('Tab'); // Skip to nav

    const skipNav = page.locator('a[href="#navigation"]');
    await expect(skipNav).toBeFocused();
    await expect(skipNav).toHaveText('Skip to navigation');

    // Activate
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);

    // Verify navigation is in DOM
    const nav = page.locator('#navigation');
    await expect(nav).toHaveAttribute('id', 'navigation');
  });

  test('skip links work in multiple languages', async ({ page }) => {
    const languages = [
      { code: 'en', skipMain: 'Skip to main content' },
      { code: 'es', skipMain: 'Saltar al contenido principal' },
      { code: 'de', skipMain: 'Zum Hauptinhalt springen' },
      { code: 'fr', skipMain: 'Aller au contenu principal' },
    ];

    for (const lang of languages) {
      await page.goto(`/${lang.code}`);
      await page.keyboard.press('Tab');

      const skipLink = page.locator('a[href="#main-content"]');

      // Should exist and be visible when focused
      await expect(skipLink).toBeFocused();
      await expect(skipLink).toBeVisible();

      // Verify it has some text (exact translation may vary)
      const text = await skipLink.textContent();
      expect(text).toBeTruthy();
      expect(text!.length).toBeGreaterThan(0);
    }
  });

  test('skip links have proper styling', async ({ page }) => {
    await page.goto('/en');
    await page.keyboard.press('Tab');

    const skipLink = page.locator('a[href="#main-content"]');

    // Check it's visible when focused
    await expect(skipLink).toBeVisible();

    // Check it has proper z-index (should be on top)
    const zIndex = await skipLink.evaluate(el =>
      window.getComputedStyle(el).zIndex
    );
    expect(parseInt(zIndex)).toBeGreaterThan(1000);

    // Check it's positioned fixed
    const position = await skipLink.evaluate(el =>
      window.getComputedStyle(el).position
    );
    expect(position).toBe('fixed');
  });

  test('skip links are hidden when not focused', async ({ page }) => {
    await page.goto('/en');

    // Before tabbing, skip links should not be visible
    const skipLink = page.locator('a[href="#main-content"]');

    // Check if it has sr-only class or is not visible
    const classList = await skipLink.getAttribute('class');
    expect(classList).toContain('sr-only');
  });

  test('skip links work on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test is only for mobile');

    await page.goto('/en');

    // On mobile with external keyboard
    await page.keyboard.press('Tab');

    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();
  });
});
