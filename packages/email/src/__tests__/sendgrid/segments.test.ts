import { createSendgridTestHarness } from "./setup";

createSendgridTestHarness();

describe("SendgridProvider listSegments", () => {
  it("maps segments on success", async () => {
    process.env.SENDGRID_MARKETING_KEY = "sg";
    global.fetch = jest.fn().mockResolvedValue({
      json: jest
        .fn()
        .mockResolvedValue({ result: [{ id: "1", name: "Segment", extra: "x" }] }),
    });
    const { SendgridProvider } = await import("../../providers/sendgrid");
    const provider = new SendgridProvider();

    await expect(provider.listSegments()).resolves.toEqual([
      { id: "1", name: "Segment" },
    ]);
  });

  it("returns empty array without marketing key", async () => {
    global.fetch = jest.fn();
    const { SendgridProvider } = await import("../../providers/sendgrid");
    const provider = new SendgridProvider();

    await expect(provider.listSegments()).resolves.toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns empty array on fetch failure", async () => {
    process.env.SENDGRID_MARKETING_KEY = "sg";
    global.fetch = jest.fn().mockRejectedValue(new Error("fail"));
    const { SendgridProvider } = await import("../../providers/sendgrid");
    const provider = new SendgridProvider();

    await expect(provider.listSegments()).resolves.toEqual([]);
  });
});
