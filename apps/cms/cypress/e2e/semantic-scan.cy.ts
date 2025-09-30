describe("semantic scan", () => {
  const routes = ["/", "/login", "/account"];

  routes.forEach((route) => {
    it(`checks accessibility for ${route}`, () => {
      cy.visit(route);
      cy.checkA11y(null, { runOnly: ["wcag2a", "wcag2aa"] });
    });
  });
});
