import '@testing-library/cypress/add-commands';
import 'cypress-plugin-tab';
import React from 'react';
import ReactDOM from 'react-dom/client';

describe('Account sessions list semantics', () => {
  it('renders as a list with focusable items and has no a11y violations', () => {
    cy.visit('about:blank').then(async (win) => {
      const auth = await import('../../packages/auth/src');
      cy.stub(auth, 'getCustomerSession').resolves({ customerId: 'cust1', role: 'customer' });
      cy.stub(auth, 'hasPermission').returns(true);
      cy.stub(auth, 'listSessions').resolves([
        { sessionId: 's1', userAgent: 'ua1', createdAt: new Date() },
        { sessionId: 's2', userAgent: 'ua2', createdAt: new Date() },
      ]);

      const actions = await import('../../packages/ui/src/actions/revokeSession');
      cy.stub(actions, 'revoke').resolves({ success: true });

      const { default: SessionsPage } = await import('../../packages/ui/src/components/account/Sessions');
      ReactDOM.createRoot(win.document.body).render(
        React.createElement(SessionsPage)
      );
    });

    cy.findByRole('list');
    cy.findAllByRole('listitem').should('have.length', 2).invoke('attr', 'tabindex', '0');

    cy.findAllByRole('listitem').eq(0).focus();
    cy.focused().should('contain.text', 'ua1');
    cy.tab();
    cy.focused().should('contain.text', 'ua2');

    cy.injectAxe();
    cy.checkA11y();
  });
});
