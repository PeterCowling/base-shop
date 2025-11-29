import '@testing-library/cypress/add-commands';

describe('CMS a11y debug: /cms/pages', () => {
  const login = () => cy.loginAsAdmin();

  before(() => {
    cy.session('admin-session', login);
  });

  it('logs all color-contrast violations on /cms/pages (excluding hero)', () => {
    cy.session('admin-session', login);
    cy.visit('/cms/pages', { failOnStatusCode: false });
    cy.location('pathname').should('eq', '/cms/pages');
    cy.injectAxe();
    cy.window().then((win) =>
      (win as any).axe
        .run({ exclude: [['.bg-hero-contrast'], ['.bg-hero']] }, {
          runOnly: { type: 'rule', values: ['color-contrast'] },
          resultTypes: ['violations'],
        })
        .then((results: any) => {
          const violations = results.violations || [];
          cy.task(
            'log',
            violations.map((v: any) => ({
              id: v.id,
              impact: v.impact,
              help: v.help,
              helpUrl: v.helpUrl,
              nodes: v.nodes.map((n: any) => ({ target: n.target, summary: n.failureSummary })),
            }))
          );
        })
    );
  });
});
