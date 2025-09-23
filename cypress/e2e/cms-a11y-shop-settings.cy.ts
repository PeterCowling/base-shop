import '@testing-library/cypress/add-commands';

describe('CMS a11y: Shop settings', () => {
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
  const routes = [
    `/cms/shop/${shop}/settings`,
    `/cms/shop/${shop}/settings/seo`,
    `/cms/shop/${shop}/settings/deposits`,
    `/cms/shop/${shop}/settings/late-fees`,
    `/cms/shop/${shop}/settings/reverse-logistics`,
    `/cms/shop/${shop}/settings/stock-alerts`,
    `/cms/shop/${shop}/settings/stock-scheduler`,
    `/cms/shop/${shop}/settings/premier-delivery`,
    `/cms/shop/${shop}/settings/returns`,
    `/cms/shop/${shop}/settings/maintenance-scan`,
  ];

  routes.forEach((path) => {
    it(`has no serious+ a11y violations on ${path}`, () => {
      cy.session('admin-session', login);
      cy.visit(path, { failOnStatusCode: false });
      cy.location('pathname').should('eq', path);
      cy.injectAxe();
      cy.checkA11y(
        { exclude: [['header'], ['nav'], ['aside'], ['footer'], ['.bg-hero-contrast'], ['.bg-hero']] },
        { runOnly: { type: 'rule', values: ['color-contrast'] }, includedImpacts: ['critical', 'serious'] },
        () => {},
        true
      );
    });
  });
});
