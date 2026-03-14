/**
 * TC-12-01: PM /api/internal/shop-config — read active provider for a shop
 * TC-12-02: Unauthorized when token missing or wrong
 * TC-12-03: 400 when shopId missing
 * TC-12-04: 404 when shop not in ShopPaymentConfig
 */

import { GET } from "../route";

jest.mock("@acme/platform-core/db", () => ({
  prisma: {},
}));
jest.mock("../../../../../lib/auth/pmLog", () => ({
  pmLog: jest.fn(),
}));
jest.mock("../../../../../lib/auth/session", () => ({
  timingSafeEqual: jest.fn((a: string, b: string) => a === b),
}));

const { prisma } = require("@acme/platform-core/db");

const prismaAny = prisma as any; // PM-0004 Prisma client type varies

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env.PAYMENT_MANAGER_INTERNAL_TOKEN = "test-pm-internal-token-32chars-xxxx";
  prismaAny.shopPaymentConfig = {
    findUnique: jest.fn(),
  };
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

function makeRequest(
  shopId: string | null,
  token: string | null = "test-pm-internal-token-32chars-xxxx",
): Request {
  const url = shopId
    ? `http://localhost/api/internal/shop-config?shopId=${encodeURIComponent(shopId)}`
    : "http://localhost/api/internal/shop-config";
  const headers: Record<string, string> = {};
  if (token !== null) {
    headers["x-internal-token"] = token;
  }
  return new Request(url, { headers });
}

// TC-12-01: returns active provider for known shop
it("returns activeProvider for existing shop", async () => {
  prismaAny.shopPaymentConfig.findUnique.mockResolvedValue({
    shopId: "caryina",
    activeProvider: "axerve",
  });

  const res = await GET(makeRequest("caryina"));
  const body = await res.json();

  expect(res.status).toBe(200);
  expect(body).toEqual({ shopId: "caryina", activeProvider: "axerve" });
});

// TC-12-02: unauthorized when token is missing
it("returns 401 when x-internal-token header is absent", async () => {
  const res = await GET(makeRequest("caryina", null));
  const body = await res.json();

  expect(res.status).toBe(401);
  expect(body.error).toBe("unauthorized");
});

// TC-12-02: unauthorized when token is wrong
it("returns 401 when x-internal-token does not match", async () => {
  const res = await GET(makeRequest("caryina", "wrong-token"));
  const body = await res.json();

  expect(res.status).toBe(401);
  expect(body.error).toBe("unauthorized");
});

// TC-12-03: 400 when shopId missing from query
it("returns 400 when shopId query param is absent", async () => {
  const res = await GET(makeRequest(null));
  const body = await res.json();

  expect(res.status).toBe(400);
  expect(body.error).toBe("missing_shop_id");
});

// TC-12-04: 404 when shop has no config row
it("returns 404 when shop is not in ShopPaymentConfig", async () => {
  prismaAny.shopPaymentConfig.findUnique.mockResolvedValue(null);

  const res = await GET(makeRequest("unknown-shop"));
  const body = await res.json();

  expect(res.status).toBe(404);
  expect(body.error).toBe("not_found");
});

// TC-12-05: 500 on db error
it("returns 500 on unexpected db error", async () => {
  prismaAny.shopPaymentConfig.findUnique.mockRejectedValue(new Error("db timeout"));

  const res = await GET(makeRequest("caryina"));
  const body = await res.json();

  expect(res.status).toBe(500);
  expect(body.error).toBe("internal_error");
});
