// test/e2e/translation-freeze.spec.ts

describe("Translation freeze", () => {
  const settingsUrl = "/cms/shop/demo/settings/seo";

  it("switches locale then freezes translations", () => {
    // sign in via the login page and redirect to settings
    cy.visit(`/login?callbackUrl=${settingsUrl}`);
    cy.get('input[name="email"]').type("admin@example.com");
    cy.get('input[name="password"]').type("admin");
    cy.contains("button", "Continue").click();
    cy.location("pathname", { timeout: 10000 }).should("eq", settingsUrl);

    // now on the settings page

    // switch locale to German
    cy.contains("label", "Locale").find("select").select("de");

    // freeze translations via checkbox
    cy.contains("label", "Freeze translations")
      .find("input[type=checkbox]")
      .check();

    // capture title field value after freezing
    cy.contains("label", "Title")
      .find("input")
      .invoke("val")
      .then((frozenTitle) => {
        // switch back to English
        cy.contains("label", "Locale").find("select").select("en");

        // title should still display previously loaded value
        cy.contains("label", "Title")
          .find("input")
          .should("have.value", frozenTitle as string);

        // reload page and verify persistence
        cy.reload();
        cy.contains("label", "Freeze translations")
          .find("input[type=checkbox]")
          .should("be.checked", { timeout: 10000 });
        cy.contains("label", "Title")
          .find("input")
          .should("have.value", frozenTitle as string, { timeout: 10000 });
      });
  });
});
