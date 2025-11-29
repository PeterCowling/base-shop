// File: scripts/lhci/login.cjs
/**
 * Puppeteer script invoked by LHCI before each URL set.
 * It authenticates once and preserves cookies/storage for subsequent runs.
 *
 * Optional env vars (configure in CI when available):
 *   LHCI_USERNAME
 *   LHCI_PASSWORD
 *
 * If credentials or expected selectors are missing, this script logs a warning
 * and returns early so Lighthouse can still run against public pages.
 */
module.exports = async (browser /*, context */) => {
  const page = await browser.newPage();
  const base = process.env.LHCI_BASE_URL || 'http://localhost:3006';
  const loginUrl = `${base}/login`;

  await page.goto(loginUrl, { waitUntil: 'networkidle2' });

  const username = process.env.LHCI_USERNAME || '';
  const password = process.env.LHCI_PASSWORD || '';

  if (!username || !password) {
    // Missing credentials; treat login as optional and continue unauthenticated.
    // This allows Lighthouse to run against public pages or login screens.
    console.warn(
      '[lhci:login] LHCI_USERNAME/LHCI_PASSWORD not set; skipping auth step.',
    );
    await page.close();
    return;
  }

  // Try to locate the expected login fields; if the markup has changed,
  // log a warning and continue without failing the entire LHCI run.
  const usernameInput = await page.$('#username');
  const passwordInput = await page.$('#password');
  const submitButton = await page.$('button[type="submit"]');

  if (!usernameInput || !passwordInput || !submitButton) {
    console.warn(
      '[lhci:login] Could not find #username/#password/buttons on login page; skipping auth step. URL:',
      await page.url(),
    );
    await page.close();
    return;
  }

  await usernameInput.type(username, { delay: 10 });
  await passwordInput.type(password, { delay: 10 });
  await Promise.all([
    submitButton.click(),
    page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {}),
  ]);

  // Verify we reached an authenticated page before closing the tab.
  if (!page.url().includes('/dashboard')) {
    console.warn(
      `[lhci:login] Login did not reach /dashboard (current URL: ${page.url()}); continuing without stored session.`,
    );
    await page.close();
    return;
  }

  // Optional: warm cache by visiting the dashboard once more
  // await page.goto(`${base}/dashboard`, { waitUntil: 'networkidle2' });

  await page.close();
};
