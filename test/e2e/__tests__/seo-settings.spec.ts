// tests/e2e/seo-settings.spec.ts

// This test will switch language, edit SEO meta, preview the
// changes, save, check diff history and verify that the head tags
// rendered by next-seo reflect the changes.

describe("SEO settings", () => {
  const seoUrl = "/cms/shop/demo/settings/seo";
  const dataDir = Cypress.env("TEST_DATA_ROOT");
  const historyFile = `${dataDir}/demo/settings.history.jsonl`;

  it("switch language, edit meta and verify", () => {
    const title = "Cypress Title";
    const description = "Cypress description";

    cy.visit(seoUrl);

    // switch to a different locale using language tabs
    cy.contains("button", "DE").click();

    // fill meta fields
    cy.contains("label", "Title").find("input").clear().type(title);
    cy.contains("label", "Description")
      .find("textarea")
      .clear()
      .type(description);

    // Preview panel should reflect the typed values when present
    cy.contains("Google result").parent().should("contain", title);

    // save changes
    cy.contains("button", "Save").click();

    // verify diff history file contains update
    cy.readFile(historyFile).should("include", title);

    // verify storefront <head> tags are updated
    cy.visit("/de");
    cy.title().should("contain", title);
    cy.get('head meta[name="description"]')
      .invoke("attr", "content")
      .should("contain", description);
  });
});
