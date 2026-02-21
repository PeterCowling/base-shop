// i18n-exempt file -- PRIME-241 [ttl=2026-12-31]
// E2E assertions intentionally use literal UI copy to verify guest-visible text.
import { installPrimeApiMocks, PRIME_E2E_GUEST, setPrimeGuestSession } from '../support/prime-mocks';

describe('Guided onboarding flow', () => {
  beforeEach(() => {
    installPrimeApiMocks('pre-arrival');

    // Intercept Firebase RTDB writes for preArrival data
    cy.intercept('PUT', '**/preArrival/**', { statusCode: 200, body: { status: 'ok' } }).as('firebaseWrite');
    cy.intercept('PATCH', '**/preArrival/**', { statusCode: 200, body: { status: 'ok' } }).as('firebasePatch');
  });

  it('TC-01: guest enters verified portal → GuidedOnboardingFlow renders', () => {
    setPrimeGuestSession();
    cy.visit('/portal');

    cy.wait('@validateGuestSession');

    // Onboarding flow renders (not the "Portal unavailable" message)
    cy.contains('Portal unavailable').should('not.exist');
    // Step 1 content is visible — the arrival method fieldset
    cy.contains('How are you most likely arriving?').should('be.visible');
  });

  it('TC-02: select arrival method + confidence on Step 1, save → advances to Step 2', () => {
    setPrimeGuestSession();
    cy.visit('/portal');
    cy.wait('@validateGuestSession');

    // Step 1 is visible
    cy.contains('How are you most likely arriving?').should('be.visible');

    // Select "Ferry" arrival method
    cy.contains('button', 'Ferry').click();

    // Select "Confident"
    cy.contains('button', 'Confident').click();

    // Click "Save and continue"
    cy.contains('button', 'Save and continue').click();

    // Should advance to Step 2 — "Share your ETA" heading
    cy.contains('Share your ETA').should('be.visible');
  });

  it('TC-03: skip Step 2 → advances to Step 3 without saving ETA', () => {
    setPrimeGuestSession();
    cy.visit('/portal');
    cy.wait('@validateGuestSession');

    // Advance past Step 1
    cy.contains('button', 'Ferry').click();
    cy.contains('button', 'Confident').click();
    cy.contains('button', 'Save and continue').click();
    cy.contains('Share your ETA').should('be.visible');

    // Skip Step 2
    cy.contains('button', 'Skip for now').click();

    // Should advance to Step 3 — "Final checks" heading
    cy.contains('Final checks').should('be.visible');
  });

  it('TC-04: check cash + rules on Step 3, finish → redirects to guest home', () => {
    setPrimeGuestSession();
    cy.visit('/portal');
    cy.wait('@validateGuestSession');

    // Step 1 → save
    cy.contains('button', 'Ferry').click();
    cy.contains('button', 'Confident').click();
    cy.contains('button', 'Save and continue').click();
    cy.contains('Share your ETA').should('be.visible');

    // Step 2 → skip
    cy.contains('button', 'Skip for now').click();
    cy.contains('Final checks').should('be.visible');

    // Step 3 — check cash + rules
    cy.contains('Cash for check-in').click();
    cy.contains('House rules').click();

    // Click Finish
    cy.contains('button', 'Finish').click();

    // Should redirect to guest home with uuid in URL
    cy.url().should('include', `uuid=${PRIME_E2E_GUEST.uuid}`);
  });

  it('TC-05: after completion → localStorage completion key is set', () => {
    setPrimeGuestSession();
    cy.visit('/portal');
    cy.wait('@validateGuestSession');

    // Fast-path through all steps
    cy.contains('button', 'Ferry').click();
    cy.contains('button', 'Confident').click();
    cy.contains('button', 'Save and continue').click();
    cy.contains('Share your ETA').should('be.visible');

    cy.contains('button', 'Skip for now').click();
    cy.contains('Final checks').should('be.visible');

    cy.contains('button', 'Finish').click();

    // Verify localStorage key is set
    cy.window().then((win) => {
      const key = `prime_guided_onboarding_complete:${PRIME_E2E_GUEST.bookingId}`;
      expect(win.localStorage.getItem(key)).to.equal('1');
    });
  });
});
