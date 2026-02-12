import { evaluateSdkAccess } from "../../../lib/security/dataAccessModel";

describe("sdk fail-closed policy", () => {
  it("TC-01: missing guest token fails closed", () => {
    const decision = evaluateSdkAccess("activities_presence", {
      hasGuestToken: false,
      isGuestAuthReady: true,
      flowFlagEnabled: true,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe("missing-guest-token");
  });

  it("TC-02: missing auth readiness fails closed", () => {
    const decision = evaluateSdkAccess("activities_presence", {
      hasGuestToken: true,
      isGuestAuthReady: false,
      flowFlagEnabled: true,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe("auth-not-ready");
  });

  it("TC-03: feature flag off fails closed in production posture", () => {
    const decision = evaluateSdkAccess("activities_presence", {
      hasGuestToken: true,
      isGuestAuthReady: true,
      flowFlagEnabled: false,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe("flag-disabled");
  });
});
