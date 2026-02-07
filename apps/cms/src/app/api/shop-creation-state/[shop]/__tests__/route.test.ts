import { NextRequest } from "next/server";

jest.mock("@cms/auth/options", () => ({ authOptions: {} }));

const setSession = (session: any) => {
  const { __setMockSession } = require("next-auth") as {
    __setMockSession: (s: any) => void;
  };
  __setMockSession(session);
};

const mockReadState = jest.fn();

jest.mock("@acme/platform-core/createShop", () => ({
  readShopCreationState: (...args: unknown[]) => mockReadState(...args),
}));

let GET: typeof import("../route").GET;

beforeAll(async () => {
  ({ GET } = await import("../route"));
});

beforeEach(() => {
  jest.clearAllMocks();
});

const makeRequest = () =>
  new NextRequest("http://test.local/cms/api/shop-creation-state/demo", {
    method: "GET",
  });

describe("GET /cms/api/shop-creation-state/[shop]", () => {
  it("responds 403 when unauthorized", async () => {
    setSession(null);
    const res = await GET(makeRequest(), {
      params: Promise.resolve({ shop: "demo" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns unknown status when no creation.json exists", async () => {
    setSession({ user: { role: "admin" } });
    mockReadState.mockReturnValueOnce(null);
    const res = await GET(makeRequest(), {
      params: Promise.resolve({ shop: "demo" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ shopId: "demo", status: "unknown" });
  });

  it("returns creation state when present", async () => {
    setSession({ user: { role: "ShopAdmin" } });
    mockReadState.mockReturnValueOnce({
      shopId: "demo",
      status: "created",
      lastError: undefined,
    });
    const res = await GET(makeRequest(), {
      params: Promise.resolve({ shop: "demo" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      shopId: "demo",
      status: "created",
      lastError: undefined,
    });
  });
});


export {};
