const shopId = "bcd";

describe("Configurator environment validation", () => {
  it("validates environment for a configured shop", () => {
    cy.request(`/cms/api/configurator/validate-env/${shopId}`)
      .its("status")
      .should("eq", 200);
    cy.request(`/cms/api/configurator/validate-env/${shopId}`)
      .its("body")
      .should("deep.equal", { success: true });
  });

  it("returns 400 for an invalid shop id", () => {
    cy.request({
      url: "/cms/api/configurator/validate-env/invalid",
      failOnStatusCode: false,
    })
      .its("status")
      .should("eq", 400);
  });
});
