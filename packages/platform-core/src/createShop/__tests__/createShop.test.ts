describe("createShop", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("creates DB records, writes files, and skips deploy when options.deploy=false", async () => {
    const create = jest.fn().mockResolvedValue({});
    const createMany = jest.fn().mockResolvedValue({});
    jest.doMock("../../db", () => ({ prisma: { shop: { create }, page: { createMany } } }));

    const validateShopName = jest.fn((s: string) => s);
    jest.doMock("../../shops", () => ({ validateShopName }));

    jest.doMock("../schema", () => ({
      prepareOptions: (_id: string, _opts: any) => ({
        name: "Demo Shop",
        theme: "base",
        themeOverrides: {},
        navItems: [],
        analytics: { enabled: false },
        shipping: [],
        tax: "taxjar",
        payment: [],
        sanityBlog: false,
        enableEditorial: false,
        enableSubscriptions: false,
        pages: [{ slug: "home", blocks: [] }],
      }),
    }));

    jest.doMock("../themeUtils", () => ({ loadTokens: () => ({}) }));

    const ensureDir = jest.fn();
    const writeJSON = jest.fn();
    jest.doMock("../fsUtils", () => ({ ensureDir, writeJSON }));

    const { createShop } = require("../createShop") as typeof import("../createShop");
    const result = await createShop("my-shop", {} as any, { deploy: false });

    expect(validateShopName).toHaveBeenCalledWith("my-shop");
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ id: "my-shop" }) })
    );
    expect(createMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.arrayContaining([expect.objectContaining({ slug: "home" })]) })
    );
    expect(ensureDir).toHaveBeenCalled();
    expect(writeJSON).toHaveBeenCalled();
    expect(result).toEqual({ status: "pending" });
  });

  test("deploys when deploy option not false and returns deployShopImpl result", async () => {
    const create = jest.fn().mockResolvedValue({});
    const createMany = jest.fn().mockResolvedValue({});
    jest.doMock("../../db", () => ({ prisma: { shop: { create }, page: { createMany } } }));

    const validateShopName = jest.fn((s: string) => s);
    jest.doMock("../../shops", () => ({ validateShopName }));

    jest.doMock("../schema", () => ({
      prepareOptions: (_id: string, _opts: any) => ({
        name: "Demo Shop",
        theme: "base",
        themeOverrides: {},
        navItems: [],
        analytics: { enabled: false },
        shipping: [],
        tax: "taxjar",
        payment: [],
        sanityBlog: false,
        enableEditorial: false,
        enableSubscriptions: false,
        pages: [],
      }),
    }));

    jest.doMock("../themeUtils", () => ({ loadTokens: () => ({}) }));
    jest.doMock("../fsUtils", () => ({ ensureDir: jest.fn(), writeJSON: jest.fn() }));

    const implResult = { status: "ok", url: "https://example.test" } as any;
    const deployShopMock = jest.fn();
    jest.doMock("../index", () => ({
      deployShop: deployShopMock,
      deployShopImpl: () => implResult,
    }));

    const { createShop } = require("../createShop") as typeof import("../createShop");
    const result = await createShop("shop-deploy");

    expect(deployShopMock).toHaveBeenCalledWith("shop-deploy", undefined, expect.anything());
    expect(result).toEqual(implResult);
  });
});
