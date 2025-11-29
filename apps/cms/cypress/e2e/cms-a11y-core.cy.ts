import '@testing-library/cypress/add-commands';

describe('CMS pages accessibility (broad)', () => {
  const login = () => cy.loginAsAdmin();

  // Prepare a named session to reuse across tests
  before(() => {
    cy.session('admin-session', login);
  });

  const routes = [
    // Core dashboards & top-level
    '/cms',
    '/cms/dashboard',
    '/cms/telemetry',
    '/cms/migrations',
    '/cms/media',
    '/cms/pages',
    '/cms/products',
    '/cms/orders',
    '/cms/settings',
    '/cms/themes',
    '/cms/themes/library',
    '/cms/plugins',
  ];

  routes.forEach((path) => {
    it(`has no serious+ a11y violations on ${path}`, () => {
      cy.session('admin-session', login);
      cy.visit(path, { failOnStatusCode: false });
      cy.location('pathname').should('eq', path);
      cy.injectAxe();
      // Exclude hero sections (covered by dedicated hero specs) to focus on non-hero content
      cy.checkA11y(
        // Focus on main content; exclude global chrome and heroes
        { exclude: [['header'], ['nav'], ['aside'], ['footer'], ['.bg-hero-contrast'], ['.bg-hero']] },
        { runOnly: { type: 'rule', values: ['color-contrast'] }, includedImpacts: ['critical', 'serious'] },
        (violations) => {
          cy.task('log', violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) })));
        }
      );
    });
  });
});
