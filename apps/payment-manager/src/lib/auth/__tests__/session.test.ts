import {
  hasPmSession,
  issuePmSession,
  isTokenRevokedByTimestamp,
  revokeAllPmSessions,
  validatePmAdminToken,
} from "../session";

// Mock getPmKv from pmKv.
const mockKvGet = jest.fn();
const mockKvPut = jest.fn();
const getPmKvMock = jest.fn();

jest.mock("../pmKv", () => ({
  getPmKv: (...args: unknown[]) => getPmKvMock(...args),
}));

// Mock pmLog to verify security event logging.
const mockPmLog = jest.fn();
jest.mock("../pmLog", () => ({
  pmLog: (...args: unknown[]) => mockPmLog(...args),
}));

const ENV_KEYS = [
  "NODE_ENV",
  "PAYMENT_MANAGER_ADMIN_TOKEN",
  "PAYMENT_MANAGER_SESSION_SECRET",
  "PAYMENT_MANAGER_E2E_ADMIN_TOKEN",
] as const;

const ORIGINAL_ENV = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]]),
);

afterEach(() => {
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  getPmKvMock.mockReset();
  mockKvGet.mockReset();
  mockKvPut.mockReset();
  mockPmLog.mockClear();
});

it("issues and verifies a session token when KV has no revocation key", async () => {
  process.env.NODE_ENV = "development";
  process.env.PAYMENT_MANAGER_ADMIN_TOKEN = "admin-token-payment-manager-32chars!";
  process.env.PAYMENT_MANAGER_SESSION_SECRET = "test-session-secret-32-chars-minimum!";

  // KV is bound but has no revocation key set.
  mockKvGet.mockResolvedValue(null);
  getPmKvMock.mockResolvedValue({
    get: mockKvGet,
    put: mockKvPut,
    delete: jest.fn(),
  });

  await expect(
    hasPmSession(new Request("https://pm.example/api/auth/login")),
  ).resolves.toBe(false);

  const token = await issuePmSession();
  expect(token.split(".")).toHaveLength(4);
  const requestWithCookie = new Request("https://pm.example/api/auth/login", {
    headers: { cookie: `payment_manager_admin=${encodeURIComponent(token)}` },
  });
  await expect(hasPmSession(requestWithCookie)).resolves.toBe(true);
});

it("rejects a tampered token", async () => {
  process.env.NODE_ENV = "development";
  process.env.PAYMENT_MANAGER_ADMIN_TOKEN = "admin-token-payment-manager-32chars!";
  process.env.PAYMENT_MANAGER_SESSION_SECRET = "test-session-secret-32-chars-minimum!";

  getPmKvMock.mockResolvedValue(null);

  const request = new Request("https://pm.example/api/auth/login", {
    headers: { cookie: "payment_manager_admin=v1.12345.nonce.badsignature" },
  });
  await expect(hasPmSession(request)).resolves.toBe(false);
});

it("validates admin token correctly", async () => {
  process.env.NODE_ENV = "production";
  process.env.PAYMENT_MANAGER_ADMIN_TOKEN = "correct-admin-token-pm-32-chars-xxxx!";
  process.env.PAYMENT_MANAGER_SESSION_SECRET = "test-session-secret-32-chars-minimum!";

  await expect(validatePmAdminToken("wrong-token")).resolves.toBe(false);
  await expect(validatePmAdminToken("correct-admin-token-pm-32-chars-xxxx!")).resolves.toBe(true);
});

it("uses PAYMENT_MANAGER_E2E_ADMIN_TOKEN in non-production", async () => {
  process.env.NODE_ENV = "development";
  process.env.PAYMENT_MANAGER_ADMIN_TOKEN = "production-token-pm-32-chars-xxxxx!";
  process.env.PAYMENT_MANAGER_E2E_ADMIN_TOKEN = "e2e-override-token";
  process.env.PAYMENT_MANAGER_SESSION_SECRET = "test-session-secret-32-chars-minimum!";

  await expect(validatePmAdminToken("production-token-pm-32-chars-xxxxx!")).resolves.toBe(false);
  await expect(validatePmAdminToken("e2e-override-token")).resolves.toBe(true);
});

describe("isTokenRevokedByTimestamp", () => {
  it("returns false when minIssuedAt is null (no revocation set)", () => {
    expect(isTokenRevokedByTimestamp(1000, null)).toBe(false);
  });

  it("returns true when token issuedAt is before minIssuedAt", () => {
    expect(isTokenRevokedByTimestamp(1000, 2000)).toBe(true);
  });

  it("returns false when token issuedAt is after minIssuedAt", () => {
    expect(isTokenRevokedByTimestamp(3000, 2000)).toBe(false);
  });

  it("returns false when minIssuedAt is NaN", () => {
    expect(isTokenRevokedByTimestamp(1000, NaN)).toBe(false);
  });

  it("returns false when token issuedAt equals minIssuedAt", () => {
    expect(isTokenRevokedByTimestamp(2000, 2000)).toBe(false);
  });
});

