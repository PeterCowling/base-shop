import "@testing-library/cypress/add-commands";
import "cypress-axe";

describe("Navigation accessibility", () => {
  it("allows keyboard navigation and has proper attributes", () => {
    cy.visit("/");
    cy.injectAxe();

    cy.get("nav").should("have.attr", "aria-label");

    cy.get("[id]").then(($els) => {
      const ids = $els.toArray().map((el) => el.id);
      expect(new Set(ids).size).to.eq(ids.length);
    });

    cy.get("nav a").then(($links) => {
      const links = $links.toArray() as HTMLAnchorElement[];
      if (links.length) {
        cy.wrap(links[0]).focus();
        links.forEach((link, index) => {
          cy.focused().should("have.attr", "href", link.getAttribute("href"));
          if (index < links.length - 1) {
            cy.tab();
          }
        });
      }
    });

    cy.checkA11y();
  });
});
