describe("Theme library API", () => {
  const base = "/cms/api/themes";
  const sample = {
    id: "theme-1",
    name: "Sample",
    brandColor: "#000000",
    createdBy: "tester",
    version: 1,
    theme: {},
  };

  it("creates, updates and deletes an entry", () => {
    cy.request("POST", base, sample).its("status").should("eq", 200);
    cy.request(base).its("body").should("deep.include", sample);
    cy.request(`${base}/${sample.id}`).its("body.name").should("eq", sample.name);
    cy.request("PATCH", `${base}/${sample.id}`, { name: "Updated" });
    cy.request(`${base}/${sample.id}`).its("body.name").should("eq", "Updated");
    cy.request("DELETE", `${base}/${sample.id}`).its("status").should("eq", 200);
    cy.request(base).its("body").should("deep.equal", []);
  });
});
