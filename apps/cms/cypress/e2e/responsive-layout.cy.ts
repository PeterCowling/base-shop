const viewports = [
  { label: "mobile", width: 320, height: 640, columns: 1, hamburger: true },
  { label: "tablet", width: 768, height: 1024, columns: 3, hamburger: false },
  { label: "desktop", width: 1280, height: 800, columns: 4, hamburger: false },
];

describe("Responsive layout", () => {
  viewports.forEach(({ label, width, height, columns, hamburger }) => {
    it(`adapts layout at ${label} (${width}x${height})`, () => {
      cy.viewport(width, height);
      cy.visit("/shop");
      cy.injectAxe();
      cy.checkA11y();

      if (hamburger) {
        cy.get('button[aria-label*="menu" i]').should("be.visible");
      } else {
        cy.get('button[aria-label*="menu" i]').should("not.exist");
      }

      cy.get('[style*="grid-template-columns"]')
        .first()
        .invoke("attr", "style")
        .then((style) => {
          const match = /repeat\\((\\d+)/.exec(style || "");
          const count = match ? Number(match[1]) : 0;
          expect(count).to.eq(columns);
        });
    });
  });
});
