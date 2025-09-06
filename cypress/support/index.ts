/// <reference types="cypress" />

// Prevent tests from failing on uncaught exceptions originating from the app
Cypress.on("uncaught:exception", (_err, _runnable) => {
  // returning false here prevents Cypress from failing the test
  return false;
});

// You can add custom Cypress commands here if needed.
// e.g., Cypress.Commands.add("login", (email, password) => { ... });
