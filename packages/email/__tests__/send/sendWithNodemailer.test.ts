describe("sendWithNodemailer", () => {
  beforeEach(() => {
    jest.resetModules();
    delete process.env.SMTP_URL;
  });

  it("passes SMTP_URL and forwards fields", async () => {
    process.env.SMTP_URL = "smtp://example";
    const sendMail = jest.fn();
    const createTransport = jest.fn(() => ({ sendMail }));
    jest.doMock("nodemailer", () => ({ __esModule: true, default: { createTransport } }));
    jest.doMock("../../src/config", () => ({ getDefaultSender: () => "from@example.com" }));
    const { sendWithNodemailer } = await import("../../src/send");
    await sendWithNodemailer({
      to: "to@example.com",
      subject: "Subj",
      html: "<p>HTML</p>",
      text: "text",
    });
    expect(createTransport).toHaveBeenCalledWith({ url: "smtp://example" });
    expect(sendMail).toHaveBeenCalledWith({
      from: "from@example.com",
      to: "to@example.com",
      subject: "Subj",
      html: "<p>HTML</p>",
      text: "text",
    });
  });

  it("surfaces sendMail errors", async () => {
    process.env.SMTP_URL = "smtp://example";
    const sendMail = jest.fn().mockRejectedValue(new Error("smtp fail"));
    const createTransport = jest.fn(() => ({ sendMail }));
    jest.doMock("nodemailer", () => ({ __esModule: true, default: { createTransport } }));
    jest.doMock("../../src/config", () => ({ getDefaultSender: () => "from@example.com" }));
    const { sendWithNodemailer } = await import("../../src/send");
    await expect(
      sendWithNodemailer({
        to: "to@example.com",
        subject: "Subj",
        html: "<p>HTML</p>",
        text: "text",
      })
    ).rejects.toThrow("smtp fail");
    expect(createTransport).toHaveBeenCalledWith({ url: "smtp://example" });
    expect(sendMail).toHaveBeenCalledWith({
      from: "from@example.com",
      to: "to@example.com",
      subject: "Subj",
      html: "<p>HTML</p>",
      text: "text",
    });
  });
});
