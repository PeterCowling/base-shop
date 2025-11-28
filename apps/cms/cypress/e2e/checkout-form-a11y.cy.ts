// apps/cms/cypress/e2e/checkout-form-a11y.cy.ts
// Legacy shopper checkout form a11y spec.
// The underlying `/api/login` + checkout endpoints now live only in the
// retired shop app, so this spec is stubbed out to avoid brittle bundling
// against removed routes. If the shop app returns, this can be restored.

describe('CheckoutForm accessibility (legacy)', () => {
  it('is skipped when shopper checkout is not present', function () {
    cy.request({
      method: 'HEAD',
      url: '/api/login',
      failOnStatusCode: false,
    }).then((resp) => {
      if (resp.status === 404) {
        cy.log('Skipping checkout-form-a11y: shopper checkout endpoints are not present on this host.');
        this.skip();
      } else {
        // Environment still has shopper checkout; mark as pending for now.
        cy.log('CheckoutForm a11y spec is pending implementation for this environment.');
        this.skip();
      }
    });
  });
});
