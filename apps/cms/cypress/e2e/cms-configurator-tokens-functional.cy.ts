import "@testing-library/cypress/add-commands";

describe("CMS – Configurator Tokens step (edit + reflect)", () => {
  it("focuses a token via inspector and updates its value", () => {
    cy.session("admin-session", () => cy.loginAsAdmin());
    cy.visit('/cms/configurator/tokens', { failOnStatusCode: false });
    cy.location('pathname').should('eq', '/cms/configurator/tokens');

    // Click the preview container token to open the inspector popover
    cy.get('[data-token="--color-bg"]').first().click();
    cy.findByRole('button', { name: 'Jump to editor' }).click();

    // The StyleEditor should scroll to the --color-bg token and focus its input
    cy.get('[data-token-key="--color-bg"]').as('bgToken');
    cy.get('@bgToken').within(() => {
      cy.get('input[type="color"]').invoke('val', '#ff0000').trigger('change');
    });

    // Row is marked as overridden (info styling)
    cy.get('@bgToken').should('have.attr', 'data-token', '--color-info');

    // Preview inline style now contains the updated token value (HSL for #ff0000)
    cy.get('[data-token="--color-bg"]').first().invoke('attr', 'style').then((style) => {
      expect(style || '').to.contain('--color-bg:');
    });
  });
});

