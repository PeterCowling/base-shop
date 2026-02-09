import { installPrimeApiMocks, PRIME_E2E_GUEST, setPrimeGuestSession } from '../support/prime-mocks';

describe('Prime arrival-day journey', () => {
  it('TC-02: arrival-day guest sees QR/code-first mode and can copy check-in code', () => {
    installPrimeApiMocks('arrival-day');

    cy.visit('/');
    setPrimeGuestSession();

    cy.visit(`/?uuid=${PRIME_E2E_GUEST.uuid}`);

    cy.contains('button', PRIME_E2E_GUEST.checkInCode, { timeout: 20000 }).should('be.visible');
    cy.get('img[src^="data:image/png"]', { timeout: 20000 }).should('be.visible');

    cy.window().then((win) => {
      if (!win.navigator.clipboard) {
        Object.defineProperty(win.navigator, 'clipboard', {
          configurable: true,
          value: {
            writeText: () => Promise.resolve(),
          },
        });
      }

      cy.stub(win.navigator.clipboard, 'writeText').as('writeText').resolves();
    });

    cy.contains('button', PRIME_E2E_GUEST.checkInCode).click();
    cy.get('@writeText').should('have.been.calledWith', PRIME_E2E_GUEST.checkInCode);
    cy.url().should('include', `uuid=${PRIME_E2E_GUEST.uuid}`);
  });
});
