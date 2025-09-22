import "@testing-library/cypress/add-commands";

describe("CMS settings – Overrides validation (negative)", () => {
  const shop = "demo";

  before(() => {
    cy.session("admin-session", () => cy.loginAsAdmin());
  });

  it("blocks save when mappings are invalid and shows errors", () => {
    cy.session("admin-session", () => cy.loginAsAdmin());
    cy.visit(`/cms/shop/${shop}/settings`, { failOnStatusCode: false });
    cy.location("pathname").should("eq", `/cms/shop/${shop}/settings`);

    // Invalid filter mapping: add row but leave fields blank
    cy.findByRole('button', { name: 'Add filter mapping' }).click();

    // Invalid price override: non-numeric value
    cy.findByRole('button', { name: 'Add price override' }).click();
    cy.findByLabelText('Locale').type('en-GB');
    cy.findByLabelText('Override (minor units)').type('not-a-number');

    // Invalid locale override: leave locale unselected
    cy.findByRole('button', { name: 'Add locale override' }).click();
    cy.findByLabelText('Field key').type('/invalid');
    // Don't pick a locale

    // Attempt to save
    cy.findByRole('button', { name: /^Save$/ }).click();

    // Error toast appears
    cy.contains('Please resolve the highlighted validation issues.').should('exist');

    // General errors for sections are surfaced
    cy.contains('All filter mappings must have key and value').should('exist');
    cy.contains('All price overrides require locale and numeric value').should('exist');
    cy.contains('All locale overrides require key and valid locale').should('exist');
  });
  
});

