import "@testing-library/cypress/add-commands";

describe("CMS settings – Shop Editor identity & luxury features", () => {
  const shop = "demo";
  const root = (Cypress.env("TEST_DATA_ROOT") as string) || "__tests__/data/shops";
  const shopFile = `${root}/${shop}/shop.json`;
  const settingsFile = `${root}/${shop}/settings.json`;

  before(() => {
    cy.session("admin-session", () => cy.loginAsAdmin());
  });

  it("updates name/theme and toggles premierDelivery; persists to shop.json and settings.json", () => {
    const newName = `Demo Shop ${Date.now()}`;
    const themeId = "bcd-classic";

    cy.session("admin-session", () => cy.loginAsAdmin());
    cy.visit(`/cms/shop/${shop}/settings`, { failOnStatusCode: false });
    cy.location("pathname").should("eq", `/cms/shop/${shop}/settings`);

    // Identity section: change name and theme preset
    cy.findByLabelText("Shop name").clear().type(newName);
    cy.findByLabelText("Theme preset").clear().type(themeId);

    // Toggle Premier delivery luxury feature
    cy.findByLabelText("Premier delivery").click({ force: true });

    // Save via accordion footer
    cy.findByRole("button", { name: /^Save$/ }).click();

    // shop.json: name + themeId should update
    cy.readFile(shopFile, { timeout: 5000 }).then((json: any) => {
      expect(json).to.include({ name: newName, themeId });
      // theme tokens/overrides may be added by backend; we don't assert them here
    });

    // settings.json: premierDelivery flag should be true
    cy.readFile(settingsFile, { timeout: 5000 }).then((json: any) => {
      expect(json).to.have.nested.property("luxuryFeatures.premierDelivery", true);
    });
  });
});

