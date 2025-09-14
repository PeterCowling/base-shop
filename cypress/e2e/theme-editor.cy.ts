import path from "path";

describe("Theme editor flow", () => {
  const shopId = "bcd";
  const shopPath = path.join("data", "shops", shopId, "shop.json");
  let original: unknown;

  before(() => {
    cy.readFile(shopPath).then((data) => {
      original = data;
    });
  });

  after(() => {
    if (original) {
      cy.writeFile(shopPath, original);
    }
  });

  it("overrides a color token and persists the change", () => {
    // Open theme editor
    cy.visit(`/cms/shop/${shopId}/themes`);

    // Select an element via its color swatch
    cy.get('button[aria-label="--color-bg"]').click();

    // Override the color using the color picker
    cy.contains("label", "--color-bg").within(() => {
      cy.get('input[type="color"]')
        .invoke("val", "#000000")
        .trigger("input");
    });

    // Save the shop
    cy.contains("button", "Save").click();

    // Reload the shop configuration page
    cy.visit(`/cms/shop/${shopId}/settings`);

    // Assert base token value and override appear with swatch
    cy.contains("td", "--color-bg").parent("tr").within(() => {
      cy.get("td").eq(1).should("contain", "0 0% 100%");
      cy.get("td").eq(2).should("contain", "0 0% 0%");
      cy.get("span").should("have.attr", "style").and("include", "0 0% 0%");
    });
  });
});
