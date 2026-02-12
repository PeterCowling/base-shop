// i18n-exempt file -- PRIME-241 [ttl=2026-12-31]
// E2E assertions intentionally use literal UI copy to verify guest-visible text.
import { installPrimeApiMocks, PRIME_E2E_GUEST, setPrimeGuestSession } from '../support/prime-mocks';

describe('Prime expired-token recovery', () => {
  it('TC-03: expired token clears session storage and redirects to find-my-stay', () => {
    installPrimeApiMocks('pre-arrival');

    cy.visit('/');
    setPrimeGuestSession({ token: 'expired-token-e2e' });

    cy.visit('/portal/');

    cy.url({ timeout: 20000 }).should('include', '/find-my-stay');
    cy.contains('Find My Stay').should('be.visible');

    cy.window().then((win) => {
      expect(win.localStorage.getItem('prime_guest_token')).to.equal(null);
      expect(win.localStorage.getItem('prime_guest_booking_id')).to.equal(null);
      expect(win.localStorage.getItem('prime_guest_uuid')).to.equal(null);
      expect(win.localStorage.getItem('prime_guest_first_name')).to.equal(null);
      expect(win.localStorage.getItem('prime_guest_verified_at')).to.equal(null);
    });
  });
});
