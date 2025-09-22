import "@testing-library/cypress/add-commands";

describe("CMS settings – SEO freeze translations functional", () => {
  const shop = "demo";
  const root = (Cypress.env("TEST_DATA_ROOT") as string) || "__tests__/data/shops";
  const settingsFile = `${root}/${shop}/settings.json`;

  before(() => {
    cy.session("admin-session", () => cy.loginAsAdmin());
  });

  it("freezes shared fields across locales and persists", () => {
    const title = `Frozen ${Date.now()}`;
    const description = "Frozen desc";

    // Ensure multiple locales are configured before loading the page
    cy.readFile(settingsFile).then((json: any) => {
      json.languages = ["en", "de"]; // set two locales
      cy.writeFile(settingsFile, json);
    });

    cy.session("admin-session", () => cy.loginAsAdmin());
    cy.visit(`/cms/shop/${shop}/settings/seo`, { failOnStatusCode: false });
    cy.location("pathname").should("eq", `/cms/shop/${shop}/settings/seo`);

    // Freeze translations
    cy.findByLabelText("Freeze translations").check({ force: true });

    // Edit shared fields in current locale (en)
    cy.findByLabelText("Title").clear().type(title);
    cy.findByLabelText("Description").clear().type(description);

    // Save
    cy.findByRole("button", { name: /^Save$/ }).click();
    cy.contains("Metadata saved").should("exist");

    // Verify that both 'en' and 'de' share the same title/description
    cy.readFile(settingsFile, { timeout: 5000 }).then((json: any) => {
      expect(json).to.have.property("seo");
      expect(json.seo).to.have.property("en");
      expect(json.seo).to.have.property("de");
      expect(json.seo.en).to.include({ title, description });
      expect(json.seo.de).to.include({ title, description });
    });
  });
});

