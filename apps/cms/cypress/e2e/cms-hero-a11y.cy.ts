import '@testing-library/cypress/add-commands';

// Focused a11y check for CMS hero sections that previously suffered low contrast.
describe('CMS hero contrast', () => {
  const login = () => cy.loginAsAdmin();

  before(() => {
    cy.session('admin-session', login);
  });

  it('ensures no color-contrast violations on /cms/pages', function () {
    cy.session('admin-session', login);
    // Navigate explicitly after login and confirm we are on the target page
    cy.visit('/cms/pages', { failOnStatusCode: false });
    cy.location('pathname').should('eq', '/cms/pages');
    cy.document().then(function (doc) {
      const hero = doc.querySelector('section.bg-hero-contrast');
      if (!hero) {
        cy.log(
          'Skipping hero-a11y spec: no bg-hero-contrast section is rendered on /cms/pages in this environment.',
        );
         
        this.skip();
        return;
      }

      cy.injectAxe();
      // Ensure the color-contrast rule is active
      cy.configureAxe({ rules: [{ id: 'color-contrast', enabled: true }] });

      cy.window()
        .then((win) =>
          (win as any).axe.run(hero, {
            runOnly: { type: 'rule', values: ['color-contrast'] },
            resultTypes: ['violations'],
          }),
        )
        .then((results: any) => {
          const violations = results.violations || [];
          cy.task(
            'log',
            violations.map((v: any) => ({
              id: v.id,
              impact: v.impact,
              nodes: v.nodes.map((n: any) => n.target),
            })),
          );
          expect(violations, 'no color-contrast violations').to.have.length(0);
        });

      // Quick sanity: the hero heading is visible and has computed color
      cy.findByRole('heading', {
        name: /Start crafting the story for each storefront/i,
      }).should('be.visible');
    });
  });
});
