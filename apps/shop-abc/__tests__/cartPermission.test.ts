// apps/shop-abc/__tests__/cartPermission.test.ts
jest.mock("@auth", () => ({
  __esModule: true,
  getCustomerSession: jest.fn(),
  hasPermission: jest.fn(),
}));

jest.mock("@platform-core/src/cartApi", () => ({
  runtime: "edge",
  GET: jest.fn(() => new Response("ok", { status: 200 })),
  POST: jest.fn(),
  PATCH: jest.fn(),
  PUT: jest.fn(),
  DELETE: jest.fn(),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) =>
      new Response(JSON.stringify(data), init),
  },
}));

import { GET } from "../src/app/api/cart/route";
import { getCustomerSession, hasPermission } from "@auth";
import { GET as coreGET } from "@platform-core/src/cartApi";

describe("cart route permissions", () => {
  beforeEach(() => {
    (getCustomerSession as jest.Mock).mockResolvedValue({ role: "customer" });
    (hasPermission as jest.Mock).mockReturnValue(true);
    (coreGET as jest.Mock).mockClear();
  });

  it("allows access when permission granted", async () => {
    const res = await GET({} as any);
    expect(res.status).toBe(200);
    expect(coreGET).toHaveBeenCalled();
  });

  it("returns 403 when permission denied", async () => {
    (hasPermission as jest.Mock).mockReturnValue(false);
    const res = await GET({} as any);
    expect(res.status).toBe(403);
    expect(coreGET).not.toHaveBeenCalled();
  });
});
