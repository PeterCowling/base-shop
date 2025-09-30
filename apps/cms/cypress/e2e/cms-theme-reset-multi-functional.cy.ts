import "@testing-library/cypress/add-commands";

describe("CMS settings – Theme override reset (multiple)", () => {
  const shop = (Cypress.env('SHOP') as string) || 'demo';
  const dataRoot = (Cypress.env("TEST_DATA_ROOT") as string) || "__tests__/data/shops";
  const shopFile = `${dataRoot}/${shop}/shop.json`;

  before(() => {
    cy.session("admin-session", () => cy.loginAsAdmin());
  });

  it("only removes the targeted token from themeOverrides", () => {
    // Seed two overrides
    cy.readFile(shopFile).then((json: any) => {
      json.themeOverrides = { ...(json.themeOverrides || {}), "color.brand": "#ff0000", "font.body": "Inter" };
      cy.writeFile(shopFile, json);
    });

    cy.session("admin-session", () => cy.loginAsAdmin());
    cy.visit(`/cms/shop/${shop}/settings`, { failOnStatusCode: false });
    cy.location("pathname").should("eq", `/cms/shop/${shop}/settings`);

    cy.get("#theme-tokens").within(() => {
      cy.findByText(/color\.brand/).should("exist");
      cy.findAllByRole("button", { name: /^Reset$/ }).first().click();
    });

    cy.readFile(shopFile, { timeout: 5000 }).then((json: any) => {
      const overrides = json.themeOverrides || {};
      expect(overrides).to.not.have.property("color.brand");
      expect(overrides).to.have.property("font.body", "Inter");
    });
  });
});
