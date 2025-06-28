// test/e2e/page-builder.spec.ts

describe("Page Builder happy path", () => {
  const builderUrl = "/cms/shop/demo/pages/home/builder";

  it("drags a block, saves draft and publishes", () => {
    cy.visit(builderUrl);

    // drag first palette item onto the canvas
    cy.get("aside .cursor-grab").first().trigger("mousedown", { button: 0 });

    cy.get("#canvas")
      .trigger("mousemove", { clientX: 200, clientY: 200 })
      .trigger("mouseup", { force: true });

    cy.get("#canvas .relative.rounded.border").should(
      "have.length.at.least",
      1
    );

    cy.contains("button", "Save").click();
    cy.contains("button", "Publish").click();
  });
});
