import '@testing-library/cypress/add-commands';
import 'cypress-plugin-tab';

describe('Checkout flow accessibility', { tags: ['a11y'] }, () => {
  beforeEach(() => {
    cy.intercept('POST', '**/api/checkout-session', {
      statusCode: 200,
      body: { clientSecret: 'cs_test', sessionId: 'sess_test' },
    }).as('createSession');

    // Seed cart with an item so checkout page renders form
    cy.request('POST', '/api/cart', {
      sku: { id: 'green-sneaker' },
      qty: 1,
      size: '42',
    });
  });

  it('ensures accessible checkout experience', () => {
    cy.visit('/en/checkout');
    cy.wait('@createSession');
    cy.injectAxe();
    cy.checkA11y();

    // Every input has an associated label
    cy.findByLabelText('Return date').should('exist');

    // Trigger validation and ensure errors are announced
    cy.findByLabelText('Return date').clear();
    cy.findByRole('button', { name: 'Pay' }).click();
    cy.findByRole('alert').should('exist');
    cy.findByLabelText('Return date').should('have.attr', 'aria-invalid', 'true');

    // Sequential tab order and order summary reachability
    cy.findByLabelText('Return date').focus();
    cy.tab();
    cy.tab();
    cy.focused().should('have.attr', 'type', 'submit');
    cy.findByRole('table').should('exist');

    // Navigation menu/stepper accessibility
    cy.findAllByRole('navigation').each(($nav) => {
      cy.wrap($nav).should('have.attr', 'aria-label');
    });
    cy.tab();
    cy.focused().should('have.attr', 'href');
    cy.focused().type('{enter}');
    cy.location('pathname').should('not.eq', '/en/checkout');
  });
});
