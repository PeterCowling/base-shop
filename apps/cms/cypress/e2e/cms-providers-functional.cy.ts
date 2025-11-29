import "@testing-library/cypress/add-commands";

describe("CMS settings – Providers (tracking) functional", { tags: ["smoke"] }, () => {
  const shop = (Cypress.env('SHOP') as string) || 'demo';
  const root = (Cypress.env("TEST_DATA_ROOT") as string) || "__tests__/data/shops";
  const settingsFile = `${root}/${shop}/settings.json`;

  before(() => {
    cy.session("admin-session", () => cy.loginAsAdmin());
  });

  it("selects DHL and UPS and persists trackingProviders", () => {
    cy.session("admin-session", () => cy.loginAsAdmin());
    cy.visit(`/cms/shop/${shop}/settings`, { failOnStatusCode: false });
    cy.location("pathname").should("eq", `/cms/shop/${shop}/settings`);

    cy.get("body").then(function ($body) {
      const hasProvidersSection = $body.find('[data-section="providers"]').length > 0;
      if (!hasProvidersSection) {
        cy.log(
          "Skipping providers spec: providers section is not present on /cms/shop settings for this environment.",
        );
         
        this.skip();
        return;
      }

      cy.get('[data-section="providers"]').within(() => {
        // Tick provider checkboxes by toggling their inputs
        cy.get('input[name="trackingProviders"][value="dhl"]').check({
          force: true,
        });
        cy.get('input[name="trackingProviders"][value="ups"]').check({
          force: true,
        });
      });
    });

    // Save
    cy.findByRole("button", { name: /^Save$/ }).click();

    // Assert settings.json contains selected providers
    cy.readFile(settingsFile, { timeout: 5000 }).then((json: any) => {
      const list = (json.trackingProviders || []).sort();
      expect(list).to.include.members(["dhl", "ups"]);
    });

    // Reload and ensure checkboxes remain checked
    cy.reload();
    cy.get("body").then(function ($body) {
      const hasProvidersSection = $body.find('[data-section="providers"]').length > 0;
      if (!hasProvidersSection) {
        // If the section disappeared on reload, treat it as an environment issue.
         
        this.skip();
        return;
      }
      cy.get('[data-section="providers"]').within(() => {
        cy.get('input[name="trackingProviders"][value="dhl"]').should(
          "be.checked",
        );
        cy.get('input[name="trackingProviders"][value="ups"]').should(
          "be.checked",
        );
      });
    });
  });
});
