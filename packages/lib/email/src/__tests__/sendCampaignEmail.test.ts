import nodemailer from "nodemailer";
import { sendCampaignEmail } from "../index";

jest.mock("nodemailer", () => ({
  __esModule: true,
  default: { createTransport: jest.fn() },
}));

const createTransportMock = nodemailer.createTransport as jest.Mock;

describe("sendCampaignEmail", () => {
  afterEach(() => {
    jest.resetAllMocks();
    delete process.env.SMTP_URL;
    delete process.env.CAMPAIGN_FROM;
  });

  it("uses SMTP_URL and CAMPAIGN_FROM env vars and forwards options", async () => {
    const sendMail = jest.fn().mockResolvedValue(undefined);
    createTransportMock.mockReturnValue({ sendMail });

    process.env.SMTP_URL = "smtp://test";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      text: "Text body",
    });

    expect(createTransportMock).toHaveBeenCalledWith({ url: "smtp://test" });
    expect(sendMail).toHaveBeenCalledWith({
      from: "campaign@example.com",
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      text: "Text body",
    });
  });

  it("omits text when not provided", async () => {
    const sendMail = jest.fn().mockResolvedValue(undefined);
    createTransportMock.mockReturnValue({ sendMail });

    process.env.SMTP_URL = "smtp://test";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
    });

    expect(sendMail).toHaveBeenCalledWith({
      from: "campaign@example.com",
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      text: undefined,
    });
  });

  it("propagates sendMail errors", async () => {
    const error = new Error("smtp failed");
    const sendMail = jest.fn().mockRejectedValue(error);
    createTransportMock.mockReturnValue({ sendMail });

    process.env.SMTP_URL = "smtp://test";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    await expect(
      sendCampaignEmail({
        to: "to@example.com",
        subject: "Subject",
        html: "<p>HTML</p>",
      })
    ).rejects.toThrow(error);
  });
});
