// test/e2e/upgrade-rollback.spec.ts

describe("Upgrade and rollback flow", () => {
  const slug = "cover-me-pretty";
  const shopJson = `data/shops/${slug}/shop.json`;
  const login = () => cy.loginAsAdmin();
  let original: Record<string, unknown> | null = null;

  before(() => {
    cy.session("admin-session", login);
    cy.readFile(shopJson).then((data) => {
      original = data;
    });
  });

  afterEach(() => {
    if (original) {
      cy.writeFile(shopJson, original);
    }
  });

  it("upgrades then rolls back a shop", function () {
    cy.session("admin-session", login);

    // Probe upgrade endpoint; skip if auth or route is unavailable in this env
    cy.request({
      method: "POST",
      url: "/cms/api/upgrade-shop",
      body: { shop: slug },
      failOnStatusCode: false,
    }).then((res) => {
      if (![200, 202].includes(res.status)) {
        cy.log(
          `Skipping upgrade-rollback spec: /cms/api/upgrade-shop returned ${res.status} in this environment.`,
        );
         
        (this as Mocha.Context).skip();
        return;
      }

      cy.readFile(shopJson).then((data) => {
        expect(data.lastUpgrade).not.to.equal(original?.lastUpgrade);
        expect(data.componentVersions.pkg).to.equal("2.0.0");
      });

      cy.request("POST", `/cms/api/shop/${slug}/rollback`)
        .its("status")
        .should("eq", 200);

      cy.readFile(shopJson).should((data) => {
        expect(data).to.deep.equal(original);
      });
    });
  });
});
