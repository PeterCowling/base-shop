// apps/shop-abc/__tests__/cartPermission.test.ts
import { GET } from "../src/app/api/cart/route";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) => new Response(JSON.stringify(data), init),
  },
}));

jest.mock("@upstash/redis", () => ({ Redis: class {} }));

jest.mock("@auth", () => ({ requirePermission: jest.fn() }));
import { requirePermission } from "@auth";

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
  (requirePermission as jest.Mock).mockRejectedValue(new Error("Unauthorized"));
  const res = await GET(createRequest());
  expect(res.status).toBe(401);
});

test("allows access with manage_cart permission", async () => {
  (requirePermission as jest.Mock).mockResolvedValue({});
  const res = await GET(createRequest());
  expect(res.status).toBe(200);
});
