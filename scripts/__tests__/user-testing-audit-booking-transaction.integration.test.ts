import bookingTransactionPredicates from "../../.claude/skills/user-testing-audit/scripts/booking-transaction-predicates.cjs";

const {
  evaluateBookingTransactionCheck,
  collectBookingTransactionRegressionIssues,
} = bookingTransactionPredicates;

describe("user-testing-audit booking transaction integration", () => {
  it("returns no issue when all booking transaction flows pass", () => {
    const checks = {
      homeModalHandoff: evaluateBookingTransactionCheck({
        flowKey: "homeModalHandoff",
        flowType: "home-modal-booking",
        routePath: "/en",
        hydratedInteraction: true,
        hydratedTriggerWorked: true,
        handoffHref:
          "https://book.octorate.com/octobook/site/reservation/result.xhtml?codice=45111&checkin=2026-02-12&checkout=2026-02-14&pax=2",
        handoffObservedUrl: "",
        error: "",
      }),
      roomDetailRateHandoff: evaluateBookingTransactionCheck({
        flowKey: "roomDetailRateHandoff",
        flowType: "room-detail-rate-booking",
        routePath: "/en/rooms/double_room",
        hydratedInteraction: true,
        hydratedTriggerWorked: true,
        handoffHref: "",
        handoffObservedUrl:
          "https://book.octorate.com/octobook/site/reservation/confirm.xhtml?codice=45111&checkin=2026-02-12&checkout=2026-02-14&pax=1",
        error: "",
      }),
    };

    const issues = collectBookingTransactionRegressionIssues(checks);
    expect(issues).toHaveLength(0);
  });

  it("raises booking transaction issue when any flow fails", () => {
    const checks = {
      homeModalHandoff: evaluateBookingTransactionCheck({
        flowKey: "homeModalHandoff",
        flowType: "home-modal-booking",
        routePath: "/en",
        hydratedInteraction: false,
        hydratedTriggerWorked: false,
        handoffHref: "",
        handoffObservedUrl: "",
        error: "Modal did not open",
      }),
      roomDetailRateHandoff: evaluateBookingTransactionCheck({
        flowKey: "roomDetailRateHandoff",
        flowType: "room-detail-rate-booking",
        routePath: "/en/rooms/double_room",
        hydratedInteraction: true,
        hydratedTriggerWorked: true,
        handoffHref: "",
        handoffObservedUrl:
          "https://book.octorate.com/octobook/site/reservation/confirm.xhtml?codice=45111&checkin=2026-02-12&checkout=2026-02-14&pax=1",
        error: "",
      }),
    };

    const issues = collectBookingTransactionRegressionIssues(checks);
    expect(issues).toHaveLength(1);
    expect(issues[0].id).toBe("booking-transaction-provider-handoff");
    expect(issues[0].evidence.failingFlows).toHaveLength(1);
    expect(issues[0].evidence.failingFlows[0].flowKey).toBe("homeModalHandoff");
  });
});
