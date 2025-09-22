import '@testing-library/cypress/add-commands';

// Focused a11y check for CMS hero sections that previously suffered low contrast.
describe('CMS hero contrast', () => {
  before(() => {
    // Programmatically sign in as admin via NextAuth credentials provider
    cy.request('/api/auth/csrf').then(({ body }) => {
      const csrf = body.csrfToken as string;
      cy.request({
        method: 'POST',
        url: '/api/auth/callback/credentials',
        form: true,
        followRedirect: true,
        body: {
          csrfToken: csrf,
          email: 'admin@example.com',
          password: 'admin',
          callbackUrl: '/',
        },
      });
    });
  });

  it('ensures no color-contrast violations on /cms/pages', () => {
    // Navigate explicitly after login and confirm we are on the target page
    cy.visit('/cms/pages', { failOnStatusCode: false });
    cy.location('pathname').should('eq', '/cms/pages');
    cy.injectAxe();
    // Ensure the color-contrast rule is active
    cy.configureAxe({ rules: [{ id: 'color-contrast', enabled: true }] });
    // Focus the check on the hero section to avoid unrelated page issues
    cy.get('section.bg-hero-contrast').first();
    cy.window().then((win) =>
      cy.get('section.bg-hero-contrast').first().then(($el) =>
        (win as any).axe.run($el[0], {
          runOnly: { type: 'rule', values: ['color-contrast'] },
          resultTypes: ['violations'],
        })
      )
    ).then((results: any) => {
      const violations = results.violations || [];
      cy.task('log', violations.map((v: any) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n: any) => n.target) })));
      expect(violations, 'no color-contrast violations').to.have.length(0);
    });

    // Quick sanity: the hero heading is visible and has computed color
    cy.findByRole('heading', {
      name: /Start crafting the story for each storefront/i,
    }).should('be.visible');
  });
});
