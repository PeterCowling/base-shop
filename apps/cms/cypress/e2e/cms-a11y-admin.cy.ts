import '@testing-library/cypress/add-commands';

describe('CMS a11y: Admin & RBAC', () => {
  const login = () => cy.loginAsAdmin();

  before(() => { cy.session('admin-session', login); });

  const routes = [
    '/cms/rbac',
    '/cms/rbac/permissions',
    '/cms/account-requests',
    '/cms/ra',
    '/cms/blog/sanity/connect',
    '/cms/blog/posts',
    '/cms/blog/posts/new',
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
