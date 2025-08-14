describe("edit preview page", () => {
  const shopId = "abc";
  const changeFile = `apps/shop-${shopId}/upgrade-changes.json`;

  before(() => {
    cy.writeFile(changeFile, {
      components: [
        { file: "molecules/Breadcrumbs.tsx", componentName: "Breadcrumbs" },
      ],
    });
  });

  it("shows navigation link and lists changed components", () => {
    cy.visit(`/cms/shop/${shopId}`);
    cy.contains("a", "Edit Preview")
      .should("have.attr", "href", `/cms/shop/${shopId}/edit-preview`)
      .click();
    cy.contains("li", "Breadcrumbs");
  });
});
