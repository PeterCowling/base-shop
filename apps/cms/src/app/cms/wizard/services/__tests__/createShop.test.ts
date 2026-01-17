import { createShop } from "../createShop";
import { validateShopName } from "@acme/platform-core/shops";
import { createShopOptionsSchema } from "@acme/platform-core/createShop/schema";

jest.mock("@acme/platform-core/shops", () => ({
  validateShopName: jest.fn(),
}));

jest.mock("@acme/platform-core/createShop/schema", () => ({
  createShopOptionsSchema: { safeParse: jest.fn() },
}));

describe("createShop", () => {
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
  };

  it("returns error for invalid shop name", async () => {
    (validateShopName as jest.Mock).mockImplementation(() => {
      throw new Error("bad name");
    });

    const result = await createShop("bad", baseState);

    expect(result).toEqual({ ok: false, error: "bad name" });
    expect(createShopOptionsSchema.safeParse).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns fieldErrors when schema validation fails", async () => {
    (createShopOptionsSchema.safeParse as jest.Mock).mockReturnValue({
      success: false,
      error: {
        issues: [
          { path: ["name"], message: "Required" },
          { path: ["shipping", "provider"], message: "Invalid" },
        ],
      },
    });

    const result = await createShop("shop", baseState);

    expect(result).toEqual({
      ok: false,
      fieldErrors: {
        name: ["Required"],
        "shipping.provider": ["Invalid"],
      },
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns deployment when fetch succeeds", async () => {
    (createShopOptionsSchema.safeParse as jest.Mock).mockReturnValue({
      success: true,
      data: {},
    });

    const deployment = { id: "dep" };
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ deployment }),
    });

    const result = await createShop("shop", baseState);

    expect(result).toEqual({ ok: true, deployment });
  });

  it("returns error when fetch fails", async () => {
    (createShopOptionsSchema.safeParse as jest.Mock).mockReturnValue({
      success: true,
      data: {},
    });

    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "fail" }),
    });

    const result = await createShop("shop", baseState);

    expect(result).toEqual({ ok: false, error: "fail" });
  });
});

