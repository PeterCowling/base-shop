import { seedShop } from "../seedShop";
import { validateShopName } from "@platform-core/shops";

jest.mock("@platform-core/shops", () => ({
  validateShopName: jest.fn(),
}));

describe("seedShop", () => {
  const fetchMock = jest.fn();
  const appendMock = jest.fn();
  class FormDataMock {
    append = appendMock;
  }

  beforeEach(() => {
    fetchMock.mockReset();
    appendMock.mockReset();
    (globalThis as any).fetch = fetchMock;
    (globalThis as any).FormData = FormDataMock as any;
    (validateShopName as jest.Mock).mockReset();
  });

  it("uploads a CSV file", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });

    const file = {} as unknown as File;
    const result = await seedShop("shop123", file);

    expect(fetchMock).toHaveBeenCalledWith("/cms/api/upload-csv/shop123", {
      method: "POST",
      body: expect.any(FormDataMock),
    });
    expect(result).toEqual({ ok: true });
  });

  it("posts categories when provided", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });

    const result = await seedShop("shop123", undefined, "a,b");

    expect(fetchMock).toHaveBeenCalledWith("/cms/api/categories/shop123", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(["a", "b"]),
    });
    expect(result).toEqual({ ok: true });
  });

  it("returns error when upload fails", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "upload fail" }),
    });

    const result = await seedShop("shop123", {} as unknown as File);

    expect(result).toEqual({ ok: false, error: "upload fail" });
  });

  it("returns error when categories post fails", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "cat fail" }),
      });

    const result = await seedShop("shop123", {} as any, "cat");

    expect(result).toEqual({ ok: false, error: "cat fail" });
  });

  it("returns ok true on full success", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });

    const result = await seedShop("shop123", {} as any, "cat1,cat2");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ ok: true });
  });
});

