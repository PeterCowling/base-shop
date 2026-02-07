// Response.json() provided by shared test setup
function setSession(session: any) {
  const { __setMockSession } = require("next-auth") as {
    __setMockSession: (s: any) => void;
  };
  __setMockSession(session);
}

jest.mock("@acme/platform-core/repositories/shop.server", () => ({
  updateShopInRepo: jest.fn(),
}))

describe("configure-shop route", () => {
  let updateShopInRepo: jest.Mock

  beforeEach(() => {
    jest.resetModules()
    updateShopInRepo = require("@acme/platform-core/repositories/shop.server").updateShopInRepo as jest.Mock
    updateShopInRepo.mockReset()
  })

  it("updates shop when request is valid", async () => {
    setSession({ user: { role: "admin" } })
    updateShopInRepo.mockResolvedValueOnce(undefined)
    const { POST } = await import("../route")
    const req = new Request("http://localhost/api/configure-shop", {
      method: "POST",
      body: JSON.stringify({
        payment: ["stripe"],
        billingProvider: "stripe",
        shipping: ["shippo"],
      }),
    }) as unknown as import("next/server").NextRequest
    const res = await POST(req, { params: Promise.resolve({ shop: "shop1" }) })
    expect(updateShopInRepo).toHaveBeenCalledWith("shop1", {
      id: "shop1",
      paymentProviders: ["stripe"],
      billingProvider: "stripe",
      shippingProviders: ["shippo"],
    })
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ success: true })
  })

  it("returns error when update fails", async () => {
    setSession({ user: { role: "admin" } })
    updateShopInRepo.mockRejectedValueOnce(new Error("bad input"))
    const { POST } = await import("../route")
    const req = new Request("http://localhost/api/configure-shop", {
      method: "POST",
      body: JSON.stringify({ payment: "x" }),
    }) as unknown as import("next/server").NextRequest
    const res = await POST(req, { params: Promise.resolve({ shop: "shop2" }) })
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ error: expect.any(String) })
  })
})

export {};
