import '@testing-library/cypress/add-commands';
import 'cypress-axe';

// Thorough color-contrast checks across the configurator dashboard and all steps
describe('CMS configurator color-contrast [a11y]', { tags: ['a11y'] }, () => {
  const shop = (Cypress.env('SHOP') as string) || 'demo';

  const excluded: any = { exclude: [
    ['header'], ['nav'], ['aside'], ['footer'],
    ['.bg-hero-contrast'], ['.bg-hero']
  ]};
  const runOnly = { runOnly: { type: 'rule', values: ['color-contrast'] } } as const;

  const login = () => cy.loginAsAdmin();

  before(() => {
    cy.session('admin-session', login);
  });

  it('dashboard /cms/configurator has no serious+ color-contrast issues', () => {
    cy.session('admin-session', login);
    const path = '/cms/configurator';
    cy.visit(path, { failOnStatusCode: false });
    cy.location('pathname').should('eq', path);
    cy.injectAxe();
    cy.checkA11y(excluded, { ...runOnly, includedImpacts: ['critical', 'serious'] });
  });

  // Step ids mirrored from apps/cms/src/app/cms/configurator/steps.tsx
  const steps: string[] = [
    'shop-details',
    'theme',
    'tokens',
    'payment-provider',
    'shipping',
    'checkout-page',
    'inventory',
    'env-vars',
    // optional growth/ops steps
    'import-data',
    'hosting',
  ];

  steps.forEach((id) => {
    it(`step /cms/configurator/${id} has no serious+ color-contrast issues`, () => {
      cy.session('admin-session', login);
      const path = `/cms/configurator/${id}`;
      cy.visit(path, { failOnStatusCode: false });
      cy.location('pathname').should('eq', path);
      cy.injectAxe();
      cy.checkA11y(excluded, { ...runOnly, includedImpacts: ['critical', 'serious'] }, (violations) => {
        // Persist per-step results for debugging
        const rows = violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          nodes: v.nodes.map((n) => ({ target: n.target, html: (n.html || '').slice(0, 200), failureSummary: n.failureSummary }))
        }));
        cy.writeFile(`test-results/cms-configurator-a11y-${id}.json`, rows, { log: false });
      });
    });
  });
});
