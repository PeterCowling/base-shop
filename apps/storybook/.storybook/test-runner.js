const { getStoryContext } = require("@storybook/test-runner");
const { injectAxe, checkA11y, configureAxe } = require("axe-playwright");

/** @type {import('@storybook/test-runner').TestRunnerConfig} */
const config = {
  async preVisit(page) {
    await injectAxe(page);
  },
  async postVisit(page, context) {
    const storyContext = await getStoryContext(page, context);
    if (storyContext.parameters?.a11y?.disable) {
      return;
    }
    await configureAxe(page, {
      rules: storyContext.parameters?.a11y?.config?.rules,
    });
    await checkA11y(page, "#storybook-root", {
      detailedReport: true,
      detailedReportOptions: { html: true },
      axeOptions: storyContext.parameters?.a11y?.options,
    });
  },
};

module.exports = config;
