import "@testing-library/cypress/add-commands";

describe("CMS – Configurator stage gate and QA flow", () => {
  before(() => {
    cy.session("admin-session", () => cy.loginAsAdmin());
  });

  it("blocks prod until stage smoke + QA ack, then enables Prod toggle", function () {
    cy.session("admin-session", () => cy.loginAsAdmin());

    const completed: Record<string, string> = {
      "shop-details": "complete",
      theme: "complete",
      tokens: "complete",
      "payment-provider": "complete",
      shipping: "complete",
      "checkout-page": "complete",
      inventory: "complete",
      "env-vars": "complete",
      hosting: "complete",
    };

    // Intercept configurator progress to mark all required steps complete
    cy.intercept("GET", "/api/configurator-progress", (req) => {
      req.reply({
        statusCode: 200,
        body: { state: { shopId: "demo" }, completed },
      });
    }).as("getProgress");

    // Stage gate state machine
    const gateState = {
      stageStatus: "not-run" as "not-run" | "passed" | "failed",
      stageAt: undefined as string | undefined,
      stageVersion: undefined as string | undefined,
      qaAck: false,
      missing: ["stage-tests", "qa-ack"] as Array<"stage-tests" | "qa-ack">,
    };

    cy.intercept("GET", "/api/launch-shop/gate*", (req) => {
      req.reply({
        statusCode: 200,
        body: {
          gate: {
            stageTestsStatus: gateState.stageStatus,
            stageTestsAt: gateState.stageAt,
            stageTestsVersion: gateState.stageVersion,
            qaAck: gateState.qaAck
              ? { acknowledgedAt: gateState.stageAt ?? new Date().toISOString() }
              : null,
          },
          prodAllowed: gateState.missing.length === 0,
          missing: gateState.missing,
          stage: {
            status: gateState.stageStatus,
            at: gateState.stageAt,
            version: gateState.stageVersion,
          },
        },
      });
    }).as("getGate");

    cy.intercept("POST", "/api/launch-shop/smoke", (req) => {
      gateState.stageStatus = "passed";
      gateState.stageAt = new Date().toISOString();
      gateState.stageVersion = gateState.stageAt;
      gateState.missing = ["qa-ack"];
      req.reply({ statusCode: 200, body: { status: "passed" } });
    }).as("smoke");

    cy.intercept("POST", "/api/launch-shop/qa-ack", (req) => {
      gateState.qaAck = true;
      gateState.missing = [];
      req.reply({ statusCode: 200, body: { ok: true } });
    }).as("qaAck");

    cy.visit("/cms/configurator", { failOnStatusCode: false });
    cy.wait("@getProgress");
    cy.wait("@getGate");

    // Stage gate banner present, Prod disabled
    cy.contains("Stage gate: unlock Prod").should("be.visible");
    cy.findByRole("button", { name: "prod" }).should("be.disabled");

    // Run Stage smoke, then Prod should still be blocked
    cy.contains("Re-run smoke tests").click();
    cy.wait("@smoke");
    cy.wait("@getGate");
    cy.findByRole("button", { name: "prod" }).should("be.disabled");

    // Fill QA ack and unlock Prod
    cy.findByLabelText("Optional note").type("Reviewed staging flow");
    cy.contains("I reviewed staging").click();
    cy.wait("@qaAck");
    cy.wait("@getGate");
    cy.findByRole("button", { name: "prod" }).should("not.be.disabled");
  });
});
