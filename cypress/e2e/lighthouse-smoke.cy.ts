// Lighthouse smoke with simple budgets
describe('Lighthouse smoke', { tags: ['smoke', 'lh'] }, () => {
  it('homepage meets budgets', () => {
    cy.visit('/');
    const thresholds = {
      performance: 0.75,
      accessibility: 0.9,
      'first-contentful-paint': 2500,
      'largest-contentful-paint': 3000,
      'cumulative-layout-shift': 0.1,
      'total-blocking-time': 250,
    } as const;
    // Run in desktop mode by default; cypress-audit reads current viewport
    cy.lighthouse(thresholds);
  });
});

