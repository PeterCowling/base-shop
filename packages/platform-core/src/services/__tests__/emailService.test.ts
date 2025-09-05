import { getEmailService, setEmailService, type EmailService } from "../emailService";

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

