/**
 * Tests for the internal inbox recovery API route authentication and control flow.
 * Tests TASK-03 TC-01 through TC-05.
 *
 * Note: TC-06 (worker entry wrapper delegation) is verified by manual staging
 * deployment test, not unit test, because the wrapper depends on OpenNext build output.
 */

jest.mock("server-only", () => ({}));

jest.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: jest.fn(),
}));

jest.mock("../db.server", () => ({
  getInboxDb: jest.fn().mockReturnValue({}),
}));

jest.mock("../recovery.server", () => ({
  recoverStaleThreads: jest.fn(),
}));

const { getCloudflareContext } = require("@opennextjs/cloudflare");
const { recoverStaleThreads } = require("../recovery.server");
const { POST } = require("../../app/api/internal/inbox-recovery/route");

describe("POST /api/internal/inbox-recovery", () => {
  const VALID_SECRET = "test-recovery-secret-123";

  function makeRequest(headers: Record<string, string> = {}) {
    return new Request("https://localhost/api/internal/inbox-recovery", {
      method: "POST",
      headers,
    });
  }

  beforeEach(() => {
    jest.resetAllMocks();

    (getCloudflareContext as jest.Mock).mockResolvedValue({
      env: {
        INBOX_RECOVERY_SECRET: VALID_SECRET,
        INBOX_RECOVERY_ENABLED: undefined,
        INBOX_RECOVERY_STALE_HOURS: undefined,
      },
    });

    (recoverStaleThreads as jest.Mock).mockResolvedValue({
      processed: 2,
      recovered: 1,
      manualFlagged: 1,
      skipped: 0,
    });
  });

  // TC-01: Request with valid secret -> 200 response with recovery summary
  it("returns 200 with recovery summary when secret is valid", async () => {
    const response = await POST(
      makeRequest({ Authorization: `Bearer ${VALID_SECRET}` }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      enabled: true,
      processed: 2,
      recovered: 1,
      manualFlagged: 1,
      skipped: 0,
    });
    expect(recoverStaleThreads).toHaveBeenCalled();
  });

  // TC-02: Request without secret -> 401 response
  it("returns 401 when no Authorization header is provided", async () => {
    const response = await POST(makeRequest());

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(recoverStaleThreads).not.toHaveBeenCalled();
  });

  // TC-03: Request with wrong secret -> 401 response
  it("returns 401 when Authorization header has wrong secret", async () => {
    const response = await POST(
      makeRequest({ Authorization: "Bearer wrong-secret" }),
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(recoverStaleThreads).not.toHaveBeenCalled();
  });

  // TC-04: INBOX_RECOVERY_ENABLED=false -> 200 with enabled: false
  it("returns 200 with enabled: false when recovery is disabled", async () => {
    (getCloudflareContext as jest.Mock).mockResolvedValue({
      env: {
        INBOX_RECOVERY_SECRET: VALID_SECRET,
        INBOX_RECOVERY_ENABLED: "false",
      },
    });

    const response = await POST(
      makeRequest({ Authorization: `Bearer ${VALID_SECRET}` }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ success: true, enabled: false });
    expect(recoverStaleThreads).not.toHaveBeenCalled();
  });

  // TC-05: Recovery function error -> 500 response, does not crash
  it("returns 500 when recovery function throws", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    (recoverStaleThreads as jest.Mock).mockRejectedValue(new Error("D1 connection failed"));

    const response = await POST(
      makeRequest({ Authorization: `Bearer ${VALID_SECRET}` }),
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("D1 connection failed");

    consoleErrorSpy.mockRestore();
  });

  it("returns 503 when INBOX_RECOVERY_SECRET is not configured", async () => {
    (getCloudflareContext as jest.Mock).mockResolvedValue({
      env: {
        INBOX_RECOVERY_SECRET: undefined,
      },
    });

    const response = await POST(
      makeRequest({ Authorization: "Bearer some-token" }),
    );

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.success).toBe(false);
  });
});
