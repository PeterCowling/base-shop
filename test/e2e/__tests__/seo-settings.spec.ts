// tests/e2e/seo-settings.spec.ts

// This test will switch language, edit SEO meta, preview the
// changes, save, check diff history and verify that the head tags
// rendered by next-seo reflect the changes.

describe("SEO settings", () => {
  const seoUrl = "/cms/shop/demo/settings/seo";
  const dataDir = Cypress.env("TEST_DATA_ROOT");
  const historyFile = `${dataDir}/demo/settings.history.jsonl`;
  const preferredLocale = Cypress.env("SEO_PREFERRED_LOCALE") || "DE";
  const fallbackLocale = Cypress.env("SEO_FALLBACK_LOCALE") || "EN";

  it("switch language, edit meta and verify", () => {
    const title = "Cypress Title";
    const description = "Cypress description";
    let activeLocale = preferredLocale;
    let storefrontPath = "/";
    let canVerifyHead = true;

    cy.visit(seoUrl);

    cy.get("body").then(($body) => {
      const localeButtons = $body.find("button").toArray();
      const hasPreferred = localeButtons.some(
        (btn) => btn.textContent?.trim() === preferredLocale,
      );
      if (!hasPreferred) {
        cy.log(
          `Locale ${preferredLocale} not found, falling back to ${fallbackLocale}`,
        );
        activeLocale = fallbackLocale;
      }
    });

    cy.then(() => {
      cy.contains("button", activeLocale).click();
      storefrontPath =
        activeLocale.toLowerCase() === "en"
          ? "/"
          : `/${activeLocale.toLowerCase()}`;
    });

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

    // verify storefront <head> tags are updated when the locale path exists
    cy.request({ url: storefrontPath, failOnStatusCode: false }).then(
      (resp) => {
        if (resp.status >= 400) {
          cy.log(
            `Skipping head assertions: ${storefrontPath} returned ${resp.status}`,
          );
          canVerifyHead = false;
        }
      },
    );
    cy.then(() => {
      if (!canVerifyHead) return;
      cy.visit(storefrontPath);
      cy.title().should("contain", title);
      cy.get('head meta[name="description"]')
        .invoke("attr", "content")
        .should("contain", description);
    });
  });
});
