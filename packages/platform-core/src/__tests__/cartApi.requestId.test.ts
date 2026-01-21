/** @jest-environment node */

import { asNextJson } from "@acme/test-utils";

import { CART_COOKIE,mockCartCookie, mockCartStore } from "./cartApi.test.utils";

// TODO: CORE-2425 - Implement x-request-id header propagation in cartApi
// These tests are skipped until the feature is implemented
describe.skip("cart API request id", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("echoes an inbound x-request-id header", async () => {
    mockCartCookie();
    mockCartStore({
      createCart: jest.fn(async () => "new"),
      getCart: jest.fn(async () => ({})),
    });
    const { GET } = await import("../cartApi");
    const res = await GET(
      asNextJson(
        {},
        {
          headers: { "x-request-id": "req_123" },
        },
      ) as any,
    );
    expect(res.headers.get("x-request-id")).toBe("req_123");
    expect(res.headers.get("Set-Cookie")).toBe(`${CART_COOKIE}=new`);
  });

  it("generates a request id when missing", async () => {
    mockCartCookie();
    mockCartStore({
      createCart: jest.fn(async () => "new"),
      getCart: jest.fn(async () => ({})),
    });
    const { GET } = await import("../cartApi");
    const res = await GET(asNextJson({}, {}) as any);
    const requestId = res.headers.get("x-request-id");
    expect(typeof requestId).toBe("string");
    expect(requestId?.length).toBeGreaterThan(0);
  });
});
