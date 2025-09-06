// cypress.config.ts
import { defineConfig } from "cypress";

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
      TEST_DATA_ROOT: process.env.TEST_DATA_ROOT || "test/data/shops"
    },
    defaultCommandTimeout: 10000
  }
});
