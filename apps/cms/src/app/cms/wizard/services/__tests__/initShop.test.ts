import { Buffer } from "buffer";

import { validateShopName } from "@acme/platform-core/shops";

jest.mock("@acme/platform-core/shops", () => ({
  validateShopName: jest.fn(),
}));

describe("initShop", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (validateShopName as jest.Mock).mockImplementation(() => {});
    global.fetch = jest.fn() as any;
  });

  it("converts CSV file to base64 via Buffer", async () => {
    const data = "id,name\n1,2";
    const arrayBuffer = new TextEncoder().encode(data).buffer;
    const file = { arrayBuffer: jest.fn().mockResolvedValue(arrayBuffer) } as any;
    const fromSpy = jest.spyOn(Buffer, "from");
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });
    const { initShop } = await import("../initShop");
    await initShop("shop", file);
    expect(file.arrayBuffer).toHaveBeenCalled();
    expect(fromSpy).toHaveBeenCalled();
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.csv).toBe(Buffer.from(data).toString("base64"));
    fromSpy.mockRestore();
  });

  it("parses comma and newline separated categories", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });
    const { initShop } = await import("../initShop");
    await initShop("shop", undefined, "a, b\nc\n\n d ");
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.categories).toEqual(["a", "b", "c", "d"]);
  });

  it("returns ok true on fetch success", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });
    const { initShop } = await import("../initShop");
    const result = await initShop("shop");
    expect(result).toEqual({ ok: true });
  });

  it("returns ok false and error on fetch failure", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "fail" }),
    });
    const { initShop } = await import("../initShop");
    const result = await initShop("shop");
    expect(result).toEqual({ ok: false, error: "fail" });
  });
});

