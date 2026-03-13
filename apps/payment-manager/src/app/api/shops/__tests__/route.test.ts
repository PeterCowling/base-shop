/**
 * TC-06: Shop config API tests
 */

jest.mock("@acme/platform-core/db", () => ({
  prisma: {},
}));
jest.mock("../../../lib/auth/pmLog", () => ({
  pmLog: jest.fn(),
}));
jest.mock("../../../lib/auth/session", () => ({
  hasPmSession: jest.fn(),
}));
jest.mock("../../../lib/crypto/credentials", () => ({
  encrypt: jest.fn(),
  decrypt: jest.fn(),
}));
jest.mock("@acme/stripe", () => ({
  stripe: {
    accounts: { retrieve: jest.fn() },
  },
}));

const { prisma } = require("@acme/platform-core/db"); // jest hoisting pattern
const { hasPmSession } = require("../../../lib/auth/session") as { hasPmSession: jest.Mock }; // jest hoisting pattern
const { encrypt, decrypt } = require("../../../lib/crypto/credentials") as { encrypt: jest.Mock; decrypt: jest.Mock }; // jest hoisting pattern

const prismaAny = prisma as any; // PM-0004 Prisma client type varies

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  (hasPmSession as jest.Mock).mockResolvedValue(true);
  prismaAny.shopPaymentConfig = {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    upsert: jest.fn(),
  };
  prismaAny.shopProviderCredential = {
    findMany: jest.fn().mockResolvedValue([]),
    upsert: jest.fn(),
  };
  prismaAny.paymentConfigAudit = {
    create: jest.fn().mockResolvedValue({ id: 1 }),
  };
  (encrypt as jest.Mock).mockImplementation(async (v: string) => `encrypted:${v}`);
  (decrypt as jest.Mock).mockImplementation(async (v: string) => v.replace("encrypted:", ""));

  process.env.PAYMENT_MANAGER_ENCRYPTION_KEY = "dGVzdGtleXRlc3RrZXl0ZXN0a2V5dGVzdGtleXRlc3Q="; // 32 bytes base64
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  jest.restoreAllMocks();
});

function makeRequest(method: string, url: string, body?: unknown): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

// ── TC-06-01: PUT /api/shops/:shopId/config ──────────────────────────────────

describe("PUT /api/shops/:shopId/config", () => {
  it("TC-06-01: updates activeProvider and writes PaymentConfigAudit record", async () => {
    const { PUT } = await import("../[shopId]/config/route");

    prismaAny.shopPaymentConfig.findUnique.mockResolvedValue({
      activeProvider: "axerve",
    });
    prismaAny.shopPaymentConfig.upsert.mockResolvedValue({
      shopId: "caryina",
      activeProvider: "stripe",
      updatedAt: new Date("2026-03-13T12:00:00Z"),
    });

    const res = await PUT(
      makeRequest("PUT", "http://localhost/api/shops/caryina/config", { activeProvider: "stripe" }),
      { params: Promise.resolve({ shopId: "caryina" }) },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.activeProvider).toBe("stripe");
    expect(body.shopId).toBe("caryina");

    // Audit record written
    expect(prismaAny.paymentConfigAudit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          shopId: "caryina",
          field: "activeProvider",
          oldValue: "axerve",
          newValue: "stripe",
        }),
      }),
    );
  });

  it("returns 400 for invalid provider value", async () => {
    const { PUT } = await import("../[shopId]/config/route");

    const res = await PUT(
      makeRequest("PUT", "http://localhost/api/shops/caryina/config", { activeProvider: "paypal" }),
      { params: Promise.resolve({ shopId: "caryina" }) },
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/activeProvider/);
  });

  it("returns 401 when session invalid", async () => {
    const { PUT } = await import("../[shopId]/config/route");
    (hasPmSession as jest.Mock).mockResolvedValue(false);

    const res = await PUT(
      makeRequest("PUT", "http://localhost/api/shops/caryina/config", { activeProvider: "stripe" }),
      { params: Promise.resolve({ shopId: "caryina" }) },
    );
    expect(res.status).toBe(401);
  });
});

// ── TC-06-02: GET /api/shops/:shopId/credentials/:provider ───────────────────

