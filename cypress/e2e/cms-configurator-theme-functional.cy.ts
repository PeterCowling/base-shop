import "@testing-library/cypress/add-commands";

describe("CMS – Configurator Theme step", () => {
  it("changes theme and palette, advances to Tokens step", () => {
    cy.session("admin-session", () => cy.loginAsAdmin());
    cy.visit('/cms/configurator/theme', { failOnStatusCode: false });
    cy.location('pathname').should('eq', '/cms/configurator/theme');

    // Select a theme from dropdown (first option if current is blank)
    cy.get('[data-cy="theme-select"]').click();
    cy.findAllByRole('option').first().click();

    // Click a palette swatch
    cy.get('[data-cy^="palette-"]').first().click();

    // Proceed to next step
    cy.findByRole('button', { name: 'Next' }).click();
    cy.location('pathname').should('match', /\/cms\/configurator\/tokens$/);
  });
});

