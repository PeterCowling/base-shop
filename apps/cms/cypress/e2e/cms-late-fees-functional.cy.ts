import "@testing-library/cypress/add-commands";

describe("CMS settings – Late Fees functional", () => {
  const shop = (Cypress.env('SHOP') as string) || 'demo';
  const root = (Cypress.env("TEST_DATA_ROOT") as string) || "__tests__/data/shops";
  const settingsFile = `${root}/${shop}/settings.json`;

  before(() => {
    cy.session("admin-session", () => cy.loginAsAdmin());
  });

  it("updates interval and persists", () => {
    cy.session("admin-session", () => cy.loginAsAdmin());
    cy.visit(`/cms/shop/${shop}/settings/late-fees`, { failOnStatusCode: false });
    cy.location("pathname").should("eq", `/cms/shop/${shop}/settings/late-fees`);

    cy.findByLabelText("Interval (minutes)").clear().type("120");
    cy.findByRole("button", { name: /^Save$/ }).click();

    cy.readFile(settingsFile, { timeout: 5000 }).then((json: any) => {
      expect(json).to.have.nested.property("lateFeeService.intervalMinutes", 120);
    });
  });
});
