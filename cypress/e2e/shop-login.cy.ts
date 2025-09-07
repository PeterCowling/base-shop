describe("Shop login", () => {
  it("logs in a customer and manages session", () => {
    cy.visit("/login");
    cy.get('input[name="customerId"]').type("cust1");
    cy.get('input[name="password"]').type("pass1");
    cy.contains("button", "Login").click();
    cy.getCookie("customer_session").should("exist");
    cy.visit("/account/profile");
    cy.location("pathname", { timeout: 10000 }).should("eq", "/account/profile");
    cy.visit("/logout");
    cy.location("pathname").should("eq", "/");
    cy.getCookie("customer_session").should("not.exist");
  });

  it("has accessible form inputs and validation", () => {
    cy.visit("/login");
    cy.injectAxe();
    cy.checkA11y();

    ["customerId", "password"].forEach((name) => {
      cy.get(`input[name="${name}"]`).should(($input) => {
        const id = $input.attr("id");
        const ariaLabel = $input.attr("aria-label");
        const hasLabel = !!id && Cypress.$(`label[for="${id}"]`).length > 0;
        expect(Boolean(ariaLabel) || hasLabel).to.be.true;
      });
    });

    cy.contains("button", "Login").click();

    ["customerId", "password"].forEach((name) => {
      cy.get(`input[name="${name}"]`)
        .should("have.attr", "aria-invalid", "true")
        .invoke("attr", "aria-describedby")
        .then((describedBy) => {
          expect(describedBy).to.exist;
          cy.get(`#${describedBy}`).should("be.visible");
        });
    });
  });
});
