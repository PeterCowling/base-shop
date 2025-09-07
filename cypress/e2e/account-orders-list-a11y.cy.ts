import '@testing-library/cypress/add-commands';
import 'cypress-plugin-tab';
import React from 'react';
import ReactDOM from 'react-dom/client';

describe('Account orders list semantics', () => {
  it('renders as a list with focusable items and has no a11y violations', () => {
    cy.visit('about:blank').then(async (win) => {
      const auth = await import('../../packages/auth/src');
      cy.stub(auth, 'getCustomerSession').resolves({ customerId: 'cust1', role: 'customer' });
      cy.stub(auth, 'hasPermission').returns(true);

      const ordersRepo = await import('../../packages/platform-core/src/orders');
      cy.stub(ordersRepo, 'getOrdersForCustomer').resolves([
        { id: 'ord_1', trackingNumber: null, sessionId: 's1', expectedReturnDate: null },
        { id: 'ord_2', trackingNumber: null, sessionId: 's2', expectedReturnDate: null },
      ]);

      const { default: OrdersPage } = await import('../../packages/ui/src/components/account/Orders');
      ReactDOM.createRoot(win.document.body).render(
        React.createElement(OrdersPage, { shopId: 'shop1', trackingEnabled: false })
      );
    });

    cy.findByRole('list');
    cy.findAllByRole('listitem').should('have.length', 2).invoke('attr', 'tabindex', '0');

    cy.findAllByRole('listitem').eq(0).focus();
    cy.focused().should('contain.text', 'ord_1');
    cy.tab();
    cy.focused().should('contain.text', 'ord_2');

    cy.injectAxe();
    cy.checkA11y();
  });
});
