import "@testing-library/cypress/add-commands";

describe("CMS settings – SEO per-locale editing (freeze off)", () => {
  const shop = (Cypress.env('SHOP') as string) || 'demo';
  const root = (Cypress.env("TEST_DATA_ROOT") as string) || "__tests__/data/shops";
  const settingsFile = `${root}/${shop}/settings.json`;

  before(() => {
    cy.session("admin-session", () => cy.loginAsAdmin());
  });

  it("saves EN only and leaves DE unchanged when not frozen", () => {
    // Ensure multiple locales
    cy.readFile(settingsFile).then((json: any) => {
      json.languages = ["en", "de"];
      // Clear any existing SEO for a clean check
      json.seo = {};
      cy.writeFile(settingsFile, json);
    });

    cy.session("admin-session", () => cy.loginAsAdmin());
    cy.visit(`/cms/shop/${shop}/settings/seo`, { failOnStatusCode: false });
    cy.location("pathname").should("eq", `/cms/shop/${shop}/settings/seo`);

    // Ensure Freeze translations is off
    cy.findByLabelText("Freeze translations").uncheck({ force: true });

    // EN is default tab. Type a title
    const enTitle = `EN only ${Date.now()}`;
    cy.findByLabelText("Title").clear().type(enTitle);

    // Switch to DE and verify field is still empty
    cy.findByRole('tab', { name: 'DE' }).click();
    cy.findByLabelText("Title").invoke('val').then((val) => {
      expect(val).to.not.equal(enTitle);
    });

    // Save
    cy.findByRole("button", { name: /^Save$/ }).click();
    cy.contains(/Metadata saved/).should("exist");

    // Persisted: en has title, de is missing or different
    cy.readFile(settingsFile, { timeout: 5000 }).then((json: any) => {
      expect(json).to.have.nested.property('seo.en.title', enTitle);
      const deTitle = json?.seo?.de?.title;
      expect(deTitle).to.be.oneOf([undefined, '', null]);
    });
  });
});
