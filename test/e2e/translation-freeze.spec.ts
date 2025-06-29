// test/e2e/translation-freeze.spec.ts

describe("Translation freeze", () => {
  const settingsUrl = "/cms/shop/demo/settings/seo";

  it("switches locale then freezes translations", () => {
    cy.visit(settingsUrl);

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
          .should("be.checked");
        cy.contains("label", "Title")
          .find("input")
          .should("have.value", frozenTitle as string);
      });
  });
});
