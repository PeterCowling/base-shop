// Cypress Component Testing support for React components
// - Adds testing-library commands
// - Registers a global `cy.mount` command

import '@testing-library/cypress/add-commands';
import { mount } from 'cypress/react';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Mount a React component for Component Testing */
      mount: typeof mount;
    }
  }
}

Cypress.Commands.add('mount', mount);

export {};

