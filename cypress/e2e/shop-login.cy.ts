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

  it("has accessible inputs and validation", () => {
    cy.visit("/login");
    cy.injectAxe();

    ["customerId", "password"].forEach((name) => {
      cy.get(`input[name="${name}"]`).should(($input) => {
        const id = $input.attr("id");
        const hasLabel = !!id && Cypress.$(`label[for="${id}"]`).length > 0;
        const hasAriaLabel = !!$input.attr("aria-label");
        expect(hasLabel || hasAriaLabel).to.be.true;
      });
    });

    cy.checkA11y();

    cy.contains("button", "Login").click();

    ["customerId", "password"].forEach((name) => {
      cy.get(`input[name="${name}"]`)
        .should("have.attr", "aria-invalid", "true")
        .and("have.attr", "aria-describedby")
        .then(($input) => {
          const describedby = $input.attr("aria-describedby")!;
          cy.get(`#${describedby}`).should("be.visible");
        });
    });

    cy.checkA11y();
  });
});
