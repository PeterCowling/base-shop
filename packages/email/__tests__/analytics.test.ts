// Placeholder to satisfy Jest's test discovery when legacy aggregated
// analytics test file is referenced by cache or tooling.
describe("analytics (placeholder)", () => {
  it("placeholder", () => {
    expect(true).toBe(true);
  });

  it("does nothing when no email provider is configured", async () => {
    jest.resetModules();
    delete process.env.EMAIL_PROVIDER;

    const trackEvent = jest.fn();
    jest.doMock("@platform-core/analytics", () => ({
      __esModule: true,
      trackEvent,
    }));

    const getCampaignStore = jest.fn();
    jest.doMock("../src/storage", () => ({ __esModule: true, getCampaignStore }));
    jest.doMock("../src/providers/sendgrid", () => ({ SendgridProvider: jest.fn() }));
    jest.doMock("../src/providers/resend", () => ({ ResendProvider: jest.fn() }));

    const { syncCampaignAnalytics } = await import("../src/analytics");
    await syncCampaignAnalytics();

    expect(getCampaignStore).not.toHaveBeenCalled();
    expect(trackEvent).not.toHaveBeenCalled();
  });
});

