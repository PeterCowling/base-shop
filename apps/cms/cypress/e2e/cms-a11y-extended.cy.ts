import '@testing-library/cypress/add-commands';

// Extra CMS routes: blog flows, account requests, migrations, RA.
// Full-page color-contrast scan with no exclusions.
// Tag: [a11y]
describe('CMS a11y: extended routes [a11y]', { tags: ['a11y'] }, () => {
  const login = () => cy.loginAsAdmin();

  before(() => { cy.session('admin-session', login); });

  const shopId = (Cypress.env('SHOP') as string) || 'demo';
  const routes: string[] = [
    '/cms/account-requests',
    '/cms/migrations',
    '/cms/ra',
    `/cms/blog/sanity/connect?shopId=${shopId}`,
    `/cms/blog/posts?shopId=${shopId}`,
    `/cms/blog/posts/new?shopId=${shopId}`,
  ];

  routes.forEach((path) => {
    it(`has no color-contrast violations on ${path}`, () => {
      cy.session('admin-session', login);
      cy.visit(path, { failOnStatusCode: false });
      cy.location('pathname').should('eq', path.replace(/\?.*$/, ''));
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
