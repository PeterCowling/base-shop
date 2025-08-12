jest.mock("resend", () => ({
  Resend: jest.fn(),
}));

const { Resend } = require("resend");
const sendMock = jest.fn();
(Resend as jest.Mock).mockImplementation(() => ({ emails: { send: sendMock } }));

describe("ResendProvider", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.RESEND_API_KEY;
    delete process.env.CAMPAIGN_FROM;
  });

  it("forwards payload to Resend client", async () => {
    process.env.RESEND_API_KEY = "rs";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    const { ResendProvider } = await import("../providers/resend");
    const provider = new ResendProvider();

    await provider.send({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      text: "Text",
    });

    expect(Resend).toHaveBeenCalledWith("rs");
    expect(sendMock).toHaveBeenCalledWith({
      from: "campaign@example.com",
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      text: "Text",
    });
  });
});
