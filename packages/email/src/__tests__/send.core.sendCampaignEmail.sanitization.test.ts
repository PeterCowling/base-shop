// Focus: HTML sanitization behavior of sendCampaignEmail

import {
  cleanupEnv,
  mockSanitizeHtml,
  mockSendgridSend,
  resetMocks,
  setupEnv,
} from "./sendCampaignTestUtils";

jest.mock("../config", () => ({
  getDefaultSender: () => "from@example.com",
}));

describe("send core – sendCampaignEmail (sanitization)", () => {
  beforeEach(() => {
    resetMocks();
    (mockSanitizeHtml as jest.Mock).mockImplementation((html: string) => html);
    setupEnv();
  });

  afterEach(() => {
    cleanupEnv();
  });

  it("sanitizes HTML when enabled", async () => {
    (mockSendgridSend as jest.Mock).mockResolvedValue(undefined);
    mockSanitizeHtml.mockImplementation((html: string, opts: any) => {
      expect(opts.allowedTags).toEqual(expect.arrayContaining(["img", "p"]));
      expect(opts.allowedAttributes["*"]).toEqual(
        expect.arrayContaining([
          "href",
          "src",
          "alt",
          "title",
          "width",
          "height",
          "style",
        ])
      );
      return '<p>Hi</p><img src="x" />';
    });
    await jest.isolateModulesAsync(async () => {
      process.env.EMAIL_PROVIDER = "sendgrid";
      const { sendCampaignEmail } = await import("../send");
      await sendCampaignEmail({
        to: "t@example.com",
        subject: "s",
        html: '<p>Hi</p><img src="x" onerror="x"><script>bad()</script>',
      });
    });
    expect(mockSanitizeHtml).toHaveBeenCalled();
    expect(mockSendgridSend).toHaveBeenCalledWith(
      expect.objectContaining({ html: '<p>Hi</p><img src="x" />' })
    );
  });

  it("removes style attributes during sanitization", async () => {
    (mockSendgridSend as jest.Mock).mockResolvedValue(undefined);
    mockSanitizeHtml.mockImplementation(() => "<p>Hi</p>");
    await jest.isolateModulesAsync(async () => {
      process.env.EMAIL_PROVIDER = "sendgrid";
      const { sendCampaignEmail } = await import("../send");
      await sendCampaignEmail({
        to: "t@example.com",
        subject: "s",
        html: '<p style="color:red">Hi</p>',
      });
    });
    expect(mockSendgridSend).toHaveBeenCalledWith(
      expect.objectContaining({ html: "<p>Hi</p>" })
    );
  });

  it("does not sanitize HTML when disabled", async () => {
    (mockSendgridSend as jest.Mock).mockResolvedValue(undefined);
    let sanitizeSpy: jest.SpyInstance;
    await jest.isolateModulesAsync(async () => {
      const sanitizeModule = await import("sanitize-html");
      sanitizeSpy = jest.spyOn(sanitizeModule, "default");
      process.env.EMAIL_PROVIDER = "sendgrid";
      const { sendCampaignEmail } = await import("../send");
      await sendCampaignEmail({
        to: "t@example.com",
        subject: "s",
        html: '<p>Hi</p><img src="x"><script>bad()</script>',
        sanitize: false,
      });
    });
    expect(sanitizeSpy!).not.toHaveBeenCalled();
    expect(mockSendgridSend).toHaveBeenCalledWith(
      expect.objectContaining({
        html: '<p>Hi</p><img src="x"><script>bad()</script>',
      })
    );
  });
});
