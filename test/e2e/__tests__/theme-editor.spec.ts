// test/e2e/theme-editor.spec.ts

describe("Theme editor", () => {
  const shop = "bcd";
  const themeUrl = `/cms/shop/${shop}/themes`;
  const dataDir = Cypress.env("TEST_DATA_ROOT");
  const shopFile = `${dataDir}/${shop}/shop.json`;

  it("updates colors and typography and persists", () => {
    // sign in
    cy.request("/api/auth/csrf").then(({ body }) => {
      cy.request({
        method: "POST",
        url: "/api/auth/callback/credentials",
        form: true,
        followRedirect: true,
        body: {
          csrfToken: body.csrfToken,
          email: "admin@example.com",
          password: "admin",
          callbackUrl: themeUrl,
        },
      });
    });

    cy.intercept("PATCH", `/cms/api/shops/${shop}/theme`).as("saveTheme");

    cy.visit(themeUrl);

    // modify a color token
    cy.get('label[data-token-key="--color-primary"] input[type="color"]')
      .invoke("val", "#ff0000")
      .trigger("input", { force: true });
    cy.wait("@saveTheme");

    // modify a typography token
    cy.get('input[name="--font-sans"]')
      .clear()
      .type("Arial");
    cy.wait("@saveTheme");

    // verify persistence in data file
    cy.readFile(shopFile).its("themeOverrides").should("deep.include", {
      "--color-primary": "0 100% 50%",
      "--font-sans": "Arial",
    });

    // reload and verify values remain
    cy.reload();
    cy.get('label[data-token-key="--color-primary"] input[type="color"]').should(
      "have.value",
      "#ff0000",
    );
    cy.get('input[name="--font-sans"]').should("have.value", "Arial");
  });
});
