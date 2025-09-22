import "@testing-library/cypress/add-commands";

describe("CMS settings – SEO audit panel (stubbed)", () => {
  const shop = "demo";

  before(() => {
    cy.session("admin-session", () => cy.loginAsAdmin());
  });

  it("loads history, runs audit, and shows completion toast", () => {
    // Stub GET and POST endpoints used by SeoAuditPanel
    cy.intercept('GET', `/api/seo/audit/${shop}`, []).as('getAudit');
    cy.intercept('POST', `/api/seo/audit/${shop}`, (req) => {
      const record = { timestamp: new Date().toISOString(), score: 0.88, issues: 2, recommendations: ['Fix titles'] };
      req.reply(200, record);
    }).as('runAudit');

    cy.session("admin-session", () => cy.loginAsAdmin());
    cy.visit(`/cms/shop/${shop}/settings/seo`, { failOnStatusCode: false });
    cy.location("pathname").should("eq", `/cms/shop/${shop}/settings/seo`);

    cy.wait('@getAudit');

    // Run audit
    cy.findByRole('button', { name: 'Run audit' }).click();
    cy.wait('@runAudit');
    cy.contains('Audit completed').should('exist');

    // History table shows one row
    cy.contains('Audit history').parent().within(() => {
      cy.get('table tbody tr').should('have.length.greaterThan', 0);
    });
  });
});

