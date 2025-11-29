import { SESSION_TTL_S } from "@acme/auth/store";

describe("Shop session expiration", () => {
  it("redirects to login after session expires", function () {
    cy.request("/login").then((resp) => {
      if (!resp.body.includes('name="customerId"')) {
        cy.log("Skipping shop session-expiration spec: legacy shopper login is not available");
        this.skip();
        return;
      }

      cy.visit("/login", {
        onBeforeLoad(win) {
          cy.clock(win.Date.now());
        },
      });

      cy.get('input[name="customerId"]').type("cust1");
      cy.get('input[name="password"]').type("pass1");
      cy.contains("button", "Login").click();

      cy.getCookie("customer_session").should("exist");

      cy.tick((SESSION_TTL_S + 1) * 1000);

      cy.getCookie("customer_session").should("not.exist");

      cy.visit("/account/profile");
      cy.location("pathname").should("eq", "/login");
    });
  });
});
