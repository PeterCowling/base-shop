import { createSendgridTestHarness } from "./setup";

createSendgridTestHarness();

describe("SendgridProvider getCampaignStats", () => {
  it("returns normalized stats on success", async () => {
    process.env.SENDGRID_API_KEY = "sg";
    const stats = { delivered: "2", opens: "3", clicks: 1 };
    const fetchMock = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue(stats),
    });
    global.fetch = fetchMock;

    const { SendgridProvider } = await import("../../providers/sendgrid");
    const { mapSendGridStats } = await import("../../stats");
    const provider = new SendgridProvider();

    await expect(provider.getCampaignStats("1")).resolves.toEqual(
      mapSendGridStats(stats)
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.sendgrid.com/v3/campaigns/1/stats",
      { headers: { Authorization: "Bearer sg" } }
    );
  });

  it("returns empty stats without api key", async () => {
    global.fetch = jest.fn();
    const { SendgridProvider } = await import("../../providers/sendgrid");
    const { emptyStats } = await import("../../stats");
    const provider = new SendgridProvider();

    await expect(provider.getCampaignStats("1")).resolves.toEqual(emptyStats);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns empty stats on fetch failure", async () => {
    process.env.SENDGRID_API_KEY = "sg";
    global.fetch = jest.fn().mockRejectedValue(new Error("fail"));
    const { SendgridProvider } = await import("../../providers/sendgrid");
    const { emptyStats } = await import("../../stats");
    const provider = new SendgridProvider();

    await expect(provider.getCampaignStats("1")).resolves.toEqual(emptyStats);
  });

  it("returns empty stats on JSON parse failure", async () => {
    process.env.SENDGRID_API_KEY = "sg";
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockRejectedValue(new Error("bad")),
    });
    const { SendgridProvider } = await import("../../providers/sendgrid");
    const { emptyStats } = await import("../../stats");
    const provider = new SendgridProvider();

    await expect(provider.getCampaignStats("1")).resolves.toEqual(emptyStats);
  });
});
