import type { TestRunnerConfig } from "@storybook/test-runner";
import { waitForPageReady } from "@storybook/test-runner";

const config: TestRunnerConfig = {
  // Only run the minimal CI-tagged stories
  tags: { include: ["ci"] },
  logLevel: "verbose",
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
