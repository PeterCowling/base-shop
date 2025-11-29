// test/e2e/session-expiration.spec.ts

describe("Customer session expiration", () => {
  it("redirects to /login after cookie expiry", function () {
    cy.request("/login").then(function (resp) {
      if (!resp.body.includes('name="customerId"')) {
        cy.log("Skipping customer session test: shopper login not available");
        this.skip();
        return;
      }

      cy.visit("/login");
      cy.get('input[name="customerId"]').type("cust1");
      cy.get('input[name="password"]').type("pass1");
      cy.contains("button", "Login").click();

      cy.getCookie("customer_session").should("exist").then((cookie) => {
        if (!cookie?.value) {
          throw new Error("customer_session cookie missing value");
        }
        cy.setCookie("customer_session", cookie.value, {
          expiry: Math.floor(Date.now() / 1000) + 1,
        });
      });

      cy.wait(1100);

      cy.visit("/account/profile");
      cy.location("pathname").should("eq", "/login");
    });
  });
});
