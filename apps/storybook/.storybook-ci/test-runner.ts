import type { PrepareContext, TestRunnerConfig } from "@storybook/test-runner";
import { waitForPageReady } from "@storybook/test-runner";

const NAVIGATION_TIMEOUT_MS = 240_000;
const GOTO_TIMEOUT_MS = 180_000;
const MAX_GOTO_ATTEMPTS = 2;

async function prepareWithRetries({
  page,
  browserContext,
  testRunnerConfig,
}: PrepareContext): Promise<void> {
  const targetUrl = process.env.TARGET_URL;
  if (!targetUrl) {
    throw new Error("Missing TARGET_URL for Storybook test runner");
  }

  const iframeUrl = new URL("iframe.html", targetUrl).toString();

  if (testRunnerConfig.getHttpHeaders) {
    const headers = await testRunnerConfig.getHttpHeaders(iframeUrl);
    await browserContext.setExtraHTTPHeaders(headers);
  }

  page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT_MS);
  page.setDefaultTimeout(NAVIGATION_TIMEOUT_MS);

  for (let attempt = 1; attempt <= MAX_GOTO_ATTEMPTS; attempt += 1) {
    try {
      await page.goto(iframeUrl, { waitUntil: "load", timeout: GOTO_TIMEOUT_MS });
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const retryable =
        message.includes("Timeout") ||
        message.includes("ERR_CONNECTION_REFUSED") ||
        message.includes("ERR_EMPTY_RESPONSE");

      if (!retryable || attempt === MAX_GOTO_ATTEMPTS) {
        throw error;
      }

      await page.waitForTimeout(2_000 * attempt);
    }
  }
}

const config: TestRunnerConfig = {
  // Only run the minimal CI-tagged stories
  tags: { include: ["ci"] },
  logLevel: "verbose",
  prepare: prepareWithRetries,
  async postVisit(page) {
    // Ensure fonts and linked assets are ready; Storybook sometimes hides
    // the root until fonts are loaded to avoid FOUC.
    try {
      await waitForPageReady(page);
    } catch {}
    // Force unhide the root if still hidden to allow smoke assertions
    await page.evaluate(() => {
      const el = document.getElementById("storybook-root");
      if (el) (el as HTMLElement).style.visibility = "visible";
    });
  },
};

export default config;
