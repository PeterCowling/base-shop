import { submitShop } from "../submitShop";
import { validateShopName } from "@acme/platform-core/shops";
import { createShopOptionsSchema } from "@acme/platform-core/createShop";

jest.mock("@acme/platform-core/shops", () => ({
  validateShopName: jest.fn(),
}));

jest.mock("@acme/platform-core/createShop", () => ({
  createShopOptionsSchema: { safeParse: jest.fn() },
}));

describe("submitShop", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (validateShopName as jest.Mock).mockImplementation(() => {});
    global.fetch = jest.fn() as any;
  });

  const baseState: any = {
    storeName: "Store",
    logo: {},
    contactInfo: "",
    type: "sale",
    template: "temp",
    theme: "theme",
    themeOverrides: {},
    payment: {},
    shipping: {},
    pageTitle: {},
    pageDescription: {},
    socialImage: "",
    navItems: [],
    pages: [],
    checkoutComponents: [],
    analyticsProvider: "",
    analyticsId: "",
    env: {},
  };

  it("returns fieldErrors when schema validation fails", async () => {
    (createShopOptionsSchema.safeParse as jest.Mock).mockReturnValue({
      success: false,
      error: { issues: [{ path: ["name"], message: "Required" }] },
    });

    const result = await submitShop("shop", baseState);

    expect(result).toEqual({
      ok: false,
      fieldErrors: { name: ["Required"] },
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns deployment on success", async () => {
    (createShopOptionsSchema.safeParse as jest.Mock).mockReturnValue({
      success: true,
      data: {},
    });

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ deployment: { id: "dep" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    const result = await submitShop(
      "shop",
      { ...baseState, env: { KEY: "VALUE" } }
    );

    expect(result).toEqual({
      ok: true,
      deployment: { id: "dep" },
    });
  });

  it("returns error when env save fails", async () => {
    (createShopOptionsSchema.safeParse as jest.Mock).mockReturnValue({
      success: true,
      data: {},
    });

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ deployment: { id: "dep" } }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "env fail" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    const result = await submitShop(
      "shop",
      { ...baseState, env: { A: "b" } }
    );

    expect(result).toEqual({
      ok: false,
      deployment: { id: "dep" },
      error: "env fail",
    });
  });

  it("returns error when provider configuration fails", async () => {
    (createShopOptionsSchema.safeParse as jest.Mock).mockReturnValue({
      success: true,
      data: {},
    });

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ deployment: { id: "dep" } }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "provider fail" }),
      });

    const result = await submitShop("shop", baseState);

    expect(result).toEqual({
      ok: false,
      deployment: { id: "dep" },
      error: "provider fail",
    });
  });
});

