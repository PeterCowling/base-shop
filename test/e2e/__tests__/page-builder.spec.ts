// test/e2e/page-builder.spec.ts

describe("Page Builder happy path", () => {
  const shopId = "cover-me-pretty";
  const builderUrl = `/cms/shop/${shopId}/pages/home/builder`;
  const dataDir = Cypress.env("TEST_DATA_ROOT");
  const login = () => cy.loginAsAdmin();

  before(() => {
    cy.session("admin-session", login);
  });

  it("drags a block, saves draft and publishes", () => {
    cy.session("admin-session", login);

    cy.visit(builderUrl);
    cy.get("aside .cursor-grab", { timeout: 10000 })
      .first()
      .as("firstBlock")
      .trigger("mousedown", { button: 0 });

    // drag first palette item onto the canvas
    cy.get("aside .cursor-grab", { timeout: 10000 })
      .first()
      .trigger("mousedown", { button: 0 });

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
        cy.readFile(`${dataDir}/${shopId}/pages.json`).then((pages) => {
          const page = pages.find((p: any) => p.slug === "home");
          expect(page.components[0].type).to.equal(blockType.trim());
        });
      });

    cy.contains("button", "Publish").click();
    cy.readFile(`${dataDir}/${shopId}/pages.json`, { timeout: 10000 }).then(
      (pages) => {
        const page = pages.find((p: any) => p.slug === "home");
        expect(page.status).to.equal("published");
      }
    );
  });
});
