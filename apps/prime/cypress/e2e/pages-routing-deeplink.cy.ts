import { installPrimeApiMocks, PRIME_E2E_GUEST, setPrimeGuestSession } from '../support/prime-mocks';

describe('Prime Cloudflare Pages routing + deep-link verification', () => {
  it('TC-01: /g/<token> redirects to /g/?token=... handoff', () => {
    installPrimeApiMocks('pre-arrival');

    cy.request({
      url: `/g/${PRIME_E2E_GUEST.token}`,
      followRedirect: false,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(302);
      expect(response.headers.location).to.include(`/g/?token=${PRIME_E2E_GUEST.token}`);
    });

    cy.visit(`/g/${PRIME_E2E_GUEST.token}`);
    cy.url().should('include', `/g/?token=${PRIME_E2E_GUEST.token}`);
    cy.contains('Confirm your stay').should('be.visible');
  });

  it('TC-02: hard refresh on guarded route keeps guest in deterministic valid state', () => {
    installPrimeApiMocks('arrival-day');

    cy.visit('/');
    setPrimeGuestSession();
    cy.visit(`/?uuid=${PRIME_E2E_GUEST.uuid}`);

    cy.contains('button', PRIME_E2E_GUEST.checkInCode, { timeout: 20000 }).should('be.visible');

    cy.reload();

    cy.url().should('include', `uuid=${PRIME_E2E_GUEST.uuid}`);
    cy.contains('button', PRIME_E2E_GUEST.checkInCode, { timeout: 20000 }).should('be.visible');
  });

  it('TC-03: invalid token recovery state renders explicit find-my-stay CTA', () => {
    installPrimeApiMocks('pre-arrival');

    cy.visit('/g/?token=invalid-token-e2e');

    cy.contains('Link problem').should('be.visible');
    cy.contains('a', 'Find my stay').should('be.visible');
  });
});
