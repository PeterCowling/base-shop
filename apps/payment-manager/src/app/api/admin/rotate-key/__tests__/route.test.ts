import { encrypt, generateEncryptionKey } from "../../../../../lib/crypto/credentials";
import { POST } from "../route";

// Mock @opennextjs/cloudflare (ESM-only — not compatible with Jest CommonJS transform).
jest.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: jest.fn().mockResolvedValue({ env: {} }),
}));

// Mock Prisma client.
jest.mock("@acme/platform-core/db", () => ({
  prisma: {},
}));

// Mock pmLog to suppress test output.
jest.mock("../../../../../lib/auth/pmLog", () => ({
  pmLog: jest.fn(),
}));

// Get a mutable reference to the prisma mock object.
 
const { prisma } = require("@acme/platform-core/db");

const ADMIN_TOKEN = "admin-token-payment-manager-rotate-32x!";
const SESSION_SECRET = "test-session-secret-32-chars-minimum!";

const ORIGINAL_ENV: Record<string, string | undefined> = {
  NODE_ENV: process.env.NODE_ENV,
  PAYMENT_MANAGER_ADMIN_TOKEN: process.env.PAYMENT_MANAGER_ADMIN_TOKEN,
  PAYMENT_MANAGER_SESSION_SECRET: process.env.PAYMENT_MANAGER_SESSION_SECRET,
  PAYMENT_MANAGER_ENCRYPTION_KEY: process.env.PAYMENT_MANAGER_ENCRYPTION_KEY,
  PAYMENT_MANAGER_E2E_ADMIN_TOKEN: process.env.PAYMENT_MANAGER_E2E_ADMIN_TOKEN,
};

beforeEach(() => {
  process.env.NODE_ENV = "test";
  process.env.PAYMENT_MANAGER_ADMIN_TOKEN = ADMIN_TOKEN;
  process.env.PAYMENT_MANAGER_SESSION_SECRET = SESSION_SECRET;
  // Reset prisma mock surfaces
  delete (prisma as Record<string, unknown>).shopProviderCredential;
  delete (prisma as Record<string, unknown>).$transaction;
});

afterEach(() => {
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

function makeRequest(body: unknown, token?: string): Request {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  // eslint-disable-next-line security/detect-possible-timing-attacks -- test helper: checking undefined, not a security comparison
  if (token !== undefined) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return new Request("https://pm.example/api/admin/rotate-key", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

// TC-03-05: invalid/missing token → 401
describe("authentication gate", () => {
  it("returns 401 when Authorization header is missing", async () => {
    const req = new Request("https://pm.example/api/admin/rotate-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newKey: "somekey" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.ok).toBe(false);
  });

  it("returns 401 when token is wrong", async () => {
    const req = makeRequest({ newKey: "somekey" }, "wrong-token");
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});

// TC-03-04: valid token, credentials present → reEncrypted count returned, all readable with new key
describe("successful rotation", () => {
  it("re-encrypts all credential rows and returns correct count", async () => {
    const currentKey = await generateEncryptionKey();
    const newKey = await generateEncryptionKey();

    process.env.PAYMENT_MANAGER_ENCRYPTION_KEY = currentKey;
    process.env.PAYMENT_MANAGER_E2E_ADMIN_TOKEN = ADMIN_TOKEN;

    // Set up 3 credential rows encrypted with current key.
    const credValues = ["stripe-sk-live-aaa", "stripe-sk-live-bbb", "axerve-secret-ccc"];
    const encryptedRows = await Promise.all(
      credValues.map(async (v, i) => ({
        shopId: `shop-${i}`,
        provider: i < 2 ? "stripe" : "axerve",
        credentialKey: "apiKey",
        encryptedValue: await encrypt(v, currentKey),
      })),
    );

    const updatedRows: Array<{ encryptedValue: string }> = [];

    prisma.shopProviderCredential = {
      findMany: jest.fn().mockResolvedValue(encryptedRows),
      update: jest.fn().mockImplementation(({ data }: { data: { encryptedValue: string } }) => {
        updatedRows.push(data);
        return Promise.resolve(data);
      }),
    };
    prisma.$transaction = jest.fn().mockImplementation(
      (ops: Promise<unknown>[]) => Promise.all(ops),
    );

    const req = makeRequest({ newKey }, ADMIN_TOKEN);
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.reEncrypted).toBe(3);

    // Verify all rows were updated and can be decrypted with new key.
    expect(updatedRows).toHaveLength(3);
    const { decrypt: decryptFn } = await import(
      "../../../../../lib/crypto/credentials"
    );
    for (let i = 0; i < 3; i++) {
      const decrypted = await decryptFn(updatedRows[i]!.encryptedValue, newKey);
      expect(decrypted).toBe(credValues[i]);
    }
  });

  it("returns reEncrypted: 0 when no credentials exist", async () => {
    const currentKey = await generateEncryptionKey();
    const newKey = await generateEncryptionKey();

    process.env.PAYMENT_MANAGER_ENCRYPTION_KEY = currentKey;
    process.env.PAYMENT_MANAGER_E2E_ADMIN_TOKEN = ADMIN_TOKEN;

    prisma.shopProviderCredential = {
      findMany: jest.fn().mockResolvedValue([]),
    };

    const req = makeRequest({ newKey }, ADMIN_TOKEN);
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.reEncrypted).toBe(0);
  });
});

// TC-03-06: transaction aborts atomically if any row fails
describe("atomic abort on failure", () => {
  it("returns 500 and does not call $transaction when a row fails to decrypt", async () => {
    const currentKey = await generateEncryptionKey();
    const newKey = await generateEncryptionKey();

    process.env.PAYMENT_MANAGER_ENCRYPTION_KEY = currentKey;
    process.env.PAYMENT_MANAGER_E2E_ADMIN_TOKEN = ADMIN_TOKEN;

    // One valid row, one corrupt row (will fail to decrypt with current key)
    const validRow = {
      shopId: "shop-0",
      provider: "stripe",
      credentialKey: "apiKey",
      encryptedValue: await encrypt("valid-secret", currentKey),
    };
    const corruptRow = {
      shopId: "shop-1",
      provider: "axerve",
      credentialKey: "apiKey",
      encryptedValue: "dGhpc2lzbm90YXZhbGlkY2lwaGVydGV4dHh4", // base64 but not a valid GCM ciphertext
    };

    const mockTransaction = jest.fn();
    prisma.shopProviderCredential = {
      findMany: jest.fn().mockResolvedValue([validRow, corruptRow]),
      update: jest.fn(),
    };
    prisma.$transaction = mockTransaction;

    const req = makeRequest({ newKey }, ADMIN_TOKEN);
    const res = await POST(req);

    // Should return 500 — rotation aborted due to decrypt failure
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.ok).toBe(false);

    // Transaction must NOT have been called (error happens during pre-computation before transaction)
    expect(mockTransaction).not.toHaveBeenCalled();
  });
});

// Additional validation: missing body fields → 400
it("returns 400 when newKey is missing from body", async () => {
  process.env.PAYMENT_MANAGER_E2E_ADMIN_TOKEN = ADMIN_TOKEN;
  const req = makeRequest({}, ADMIN_TOKEN);
  const res = await POST(req);
  expect(res.status).toBe(400);
});
