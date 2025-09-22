import "@testing-library/cypress/add-commands";

describe("CMS – Edit Preview page", () => {
  const shop = "demo";

  before(() => {
    cy.session("admin-session", () => cy.loginAsAdmin());
  });

  it("loads and shows empty state when no upgrade changes", () => {
    cy.session("admin-session", () => cy.loginAsAdmin());
    cy.visit(`/cms/shop/${shop}/edit-preview`, { failOnStatusCode: false });
    cy.location("pathname").should("eq", `/cms/shop/${shop}/edit-preview`);
    cy.findByRole('heading', { name: /Edit Preview/ }).should('exist');
    cy.contains('No changes.').should('exist');
  });
});

