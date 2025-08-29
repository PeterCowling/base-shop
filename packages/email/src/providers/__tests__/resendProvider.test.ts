import { ResendProvider } from "../resend";

describe("ResendProvider segmentation error handling", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.RESEND_API_KEY;
  });

  it("resolves when addToList fetch rejects", async () => {
    process.env.RESEND_API_KEY = "rs";
    (global as any).fetch = jest.fn(() => Promise.reject(new Error("fail")));
    const provider = new ResendProvider();
    await expect(provider.addToList("c1", "l1")).resolves.toBeUndefined();
  });

  it("returns [] when listSegments json rejects", async () => {
    process.env.RESEND_API_KEY = "rs";
    (global as any).fetch = jest.fn().mockResolvedValue({
      json: () => Promise.reject(new Error("bad")),
    });
    const provider = new ResendProvider();
    await expect(provider.listSegments()).resolves.toEqual([]);
  });
});
