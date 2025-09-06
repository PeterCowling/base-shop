import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || "http://localhost:3006",
    supportFile: "cypress/support/index.ts",
    specPattern: "cypress/e2e/**/*.cy.ts",
  },
});
