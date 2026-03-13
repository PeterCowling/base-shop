import {
  hasInventorySession,
  issueInventorySession,
  isTokenRevokedByTimestamp,
  revokeAllInventorySessions,
  validateInventoryAdminToken,
} from "../session";

// Mock getInventoryKv from inventoryKv.
const mockKvGet = jest.fn();
const mockKvPut = jest.fn();
const getInventoryKvMock = jest.fn();

jest.mock("../inventoryKv", () => ({
  getInventoryKv: (...args: unknown[]) => getInventoryKvMock(...args),
}));

// Mock inventoryLog to verify security event logging.
const mockInventoryLog = jest.fn();
jest.mock("../inventoryLog", () => ({
  inventoryLog: (...args: unknown[]) => mockInventoryLog(...args),
}));

const ENV_KEYS = [
  "NODE_ENV",
  "INVENTORY_ADMIN_TOKEN",
  "INVENTORY_SESSION_SECRET",
  "INVENTORY_E2E_ADMIN_TOKEN",
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
  getInventoryKvMock.mockReset();
  mockKvGet.mockReset();
  mockKvPut.mockReset();
  mockInventoryLog.mockClear();
});

it("issues and verifies a session token", async () => {
  process.env.NODE_ENV = "development";
  process.env.INVENTORY_ADMIN_TOKEN = "admin-token";
  process.env.INVENTORY_SESSION_SECRET = "test-session-secret-32-chars-minimum!";

  getInventoryKvMock.mockResolvedValue(null);

  await expect(
    hasInventorySession(new Request("https://inventory.example/api/inventory/login")),
  ).resolves.toBe(false);

  const token = await issueInventorySession();
  expect(token.split(".")).toHaveLength(4);
  const requestWithCookie = new Request("https://inventory.example/api/inventory/login", {
    headers: { cookie: `inventory_admin=${encodeURIComponent(token)}` },
  });
  await expect(hasInventorySession(requestWithCookie)).resolves.toBe(true);
});

it("rejects a tampered token", async () => {
  process.env.NODE_ENV = "development";
  process.env.INVENTORY_ADMIN_TOKEN = "admin-token";
  process.env.INVENTORY_SESSION_SECRET = "test-session-secret-32-chars-minimum!";

  getInventoryKvMock.mockResolvedValue(null);

  const request = new Request("https://inventory.example/api/inventory/login", {
    headers: { cookie: "inventory_admin=v1.12345.nonce.badsignature" },
  });
  await expect(hasInventorySession(request)).resolves.toBe(false);
});

it("rejects token with wrong version using timing-safe comparison", async () => {
  process.env.NODE_ENV = "development";
  process.env.INVENTORY_ADMIN_TOKEN = "admin-token";
  process.env.INVENTORY_SESSION_SECRET = "test-session-secret-32-chars-minimum!";

  getInventoryKvMock.mockResolvedValue(null);

  const request = new Request("https://inventory.example/api/inventory/login", {
    headers: { cookie: `inventory_admin=v2.${Date.now()}.nonce.fakesig` },
  });
  await expect(hasInventorySession(request)).resolves.toBe(false);
});

it("validates admin token correctly", async () => {
  process.env.NODE_ENV = "production";
  process.env.INVENTORY_ADMIN_TOKEN = "correct-admin-token-32-chars-xxxx!";
  process.env.INVENTORY_SESSION_SECRET = "test-session-secret-32-chars-minimum!";

  await expect(validateInventoryAdminToken("wrong-token")).resolves.toBe(false);
  await expect(validateInventoryAdminToken("correct-admin-token-32-chars-xxxx!")).resolves.toBe(true);
});

it("uses INVENTORY_E2E_ADMIN_TOKEN in non-production", async () => {
  process.env.NODE_ENV = "development";
  process.env.INVENTORY_ADMIN_TOKEN = "production-token-32-chars-xxxxxx!";
  process.env.INVENTORY_E2E_ADMIN_TOKEN = "e2e-override-token";
  process.env.INVENTORY_SESSION_SECRET = "test-session-secret-32-chars-minimum!";

  await expect(validateInventoryAdminToken("production-token-32-chars-xxxxxx!")).resolves.toBe(false);
  await expect(validateInventoryAdminToken("e2e-override-token")).resolves.toBe(true);
});

