describe("Design system import", () => {
  const shop = "bcd";
  it("shows import form", () => {
    cy.visit(`/cms/shop/${shop}/import/design-system`);
    cy.contains("Import Design System").should("exist");
  });
});
