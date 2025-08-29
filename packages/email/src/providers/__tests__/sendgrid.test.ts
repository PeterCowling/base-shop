describe("SendgridProvider", () => {
  const options = {
    to: "to@example.com",
    subject: "Subject",
    html: "<p>HTML</p>",
    text: "Text",
  };

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.CAMPAIGN_FROM;
    delete process.env.SENDGRID_API_KEY;
  });

  it("resolves on success", async () => {
    process.env.CAMPAIGN_FROM = "campaign@example.com";
    const sgMail = require("@sendgrid/mail").default;
    sgMail.send.mockResolvedValueOnce(undefined);
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await expect(provider.send(options)).resolves.toBeUndefined();
  });

  it("wraps 400 errors as non-retryable ProviderError", async () => {
    process.env.CAMPAIGN_FROM = "campaign@example.com";
    const sgMail = require("@sendgrid/mail").default;
    const err = Object.assign(new Error("Bad Request"), { code: 400 });
    sgMail.send.mockRejectedValueOnce(err);
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    const { ProviderError } = require("../types");
    const promise = provider.send(options);
    await expect(promise).rejects.toBeInstanceOf(ProviderError);
    await expect(promise).rejects.toMatchObject({
      message: "Bad Request",
      retryable: false,
    });
  });

  it("marks 500 errors as retryable", async () => {
    process.env.CAMPAIGN_FROM = "campaign@example.com";
    const sgMail = require("@sendgrid/mail").default;
    const err = Object.assign(new Error("Server Error"), { code: 500 });
    sgMail.send.mockRejectedValueOnce(err);
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    const { ProviderError } = require("../types");
    const promise = provider.send(options);
    await expect(promise).rejects.toBeInstanceOf(ProviderError);
    await expect(promise).rejects.toMatchObject({ retryable: true });
  });

  it("wraps unexpected errors in ProviderError", async () => {
    process.env.CAMPAIGN_FROM = "campaign@example.com";
    const sgMail = require("@sendgrid/mail").default;
    sgMail.send.mockRejectedValueOnce("boom");
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    const { ProviderError } = require("../types");
    const promise = provider.send(options);
    await expect(promise).rejects.toBeInstanceOf(ProviderError);
    await expect(promise).rejects.toMatchObject({
      message: "Unknown error",
      retryable: true,
    });
  });
});

