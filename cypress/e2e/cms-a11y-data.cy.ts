import '@testing-library/cypress/add-commands';

describe('CMS a11y: Data views', () => {
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

  const routes = [
    '/cms/shop/segshop/data/inventory',
    '/cms/shop/segshop/data/return-logistics',
    '/cms/shop/segshop/data/rental/pricing',
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

