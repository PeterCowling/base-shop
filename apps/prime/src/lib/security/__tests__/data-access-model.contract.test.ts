import {
  evaluateSdkAccess,
  getFlowAccessMode,
  PRIME_GUEST_FLOW_ACCESS_MATRIX,
  shouldUseFunctionProxy,
} from "../dataAccessModel";
import { GUEST_CRITICAL_FLOW_ENDPOINTS } from "../guestCriticalFlowEndpoints";

describe("data access model contract", () => {
  it("TC-01: critical guest flows are function-only", () => {
    expect(getFlowAccessMode("booking_details")).toBe("FUNCTION_ONLY");
    expect(getFlowAccessMode("arrival_code")).toBe("FUNCTION_ONLY");
    expect(getFlowAccessMode("extension_request")).toBe("FUNCTION_ONLY");
    expect(getFlowAccessMode("meal_orders")).toBe("FUNCTION_ONLY");
    expect(getFlowAccessMode("bag_drop")).toBe("FUNCTION_ONLY");
    expect(getFlowAccessMode("staff_lookup_payload")).toBe("FUNCTION_ONLY");
    expect(getFlowAccessMode("owner_dashboard_payload")).toBe("FUNCTION_ONLY");
    expect(shouldUseFunctionProxy("booking_details")).toBe(true);
  });

  it("TC-02: SDK access fails closed when auth preconditions are missing", () => {
    const decision = evaluateSdkAccess("activities_presence", {
      hasGuestToken: false,
      isGuestAuthReady: false,
      flowFlagEnabled: false,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe("missing-guest-token");
  });

  it("TC-03: critical flow endpoint mapping exists and is API-prefixed", () => {
    Object.values(GUEST_CRITICAL_FLOW_ENDPOINTS).forEach((endpoint) => {
      expect(endpoint.startsWith("/api/")).toBe(true);
    });
    expect(PRIME_GUEST_FLOW_ACCESS_MATRIX.staff_lookup_payload).toBe("FUNCTION_ONLY");
  });
});
