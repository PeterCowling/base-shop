// test/e2e/marketing-email.spec.ts

describe("CMS marketing email templates", () => {
  const templates = [
    { id: "basic", name: "Basic" },
    { id: "centered", name: "Centered" },
  ];
  const login = () => cy.loginAsAdmin();

  before(() => {
    cy.session("admin-session", login);
  });

  beforeEach(() => {
    cy.intercept("GET", "/cms/api/page-templates", {
      statusCode: 200,
      body: templates,
    }).as("pageTemplates");

    cy.intercept("GET", "/api/segments*", {
      statusCode: 200,
      body: { segments: [] },
    });
    cy.intercept("GET", "/api/marketing/email*", {
      statusCode: 200,
      body: { campaigns: [] },
    });

    cy.session("admin-session", login);
  });

  it("populates template dropdown and updates preview", () => {
    cy.visit("/cms/marketing/email");
    cy.wait("@pageTemplates");
    cy.get("select").find("option").should("have.length", templates.length);
    cy.get("select").select("centered");
    cy.get(".mt-4 .text-center").should("exist");
  });

  it("page builder loads templates and renders blocks", () => {
    const shopId = "bcd";
    cy.visit(`/cms/shop/${shopId}/pages/home/builder`);
    cy.wait("@pageTemplates");
    cy.get("aside .cursor-grab", { timeout: 10000 }).should(
      "have.length.at.least",
      1,
    );
  });
});
