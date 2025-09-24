describe("ResendProvider send – error handling", () => {
  const options = {
    to: "to@example.com",
    subject: "Subject",
    html: "<p>HTML</p>",
    text: "Text",
  };

  const realFetch = global.fetch;

  function setupEnv() {
    process.env.RESEND_API_KEY = "rs";
    process.env.CAMPAIGN_FROM = "campaign@example.com";
  }

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.dontMock("../../config");
    global.fetch = realFetch;
    delete process.env.CAMPAIGN_FROM;
    delete process.env.RESEND_API_KEY;
  });

  it("wraps 400 errors as non-retryable ProviderError", async () => {
    setupEnv();
    const { send } = require("resend");
    const err = { message: "Bad Request", statusCode: 400 };
    send.mockRejectedValueOnce(err);
    const { ResendProvider } = await import("../resend");
    const provider = new ResendProvider();
    const { ProviderError } = require("../types");
    const promise = provider.send(options);
    await expect(promise).rejects.toBeInstanceOf(ProviderError);
    await expect(promise).rejects.toMatchObject({
      message: "Bad Request",
      retryable: false,
    });
  });

  it("marks 500 errors as retryable", async () => {
    setupEnv();
    const { send } = require("resend");
    const err = { message: "Server Error", statusCode: 500 };
    send.mockRejectedValueOnce(err);
    const { ResendProvider } = await import("../resend");
    const provider = new ResendProvider();
    const { ProviderError } = require("../types");
    const promise = provider.send(options);
    await expect(promise).rejects.toBeInstanceOf(ProviderError);
    await expect(promise).rejects.toMatchObject({ retryable: true });
  });

  it("treats Error objects as retryable", async () => {
    setupEnv();
    const { send } = require("resend");
    const err = new Error("network fail");
    send.mockRejectedValueOnce(err);
    const { ResendProvider } = await import("../resend");
    const provider = new ResendProvider();
    const { ProviderError } = require("../types");
    const promise = provider.send(options);
    await expect(promise).rejects.toBeInstanceOf(ProviderError);
    await expect(promise).rejects.toMatchObject({
      message: "network fail",
      retryable: true,
    });
  });

  it("wraps unexpected errors in ProviderError", async () => {
    setupEnv();
    const { send } = require("resend");
    send.mockRejectedValueOnce("boom");
    const { ResendProvider } = await import("../resend");
    const provider = new ResendProvider();
    const { ProviderError } = require("../types");
    const promise = provider.send(options);
    await expect(promise).rejects.toBeInstanceOf(ProviderError);
    await expect(promise).rejects.toMatchObject({
      message: "Unknown error",
      retryable: true,
    });
  });

  it("parses string status codes", async () => {
    setupEnv();
    const { send } = require("resend");
    const err = { message: "Upstream", status: "502" };
    send.mockRejectedValueOnce(err);
    const { ResendProvider } = await import("../resend");
    const provider = new ResendProvider();
    const { ProviderError } = require("../types");
    const promise = provider.send(options);
    await expect(promise).rejects.toBeInstanceOf(ProviderError);
    await expect(promise).rejects.toMatchObject({ retryable: true });
  });
});