describe("session revocation via KV", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "development";
    process.env.PAYMENT_MANAGER_ADMIN_TOKEN = "admin-token-payment-manager-32chars!";
    process.env.PAYMENT_MANAGER_SESSION_SECRET = "test-session-secret-32-chars-minimum!";
  });

  it("rejects session when token was issued before revocation timestamp", async () => {
    const token = await issuePmSession();
    const issuedAtFromToken = Number(token.split(".")[1]);

    const futureRevocation = String(issuedAtFromToken + 1000);
    mockKvGet.mockResolvedValue(futureRevocation);
    getPmKvMock.mockResolvedValue({
      get: mockKvGet,
      put: mockKvPut,
      delete: jest.fn(),
    });

    const request = new Request("https://pm.example/api/auth/login", {
      headers: { cookie: `payment_manager_admin=${encodeURIComponent(token)}` },
    });

    await expect(hasPmSession(request)).resolves.toBe(false);
    expect(mockPmLog).toHaveBeenCalledWith(
      "warn",
      "session_revoked",
      expect.objectContaining({ issuedAt: issuedAtFromToken }),
    );
  });

  it("allows session when token was issued after revocation timestamp", async () => {
    const token = await issuePmSession();
    const issuedAtFromToken = Number(token.split(".")[1]);

    const pastRevocation = String(issuedAtFromToken - 1000);
    mockKvGet.mockResolvedValue(pastRevocation);
    getPmKvMock.mockResolvedValue({
      get: mockKvGet,
      put: mockKvPut,
      delete: jest.fn(),
    });

    const request = new Request("https://pm.example/api/auth/login", {
      headers: { cookie: `payment_manager_admin=${encodeURIComponent(token)}` },
    });

    await expect(hasPmSession(request)).resolves.toBe(true);
  });

  it("allows session when KV returns null (no revocation key set)", async () => {
    mockKvGet.mockResolvedValue(null);
    getPmKvMock.mockResolvedValue({
      get: mockKvGet,
      put: mockKvPut,
      delete: jest.fn(),
    });

    const token = await issuePmSession();
    const request = new Request("https://pm.example/api/auth/login", {
      headers: { cookie: `payment_manager_admin=${encodeURIComponent(token)}` },
    });

    await expect(hasPmSession(request)).resolves.toBe(true);
  });

  // CRITICAL DEVIATION FROM INVENTORY-UPLOADER:
  // Payment-manager fails CLOSED (denies session) when KV is unavailable.
  // Inventory-uploader fails open. This is intentional — financial tool
  // requires that KV must be properly bound before sessions are valid.
  it("fails CLOSED when KV binding is null (denies session)", async () => {
    getPmKvMock.mockResolvedValue(null);

    const token = await issuePmSession();
    const request = new Request("https://pm.example/api/auth/login", {
      headers: { cookie: `payment_manager_admin=${encodeURIComponent(token)}` },
    });

    // Must return false (denied) when KV not bound — fail-closed behavior.
    await expect(hasPmSession(request)).resolves.toBe(false);
    expect(mockPmLog).toHaveBeenCalledWith(
      "warn",
      "revocation_kv_not_bound",
      expect.objectContaining({ message: expect.stringContaining("failing closed") }),
    );
  });

  it("fails CLOSED when KV read throws an error (denies session)", async () => {
    mockKvGet.mockRejectedValue(new Error("KV network error"));
    getPmKvMock.mockResolvedValue({
      get: mockKvGet,
      put: mockKvPut,
      delete: jest.fn(),
    });

    const token = await issuePmSession();
    const request = new Request("https://pm.example/api/auth/login", {
      headers: { cookie: `payment_manager_admin=${encodeURIComponent(token)}` },
    });

    // Must return false (denied) when KV read fails — fail-closed behavior.
    await expect(hasPmSession(request)).resolves.toBe(false);
    expect(mockPmLog).toHaveBeenCalledWith(
      "warn",
      "revocation_kv_unavailable",
      expect.objectContaining({
        error: "KV network error",
      }),
    );
  });

  it("fails CLOSED with corrupt revocation timestamp (denies session)", async () => {
    mockKvGet.mockResolvedValue("not-a-number");
    getPmKvMock.mockResolvedValue({
      get: mockKvGet,
      put: mockKvPut,
      delete: jest.fn(),
    });

    const token = await issuePmSession();
    const request = new Request("https://pm.example/api/auth/login", {
      headers: { cookie: `payment_manager_admin=${encodeURIComponent(token)}` },
    });

    // Must return false (denied) when revocation state is corrupt — fail-closed.
    await expect(hasPmSession(request)).resolves.toBe(false);
    expect(mockPmLog).toHaveBeenCalledWith(
      "warn",
      "revocation_invalid_timestamp",
      expect.objectContaining({ raw: "not-a-number" }),
    );
  });
});

describe("revokeAllPmSessions", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "development";
    process.env.PAYMENT_MANAGER_ADMIN_TOKEN = "admin-token-payment-manager-32chars!";
    process.env.PAYMENT_MANAGER_SESSION_SECRET = "test-session-secret-32-chars-minimum!";
  });

  it("writes current timestamp to revocation KV key", async () => {
    mockKvPut.mockResolvedValue(undefined);
    getPmKvMock.mockResolvedValue({
      get: mockKvGet,
      put: mockKvPut,
      delete: jest.fn(),
    });

    const before = Date.now();
    await revokeAllPmSessions();
    const after = Date.now();

    expect(mockKvPut).toHaveBeenCalledTimes(1);
    const [key, value] = mockKvPut.mock.calls[0];
    expect(key).toBe("pm:revocation:min_issued_at");
    const ts = Number(value);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it("throws when KV is not available", async () => {
    getPmKvMock.mockResolvedValue(null);

    await expect(revokeAllPmSessions()).rejects.toThrow("KV namespace not available");
  });
});
