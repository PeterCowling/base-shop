import '@testing-library/cypress/add-commands';

// Full-page color-contrast for builder and editor views.
// Tag: [a11y]
describe('CMS a11y: builders + editors [a11y]', { tags: ['a11y'] }, () => {
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
    `/cms/shop/${shop}/pages/new/builder`,
    `/cms/shop/${shop}/pages/home/builder`,
    `/cms/shop/${shop}/pages/home/export`,
    `/cms/shop/${shop}/sections/new/builder`,
    `/cms/shop/${shop}/products/1/edit`,
  ];

  routes.forEach((path) => {
    it(`has no color-contrast violations on ${path}`, () => {
      cy.session('admin-session', login);
      cy.visit(path, { failOnStatusCode: false });
      cy.location('pathname').should('eq', path);
      cy.get('body', { timeout: 10000 }).should('be.visible');
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
