import "@testing-library/cypress/add-commands";

describe("CMS settings – SEO functional", () => {
  const shop = "demo";
  const dataRoot = (Cypress.env("TEST_DATA_ROOT") as string) || "__tests__/data/shops";
  const settingsFile = `${dataRoot}/${shop}/settings.json`;

  before(() => {
    cy.session("admin-session", () => cy.loginAsAdmin());
  });

  it("edits title/description and persists", () => {
    const title = `Cypress SEO ${Date.now()}`;
    const description = "Cypress SEO description";

    cy.session("admin-session", () => cy.loginAsAdmin());
    cy.visit(`/cms/shop/${shop}/settings/seo`, { failOnStatusCode: false });
    cy.location("pathname").should("eq", `/cms/shop/${shop}/settings/seo`);

    // Fill core fields
    cy.findByLabelText("Title").clear().type(title);
    cy.findByLabelText("Description").clear().type(description);

    // Save
    cy.findByRole("button", { name: /^Save$/ }).click();

    // Toast confirms save
    cy.contains("Metadata saved").should("exist");

    // Assert JSON persisted for locale 'en'
    cy.readFile(settingsFile, { timeout: 5000 }).then((json: any) => {
      expect(json).to.have.property("seo");
      expect(json.seo).to.have.property("en");
      expect(json.seo.en).to.include({ title, description });
    });
  });
});

