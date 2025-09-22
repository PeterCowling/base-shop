import '@testing-library/cypress/add-commands';

describe('CMS dashboard a11y deep-dive', () => {
  before(() => {
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

  it('logs violations for /cms', () => {
    cy.visit('/cms', { failOnStatusCode: false });
    cy.location('pathname').should('eq', '/cms');
    cy.injectAxe();
    cy.configureAxe({ rules: [{ id: 'color-contrast', enabled: true }] });
    // First check the hero only (should pass)
    cy.get('section.bg-hero-contrast').first().then(($hero) => {
      cy.window().then((win) => (win as any).axe.run($hero[0], {
        runOnly: { type: 'rule', values: ['color-contrast'] },
        resultTypes: ['violations'],
      })).then((r: any) => {
        const v = r.violations || [];
        cy.task('log', ['hero', v.map((x: any) => ({ id: x.id, nodes: x.nodes.map((n: any) => ({ t: n.target, s: n.failureSummary })) }))]);
      });
    });
    // Then check the summary section below hero
    cy.get('section.grid').first().then(($sec) => {
      cy.window().then((win) => (win as any).axe.run($sec[0], {
        runOnly: { type: 'rule', values: ['color-contrast'] },
        resultTypes: ['violations'],
      })).then((results: any) => {
        const violations = results.violations || [];
        cy.task('log', ['summary', violations.map((v: any) => ({
          id: v.id,
          help: v.help,
          helpUrl: v.helpUrl,
          impact: v.impact,
          nodes: v.nodes.map((n: any) => ({ target: n.target, summary: n.failureSummary })),
        }))]);
        expect(violations, 'no color-contrast violations').to.have.length(0);
      });
    });
  });
});
