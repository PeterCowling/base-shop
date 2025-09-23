import "@testing-library/cypress/add-commands";

describe("CMS settings – Theme override reset functional", () => {
  const shop = (Cypress.env('SHOP') as string) || 'demo';
  const dataRoot = (Cypress.env("TEST_DATA_ROOT") as string) || "__tests__/data/shops";
  const shopFile = `${dataRoot}/${shop}/shop.json`;

  before(() => {
    cy.session("admin-session", () => cy.loginAsAdmin());
  });

  it("resets an overridden token via Reset action", () => {
    // Seed an override so only one token shows a Reset action
    cy.readFile(shopFile).then((json: any) => {
      json.themeOverrides = { ...(json.themeOverrides || {}), "color.brand": "#ff0000" };
      cy.writeFile(shopFile, json);
    });

    cy.session("admin-session", () => cy.loginAsAdmin());
    cy.visit(`/cms/shop/${shop}/settings`, { failOnStatusCode: false });
    cy.location("pathname").should("eq", `/cms/shop/${shop}/settings`);

    // In Theme tokens table, click the single Reset action
    cy.get("#theme-tokens").within(() => {
      cy.findByText(/color\.brand/).should("exist");
      cy.findByRole("button", { name: /^Reset$/ }).click();
    });

    // Assert override removed
    cy.readFile(shopFile, { timeout: 5000 }).then((json: any) => {
      expect(json.themeOverrides || {}).to.not.have.property("color.brand");
    });
  });
});
