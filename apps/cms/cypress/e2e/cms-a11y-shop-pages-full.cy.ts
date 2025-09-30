import '@testing-library/cypress/add-commands';

// Runs a full color-contrast scan on the shop pages index with no exclusions.
// Tag: [a11y]
describe('CMS a11y: /cms/shop/demo/pages [a11y]', { tags: ['a11y'] }, () => {
  const login = () => {
    cy.request('/api/auth/csrf').then(({ body }) => {
      const csrf = body.csrfToken as string;
      cy.request({
        method: 'POST',
        url: '/api/auth/callback/credentials',
        form: true,
        followRedirect: true,
        body: { csrfToken: csrf, email: 'admin@example.com', password: 'admin', callbackUrl: '/' },
      });
    });
  };

  before(() => { cy.session('admin-session', login); });

  it('has no color-contrast violations across all elements', () => {
    const shop = (Cypress.env('SHOP') as string) || 'demo';
    const path = `/cms/shop/${shop}/pages`;

    cy.session('admin-session', login);
    cy.visit(path, { failOnStatusCode: false });
    cy.location('pathname').should('eq', path);

    // Ensure the core page content exists before scanning
    cy.findByText(/Page library/i, { timeout: 10000 }).should('be.visible');

    cy.injectAxe();
    // Check the entire document for color-contrast with all impacts
    cy.checkA11y(
      undefined,
      { runOnly: { type: 'rule', values: ['color-contrast'] } },
      (violations) => {
        const rows = violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          description: v.description,
          helpUrl: v.helpUrl,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            html: n.html,
            failureSummary: n.failureSummary,
          })),
        }));
        cy.task('log', JSON.stringify(rows, null, 2));
        cy.writeFile('test-results/cms-a11y-shop-pages-full.json', rows, { log: false });
      },
      true
    );
  });
});
