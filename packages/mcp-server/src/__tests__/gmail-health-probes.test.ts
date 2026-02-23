/** @jest-environment node */

import { runEmailSystemPreflight } from "../tools/health";

/**
 * Shared base options that satisfy all existing preflight checks,
 * isolating only the new gmail_api_probe and token_expiry checks.
 */
function baseOptions() {
  return {
    strict: false,
    env: {
      DATABASE_URL: "postgresql://localhost/base_shop",
      FIREBASE_DATABASE_URL: "https://firebase.example",
      FIREBASE_API_KEY: "firebase-key",
      OCTORATE_USERNAME: "operator@example.com",
      OCTORATE_PASSWORD: "secret",
    } as NodeJS.ProcessEnv,
    cwd: "/tmp/base-shop",
    fileExists: () => true,
    gmailStatus: {
      hasCredentials: true,
      hasToken: true,
      credentialsPath: "/tmp/base-shop/credentials.json",
      tokenPath: "/tmp/base-shop/token.json",
    },
    databaseProbe: async () => ({
      status: "ok" as const,
      detail: "Database probe query succeeded.",
      remediation: "No action required.",
    }),
  };
}

describe("Gmail health probes (TASK-06)", () => {
  describe("TC-01: Valid token + working API", () => {
    it("gmail_api_probe passes with latency, token_expiry passes", async () => {
      const futureExpiry = Date.now() + 30 * 86_400_000; // 30 days from now

      const result = await runEmailSystemPreflight({
        ...baseOptions(),
        gmailApiProbe: async () => ({
          status: "ok",
          detail: "Gmail API reachable — authenticated as test@example.com (42ms).",
          remediation: "No action required.",
          latency_ms: 42,
          email: "test@example.com",
        }),
        tokenExpiryCheck: () => ({
          status: "ok",
          severity: "warning",
          detail: `Token valid — expires at ${new Date(futureExpiry).toISOString()} (30 days remaining).`,
          remediation: "No action required.",
        }),
      });

      const apiProbe = result.checks.find((c) => c.key === "gmail_api_probe");
      expect(apiProbe).toBeDefined();
      expect(apiProbe?.status).toBe("ok");
      expect(apiProbe?.detail).toContain("Gmail API reachable");
      expect(apiProbe?.detail).toContain("42ms");

      const tokenExpiry = result.checks.find((c) => c.key === "token_expiry");
      expect(tokenExpiry).toBeDefined();
      expect(tokenExpiry?.status).toBe("ok");
      expect(tokenExpiry?.detail).toContain("30 days remaining");

      // Overall status should be pass when everything is ok
      expect(result.status).toBe("pass");
      expect(result.totals.fail).toBe(0);
    });
  });

  describe("TC-02: Expired token", () => {
    it("gmail_api_probe fails, token_expiry fails, overall preflight degrades", async () => {
      const pastExpiry = Date.now() - 86_400_000; // 1 day ago
      const expiredAt = new Date(pastExpiry).toISOString();

      const result = await runEmailSystemPreflight({
        ...baseOptions(),
        gmailApiProbe: async () => ({
          status: "fail",
          detail: "Gmail API probe failed: Token has been expired or revoked.",
          remediation:
            "Check network connectivity and OAuth token validity. Re-run gmail:auth if the token has expired.",
        }),
        tokenExpiryCheck: () => ({
          status: "fail",
          severity: "warning",
          detail: `Token expired at ${expiredAt}.`,
          remediation:
            "Re-run `cd packages/mcp-server && pnpm gmail:auth` to refresh the OAuth token.",
        }),
      });

      const apiProbe = result.checks.find((c) => c.key === "gmail_api_probe");
      expect(apiProbe).toBeDefined();
      expect(apiProbe?.status).toBe("fail");
      expect(apiProbe?.severity).toBe("warning");

      const tokenExpiry = result.checks.find((c) => c.key === "token_expiry");
      expect(tokenExpiry).toBeDefined();
      expect(tokenExpiry?.status).toBe("fail");
      expect(tokenExpiry?.detail).toContain("Token expired at");

      // Both are warning-severity, so overall should be warn (not fail)
      expect(result.status).toBe("warn");
      expect(result.totals.warningFailures).toBeGreaterThanOrEqual(2);
    });
  });

  describe("TC-03: Token file missing expiry_date field", () => {
    it("token_expiry warns with 'expiry unknown' message", async () => {
      const result = await runEmailSystemPreflight({
        ...baseOptions(),
        gmailApiProbe: async () => ({
          status: "ok",
          detail: "Gmail API reachable — authenticated as test@example.com (50ms).",
          remediation: "No action required.",
          latency_ms: 50,
          email: "test@example.com",
        }),
        tokenExpiryCheck: () => ({
          status: "fail",
          severity: "warning",
          detail:
            "Token expiry date unknown — cannot monitor. Published app with 6-month inactivity window.",
          remediation:
            "Token was issued without an expiry_date field. The refresh token remains valid for 6 months of inactivity. No immediate action required.",
        }),
      });

      const tokenExpiry = result.checks.find((c) => c.key === "token_expiry");
      expect(tokenExpiry).toBeDefined();
      expect(tokenExpiry?.status).toBe("fail");
      expect(tokenExpiry?.severity).toBe("warning");
      expect(tokenExpiry?.detail).toContain("expiry date unknown");
      expect(tokenExpiry?.detail).toContain("6-month inactivity window");

      // Gmail API probe should still pass
      const apiProbe = result.checks.find((c) => c.key === "gmail_api_probe");
      expect(apiProbe?.status).toBe("ok");

      // Overall status is warn (not fail) since token_expiry is warning severity
      expect(result.status).toBe("warn");
    });
  });

  describe("TC-04: API timeout (retry exhausted)", () => {
    it("gmail_api_probe fails gracefully, other preflight checks still run", async () => {
      const futureExpiry = Date.now() + 30 * 86_400_000;

      const result = await runEmailSystemPreflight({
        ...baseOptions(),
        gmailApiProbe: async () => ({
          status: "fail",
          detail:
            "Gmail API probe failed: Gmail API call failed after 2 retries: Gmail API probe timed out",
          remediation:
            "Check network connectivity and OAuth token validity. Re-run gmail:auth if the token has expired.",
        }),
        tokenExpiryCheck: () => ({
          status: "ok",
          severity: "warning",
          detail: `Token valid — expires at ${new Date(futureExpiry).toISOString()} (30 days remaining).`,
          remediation: "No action required.",
        }),
      });

      const apiProbe = result.checks.find((c) => c.key === "gmail_api_probe");
      expect(apiProbe).toBeDefined();
      expect(apiProbe?.status).toBe("fail");
      expect(apiProbe?.severity).toBe("warning"); // warning, not critical
      expect(apiProbe?.detail).toContain("timed out");

      // Token expiry should still pass
      const tokenExpiry = result.checks.find((c) => c.key === "token_expiry");
      expect(tokenExpiry?.status).toBe("ok");

      // All 9 original checks + 2 new checks = 11 total
      expect(result.checks.length).toBe(11);

      // All original checks should still be present
      const originalKeys = [
        "gmail_credentials",
        "gmail_token",
        "database_url",
        "firebase_database_url",
        "firebase_api_key",
        "octorate_storage_state",
        "octorate_username",
        "octorate_password",
        "database_probe",
      ];
      for (const key of originalKeys) {
        expect(result.checks.find((c) => c.key === key)).toBeDefined();
      }
    });
  });

  describe("TC-05: Token expiring within 24h", () => {
    it("token_expiry warns with imminent expiry message", async () => {
      const imminentExpiry = Date.now() + 12 * 3_600_000; // 12 hours from now
      const expiresAt = new Date(imminentExpiry).toISOString();

      const result = await runEmailSystemPreflight({
        ...baseOptions(),
        gmailApiProbe: async () => ({
          status: "ok",
          detail: "Gmail API reachable — authenticated as test@example.com (35ms).",
          remediation: "No action required.",
          latency_ms: 35,
          email: "test@example.com",
        }),
        tokenExpiryCheck: () => ({
          status: "fail",
          severity: "warning",
          detail: `Token expires within 24 hours (at ${expiresAt}).`,
          remediation:
            "Proactively re-run `cd packages/mcp-server && pnpm gmail:auth` to refresh the OAuth token before it expires.",
        }),
      });

      const tokenExpiry = result.checks.find((c) => c.key === "token_expiry");
      expect(tokenExpiry).toBeDefined();
      expect(tokenExpiry?.status).toBe("fail");
      expect(tokenExpiry?.severity).toBe("warning");
      expect(tokenExpiry?.detail).toContain("Token expires within 24 hours");

      // Overall status is warn (not fail)
      expect(result.status).toBe("warn");
    });
  });

  describe("existing preflight checks are unmodified", () => {
    it("all 9 original checks still present with correct keys", async () => {
      const result = await runEmailSystemPreflight({
        ...baseOptions(),
        gmailApiProbe: async () => ({
          status: "ok",
          detail: "Gmail API reachable.",
          remediation: "No action required.",
        }),
        tokenExpiryCheck: () => ({
          status: "ok",
          severity: "warning",
          detail: "Token valid.",
          remediation: "No action required.",
        }),
      });

      const expectedKeys = [
        "gmail_credentials",
        "gmail_token",
        "database_url",
        "firebase_database_url",
        "firebase_api_key",
        "octorate_storage_state",
        "octorate_username",
        "octorate_password",
        "database_probe",
        "token_expiry",
        "gmail_api_probe",
      ];

      expect(result.checks.map((c) => c.key)).toEqual(expectedKeys);
    });
  });

  describe("strict mode promotes warning-severity API probe failure", () => {
    it("strict=true with failed gmail_api_probe returns fail status", async () => {
      const result = await runEmailSystemPreflight({
        ...baseOptions(),
        strict: true,
        gmailApiProbe: async () => ({
          status: "fail",
          detail: "Gmail API probe failed: network error.",
          remediation: "Check network connectivity.",
        }),
        tokenExpiryCheck: () => ({
          status: "ok",
          severity: "warning",
          detail: "Token valid.",
          remediation: "No action required.",
        }),
      });

      // In strict mode, warning failures are promoted to fail
      expect(result.status).toBe("fail");
    });
  });
});
