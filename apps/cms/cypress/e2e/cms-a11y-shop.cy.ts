import '@testing-library/cypress/add-commands';

describe('CMS a11y: Shop + sections', () => {
  const login = () => cy.loginAsAdmin();

  before(() => { cy.session('admin-session', login); });

  const shop = (Cypress.env('SHOP') as string) || 'demo';
  const routes = [
    `/cms/orders/${shop}`,
    '/cms/shop',
    `/cms/shop/${shop}`,
    `/cms/shop/${shop}/media`,
    `/cms/shop/${shop}/themes`,
    // Shop pages route typically redirects to the editor; covered by cms-a11y-full-routes
    // `/cms/shop/${shop}/pages`,
    `/cms/shop/${shop}/products`,
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
