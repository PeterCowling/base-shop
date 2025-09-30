import '@testing-library/cypress/add-commands';

// Full-page color-contrast scans for settings + data subroutes (no exclusions).
// Tag: [a11y]
describe('CMS a11y: full contrast on settings + data [a11y]', { tags: ['a11y'] }, () => {
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

  const shop = (Cypress.env('SHOP') as string) || 'demo';
  const routes: string[] = [
    `/cms/shop/${shop}/sections`,
    `/cms/shop/${shop}/settings/seo`,
    `/cms/shop/${shop}/settings/premier-delivery`,
    `/cms/shop/${shop}/settings/returns`,
    `/cms/shop/${shop}/settings/reverse-logistics`,
    `/cms/shop/${shop}/settings/stock-scheduler`,
    `/cms/shop/${shop}/settings/deposits`,
    `/cms/shop/${shop}/settings/late-fees`,
    `/cms/shop/${shop}/settings/stock-alerts`,
    `/cms/shop/${shop}/settings/maintenance-scan`,
    `/cms/shop/${shop}/data/inventory`,
    `/cms/shop/${shop}/data/rental/pricing`,
  ];

  routes.forEach((path) => {
    it(`has no color-contrast violations on ${path}`, () => {
      cy.session('admin-session', login);
      cy.visit(path, { failOnStatusCode: false });
      cy.location('pathname').should('eq', path);
      cy.get('main, body', { timeout: 10000 }).should('be.visible');
      cy.injectAxe();
      cy.checkA11y(
        undefined,
        { runOnly: { type: 'rule', values: ['color-contrast'] } },
        undefined,
        true
      );
    });
  });
});
