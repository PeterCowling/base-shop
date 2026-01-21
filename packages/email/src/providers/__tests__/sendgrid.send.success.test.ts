import { createSendgridTestHarness } from "../../__tests__/sendgrid/setup";

jest.mock("@sendgrid/mail", () => {
  const setApiKey = jest.fn();
  const send = jest.fn();
  return { __esModule: true, default: { setApiKey, send }, setApiKey, send };
});

describe("SendgridProvider send – success paths", () => {
  const getSgMail = createSendgridTestHarness();

  const options = {
    to: "to@example.com",
    subject: "Subject",
    html: "<p>HTML</p>",
    text: "Text",
  };

  it("resolves on success", async () => {
    process.env.CAMPAIGN_FROM = "campaign@example.com";
    const sgMail = getSgMail();
    sgMail.send.mockResolvedValueOnce(undefined);
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await expect(provider.send(options)).resolves.toBeUndefined();
  });

  it("uses default sender address", async () => {
    process.env.CAMPAIGN_FROM = "campaign@example.com";
    process.env.SENDGRID_API_KEY = "key";
    const sgMail = getSgMail();
    sgMail.send.mockResolvedValueOnce(undefined);
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await provider.send(options);
    expect(sgMail.send).toHaveBeenCalledWith(
      expect.objectContaining({ from: "campaign@example.com" })
    );
  });

  it("sends payload matching Sendgrid API schema", async () => {
    process.env.CAMPAIGN_FROM = "campaign@example.com";
    process.env.SENDGRID_API_KEY = "key";
    const sgMail = getSgMail();
    sgMail.send.mockResolvedValueOnce(undefined);
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await provider.send(options);
    expect(sgMail.send).toHaveBeenCalledWith({
      to: options.to,
      from: "campaign@example.com",
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  });
});
