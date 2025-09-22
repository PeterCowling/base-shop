import '@testing-library/cypress/add-commands';

describe('CMS a11y debug: /cms/pages', () => {
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

  it('logs all color-contrast violations on /cms/pages', () => {
    cy.visit('/cms/pages', { failOnStatusCode: false });
    cy.location('pathname').should('eq', '/cms/pages');
    cy.injectAxe();
    cy.window()
      .then((win) =>
        (win as any).axe.run(document, {
          runOnly: { type: 'rule', values: ['color-contrast'] },
          resultTypes: ['violations'],
        })
      )
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
      });
  });
});

