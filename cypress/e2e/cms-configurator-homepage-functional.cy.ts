import "@testing-library/cypress/add-commands";

describe("CMS – Configurator Home Page (template + save)", () => {
  it("selects Blank template, saves draft, and advances", () => {
    cy.session("admin-session", () => cy.loginAsAdmin());
    cy.visit('/cms/configurator/home-page', { failOnStatusCode: false });
    cy.location('pathname').should('eq', '/cms/configurator/home-page');

    // Open template selector and choose Blank
    cy.get('[data-tour="select-template"]').click();
    cy.findByRole('option', { name: 'Blank' }).click();
    cy.findByRole('button', { name: 'Confirm' }).click();

    // Stub draft save API and trigger Save from PageBuilder toolbar
    cy.intercept('POST', '/cms/api/page-draft/*', { statusCode: 200, body: { id: 'home-1' } }).as('saveDraft');

    // PageBuilder Save button (generic) – use contains as label may vary
    cy.contains('button', /Save/i).first().click();
    cy.wait('@saveDraft');
    cy.contains(/Draft saved|Page published/i).should('exist');

    // Next step
    cy.findByRole('button', { name: 'Next' }).click();
    cy.location('pathname').should('match', /\/cms\/configurator\/checkout-page$/);
  });
});

