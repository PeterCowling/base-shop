import { fetchCollection } from "../fetchCollection";

describe("fetchCollection", () => {
  const originalFetch = global.fetch;
  const originalError = console.error;

  afterEach(() => {
    global.fetch = originalFetch;
    console.error = originalError;
    jest.resetAllMocks();
  });

  it("returns SKUs from products property", async () => {
    const skus = [{ id: "1" }, { id: "2" }];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ products: skus }),
    }) as any;

    const result = await fetchCollection("col");

    expect(global.fetch).toHaveBeenCalledWith("/api/collections/col");
    expect(result).toEqual(skus);
  });

  it("returns SKUs when API responds with array", async () => {
    const skus = [{ id: "3" }];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(skus),
    }) as any;

    const result = await fetchCollection("col");

    expect(result).toEqual(skus);
  });

  it("logs error and returns empty array for non-ok response", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      statusText: "Bad",
      json: () => Promise.resolve({}),
    }) as any;

    const result = await fetchCollection("col");

    expect(errorSpy).toHaveBeenCalledWith(
      "Failed to fetch collection col:",
      "Bad"
    );
    expect(result).toEqual([]);
  });

  it("logs error and returns empty array when fetch rejects", async () => {
    const err = new Error("fail");
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    global.fetch = jest.fn().mockRejectedValue(err);

    const result = await fetchCollection("col");

    expect(errorSpy).toHaveBeenCalledWith("fetchCollection error", err);
    expect(result).toEqual([]);
  });
});
