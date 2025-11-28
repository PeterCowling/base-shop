import "@testing-library/cypress/add-commands";
import "cypress-plugin-tab";

type AxeViolation = {
  id: string;
  impact?: string;
  description: string;
  nodes: { target: string[] }[];
};

function reportA11yViolations(violations: AxeViolation[] | undefined) {
  if (!violations?.length) return;
  cy.task("log", `Accessibility violations detected: ${violations.length}`);
  violations.forEach(({ id, impact, description, nodes }) => {
    cy.task("log", `${impact ?? "unknown"} ${id}: ${description}`);
    nodes.forEach((node) => {
      cy.task("log", `  target: ${node.target.join(", ")}`);
    });
  });
}

function checkA11y() {
  cy.checkA11y(undefined, undefined, reportA11yViolations);
}

function visitAccountPath(path: string) {
  cy.customerLogin();
  cy.visit(path);
  cy.location("pathname").should("eq", path);
}

describe("Account management accessibility", () => {
  // Skip this suite when the legacy shopper login endpoint is not available
  // (e.g. when the shop app has been removed from this deployment).
  before(function () {
    cy.request({
      method: "HEAD",
      url: "/api/login",
      failOnStatusCode: false,
    }).then((resp) => {
      if (resp.status === 404) {
        cy.log("Skipping account management specs: /api/login not present on this host.");
        this.skip();
      }
    });
  });

  const pages = ["/account/profile", "/account/orders", "/account/sessions"];

  pages.forEach((path) => {
    it(`has no detectable a11y violations on ${path}`, () => {
      visitAccountPath(path);
      cy.injectAxe();
      checkA11y();
    });
  });

  const viewports = [
    { name: "mobile", width: 375, height: 667 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "desktop", width: 1280, height: 800 },
  ];

  viewports.forEach(({ name, width, height }) => {
    it(`Profile form validation is accessible on ${name}`, () => {
      cy.viewport(width, height);
      visitAccountPath("/account/profile");

      cy.findByRole("button", { name: /save/i }).click();
      cy.findByLabelText("Name")
        .should("have.attr", "id", "name")
        .and("have.attr", "aria-invalid", "true");
      cy.findByLabelText("Email")
        .should("have.attr", "id", "email")
        .and("have.attr", "aria-invalid", "true");
      cy.findByText("Name is required.").should("have.attr", "role", "alert");
      cy.findByText("Email is required.").should("have.attr", "role", "alert");

      cy.injectAxe();
      checkA11y();
    });
  });

  it("ProfileForm links labels, announces errors, and tabs correctly", () => {
    visitAccountPath("/account/profile");
    cy.injectAxe();

    cy.findByLabelText("Name").should("have.attr", "id", "name");
    cy.findByLabelText("Email").should("have.attr", "id", "email");

    cy.findByRole("button", { name: /save/i }).click();
    cy.findByText("Name is required.").should("have.attr", "role", "alert");
    cy.findByText("Email is required.").should("have.attr", "role", "alert");

    cy.get("body").tab();
    cy.focused().should("have.attr", "id", "name");
    cy.tab();
    cy.focused().should("have.attr", "id", "email");
    cy.tab();
    cy.focused().should("have.attr", "type", "submit");

    checkA11y();
  });

  it("Orders list uses list semantics and supports keyboard navigation", () => {
    visitAccountPath("/account/orders");
    cy.injectAxe();

    cy.findByRole("list").within(() => {
      cy.findAllByRole("listitem").its("length").should("be.gte", 1);
    });

    cy.get("body").tab();
    cy.focused().type("{downarrow}");
    cy.focused().should("exist");

    checkA11y();
  });

  it("Sessions list uses list semantics and supports keyboard navigation", () => {
    visitAccountPath("/account/sessions");
    cy.injectAxe();

    cy.findByRole("list").within(() => {
      cy.findAllByRole("listitem").its("length").should("be.gte", 1);
    });

    cy.get("body").tab();
    cy.focused().type("{downarrow}");
    cy.focused().should("exist");

    checkA11y();
  });

  it('Account navigation exposes role="navigation" and supports keyboard activation', () => {
    visitAccountPath("/account/profile");
    cy.injectAxe();

    cy.findByRole("navigation");

    cy.findByRole("link", { name: /orders/i }).focus().type("{enter}");
    cy.location("pathname").should("eq", "/account/orders");

    cy.findByRole("link", { name: /sessions/i }).focus().type("{enter}");
    cy.location("pathname").should("eq", "/account/sessions");

    cy.findByRole("link", { name: /profile/i }).focus().type("{enter}");
    cy.location("pathname").should("eq", "/account/profile");

    checkA11y();
  });
});
