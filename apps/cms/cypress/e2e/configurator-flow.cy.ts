import { expect } from "chai";

describe("Configurator API flow", () => {
  const shopId = `cy-config-${Date.now()}`;
  const login = () => cy.loginAsAdmin();

  before(() => {
    cy.session("admin-session", login);
  });

  beforeEach(() => {
    cy.session("admin-session", login);
  });

  it("creates shop, seeds data and validates environment", () => {
    cy.request("POST", "/cms/api/configurator", { id: shopId }).then((res) => {
      expect(res.status).to.eq(201);
      expect(res.body).to.have.property("success", true);
    });

    const csv = typeof btoa === "function"
      ? btoa("sku,title\nsku1,Product 1")
      : Buffer.from("sku,title\nsku1,Product 1").toString("base64");

    cy.request("POST", "/cms/api/configurator/init-shop", {
      id: shopId,
      categories: ["cat-1", "cat-2"],
      csv,
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property("success", true);
    });

    cy.request(`/cms/api/configurator/validate-env/${shopId}`).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property("success", true);
    });
  });

  it("rejects invalid payload", () => {
    cy.request({
      method: "POST",
      url: "/cms/api/configurator",
      failOnStatusCode: false,
      body: { id: 123 },
    }).then((res) => {
      expect(res.status).to.eq(400);
    });
  });
});
