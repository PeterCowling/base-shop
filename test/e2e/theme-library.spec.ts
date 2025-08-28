describe("Theme library", () => {
  it("creates and deletes theme via API", () => {
    const theme = {
      name: "Demo",
      brandColor: "#fff",
      createdBy: "tester",
      version: "1.0.0",
    };
    cy.request("POST", "/cms/api/themes", theme).its("status").should("eq", 201);
    cy.request("/cms/api/themes")
      .its("body.themes")
      .should((themes) => {
        expect(themes.some((t: any) => t.name === "Demo")).to.be.true;
      });
    cy.request("GET", "/cms/api/themes")
      .its("body.themes")
      .then((themes) => {
        const id = themes.find((t: any) => t.name === "Demo").id;
        cy.request("DELETE", `/cms/api/themes/${id}`).its("status").should("eq", 200);
      });
  });
});
