import { type NextRequest } from "next/server";

const getServerSession = jest.fn();
const validateShopEnv = jest.fn();

jest.mock("next-auth", () => ({
  getServerSession: (...args: any[]) => getServerSession(...args),
}));

jest.mock("@platform-core/configurator", () => ({
  validateShopEnv: (...args: any[]) => validateShopEnv(...args),
}));

jest.mock("@cms/auth/options", () => ({ authOptions: {} }));

let GET: typeof import("./route").GET;

beforeAll(async () => {
  ({ GET } = await import("./route"));
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET", () => {
  function call(shop = "s1", req: Partial<NextRequest> = {} as NextRequest) {
    return GET(req as NextRequest, { params: Promise.resolve({ shop }) });
  }

  it("returns 403 for unauthorized user", async () => {
    getServerSession.mockResolvedValueOnce(null);

    const res = await call();
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body).toEqual({ error: "Forbidden" });
  });

  it("returns success when environment is valid", async () => {
    getServerSession.mockResolvedValueOnce({ user: { role: "admin" } });

    const res = await call("shop1");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(validateShopEnv).toHaveBeenCalledWith("shop1");
  });

  it("returns 400 when validation throws", async () => {
    getServerSession.mockResolvedValueOnce({ user: { role: "admin" } });
    validateShopEnv.mockImplementationOnce(() => {
      throw new Error("boom");
    });

    const res = await call();
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: "boom" });
  });
});

