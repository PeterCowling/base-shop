jest.mock("@sendgrid/mail", () => {
  const setApiKey = jest.fn();
  const send = jest.fn();
  return { __esModule: true, default: { setApiKey, send }, setApiKey, send };
});

import { createSendgridTestHarness } from "../../__tests__/sendgrid/setup";

describe("SendgridProvider send – config edge cases", () => {
  const getSgMail = createSendgridTestHarness();

  const options = {
    to: "to@example.com",
    subject: "Subject",
    html: "<p>HTML</p>",
    text: "Text",
  };

  it("warns when API key missing", async () => {
    process.env.CAMPAIGN_FROM = "campaign@example.com";
    const { logger } = await import("@acme/shared-utils");
    const warn = jest.spyOn(logger, "warn").mockImplementation(() => undefined as any);
    const sgMail = getSgMail();
    sgMail.send.mockResolvedValueOnce(undefined);
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await provider.send(options);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      "Sendgrid API key is not configured; attempting to send email",
      {
        provider: "sendgrid",
        recipient: "to@example.com",
        campaignId: undefined,
      }
    );
    warn.mockRestore();
  });

  it("surfaces getDefaultSender errors", async () => {
    process.env.SENDGRID_API_KEY = "key";
    const error = new Error("sender fail");
    jest.doMock("../../config", () => ({
      getDefaultSender: () => {
        throw error;
      },
    }));
    const sgMail = getSgMail();
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await expect(provider.send(options)).rejects.toThrow("sender fail");
    expect(sgMail.send).not.toHaveBeenCalled();
  });
});
