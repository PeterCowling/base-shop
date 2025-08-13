jest.mock("resend", () => ({
  Resend: jest.fn(),
}));

let Resend: any;
let sendMock: jest.Mock;
let listMock: jest.Mock;

describe("ResendProvider", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    Resend = require("resend").Resend;
    sendMock = jest.fn();
    listMock = jest.fn();
    (Resend as jest.Mock).mockImplementation(() => ({
      emails: { send: sendMock },
      apiKeys: { list: listMock },
    }));
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.CAMPAIGN_FROM;
  });

  it("forwards payload to Resend client", async () => {
    process.env.RESEND_API_KEY = "rs";
    process.env.CAMPAIGN_FROM = "campaign@example.com";
    listMock.mockResolvedValue({ data: null, error: null });

    const { ResendProvider } = await import("../providers/resend");
    const provider = new ResendProvider();

    await provider.send({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      text: "Text",
    });

    expect(Resend).toHaveBeenCalledWith("rs");
    expect(listMock).toHaveBeenCalled();
    expect(sendMock).toHaveBeenCalledWith({
      from: "campaign@example.com",
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      text: "Text",
    });
  });

  it("throws when API key is invalid", async () => {
    process.env.RESEND_API_KEY = "rs";
    listMock.mockResolvedValue({
      data: null,
      error: { message: "invalid" },
    });

    const { ResendProvider } = await import("../providers/resend");
    const provider = new ResendProvider();

    await expect(
      provider.send({
        to: "to@example.com",
        subject: "Subject",
        html: "<p>HTML</p>",
        text: "Text",
      }),
    ).rejects.toThrow(
      "Resend API key validation failed: invalid",
    );
  });
});
