import bookingTransactionPredicates from "../../.claude/skills/meta-user-test/scripts/booking-transaction-predicates.cjs";

const {
  analyzeBookingProviderUrl,
  evaluateBookingTransactionCheck,
  collectBookingTransactionRegressionIssues,
} = bookingTransactionPredicates;

describe("meta-user-test booking transaction predicates (unit)", () => {
  it("accepts valid booking provider handoff URL with required params", () => {
    const analyzed = analyzeBookingProviderUrl(
      "https://book.octorate.com/octobook/site/reservation/result.xhtml?codice=45111&checkin=2026-02-12&checkout=2026-02-14&pax=2"
    );

    expect(analyzed.isValidUrl).toBe(true);
    expect(analyzed.isProviderHost).toBe(true);
    expect(analyzed.isExpectedPath).toBe(true);
    expect(analyzed.hasRequiredQuery).toBe(true);
    expect(analyzed.hasPartySize).toBe(true);
  });

  it("fails a flow when hydrated interaction does not happen", () => {
    const flow = evaluateBookingTransactionCheck({
      flowKey: "homeModalHandoff",
      flowType: "home-modal-booking",
      routePath: "/en",
      hydratedInteraction: false,
      hydratedTriggerWorked: false,
      handoffHref: "",
      handoffObservedUrl: "",
      error: "Modal never opened",
    });

    expect(flow.checks.hasHydratedInteraction).toBe(false);
    expect(flow.checks.passes).toBe(false);
  });

  it("passes a flow when hydration and provider handoff succeed", () => {
    const flow = evaluateBookingTransactionCheck({
      flowKey: "roomDetailRateHandoff",
      flowType: "room-detail-rate-booking",
      routePath: "/en/rooms/double_room",
      hydratedInteraction: true,
      hydratedTriggerWorked: true,
      handoffHref: "",
      handoffObservedUrl:
        "https://book.octorate.com/octobook/site/reservation/confirm.xhtml?codice=45111&checkin=2026-02-12&checkout=2026-02-14&adults=2",
      error: "",
    });

    expect(flow.checks.hasHydratedInteraction).toBe(true);
    expect(flow.checks.hasProviderHandoff).toBe(true);
    expect(flow.checks.hasRequiredBookingQuery).toBe(true);
    expect(flow.checks.passes).toBe(true);
  });

  it("maps failing flows to booking provider-handoff issue", () => {
    const passing = evaluateBookingTransactionCheck({
      flowKey: "homeModalHandoff",
      flowType: "home-modal-booking",
      routePath: "/en",
      hydratedInteraction: true,
      hydratedTriggerWorked: true,
      handoffHref:
        "https://book.octorate.com/octobook/site/reservation/result.xhtml?codice=45111&checkin=2026-02-12&checkout=2026-02-14&pax=2",
      handoffObservedUrl: "",
      error: "",
    });
    const failing = evaluateBookingTransactionCheck({
      flowKey: "roomDetailRateHandoff",
      flowType: "room-detail-rate-booking",
      routePath: "/en/rooms/double_room",
      hydratedInteraction: true,
      hydratedTriggerWorked: true,
      handoffHref: "https://example.com/booking",
      handoffObservedUrl: "",
      error: "",
    });

    const issues = collectBookingTransactionRegressionIssues({
      homeModalHandoff: passing,
      roomDetailRateHandoff: failing,
    });

    expect(issues).toHaveLength(1);
    expect(issues[0].id).toBe("booking-transaction-provider-handoff");
    expect(issues[0].priority).toBe("P0");
  });
});
