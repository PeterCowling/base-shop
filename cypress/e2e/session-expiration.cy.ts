import { CUSTOMER_SESSION_COOKIE } from "@auth";

describe("Session expiration", () => {
  it("redirects to login after the session cookie expires", () => {
    // Log in with valid customer credentials
    cy.visit("/login");
    cy.get('input[name="customerId"]').type("cust1");
    cy.get('input[name="password"]').type("pass1");
    cy.contains("button", "Login").click();
    cy.contains("Logged in");

    // Shorten cookie lifetime to 1 second and wait for expiry
    const SESSION_TTL_S = 1;
    cy.getCookie(CUSTOMER_SESSION_COOKIE)
      .should("exist")
      .then((cookie) => {
        cy.setCookie(CUSTOMER_SESSION_COOKIE, cookie!.value!, {
          expiry: Math.floor(Date.now() / 1000) + SESSION_TTL_S,
        });
      });
    cy.wait((SESSION_TTL_S + 1) * 1000);

    // Attempt to access a protected page and expect redirect to login
    cy.visit("/account/profile");
    cy.location("pathname").should("eq", "/login");
  });
});
