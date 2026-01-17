jest.mock("@acme/platform-core/shops", () => ({
  validateShopName: jest.fn(),
}));

import { validateShopName } from "@acme/platform-core/shops";

const fetchMock = jest.fn();

describe("deployShop", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    (globalThis as any).fetch = fetchMock;
    (validateShopName as jest.Mock).mockReset();
  });

  it("returns error when validateShopName throws", async () => {
    (validateShopName as jest.Mock).mockImplementation(() => {
      throw new Error("bad name");
    });
    const { deployShop } = await import("../deployShop");
    const result = await deployShop("bad", "example.com");
    expect(result).toEqual({ ok: false, error: "bad name" });
  });

  it("merges domain and certificate statuses from Cloudflare", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "pending", domainStatus: "waiting" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "active", certificateStatus: "issued" }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    const { deployShop } = await import("../deployShop");
    const result = await deployShop("good", "example.com");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result).toEqual({
      ok: true,
      info: {
        status: "pending",
        domainStatus: "active",
        certificateStatus: "issued",
      },
    });
  });

  it("returns error when initial deploy POST fails", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "fail" }),
    });
    const { deployShop } = await import("../deployShop");
    const result = await deployShop("good", "example.com");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: false, error: "fail" });
  });

  it("returns error when Cloudflare provisioning fails", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "pending", domainStatus: "pending" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "cf fail" }),
      });
    const { deployShop } = await import("../deployShop");
    const result = await deployShop("good", "example.com");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ ok: false, error: "cf fail" });
  });

  it("returns error when final deploy PUT fails", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "pending", domainStatus: "pending" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "active", certificateStatus: "issued" }),
      })
      .mockRejectedValueOnce(new Error("put fail"));
    const { deployShop } = await import("../deployShop");
    const result = await deployShop("good", "example.com");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ ok: false, error: "put fail" });
  });
});
