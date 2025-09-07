const viewports = [
  { label: "mobile", width: 320, height: 640, hamburger: true },
  { label: "tablet", width: 768, height: 1024, hamburger: false },
];

const routes: { path: string; checkLayout: (hamburger: boolean) => void }[] = [
  {
    path: "/en/checkout",
    checkLayout: (hamburger) => {
      const expected = hamburger ? "column" : "row";
      cy.get("main > div")
        .first()
        .should("have.css", "flex-direction", expected);
    },
  },
  {
    path: "/account/profile",
    checkLayout: (hamburger) => {
      const expected = hamburger ? "column" : "row";
      cy.get("main > div")
        .first()
        .should("have.css", "flex-direction", expected);
    },
  },
  {
    path: "/en/shop?q=green",
    checkLayout: (hamburger) => {
      const expectedColumns = hamburger ? 1 : 3;
      cy.get('[style*="grid-template-columns"]')
        .first()
        .invoke("attr", "style")
        .then((style) => {
          const match = /repeat\\((\\d+)/.exec(style || "");
          const count = match ? Number(match[1]) : 0;
          expect(count).to.eq(expectedColumns);
        });
    },
  },
];

describe("Responsive pages", () => {
  viewports.forEach(({ label, width, height, hamburger }) => {
    routes.forEach(({ path, checkLayout }) => {
      it(`adapts ${path} at ${label} (${width}x${height})`, () => {
        cy.viewport(width, height);
        cy.visit(path);
        cy.injectAxe();
        cy.checkA11y();

        if (hamburger) {
          cy.get('button[aria-label="menu"]').should("be.visible").focus().should("have.focus");
        } else {
          cy.get('button[aria-label="menu"]').should("not.exist");
        }

        checkLayout(hamburger);
      });
    });
  });
});
