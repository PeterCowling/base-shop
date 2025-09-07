import '@testing-library/cypress/add-commands';
import 'cypress-plugin-tab';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Header } from '../../packages/ui/src/components/organisms/Header';

describe('Navigation accessibility', () => {
  it('allows sequential focus and passes basic a11y checks', () => {
    const nav = [
      { title: 'Home', href: '#home' },
      { title: 'Products', href: '#products' },
      { title: 'Contact', href: '#contact' },
    ];

    Cypress.Commands.overwrite('visit', (orig, url, options) =>
      orig(url, options)
    );

    cy.visit('/').then((win) => {
      ReactDOM.createRoot(win.document.body).render(
        React.createElement(Header, { locale: 'en', nav, logo: 'Logo' })
      );
    });

    cy.injectAxe();

    cy.get('nav').should('have.attr', 'aria-label');

    cy.get('body').tab();
    cy.focused().should('have.attr', 'href', '/');
    cy.tab();
    cy.focused().should('have.attr', 'href', '#home');
    cy.tab();
    cy.focused().should('have.attr', 'href', '#products');
    cy.tab();
    cy.focused().should('have.attr', 'href', '#contact');

    cy.get('nav').then(($nav) => {
      const ids = $nav.find('[id]').toArray().map((el) => el.id);
      expect(new Set(ids).size).to.eq(ids.length);
    });

    cy.checkA11y(undefined, undefined, undefined, true);
  });
});
