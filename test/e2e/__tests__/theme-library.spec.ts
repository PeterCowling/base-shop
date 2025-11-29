// test/e2e/theme-library.spec.ts

describe("Theme library API", () => {
  const baseUrl = "/cms/api/themes";
  const login = () => cy.loginAsAdmin();

  before(() => {
    cy.session("admin-session", login);
  });

  it("creates, fetches and deletes themes", () => {
    cy.session("admin-session", login);
    const theme = {
      name: "Spec Theme",
      brandColor: "#000",
      createdBy: "tester",
      version: 1,
      themeDefaults: {},
      themeOverrides: {},
      themeTokens: {},
    };
    cy.request("POST", baseUrl, theme).then((res) => {
      expect(res.status).to.eq(201);
      const id = res.body.id;
      cy.request(baseUrl)
        .its("body")
        .should("deep.include", { ...theme, id });
      cy.request(`${baseUrl}/${id}`)
        .its("body")
        .should("deep.include", { ...theme, id });
      cy.request("DELETE", `${baseUrl}/${id}`).its("status").should("eq", 204);
    });
  });
});