it("does not use INVENTORY_E2E_ADMIN_TOKEN in production", async () => {
  process.env.NODE_ENV = "production";
  process.env.INVENTORY_ADMIN_TOKEN = "production-token-32-chars-xxxxxx!";
  process.env.INVENTORY_E2E_ADMIN_TOKEN = "e2e-override-token";
  process.env.INVENTORY_SESSION_SECRET = "test-session-secret-32-chars-minimum!";

  await expect(validateInventoryAdminToken("e2e-override-token")).resolves.toBe(false);
  await expect(validateInventoryAdminToken("production-token-32-chars-xxxxxx!")).resolves.toBe(true);
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
    process.env.INVENTORY_ADMIN_TOKEN = "admin-token";
    process.env.INVENTORY_SESSION_SECRET = "test-session-secret-32-chars-minimum!";
  });

  it("rejects session when token was issued before revocation timestamp", async () => {
    const token = await issueInventorySession();
    const issuedAtFromToken = Number(token.split(".")[1]);

    const futureRevocation = String(issuedAtFromToken + 1000);
    mockKvGet.mockResolvedValue(futureRevocation);
    getInventoryKvMock.mockResolvedValue({
      get: mockKvGet,
      put: mockKvPut,
      delete: jest.fn(),
    });

    const request = new Request("https://inventory.example/api/inventory/login", {
      headers: { cookie: `inventory_admin=${encodeURIComponent(token)}` },
    });

    await expect(hasInventorySession(request)).resolves.toBe(false);
    expect(mockInventoryLog).toHaveBeenCalledWith(
      "warn",
      "session_revoked",
      expect.objectContaining({ issuedAt: issuedAtFromToken }),
    );
  });

  it("allows session when token was issued after revocation timestamp", async () => {
    const token = await issueInventorySession();
    const issuedAtFromToken = Number(token.split(".")[1]);

    const pastRevocation = String(issuedAtFromToken - 1000);
    mockKvGet.mockResolvedValue(pastRevocation);
    getInventoryKvMock.mockResolvedValue({
      get: mockKvGet,
      put: mockKvPut,
      delete: jest.fn(),
    });

    const request = new Request("https://inventory.example/api/inventory/login", {
      headers: { cookie: `inventory_admin=${encodeURIComponent(token)}` },
    });

    await expect(hasInventorySession(request)).resolves.toBe(true);
  });

  it("allows session when KV returns null (no revocation key set)", async () => {
    mockKvGet.mockResolvedValue(null);
    getInventoryKvMock.mockResolvedValue({
      get: mockKvGet,
      put: mockKvPut,
      delete: jest.fn(),
    });

    const token = await issueInventorySession();
    const request = new Request("https://inventory.example/api/inventory/login", {
      headers: { cookie: `inventory_admin=${encodeURIComponent(token)}` },
    });

    await expect(hasInventorySession(request)).resolves.toBe(true);
  });

  it("fails open when KV is unavailable (null binding)", async () => {
    getInventoryKvMock.mockResolvedValue(null);

    const token = await issueInventorySession();
    const request = new Request("https://inventory.example/api/inventory/login", {
      headers: { cookie: `inventory_admin=${encodeURIComponent(token)}` },
    });

    await expect(hasInventorySession(request)).resolves.toBe(true);
  });

  it("fails open when KV read throws an error", async () => {
    mockKvGet.mockRejectedValue(new Error("KV network error"));
    getInventoryKvMock.mockResolvedValue({
      get: mockKvGet,
      put: mockKvPut,
      delete: jest.fn(),
    });

    const token = await issueInventorySession();
    const request = new Request("https://inventory.example/api/inventory/login", {
      headers: { cookie: `inventory_admin=${encodeURIComponent(token)}` },
    });

    await expect(hasInventorySession(request)).resolves.toBe(true);
    expect(mockInventoryLog).toHaveBeenCalledWith(
      "warn",
      "revocation_kv_unavailable",
      expect.objectContaining({
        error: "KV network error",
      }),
    );
  });
});

describe("revokeAllInventorySessions", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "development";
    process.env.INVENTORY_ADMIN_TOKEN = "admin-token";
    process.env.INVENTORY_SESSION_SECRET = "test-session-secret-32-chars-minimum!";
  });

  it("writes current timestamp to revocation KV key", async () => {
    mockKvPut.mockResolvedValue(undefined);
    getInventoryKvMock.mockResolvedValue({
      get: mockKvGet,
      put: mockKvPut,
      delete: jest.fn(),
    });

    const before = Date.now();
    await revokeAllInventorySessions();
    const after = Date.now();

    expect(mockKvPut).toHaveBeenCalledTimes(1);
    const [key, value] = mockKvPut.mock.calls[0];
    expect(key).toBe("inventory:revocation:min_issued_at");
    const ts = Number(value);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it("throws when KV is not available", async () => {
    getInventoryKvMock.mockResolvedValue(null);

    await expect(revokeAllInventorySessions()).rejects.toThrow("KV namespace not available");
  });
});
