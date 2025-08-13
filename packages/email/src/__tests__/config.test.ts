describe("defaultFrom config", () => {
  afterEach(() => {
    delete process.env.CAMPAIGN_FROM;
    jest.resetModules();
  });

  it("throws when CAMPAIGN_FROM is missing", async () => {
    await expect(import("../config")).rejects.toThrow(
      "CAMPAIGN_FROM"
    );
  });

  it("throws when CAMPAIGN_FROM is invalid", async () => {
    process.env.CAMPAIGN_FROM = "not-an-email";
    await expect(import("../config")).rejects.toThrow(
      "Invalid CAMPAIGN_FROM address"
    );
  });

  it("returns sender when CAMPAIGN_FROM is valid", async () => {
    process.env.CAMPAIGN_FROM = "campaign@example.com";
    const { defaultFrom } = await import("../config");
    expect(defaultFrom).toBe("campaign@example.com");
  });
});
