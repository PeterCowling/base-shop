const sgMail = require("@sendgrid/mail").default;

describe("SendgridProvider", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.SENDGRID_API_KEY;
    delete process.env.CAMPAIGN_FROM;
  });

  it("forwards payload to @sendgrid/mail", async () => {
    process.env.SENDGRID_API_KEY = "sg";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    const { SendgridProvider } = await import("../providers/sendgrid");
    const provider = new SendgridProvider();

    await provider.send({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      text: "Text",
    });

    expect(sgMail.setApiKey).toHaveBeenCalledWith("sg");
    expect(sgMail.send).toHaveBeenCalledWith({
      to: "to@example.com",
      from: "campaign@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      text: "Text",
    });
  });
});
