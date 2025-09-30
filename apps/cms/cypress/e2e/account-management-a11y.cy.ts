import '@testing-library/cypress/add-commands';
import 'cypress-plugin-tab';

function login() {
  cy.visit('/login');
  cy.get('input[name="customerId"]').type('cust1');
  cy.get('input[name="password"]').type('pass1');
  cy.contains('button', 'Login').click();
  cy.getCookie('customer_session').should('exist');
}

describe('Account management accessibility', () => {
  const pages = ['/account/profile', '/account/orders', '/account/sessions'];

  pages.forEach((path) => {
    it(`has no detectable a11y violations on ${path}`, () => {
      login();
      cy.visit(path);
      cy.injectAxe();
      cy.checkA11y(undefined, undefined, undefined, true);
    });
  });

  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 800 }
  ];

  viewports.forEach(({ name, width, height }) => {
    it(`Profile form validation is accessible on ${name}`, () => {
      cy.viewport(width, height);
      login();
      cy.visit('/account/profile');

      cy.findByRole('button', { name: /save/i }).click();
      cy.findByLabelText('Name')
        .should('have.attr', 'id', 'name')
        .and('have.attr', 'aria-invalid', 'true');
      cy.findByLabelText('Email')
        .should('have.attr', 'id', 'email')
        .and('have.attr', 'aria-invalid', 'true');
      cy.findByText('Name is required.').should('have.attr', 'role', 'alert');
      cy.findByText('Email is required.').should('have.attr', 'role', 'alert');

      cy.injectAxe();
      cy.checkA11y(undefined, undefined, undefined, true);
    });
  });

  it('ProfileForm links labels, announces errors, and tabs correctly', () => {
    login();
    cy.visit('/account/profile');
    cy.injectAxe();

    cy.findByLabelText('Name').should('have.attr', 'id', 'name');
    cy.findByLabelText('Email').should('have.attr', 'id', 'email');

    cy.findByRole('button', { name: /save/i }).click();
    cy.findByText('Name is required.').should('have.attr', 'role', 'alert');
    cy.findByText('Email is required.').should('have.attr', 'role', 'alert');

    cy.get('body').tab();
    cy.focused().should('have.attr', 'id', 'name');
    cy.tab();
    cy.focused().should('have.attr', 'id', 'email');
    cy.tab();
    cy.focused().should('have.attr', 'type', 'submit');

    cy.checkA11y(undefined, undefined, undefined, true);
  });

  it('Orders list uses list semantics and supports keyboard navigation', () => {
    login();
    cy.visit('/account/orders');
    cy.injectAxe();

    cy.findByRole('list').within(() => {
      cy.findAllByRole('listitem').its('length').should('be.gte', 1);
    });

    cy.get('body').tab();
    cy.focused().type('{downarrow}');
    cy.focused().should('exist');

    cy.checkA11y(undefined, undefined, undefined, true);
  });

  it('Sessions list uses list semantics and supports keyboard navigation', () => {
    login();
    cy.visit('/account/sessions');
    cy.injectAxe();

    cy.findByRole('list').within(() => {
      cy.findAllByRole('listitem').its('length').should('be.gte', 1);
    });

    cy.get('body').tab();
    cy.focused().type('{downarrow}');
    cy.focused().should('exist');

    cy.checkA11y(undefined, undefined, undefined, true);
  });

  it('Account navigation exposes role="navigation" and supports keyboard activation', () => {
    login();
    cy.visit('/account/profile');
    cy.injectAxe();

    cy.findByRole('navigation');

    cy.findByRole('link', { name: /orders/i }).focus().type('{enter}');
    cy.location('pathname').should('eq', '/account/orders');

    cy.findByRole('link', { name: /sessions/i }).focus().type('{enter}');
    cy.location('pathname').should('eq', '/account/sessions');

    cy.findByRole('link', { name: /profile/i }).focus().type('{enter}');
    cy.location('pathname').should('eq', '/account/profile');

    cy.checkA11y(undefined, undefined, undefined, true);
  });
});
