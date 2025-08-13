jest.mock("@sendgrid/mail", () => ({
  __esModule: true,
  default: {
    setApiKey: jest.fn(),
    send: jest.fn(),
    client: { request: jest.fn() },
  },
}));

let sgMail: any;
let requestMock: jest.Mock;

describe("SendgridProvider", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    sgMail = require("@sendgrid/mail").default;
    requestMock = sgMail.client.request as jest.Mock;
  });

  afterEach(() => {
    delete process.env.SENDGRID_API_KEY;
    delete process.env.CAMPAIGN_FROM;
  });

  it("forwards payload to @sendgrid/mail", async () => {
    process.env.SENDGRID_API_KEY = "sg";
    process.env.CAMPAIGN_FROM = "campaign@example.com";
    requestMock.mockResolvedValue([{}, {}]);

    const { SendgridProvider } = await import("../providers/sendgrid");
    const provider = new SendgridProvider();

    await provider.send({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      text: "Text",
    });

    expect(sgMail.setApiKey).toHaveBeenCalledWith("sg");
    expect(requestMock).toHaveBeenCalled();
    expect(sgMail.send).toHaveBeenCalledWith({
      to: "to@example.com",
      from: "campaign@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      text: "Text",
    });
  });

  it("throws when API key is invalid", async () => {
    process.env.SENDGRID_API_KEY = "sg";
    requestMock.mockRejectedValue(new Error("Unauthorized"));

    const { SendgridProvider } = await import("../providers/sendgrid");
    const provider = new SendgridProvider();

    await expect(
      provider.send({
        to: "to@example.com",
        subject: "Subject",
        html: "<p>HTML</p>",
        text: "Text",
      }),
    ).rejects.toThrow(
      "SendGrid API key validation failed: Unauthorized",
    );
  });
});
