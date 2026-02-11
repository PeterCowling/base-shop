// i18n-exempt file -- PRIME-241 [ttl=2026-12-31]
// E2E assertions intentionally use literal UI copy to verify guest-visible behavior.
import { installPrimeApiMocks, PRIME_E2E_GUEST, setPrimeGuestSession } from '../support/prime-mocks';

const CHECKIN_CACHE_KEY = `prime_checkin_code_${PRIME_E2E_GUEST.uuid}`;
const LEGACY_CACHE_NAME = 'prime-arrival-shell-v0';

describe('Prime PWA offline arrival contracts', () => {
  beforeEach(() => {
    installPrimeApiMocks('arrival-day');
    cy.visit('/');
    setPrimeGuestSession();
  });

  it('TC-01: online-first visit caches arrival route, then offline revisit remains usable', () => {
    cy.visit(`/?uuid=${PRIME_E2E_GUEST.uuid}`);
    cy.contains('button', PRIME_E2E_GUEST.checkInCode, { timeout: 20000 }).should('be.visible');

    cy.window().then((win) => {
      const cached = win.localStorage.getItem(CHECKIN_CACHE_KEY);
      expect(cached, 'check-in code cache entry').to.be.a('string');
    });

    cy.visit(`/?uuid=${PRIME_E2E_GUEST.uuid}`, {
      onBeforeLoad(win) {
        Object.defineProperty(win.navigator, 'onLine', {
          configurable: true,
          get: () => false,
        });
      },
    });

    cy.contains('button', PRIME_E2E_GUEST.checkInCode, { timeout: 20000 }).should('be.visible');
    cy.contains(/cached/i).should('be.visible');
    cy.get('[role="status"]').should('be.visible');
  });

  it('TC-02: cache version bump path invalidates stale cache namespace', () => {
    cy.visit(`/?uuid=${PRIME_E2E_GUEST.uuid}`);
    cy.contains('button', PRIME_E2E_GUEST.checkInCode, { timeout: 20000 }).should('be.visible');

    cy.window().then(async (win) => {
      const legacyCache = await win.caches.open(LEGACY_CACHE_NAME);
      await legacyCache.put('/stale-probe', new win.Response('stale'));

      const beforeKeys = await win.caches.keys();
      expect(beforeKeys).to.include(LEGACY_CACHE_NAME);

      const registration = await win.navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.unregister();
      }

      await win.navigator.serviceWorker.register('/sw.js');
      await win.navigator.serviceWorker.ready;
    });

    cy.reload();

    cy.window().then(async (win) => {
      const keys = await win.caches.keys();
      expect(keys).to.not.include(LEGACY_CACHE_NAME);
      expect(keys.some((key) => key === 'prime-arrival-shell-v1')).to.equal(true);
    });
  });
});

