// test/e2e/upgrade-preview-republish.spec.ts

describe("Upgrade preview and republish", () => {
  const shopId = "demo";

  it("runs upgrade script, previews changes and republishes", () => {
    // run the upgrade script for the sample shop
    cy.exec(`pnpm tsx scripts/src/upgrade-shop.ts ${shopId}`);

    // fetch the list of changes returned by the upgrade API
    cy.request("/api/upgrade-changes").its("status").should("eq", 200);

    // visit the preview to ensure the upgraded shop renders correctly
    cy.visit(`/cms/shop/${shopId}/pages/home/builder`);
    cy.contains("Preview").should("exist");

    // mock deployment of the shop when publishing
    cy.intercept("POST", "/api/deploy-shop", {
      statusCode: 200,
      body: { status: "success", previewUrl: "https://demo.pages.dev" },
    }).as("deployShop");

    // publish and wait for the redeploy call
    cy.contains("button", "Publish").click();
    cy.wait("@deployShop").its("response.statusCode").should("eq", 200);
  });
});

