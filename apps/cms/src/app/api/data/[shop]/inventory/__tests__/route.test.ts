import { NextRequest } from "next/server";
import { __setMockSession } from "next-auth";
jest.mock("@cms/auth/options", () => ({ authOptions: {} }));

const write = jest.fn();
jest.mock("@acme/platform-core/repositories/inventory.server", () => ({
  inventoryRepository: { write },
}));

let POST: typeof import("../route").POST;

beforeAll(async () => {
  ({ POST } = await import("../route"));
});

afterEach(() => {
  jest.clearAllMocks();
});

function req(body: unknown) {
  return new NextRequest("http://test.local", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST", () => {
  it.each([null, { user: { role: "user" } }])(
    "returns 403 for session %p",
    async (session) => {
      __setMockSession(session as any);
      const res = await POST(req([]), {
        params: Promise.resolve({ shop: "s1" }),
      });
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: "Forbidden" });
    },
  );

  it("returns 400 for invalid payload", async () => {
    __setMockSession({ user: { role: "admin" } } as any);
    const res = await POST(
      req([{ sku: "a", productId: "p1", quantity: -1, variantAttributes: {} }]),
      { params: Promise.resolve({ shop: "s1" }) },
    );
    expect(res.status).toBe(400);
    expect(write).not.toHaveBeenCalled();
  });

  it("writes inventory and returns success", async () => {
    __setMockSession({ user: { role: "admin" } } as any);
    const items = [
      { sku: "a", productId: "p1", quantity: 1, variantAttributes: {} },
    ];
    const res = await POST(req(items), {
      params: Promise.resolve({ shop: "s1" }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(write).toHaveBeenCalledWith("s1", items);
  });

  it("returns 503 when backend delegate is unavailable", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    __setMockSession({ user: { role: "admin" } } as any);
    write.mockRejectedValueOnce(new Error("Prisma inventory delegate is unavailable"));
    const items = [
      { sku: "a", productId: "p1", quantity: 1, variantAttributes: {} },
    ];
    const res = await POST(req(items), {
      params: Promise.resolve({ shop: "s1" }),
    });
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      error: "Prisma inventory delegate is unavailable",
    });
    errorSpy.mockRestore();
  });
});
