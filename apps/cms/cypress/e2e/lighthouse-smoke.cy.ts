// Lighthouse smoke for authenticated routes with explicit device config
describe('Lighthouse smoke (authenticated)', { tags: ['smoke', 'lh'] }, () => {
  const thresholdsMobile = {
    performance: 60,
    'largest-contentful-paint': 4000,
    'total-blocking-time': 300,
    'cumulative-layout-shift': 0.1,
  } as const;

  const thresholdsDesktop = {
    performance: 90,
    'largest-contentful-paint': 2500,
    'total-blocking-time': 200,
    'cumulative-layout-shift': 0.1,
  } as const;

  beforeEach(() => {
    // Sessionized login to ensure we audit real pages not /login
    cy.session('login', () => {
      cy.visit('/login');
      const user = Cypress.env('E2E_USERNAME');
      const pass = Cypress.env('E2E_PASSWORD');
      if (!user || !pass) {
        // eslint-disable-next-line no-console
        console.warn('E2E_USERNAME/E2E_PASSWORD not set; skipping auth.');
        return;
      }
      cy.get('#username').type(user);
      cy.get('#password').type(pass, { log: false });
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/dashboard');
    });
  });

  it('mobile dashboard', () => {
    cy.visit('/dashboard');
    cy.lighthouse(
      thresholdsMobile,
      {},
      { settings: { preset: 'mobile', throttlingMethod: 'simulate' } }
    );
  });

  it('desktop dashboard', () => {
    cy.visit('/dashboard');
    cy.lighthouse(
      thresholdsDesktop,
      {},
      { settings: { preset: 'desktop', throttlingMethod: 'simulate' } }
    );
  });
});
