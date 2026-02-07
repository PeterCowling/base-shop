import { installPrimeApiMocks, PRIME_E2E_GUEST } from '../support/prime-mocks';

describe('Prime guest primary journey', () => {
  it('TC-01: find-my-stay → /g/<token> verify → /portal → guest home succeeds without dead ends', () => {
    installPrimeApiMocks('pre-arrival');

    cy.visit('/find-my-stay/');

    cy.get('input#surname').type(PRIME_E2E_GUEST.lastName);
    cy.get('input#bookingRef').type(PRIME_E2E_GUEST.bookingRef);
    cy.contains('button', 'Find Booking').click();

    cy.wait('@findBooking');
    cy.url().should('include', `/g/?token=${PRIME_E2E_GUEST.token}`);
    cy.contains('Confirm your stay').should('be.visible');

    cy.get('input#lastName').type(PRIME_E2E_GUEST.lastName);
    cy.contains('button', 'Continue').click();

    cy.wait('@verifyGuestSession');
    cy.contains(`Welcome, ${PRIME_E2E_GUEST.firstName}`).should('be.visible');

    cy.window().then((win) => {
      win.localStorage.setItem(`prime_guided_onboarding_complete:${PRIME_E2E_GUEST.bookingId}`, '1');
    });

    cy.contains('a', 'Continue').click();

    cy.url().should('include', `uuid=${PRIME_E2E_GUEST.uuid}`);
    cy.contains('Unable to load your booking information.').should('not.exist');
  });
});
