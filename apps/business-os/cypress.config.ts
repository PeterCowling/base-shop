import { defineConfig } from "cypress";
import path from "path";

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || "http://localhost:3020",
    specPattern: path.join(__dirname, "cypress/e2e/**/*.cy.{js,ts}"),
    supportFile: path.join(__dirname, "cypress/support/e2e.ts"),
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    retries: {
      runMode: 2,
      openMode: 0,
    },
    setupNodeEvents(on, config) {
      // Add task for logging
      on("task", {
        log(message) {
          console.log(message);
          return null;
        },
      });

      return config;
    },
  },
});
