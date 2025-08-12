// apps/shop-abc/__tests__/cartPermission.test.ts
import { GET } from "../src/app/api/cart/route";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) => new Response(JSON.stringify(data), init),
  },
}));

jest.mock("@upstash/redis", () => ({ Redis: class {} }));

jest.mock("@auth", () => {
  const { hasPermission } = require("../../../packages/auth/src/permissions");
  return { getCustomerSession: jest.fn(), hasPermission };
});
import { getCustomerSession } from "@auth";

function createRequest(): Parameters<typeof GET>[0] {
  const url = "http://localhost/api/cart";
  return {
    json: async () => ({}),
    cookies: { get: () => undefined },
    nextUrl: Object.assign(new URL(url), { clone: () => new URL(url) }),
  } as any;
}

afterEach(() => {
  jest.clearAllMocks();
});

test("denies access without manage_cart permission", async () => {
  (getCustomerSession as jest.Mock).mockResolvedValue({ customerId: "c1", role: "viewer" });
  const res = await GET(createRequest());
  expect(res.status).toBe(403);
});

test("allows access with manage_cart permission", async () => {
  (getCustomerSession as jest.Mock).mockResolvedValue({ customerId: "c1", role: "customer" });
  const res = await GET(createRequest());
  expect(res.status).toBe(200);
});
