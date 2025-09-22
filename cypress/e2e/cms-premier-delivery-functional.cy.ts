import "@testing-library/cypress/add-commands";

describe("CMS settings – Premier Delivery functional", () => {
  const shop = "demo";
  const root = (Cypress.env("TEST_DATA_ROOT") as string) || "__tests__/data/shops";
  const settingsFile = `${root}/${shop}/settings.json`;

  before(() => {
    cy.session("admin-session", () => cy.loginAsAdmin());
  });

  it("updates label/surcharge/collections and persists", () => {
    cy.session("admin-session", () => cy.loginAsAdmin());
    cy.visit(`/cms/shop/${shop}/settings/premier-delivery`, { failOnStatusCode: false });
    cy.location("pathname").should("eq", `/cms/shop/${shop}/settings/premier-delivery`);

    cy.findByLabelText("Service label").clear().type("Premier Delivery");
    cy.findByLabelText("Surcharge").clear().type("19");

    // Regions, Windows, Carriers input[0] are labelled by their field labels
    cy.findByLabelText("Regions").clear().type("NYC");
    cy.findByLabelText("One-hour windows").clear().type("08-10");
    cy.findByLabelText("Preferred carriers").clear().type("Acme Express");

    cy.findByRole("button", { name: /Save changes/i }).click();

    // Verify persisted structure
    cy.readFile(settingsFile, { timeout: 5000 }).then((json: any) => {
      expect(json).to.have.property("premierDelivery");
      expect(json.premierDelivery).to.include({ serviceLabel: "Premier Delivery", surcharge: 19 });
      expect(json.premierDelivery.regions).to.deep.equal(["NYC"]);
      expect(json.premierDelivery.windows).to.deep.equal(["08-10"]);
      expect(json.premierDelivery.carriers).to.deep.equal(["Acme Express"]);
      // Feature flag set
      expect(json).to.have.nested.property("luxuryFeatures.premierDelivery", true);
    });
  });
});

