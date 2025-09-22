import "@testing-library/cypress/add-commands";

describe("CMS settings – AI Catalog functional", () => {
  const shop = "demo";
  const dataRoot = (Cypress.env("TEST_DATA_ROOT") as string) || "__tests__/data/shops";
  const settingsFile = `${dataRoot}/${shop}/settings.json`;

  before(() => {
    cy.session("admin-session", () => cy.loginAsAdmin());
  });

  it("toggles AI Catalog and saves", () => {
    cy.session("admin-session", () => cy.loginAsAdmin());
    cy.visit(`/cms/shop/${shop}/settings/seo`, { failOnStatusCode: false });
    cy.location("pathname").should("eq", `/cms/shop/${shop}/settings/seo`);

    // Toggle feed off to ensure a change
    cy.contains("span", "Enable AI catalog feed").parent().find("input[type=checkbox]").as("toggle");
    cy.get("@toggle").then(($el) => {
      const checked = ($el.get(0) as HTMLInputElement).checked;
      if (checked) {
        cy.get("@toggle").click({ force: true });
      }
    });

    // Save settings
    cy.findByRole("button", { name: /Save settings/i }).click();

    // Verify persisted
    cy.readFile(settingsFile, { timeout: 5000 }).then((json: any) => {
      expect(json).to.have.nested.property("seo.aiCatalog.enabled", false);
    });
  });
});

