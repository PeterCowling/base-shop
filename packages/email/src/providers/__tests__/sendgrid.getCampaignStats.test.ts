import { createSendgridTestHarness } from "../../__tests__/sendgrid/setup";

jest.mock("@sendgrid/mail", () => {
  const setApiKey = jest.fn();
  const send = jest.fn();
  return { __esModule: true, default: { setApiKey, send }, setApiKey, send };
});

describe("SendgridProvider getCampaignStats", () => {
  createSendgridTestHarness();

  it("returns normalized stats on success", async () => {
    process.env.SENDGRID_API_KEY = "key";
    const stats = { delivered: "2", opens: "5", clicks: 1 };
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve(stats),
    }) as any;
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    const { mapSendGridStats } = await import("../../stats");
    await expect(provider.getCampaignStats("1")).resolves.toEqual(
      mapSendGridStats(stats)
    );
  });

  it("returns empty stats when fetch rejects", async () => {
    process.env.SENDGRID_API_KEY = "key";
    global.fetch = jest.fn().mockRejectedValue(new Error("fail")) as any;
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    const { mapSendGridStats } = await import("../../stats");
    await expect(provider.getCampaignStats("1")).resolves.toEqual(
      mapSendGridStats({})
    );
  });

  it("returns empty stats on JSON parse failure", async () => {
    process.env.SENDGRID_API_KEY = "key";
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.reject(new Error("bad")),
    }) as any;
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    const { mapSendGridStats } = await import("../../stats");
    await expect(provider.getCampaignStats("1")).resolves.toEqual(
      mapSendGridStats({})
    );
  });

  it("returns empty stats when SENDGRID_API_KEY missing", async () => {
    global.fetch = jest.fn();
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    const { mapSendGridStats } = await import("../../stats");
    await expect(provider.getCampaignStats("1")).resolves.toEqual(
      mapSendGridStats({})
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
