// cypress/support/index.ts

import "cypress-axe";
// Enable Mock Service Worker for API mocking in Cypress tests
import { server } from "~test/msw/server";

// Prevent tests from failing on uncaught exceptions originating from the app
Cypress.on("uncaught:exception", (_err, _runnable) => {
  // returning false here prevents Cypress from failing the test
  return false;
});

before(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
after(() => server.close());

// You can add custom Cypress commands here if needed.
// e.g., Cypress.Commands.add("login", (email, password) => { ... });
