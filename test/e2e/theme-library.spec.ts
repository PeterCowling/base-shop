describe.skip("Theme library", () => {
  it("visits library page", () => {
    cy.visit("/cms/themes/library");
    cy.contains("Theme Library");
  });
});
