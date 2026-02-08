/**
 * @jest-environment node
 */

import { enforceStaffOwnerApiGate } from "../lib/staff-owner-gate";

describe("staff/owner api gate", () => {
  it("TC-01: production with gate disabled denies access", () => {
    const request = new Request("https://prime.example.com/api/check-in-lookup?code=BRK-ABCDE");
    const result = enforceStaffOwnerApiGate(request, {
      NODE_ENV: "production",
      PRIME_ENABLE_STAFF_OWNER_ROUTES: "false",
    });

    expect(result).not.toBeNull();
    expect(result?.status).toBe(403);
  });

  it("TC-02: production allows Cloudflare Access authenticated requests", () => {
    const request = new Request("https://prime.example.com/api/check-in-lookup?code=BRK-ABCDE", {
      headers: {
        "cf-access-authenticated-user-email": "staff@hostelbrikette.com",
      },
    });
    const result = enforceStaffOwnerApiGate(request, {
      NODE_ENV: "production",
      PRIME_ENABLE_STAFF_OWNER_ROUTES: "false",
    });

    expect(result).toBeNull();
  });

  it("TC-03: gate enabled allows expected access", () => {
    const request = new Request("https://prime.example.com/api/check-in-lookup?code=BRK-ABCDE");
    const result = enforceStaffOwnerApiGate(request, {
      NODE_ENV: "production",
      PRIME_ENABLE_STAFF_OWNER_ROUTES: "true",
    });

    expect(result).toBeNull();
  });
});
