import { type NextRequest } from "next/server";
import { __setMockSession } from "next-auth";
const validateShopEnv = jest.fn();

jest.mock("@acme/platform-core/configurator", () => ({
  validateShopEnv: (...args: any[]) => validateShopEnv(...args),
}));

jest.mock("@cms/auth/options", () => ({ authOptions: {} }));

let GET: typeof import("../route").GET;

beforeAll(async () => {
  ({ GET } = await import("../route"));
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET", () => {
  function call(shop = "s1", req: Partial<NextRequest> = {} as NextRequest) {
    return GET(req as NextRequest, { params: Promise.resolve({ shop }) });
  }

  it("returns 403 for unauthorized user", async () => {
    __setMockSession(null as any);

    const res = await call();
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body).toEqual({ error: "Forbidden" });
  });

  it("returns success when environment is valid", async () => {
    __setMockSession({ user: { role: "admin" } } as any);

    const res = await call("shop1");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(validateShopEnv).toHaveBeenCalledWith("shop1");
  });

  it("returns 400 when validation throws", async () => {
    __setMockSession({ user: { role: "admin" } } as any);
    validateShopEnv.mockImplementationOnce(() => {
      throw new Error("boom");
    });

    const res = await call();
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: "boom" });
  });
});
