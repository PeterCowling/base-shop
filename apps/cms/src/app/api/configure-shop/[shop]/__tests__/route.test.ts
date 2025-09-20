// Response.json() provided by shared test setup

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}))

jest.mock("@platform-core/repositories/shop.server", () => ({
  updateShopInRepo: jest.fn(),
}))

describe("configure-shop route", () => {
  let getServerSession: jest.Mock
  let updateShopInRepo: jest.Mock

  beforeEach(() => {
    jest.resetModules()
    getServerSession = require("next-auth").getServerSession as jest.Mock
    updateShopInRepo = require("@platform-core/repositories/shop.server").updateShopInRepo as jest.Mock
    getServerSession.mockReset()
    updateShopInRepo.mockReset()
  })

  it("updates shop when request is valid", async () => {
    getServerSession.mockResolvedValueOnce({ user: { role: "admin" } })
    updateShopInRepo.mockResolvedValueOnce(undefined)
    const { POST } = await import("../route")
    const req = new Request("http://localhost/api/configure-shop", {
      method: "POST",
      body: JSON.stringify({ payment: ["stripe"], shipping: ["shippo"] }),
    }) as unknown as import("next/server").NextRequest
    const res = await POST(req, { params: Promise.resolve({ shop: "shop1" }) })
    expect(updateShopInRepo).toHaveBeenCalledWith("shop1", {
      id: "shop1",
      paymentProviders: ["stripe"],
      shippingProviders: ["shippo"],
    })
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ success: true })
  })

  it("returns error when update fails", async () => {
    getServerSession.mockResolvedValueOnce({ user: { role: "admin" } })
    updateShopInRepo.mockRejectedValueOnce(new Error("bad input"))
    const { POST } = await import("../route")
    const req = new Request("http://localhost/api/configure-shop", {
      method: "POST",
      body: JSON.stringify({ payment: "x" }),
    }) as unknown as import("next/server").NextRequest
    const res = await POST(req, { params: Promise.resolve({ shop: "shop2" }) })
    expect(updateShopInRepo).toHaveBeenCalledWith("shop2", { id: "shop2" })
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ error: "bad input" })
  })
})
