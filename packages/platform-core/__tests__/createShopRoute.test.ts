// apps/cms/__tests__/createShopRoute.test.ts

process.env.NEXTAUTH_SECRET = "test-secret";

describe("POST /api/create-shop", () => {
  afterEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });

  it("returns 403 when session is missing", async () => {
    jest.doMock("next-auth", () => ({
      getServerSession: jest.fn().mockResolvedValue(null),
    }));
    const createNewShop = jest.fn();
    jest.doMock("@cms/actions/createShop.server", () => ({
      __esModule: true,
      createNewShop,
    }));

    const { POST } = await import(
      "../../../apps/cms/src/app/api/create-shop/route"
    );
    const req = new Request("http://localhost/api/create-shop", {
      method: "POST",
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(createNewShop).not.toHaveBeenCalled();
  });

  it("calls createNewShop and returns success", async () => {
    const deployResult = { status: "success", previewUrl: "https://shop1.pages.dev" };
    const createNewShop = jest.fn().mockResolvedValue(deployResult);
    jest.doMock("@cms/actions/createShop.server", () => ({
      __esModule: true,
      createNewShop,
    }));
    jest.doMock("next-auth", () => ({
      getServerSession: jest
        .fn()
        .mockResolvedValue({ user: { role: "admin" } }),
    }));

    const { POST } = await import(
      "../../../apps/cms/src/app/api/create-shop/route"
    );
    const req = new Request("http://localhost/api/create-shop", {
      method: "POST",
      body: JSON.stringify({ id: "shop1", theme: "base" }),
    });
    const res = await POST(req);
    expect(createNewShop).toHaveBeenCalledTimes(1);
    expect(createNewShop).toHaveBeenCalledWith("shop1", {
      theme: "base",
      payment: [],
      shipping: [],
      pages: [],
      navItems: [],
      checkoutPage: [],
    });
    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toEqual({ success: true, deployment: deployResult });
  });

  it("returns 400 when action throws", async () => {
    const createNewShop = jest.fn().mockRejectedValue(new Error("boom"));
    jest.doMock("@cms/actions/createShop.server", () => ({
      __esModule: true,
      createNewShop,
    }));
    jest.doMock("next-auth", () => ({
      getServerSession: jest
        .fn()
        .mockResolvedValue({ user: { role: "admin" } }),
    }));

    const { POST } = await import(
      "../../../apps/cms/src/app/api/create-shop/route"
    );
    const req = new Request("http://localhost/api/create-shop", {
      method: "POST",
      body: JSON.stringify({ id: "shop2" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "boom" });
  });
});
