import type { EmailService } from "../src/services/emailService";

describe("emailService", () => {
  afterEach(() => {
    jest.resetModules();
  });

  it("throws if service is not registered", async () => {
    const { getEmailService } = await import("../src/services/emailService");
    expect(() => getEmailService()).toThrow("EmailService not registered");
  });

  it("returns the registered service", async () => {
    const { setEmailService, getEmailService } = await import("../src/services/emailService");
    const mockService: EmailService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    };
    setEmailService(mockService);
    expect(getEmailService()).toBe(mockService);
  });
});

