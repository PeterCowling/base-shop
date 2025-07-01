import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3006",
    supportFile: false,
    specPattern: "test/e2e/**/*.spec.ts",
  },
});
