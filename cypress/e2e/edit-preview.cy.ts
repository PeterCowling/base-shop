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

  it("updates preview size for selected device presets", () => {
    cy.visit(`/cms/shop/${shopId}/edit-preview`);

    const presets = [
      { label: "Desktop 1280", width: 1280, height: 800 },
      { label: "iPad", width: 768, height: 1024 },
      { label: "iPhone 12", width: 390, height: 844 },
    ];

    presets.forEach(({ label, width, height }) => {
      cy.get('[aria-label="Device"]').click();
      cy.contains('[role="option"]', label).click();
      cy.get('#canvas')
        .parent()
        .should('have.css', 'width', `${width}px`)
        .and('have.css', 'height', `${height}px`);
    });
  });
});
