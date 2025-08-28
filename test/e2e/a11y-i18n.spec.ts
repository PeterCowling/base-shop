describe("A11y and i18n for new UIs", () => {
  const shop = "abc";
  it("shows translated labels", () => {
    cy.visit("/cms/themes/library");
    cy.contains("h2", "Theme Library").should("exist");
    cy.contains("a", "Back").should("exist");

    cy.visit(`/cms/shop/${shop}/import/design-system`);
    cy.contains("h2", "Import Design System").should("exist");
    cy.contains("p", "Paste design tokens JSON or enter npm package name.").should(
      "exist",
    );
  });
});
