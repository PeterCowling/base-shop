/**
 * Cypress E2E support file for Business OS
 *
 * This file is processed and loaded automatically before test files.
 */

/// <reference types="cypress" />

// Custom commands
Cypress.Commands.add("log", (message: string) => {
  cy.task("log", message);
});

// Prevent Cypress from failing on uncaught exceptions from the app
Cypress.on("uncaught:exception", (err) => {
  // Return false to prevent failing the test
  // Adjust this if you want certain errors to fail tests
  if (err.message.includes("Hydration")) {
    // Known hydration issues can be ignored for now
    return false;
  }
  return true;
});

// Type augmentation
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to log messages to the console
       */
      log(message: string): void;
    }
  }
}

export {};
