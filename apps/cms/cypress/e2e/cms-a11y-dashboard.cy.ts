import '@testing-library/cypress/add-commands';

describe('CMS dashboard a11y deep-dive', () => {
  const login = () => cy.loginAsAdmin();

  before(() => {
    cy.session('admin-session', login);
  });

  it('logs violations for /cms', function () {
    cy.session('admin-session', login);
    cy.visit('/cms', { failOnStatusCode: false });
    cy.location('pathname').should('eq', '/cms');
    cy.document().then(function (doc) {
      const hero = doc.querySelector('section.bg-hero-contrast');
      if (!hero) {
        cy.log(
          'Skipping cms-a11y-dashboard spec: no bg-hero-contrast section is rendered on /cms in this environment.',
        );
         
        this.skip();
        return;
      }

      cy.injectAxe();
      cy.configureAxe({ rules: [{ id: 'color-contrast', enabled: true }] });

      // First check the hero only (logging violations)
      cy.window()
        .then((win) =>
          (win as any).axe.run(hero, {
            runOnly: { type: 'rule', values: ['color-contrast'] },
            resultTypes: ['violations'],
          }),
        )
        .then((r: any) => {
          const v = r.violations || [];
          cy.task(
            'log',
            [
              'hero',
              v.map((x: any) => ({
                id: x.id,
                nodes: x.nodes.map((n: any) => ({
                  t: n.target,
                  s: n.failureSummary,
                })),
              })),
            ],
          );
        });

      // Then check the summary section below hero and assert no violations
      const summary = doc.querySelector('div.space-y-10 section:nth-of-type(2)');
      if (!summary) {
        cy.log(
          'Skipping summary contrast check: summary section not found on dashboard.',
        );
        return;
      }

      cy.window()
        .then((win) =>
          (win as any).axe.run(summary, {
            runOnly: { type: 'rule', values: ['color-contrast'] },
            resultTypes: ['violations'],
          }),
        )
        .then((results: any) => {
          const violations = results.violations || [];
          cy.task(
            'log',
            [
              'summary',
              violations.map((v: any) => ({
                id: v.id,
                help: v.help,
                helpUrl: v.helpUrl,
                impact: v.impact,
                nodes: v.nodes.map((n: any) => ({
                  target: n.target,
                  summary: n.failureSummary,
                })),
              })),
            ],
          );
          expect(violations, 'no color-contrast violations in dashboard summary').to.have.length(0);
        });
    });
  });
});
