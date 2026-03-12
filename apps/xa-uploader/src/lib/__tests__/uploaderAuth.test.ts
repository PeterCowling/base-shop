import {
  hasUploaderSession,
  issueUploaderSession,
  isTokenRevokedByTimestamp,
  revokeAllSessions,
  validateUploaderAdminToken,
} from "../uploaderAuth";


// Mock getUploaderKv from syncMutex.
const mockKvGet = jest.fn();
const mockKvPut = jest.fn();
const getUploaderKvMock = jest.fn();

jest.mock("../syncMutex", () => ({
  getUploaderKv: (...args: unknown[]) => getUploaderKvMock(...args),
}));

// Mock uploaderLog to verify security event logging.
const mockUploaderLog = jest.fn();
jest.mock("../uploaderLogger", () => ({
  uploaderLog: (...args: unknown[]) => mockUploaderLog(...args),
}));

const ENV_KEYS = [
  "NODE_ENV",
  "XA_UPLOADER_MODE",
  "XA_UPLOADER_VENDOR_TOKEN",
  "XA_UPLOADER_ADMIN_TOKEN",
  "XA_UPLOADER_SESSION_SECRET",
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
  getUploaderKvMock.mockReset();
  mockKvGet.mockReset();
  mockKvPut.mockReset();
  mockUploaderLog.mockClear();
});

it("uses XA_UPLOADER_VENDOR_TOKEN in vendor mode", async () => {
  process.env.NODE_ENV = "production";
  process.env.XA_UPLOADER_MODE = "vendor";
  process.env.XA_UPLOADER_ADMIN_TOKEN = "admin-token";
  process.env.XA_UPLOADER_VENDOR_TOKEN = "vendor-token";
  process.env.XA_UPLOADER_SESSION_SECRET = "test-session-secret-32-chars-minimum!";

  await expect(validateUploaderAdminToken("wrong-token")).resolves.toBe(false);
  await expect(validateUploaderAdminToken("admin-token")).resolves.toBe(false);
  await expect(validateUploaderAdminToken("vendor-token")).resolves.toBe(true);
});

