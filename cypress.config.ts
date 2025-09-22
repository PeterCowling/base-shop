// cypress.config.ts
import { defineConfig } from "cypress";
import { cpSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import os from "node:os";

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || "http://localhost:3006",
    // Run both `.cy.ts` and `.spec.ts` test files
    specPattern: [
      "cypress/e2e/**/*.cy.{js,ts}",
      "test/e2e/**/*.spec.{js,ts}"
    ],
    // Load global support commands
    supportFile: "cypress/support/index.ts",
    // Expose NextAuth secret to Cypress and tests
    env: {
      NEXTAUTH_SECRET:
        process.env.NEXTAUTH_SECRET ||
        "test-nextauth-secret-32-chars-long-string!",
      TEST_DATA_ROOT: process.env.TEST_DATA_ROOT || "__tests__/data/shops"
    },
    defaultCommandTimeout: 10000,
    setupNodeEvents(on, config) {
      let tempDir: string | null = null;

      on("task", {
        /** Simple logger to surface values from browser context */
        log(message: unknown) {
          // eslint-disable-next-line no-console
          console.log(message);
          return null;
        },
        /**
         * Create a temporary TEST_DATA_ROOT and seed minimal fixtures.
         * @param shop shop identifier (e.g. "demo")
         */
        "testData:setup"(shop: string) {
          const root = mkdtempSync(join(os.tmpdir(), "cypress-data-"));
          const src = join("__tests__", "data", "shops", shop);
          const dest = join(root, shop);
          mkdirSync(dest, { recursive: true });
          ["pages.json", "settings.json"].forEach((file) => {
            cpSync(join(src, file), join(dest, file));
          });
          tempDir = root;
          return root;
        },

        /** Remove the temporary TEST_DATA_ROOT created for tests. */
        "testData:cleanup"() {
          if (tempDir) {
            rmSync(tempDir, { recursive: true, force: true });
            tempDir = null;
          }
          return null;
        }
      });

      return config;
    }
  }
});