describe("GET /api/shops/:shopId/credentials/:provider", () => {
  it("TC-06-02: returns masked credentials (never decrypted values)", async () => {
    const { GET } = await import("../[shopId]/credentials/[provider]/route");

    prismaAny.shopProviderCredential.findMany.mockResolvedValue([
      { credentialKey: "apiKey", encryptedValue: "encrypted:sk_live_abc1234567890" },
    ]);

    const res = await GET(
      makeRequest("GET", "http://localhost/api/shops/caryina/credentials/stripe"),
      { params: Promise.resolve({ shopId: "caryina", provider: "stripe" }) },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    // Credentials are masked — the actual encrypted blob is not returned
    expect(body.credentials).toBeDefined();
    expect(body.credentials["apiKey"]).toBe("****");
    // Decrypted value never exposed
    expect(JSON.stringify(body)).not.toContain("sk_live");
  });
});

// ── TC-06-03: PUT /api/shops/:shopId/credentials/:provider ───────────────────

describe("PUT /api/shops/:shopId/credentials/:provider", () => {
  it("TC-06-03: encrypts and stores credential; encrypted value != plaintext", async () => {
    const { PUT } = await import("../[shopId]/credentials/[provider]/route");

    const res = await PUT(
      makeRequest("PUT", "http://localhost/api/shops/caryina/credentials/stripe", {
        credentials: { apiKey: "sk_live_secretkey1234" },
      }),
      { params: Promise.resolve({ shopId: "caryina", provider: "stripe" }) },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.credentials["apiKey"]).not.toBe("sk_live_secretkey1234"); // masked, not plain
    expect(body.credentials["apiKey"]).toMatch(/\*{4}/); // masked format

    // encrypt was called with the plaintext
    expect(encrypt).toHaveBeenCalledWith("sk_live_secretkey1234", expect.any(String));

    // upsert was called with encrypted value
    expect(prismaAny.shopProviderCredential.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          credentialKey: "apiKey",
          encryptedValue: expect.stringContaining("encrypted:"),
        }),
      }),
    );
  });
});

// ── TC-06-04 / TC-06-05: POST .../test ───────────────────────────────────────

describe("POST /api/shops/:shopId/credentials/:provider/test", () => {
  it("TC-06-04: Stripe valid key mock → 200 { ok: true }", async () => {
    const { POST } = await import("../[shopId]/credentials/[provider]/test/route");

    prismaAny.shopProviderCredential.findMany.mockResolvedValue([
      { credentialKey: "apiKey", encryptedValue: "encrypted:sk_live_test" },
    ]);
    (decrypt as jest.Mock).mockResolvedValue("sk_live_test");

    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "acct_123" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const res = await POST(
      makeRequest("POST", "http://localhost/api/shops/caryina/credentials/stripe/test"),
      { params: Promise.resolve({ shopId: "caryina", provider: "stripe" }) },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("TC-06-05: Stripe invalid key mock → 200 { ok: false, error: ... }", async () => {
    const { POST } = await import("../[shopId]/credentials/[provider]/test/route");

    prismaAny.shopProviderCredential.findMany.mockResolvedValue([
      { credentialKey: "apiKey", encryptedValue: "encrypted:sk_bad_key" },
    ]);
    (decrypt as jest.Mock).mockResolvedValue("sk_bad_key");

    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "No such API key" } }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const res = await POST(
      makeRequest("POST", "http://localhost/api/shops/caryina/credentials/stripe/test"),
      { params: Promise.resolve({ shopId: "caryina", provider: "stripe" }) },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/No such API key/i);
  });

  it("returns 404 when no credentials stored", async () => {
    const { POST } = await import("../[shopId]/credentials/[provider]/test/route");

    prismaAny.shopProviderCredential.findMany.mockResolvedValue([]);

    const res = await POST(
      makeRequest("POST", "http://localhost/api/shops/caryina/credentials/stripe/test"),
      { params: Promise.resolve({ shopId: "caryina", provider: "stripe" }) },
    );
    expect(res.status).toBe(404);
  });

  it("Axerve valid format → 200 { ok: true }", async () => {
    const { POST } = await import("../[shopId]/credentials/[provider]/test/route");

    prismaAny.shopProviderCredential.findMany.mockResolvedValue([
      { credentialKey: "shopLogin", encryptedValue: "encrypted:myshopname" },
      { credentialKey: "apiKey", encryptedValue: "encrypted:abc12345key" },
    ]);
    (decrypt as jest.Mock).mockImplementation(async (v: string) => v.replace("encrypted:", ""));

    const res = await POST(
      makeRequest("POST", "http://localhost/api/shops/caryina/credentials/axerve/test"),
      { params: Promise.resolve({ shopId: "caryina", provider: "axerve" }) },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
