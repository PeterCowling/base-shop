import '@testing-library/cypress/add-commands';
import React from 'react';
import ReactDOM from 'react-dom/client';

describe('CheckoutForm accessibility', () => {
  it('focuses first invalid field and announces errors', () => {
    cy.visit('about:blank').then(async (win) => {
      const shared = await import('../../packages/shared-utils/src');
      cy.stub(shared, 'fetchJson').resolves({ clientSecret: 'cs' });

      const stripeJs = await import('@stripe/stripe-js');
      cy.stub(stripeJs, 'loadStripe').resolves({});

      const stripeReact = await import('@stripe/react-stripe-js');
      cy.stub(stripeReact, 'Elements').callsFake(({ children }) => <div>{children}</div>);
      cy.stub(stripeReact, 'PaymentElement').callsFake(() => <div id="payment-element">payment-element</div>);
      cy.stub(stripeReact, 'useStripe').returns(() => ({} as any));
      cy.stub(stripeReact, 'useElements').returns(() => ({} as any));

      const { default: CheckoutForm } = await import('../../packages/ui/src/components/checkout/CheckoutForm');
      ReactDOM.createRoot(win.document.body).render(
        React.createElement(CheckoutForm, { locale: 'en', taxRegion: 'eu' })
      );
    });

    cy.findByRole('button', { name: 'checkout.pay' });
    cy.injectAxe();

    cy.findByLabelText('checkout.return').clear();
    cy.findByRole('button', { name: 'checkout.pay' }).click();
    cy.focused().should('have.attr', 'name', 'returnDate');
    cy.findByText('checkout.returnDateRequired').should('have.attr', 'role', 'alert');
    cy.findByLabelText('checkout.return').should('have.attr', 'aria-invalid', 'true');

    cy.checkA11y(undefined, undefined, undefined, true);
  });
});
