import * as provider from "@acme/email";

import {
  type EmailService,
  getEmailService,
  sendSystemEmail,
  setEmailService,
} from "../emailService";

jest.mock("@acme/email", () => ({
  sendEmail: jest.fn(),
}));

describe("emailService", () => {
  it("throws before a service is registered", async () => {
    await jest.isolateModulesAsync(async () => {
      const { getEmailService } = await import("../emailService");
      expect(() => getEmailService()).toThrow("EmailService not registered");
    });
  });

  it("returns the registered service", async () => {
    await jest.isolateModulesAsync(async () => {
      const { getEmailService, setEmailService } = await import("../emailService");
      const svc: EmailService = {
        sendEmail: jest.fn().mockResolvedValue(undefined),
      };
      setEmailService(svc);
      expect(getEmailService()).toBe(svc);
      await getEmailService().sendEmail("to", "subject", "body");
      expect(svc.sendEmail).toHaveBeenCalledWith("to", "subject", "body");
    });
  });
});

describe("sendSystemEmail", () => {
  beforeEach(() => {
    process.env.EMAIL_PROVIDER = "sendgrid";
    jest.clearAllMocks();
  });

  it("throws on unknown provider", async () => {
    delete process.env.EMAIL_PROVIDER;
    await expect(
      sendSystemEmail({ to: "a@x.com", subject: "Hi", html: "<b>Hi</b>" } as any),
    ).rejects.toThrow(/provider|config/i);
  });

  it("delegates to provider on happy path", async () => {
    (provider.sendEmail as jest.Mock).mockResolvedValue({ id: "ok" } as any);
    const res = await sendSystemEmail({
      to: "a@x.com",
      subject: "Hi",
      html: "<b>Hi</b>",
    } as any);
    expect(provider.sendEmail).toHaveBeenCalledWith(
      "a@x.com",
      "Hi",
      "<b>Hi</b>",
    );
    expect((res as any).id).toBe("ok");
  });
});