it("always requires a valid session cookie", async () => {
  process.env.NODE_ENV = "development";
  process.env.XA_UPLOADER_MODE = "vendor";
  process.env.XA_UPLOADER_ADMIN_TOKEN = "admin-token";
  process.env.XA_UPLOADER_SESSION_SECRET = "test-session-secret-32-chars-minimum!";

  // No KV revocation configured — sessions should work normally.
  getUploaderKvMock.mockResolvedValue(null);

  await expect(
    hasUploaderSession(new Request("https://uploader.example/api/uploader/session")),
  ).resolves.toBe(false);

  const token = await issueUploaderSession();
  await expect(token.split(".")).toHaveLength(4);
  const requestWithCookie = new Request("https://uploader.example/api/uploader/session", {
    headers: { cookie: `xa_uploader_admin=${encodeURIComponent(token)}` },
  });
  await expect(hasUploaderSession(requestWithCookie)).resolves.toBe(true);
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
    process.env.XA_UPLOADER_ADMIN_TOKEN = "admin-token";
    process.env.XA_UPLOADER_SESSION_SECRET = "test-session-secret-32-chars-minimum!";
  });

  it("rejects session when token was issued before revocation timestamp", async () => {
    const token = await issueUploaderSession();
    const issuedAtFromToken = Number(token.split(".")[1]);

    // Set revocation timestamp to after the token was issued.
    const futureRevocation = String(issuedAtFromToken + 1000);
    mockKvGet.mockResolvedValue(futureRevocation);
    getUploaderKvMock.mockResolvedValue({
      get: mockKvGet,
      put: mockKvPut,
      delete: jest.fn(),
    });

    const request = new Request("https://uploader.example/api/uploader/session", {
      headers: { cookie: `xa_uploader_admin=${encodeURIComponent(token)}` },
    });

    await expect(hasUploaderSession(request)).resolves.toBe(false);
    expect(mockUploaderLog).toHaveBeenCalledWith(
      "warn",
      "session_revoked",
      expect.objectContaining({ issuedAt: issuedAtFromToken }),
    );
  });

  it("allows session when token was issued after revocation timestamp", async () => {
    const token = await issueUploaderSession();
    const issuedAtFromToken = Number(token.split(".")[1]);

    // Set revocation timestamp to before the token was issued.
    const pastRevocation = String(issuedAtFromToken - 1000);
    mockKvGet.mockResolvedValue(pastRevocation);
    getUploaderKvMock.mockResolvedValue({
      get: mockKvGet,
      put: mockKvPut,
      delete: jest.fn(),
    });

    const request = new Request("https://uploader.example/api/uploader/session", {
      headers: { cookie: `xa_uploader_admin=${encodeURIComponent(token)}` },
    });

    await expect(hasUploaderSession(request)).resolves.toBe(true);
  });

  it("allows session when KV returns null (no revocation key set)", async () => {
    mockKvGet.mockResolvedValue(null);
    getUploaderKvMock.mockResolvedValue({
      get: mockKvGet,
      put: mockKvPut,
      delete: jest.fn(),
    });

    const token = await issueUploaderSession();
    const request = new Request("https://uploader.example/api/uploader/session", {
      headers: { cookie: `xa_uploader_admin=${encodeURIComponent(token)}` },
    });

    await expect(hasUploaderSession(request)).resolves.toBe(true);
  });

  it("fails open when KV is unavailable (null binding)", async () => {
    getUploaderKvMock.mockResolvedValue(null);

    const token = await issueUploaderSession();
    const request = new Request("https://uploader.example/api/uploader/session", {
      headers: { cookie: `xa_uploader_admin=${encodeURIComponent(token)}` },
    });

    await expect(hasUploaderSession(request)).resolves.toBe(true);
  });

  it("fails open when KV read throws an error", async () => {
    mockKvGet.mockRejectedValue(new Error("KV network error"));
    getUploaderKvMock.mockResolvedValue({
      get: mockKvGet,
      put: mockKvPut,
      delete: jest.fn(),
    });

    const token = await issueUploaderSession();
    const request = new Request("https://uploader.example/api/uploader/session", {
      headers: { cookie: `xa_uploader_admin=${encodeURIComponent(token)}` },
    });

    await expect(hasUploaderSession(request)).resolves.toBe(true);
    expect(mockUploaderLog).toHaveBeenCalledWith(
      "warn",
      "revocation_kv_unavailable",
      expect.objectContaining({
        error: "KV network error",
      }),
    );
  });

  it("rejects token with wrong version using timing-safe comparison", async () => {
    getUploaderKvMock.mockResolvedValue(null);

    // Construct a token with "v2" version.
    const request = new Request("https://uploader.example/api/uploader/session", {
      headers: { cookie: `xa_uploader_admin=v2.${Date.now()}.nonce.fakesig` },
    });

    await expect(hasUploaderSession(request)).resolves.toBe(false);
  });
});

describe("revokeAllSessions", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "development";
    process.env.XA_UPLOADER_ADMIN_TOKEN = "admin-token";
    process.env.XA_UPLOADER_SESSION_SECRET = "test-session-secret-32-chars-minimum!";
  });

  it("writes current timestamp to revocation KV key", async () => {
    mockKvPut.mockResolvedValue(undefined);
    getUploaderKvMock.mockResolvedValue({
      get: mockKvGet,
      put: mockKvPut,
      delete: jest.fn(),
    });

    const before = Date.now();
    await revokeAllSessions();
    const after = Date.now();

    expect(mockKvPut).toHaveBeenCalledTimes(1);
    const [key, value] = mockKvPut.mock.calls[0];
    expect(key).toBe("xa:revocation:min_issued_at");
    const ts = Number(value);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it("throws when KV is not available", async () => {
    getUploaderKvMock.mockResolvedValue(null);

    await expect(revokeAllSessions()).rejects.toThrow("KV namespace not available");
  });
});
