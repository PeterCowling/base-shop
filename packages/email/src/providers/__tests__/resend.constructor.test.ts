describe("ResendProvider constructor", () => {
  const realFetch = global.fetch;

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.dontMock("../../config");
    global.fetch = realFetch;
    delete process.env.CAMPAIGN_FROM;
    delete process.env.RESEND_API_KEY;
  });

  it("passes API key to Resend constructor", async () => {
    process.env.RESEND_API_KEY = "rs";
    const { Resend } = require("resend");
    const { ResendProvider } = await import("../resend");
    new ResendProvider();
    expect(Resend).toHaveBeenCalledWith("rs");
  });
});

