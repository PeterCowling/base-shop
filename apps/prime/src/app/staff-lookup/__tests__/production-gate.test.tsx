import {
  canAccessStaffOwnerRoutes,
  isStaffOwnerRoutesFeatureEnabled,
} from "../../../lib/security/staffOwnerGate";

describe("staff/owner production route gate", () => {
  it("TC-01: production + gate disabled denies routes", () => {
    expect(
      canAccessStaffOwnerRoutes({
        NODE_ENV: "production",
        NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES: "false",
      }),
    ).toBe(false);
  });

  it("TC-02: production + gate disabled keeps feature flag false", () => {
    expect(
      isStaffOwnerRoutesFeatureEnabled({
        NODE_ENV: "production",
        NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES: "false",
      }),
    ).toBe(false);
  });

  it("TC-03: production + gate enabled allows routes", () => {
    expect(
      canAccessStaffOwnerRoutes({
        NODE_ENV: "production",
        NEXT_PUBLIC_ENABLE_STAFF_OWNER_ROUTES: "true",
      }),
    ).toBe(true);
  });
});
