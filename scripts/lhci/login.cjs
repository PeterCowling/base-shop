// File: scripts/lhci/login.cjs
/**
 * Puppeteer script invoked by LHCI before each URL set.
 * It authenticates once and preserves cookies/storage for subsequent runs.
 *
 * Required env vars (configure in CI):
 *   LHCI_USERNAME
 *   LHCI_PASSWORD
 */
module.exports = async (browser /*, context */) => {
  const page = await browser.newPage();
  const base = process.env.LHCI_BASE_URL || 'http://localhost:3006';
  const loginUrl = `${base}/login`;

  await page.goto(loginUrl, { waitUntil: 'networkidle2' });

  // Basic username/password flow — adjust selectors if your login form differs.
  await page.type('#username', process.env.LHCI_USERNAME || '', { delay: 10 });
  await page.type('#password', process.env.LHCI_PASSWORD || '', { delay: 10 });
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ]);

  // Verify we reached an authenticated page before closing the tab.
  if (!page.url().includes('/dashboard')) {
    throw new Error(`Login did not reach /dashboard. Current URL: ${page.url()}`);
  }

  // Optional: warm cache by visiting the dashboard once more
  // await page.goto(`${base}/dashboard`, { waitUntil: 'networkidle2' });

  await page.close();
};

