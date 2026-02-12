import bookingTransactionPredicates from "../../.claude/skills/user-testing-audit/scripts/booking-transaction-predicates.cjs";

const {
  evaluateBookingTransactionCheck,
  collectBookingTransactionRegressionIssues,
} = bookingTransactionPredicates;

type FlowFixture = {
  flowKey: "homeModalHandoff" | "roomDetailRateHandoff";
  flowType: string;
  routePath: string;
  hydratedInteraction: boolean;
  hydratedTriggerWorked: boolean;
  handoffHref: string;
  handoffObservedUrl: string;
  error: string;
};

function runBookingFlowAudit(fixtures: FlowFixture[]) {
  const flowChecks = Object.fromEntries(
    fixtures.map((fixture) => [
      fixture.flowKey,
      evaluateBookingTransactionCheck(fixture),
    ])
  );
  return collectBookingTransactionRegressionIssues(flowChecks);
}

describe("user-testing-audit booking transaction flow (e2e-style)", () => {
  it("catches broken provider handoff in booking journey matrix", () => {
    const issues = runBookingFlowAudit([
      {
        flowKey: "homeModalHandoff",
        flowType: "home-modal-booking",
        routePath: "/en",
        hydratedInteraction: true,
        hydratedTriggerWorked: true,
        handoffHref: "https://book.octorate.com/octobook/site/reservation/result.xhtml?codice=45111",
        handoffObservedUrl: "",
        error: "",
      },
      {
        flowKey: "roomDetailRateHandoff",
        flowType: "room-detail-rate-booking",
        routePath: "/en/rooms/double_room",
        hydratedInteraction: true,
        hydratedTriggerWorked: true,
        handoffHref: "https://book.octorate.com/octobook/site/reservation/confirm.xhtml?codice=45111",
        handoffObservedUrl: "",
        error: "",
      },
    ]);

    expect(issues).toHaveLength(1);
    expect(issues[0].id).toBe("booking-transaction-provider-handoff");
  });

  it("passes when booking journeys hydrate and hand off with complete params", () => {
    const issues = runBookingFlowAudit([
      {
        flowKey: "homeModalHandoff",
        flowType: "home-modal-booking",
        routePath: "/en",
        hydratedInteraction: true,
        hydratedTriggerWorked: true,
        handoffHref:
          "https://book.octorate.com/octobook/site/reservation/result.xhtml?codice=45111&checkin=2026-02-12&checkout=2026-02-14&pax=2",
        handoffObservedUrl: "",
        error: "",
      },
      {
        flowKey: "roomDetailRateHandoff",
        flowType: "room-detail-rate-booking",
        routePath: "/en/rooms/double_room",
        hydratedInteraction: true,
        hydratedTriggerWorked: true,
        handoffHref: "",
        handoffObservedUrl:
          "https://book.octorate.com/octobook/site/reservation/confirm.xhtml?codice=45111&checkin=2026-02-12&checkout=2026-02-14&pax=1",
        error: "",
      },
    ]);

    expect(issues).toHaveLength(0);
  });
});
