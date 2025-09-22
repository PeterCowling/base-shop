import "@testing-library/cypress/add-commands";

describe("CMS settings – Overrides duplicate key resolution", () => {
  const shop = "demo";
  const root = (Cypress.env("TEST_DATA_ROOT") as string) || "__tests__/data/shops";
  const shopFile = `${root}/${shop}/shop.json`;

  before(() => {
    cy.session("admin-session", () => cy.loginAsAdmin());
  });

  it("last duplicate mapping wins in persisted shop.json", () => {
    cy.session("admin-session", () => cy.loginAsAdmin());
    cy.visit(`/cms/shop/${shop}/settings`, { failOnStatusCode: false });
    cy.location("pathname").should("eq", `/cms/shop/${shop}/settings`);

    // Add two mappings with same key 'color'
    cy.findByRole('button', { name: 'Add filter mapping' }).click();
    cy.findByLabelText('Filter key').type('color');
    cy.findByLabelText('Catalog attribute').type('attributes.one');

    cy.findByRole('button', { name: 'Add filter mapping' }).click();
    // Focus selects second row fields automatically by order
    cy.get('[id^="filter-mapping-key-"]').last().type('color');
    cy.get('[id^="filter-mapping-value-"]').last().type('attributes.two');

    cy.findByRole('button', { name: /^Save$/ }).click();
    cy.contains('Shop settings saved successfully.').should('exist');

    cy.readFile(shopFile, { timeout: 5000 }).then((json: any) => {
      expect(json).to.have.property('filterMappings');
      // Last assignment should win
      expect(json.filterMappings.color).to.equal('attributes.two');
    });
  });
});

