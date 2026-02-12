/// <reference types="cypress" />

Cypress.on('uncaught:exception', () => {
  return true;
});

export {};
