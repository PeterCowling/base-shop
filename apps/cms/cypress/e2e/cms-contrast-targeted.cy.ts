import '@testing-library/cypress/add-commands';

describe('CMS targeted contrast logging', () => {
  const login = () => cy.loginAsAdmin();

  before(() => {
    cy.session('admin-session', login);
  });

  const shop = (Cypress.env('SHOP') as string) || 'demo';
  const routes = ['/cms/dashboard', '/cms/live', '/cms/maintenance', `/cms/shop/${shop}/data/inventory`, '/cms/themes/library', '/cms/plugins'];

  routes.forEach((path) => {
    it(`logs color-contrast nodes on ${path}`, () => {
      cy.session('admin-session', login);
      cy.visit(path, { failOnStatusCode: false });
      cy.location('pathname').should('eq', path);
      cy.injectAxe();
      cy.checkA11y(
        { exclude: [['header'], ['nav'], ['aside'], ['footer'], ['.bg-hero-contrast'], ['.bg-hero']] },
        { runOnly: ['color-contrast'] },
        (violations) => {
          const rows = violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            help: v.help,
            nodes: v.nodes.map((n) => ({
              target: n.target,
              html: n.html?.slice(0, 200),
              failureSummary: n.failureSummary,
            })),
          }));
          cy.task('log', JSON.stringify(rows, null, 2));
        },
        true
      );
    });
  });
});
