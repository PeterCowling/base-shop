// test/e2e/page-builder.spec.ts

describe("Page Builder happy path", () => {
  const builderUrl = "/cms/shop/demo/pages/home/builder";

  it("drags a block, saves draft and publishes", () => {
    cy.get("aside .cursor-grab")
      .first()
      .as("firstBlock")
      .trigger("mousedown", { button: 0 });

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

    cy.get("@firstBlock")
      .invoke("text")
      .then((blockType) => {
        cy.readFile("data/shops/demo/pages.json").then((pages) => {
          const page = pages.find((p: any) => p.slug === "home");
          expect(page.components[0].type).to.equal(blockType.trim());
        });
      });

    cy.contains("button", "Publish").click();
  });
});
