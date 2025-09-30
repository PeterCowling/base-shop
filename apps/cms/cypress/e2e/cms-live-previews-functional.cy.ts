import "@testing-library/cypress/add-commands";

describe("CMS – Live Previews list", () => {
  before(() => {
    cy.session("admin-session", () => cy.loginAsAdmin());
  });

  it("lists shops and shows unavailable status when app not found", () => {
    cy.session("admin-session", () => cy.loginAsAdmin());
    cy.visit(`/cms/live`, { failOnStatusCode: false });
    cy.location("pathname").should("eq", `/cms/live`);

    cy.contains('h2', 'Shop previews').should('exist');
    cy.contains('Demo', { matchCase: false }); // demo shop present
    cy.contains('Unavailable').should('exist');

    // Clicking the action shows a toast with reason
    cy.contains('button', /Open preview|View details/).first().click();
    cy.contains(/Cannot open .*: app not found|Preview configuration not detected/).should('exist');
  });
});

