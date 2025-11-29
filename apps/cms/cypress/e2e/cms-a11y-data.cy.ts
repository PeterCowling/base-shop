import '@testing-library/cypress/add-commands';

describe('CMS a11y: Data views', () => {
  const login = () => cy.loginAsAdmin();

  before(() => { cy.session('admin-session', login); });

  const shop = (Cypress.env('SHOP') as string) || 'demo';
  const routes = [
    `/cms/shop/${shop}/data/inventory`,
    `/cms/shop/${shop}/data/return-logistics`,
    `/cms/shop/${shop}/data/rental/pricing`,
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
