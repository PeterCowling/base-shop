import "@testing-library/cypress/add-commands";

describe("CMS – Configurator dashboard & Shop Details flow", () => {
  before(() => {
    cy.session("admin-session", () => cy.loginAsAdmin());
  });

  it("renders dashboard, opens Shop Details, saves and returns", () => {
    cy.session("admin-session", () => cy.loginAsAdmin());
    cy.visit(`/cms/configurator`, { failOnStatusCode: false });
    cy.location("pathname").should("eq", `/cms/configurator`);

    // Launch panel and sections
    cy.findByRole('heading', { name: 'Launch readiness' }).should('exist');
    cy.findByRole('button', { name: 'Launch shop' }).should('have.attr', 'disabled');
    cy.findByText('Essential milestones', { exact: false }).should('exist');

    // Continue the first step (Shop Details)
    cy.findAllByRole('link', { name: /Continue step|Review step/ }).first().click();
    cy.location('pathname').should('match', /\/cms\/configurator\/shop-details$/);
    cy.findByRole('heading', { name: 'Shop Details' }).should('exist');

    // Fill minimal valid fields
    cy.get('[data-cy="shop-id"]').clear().type('demo');
    cy.get('[data-cy="store-name"]').clear().type('Demo Store');
    cy.get('[data-cy="contact-info"]').clear().type('contact@example.com');
    cy.get('[data-cy="shop-type"]').click();
    cy.findByRole('option', { name: 'Sale' }).click();
    cy.get('[data-cy="template"]').click();
    cy.findAllByRole('option').first().click();

    // Save & return to dashboard
    cy.findByRole('button', { name: 'Save & return' }).click();
    cy.location('pathname').should('eq', '/cms/configurator');

    // Shop Details step shows as Complete
    cy.contains('Shop Details').parent().parent().within(() => {
      cy.findByText('Complete').should('exist');
    });
  });
});

