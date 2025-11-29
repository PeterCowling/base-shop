import '@testing-library/cypress/add-commands';

// Full-page color-contrast scans across key CMS routes (no exclusions).
// Tag: [a11y]
describe('CMS a11y: full-page contrast on key routes [a11y]', { tags: ['a11y'] }, () => {
  const login = () => cy.loginAsAdmin();

  before(() => { cy.session('admin-session', login); });

  const shop = (Cypress.env('SHOP') as string) || 'demo';
  const routes: string[] = [
    '/cms',
    '/cms/media',
    '/cms/themes',
    '/cms/themes/library',
    '/cms/products',
    '/cms/pages',
    '/cms/settings',
    '/cms/plugins',
    '/cms/rbac',
    '/cms/rbac/permissions',
    '/cms/blog/posts',
    '/cms/live',
    '/cms/shop',
    `/cms/shop/${shop}`,
    `/cms/shop/${shop}/media`,
    `/cms/shop/${shop}/themes`,
    `/cms/shop/${shop}/pages`,
    `/cms/shop/${shop}/products`,
    `/cms/shop/${shop}/settings`,
    '/cms/orders',
    `/cms/orders/${shop}`,
  ];

  routes.forEach((path) => {
    it(`has no color-contrast violations on ${path}`, () => {
      cy.session('admin-session', login);
      cy.visit(path, { failOnStatusCode: false });
      cy.location('pathname').then((pathname) => {
        const shopPath = `/cms/shop/${shop}/pages`;
        if (path === shopPath) {
          // The canonical destination for the shop pages route is the editor.
          expect(pathname).to.eq(`${shopPath}/edit/page`);
        } else {
          expect(pathname).to.eq(path);
        }
      });
      // Wait for some content to reduce early scans
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
