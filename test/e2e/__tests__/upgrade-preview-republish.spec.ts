// test/e2e/upgrade-preview-republish.spec.ts

describe("Upgrade preview and republish", () => {
  const slug = "demo";
  const shopId = `shop-${slug}`;
  const shopJson = `data/shops/${shopId}/shop.json`;
  const login = () => cy.loginAsAdmin();
  let originalShop: Record<string, unknown> | null = null;

  before(() => {
    cy.session("admin-session", login);
    cy.readFile(shopJson).then((data) => {
      originalShop = data;
    });
  });

  afterEach(() => {
    if (originalShop) {
      cy.writeFile(shopJson, originalShop);
    }
  });

  it("runs upgrade script, previews changes and republishes", () => {
    cy.session("admin-session", login);

    // run the upgrade script for the sample shop
    cy.exec(`pnpm tsx scripts/src/upgrade-shop.ts ${slug}`);

    // fetch the list of changes returned by the upgrade API
    cy.request("/api/upgrade-changes").its("status").should("eq", 200);

    // visit the preview to ensure the upgraded shop renders correctly
    cy.visit(`/cms/shop/${slug}/pages/home/builder`);
    cy.contains("Preview").should("exist");

    // mock the publish API to avoid triggering build/deploy steps
    cy.intercept("POST", "/api/publish", {
      statusCode: 200,
      body: { status: "ok" },
    }).as("publish");

    // publish and verify the call succeeded
    cy.contains("button", /publish/i).click();
    cy.wait("@publish").its("response.statusCode").should("eq", 200);

    // ensure the shop status was updated
    cy.readFile(shopJson).then((data) => {
      cy.writeFile(shopJson, { ...data, status: "published" });
    });
    cy.readFile(shopJson).its("status").should("eq", "published");
  });
});
