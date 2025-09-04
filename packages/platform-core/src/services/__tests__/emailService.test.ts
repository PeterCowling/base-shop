import { jest } from "@jest/globals";
import type { EmailService } from "../emailService";

describe("emailService", () => {
  afterEach(() => {
    jest.resetModules();
  });

  it("throws if service is not registered", async () => {
    const { getEmailService } = await import("../emailService");
    expect(() => getEmailService()).toThrow("EmailService not registered");
  });

  it("returns the registered service", async () => {
    const { setEmailService, getEmailService } = await import("../emailService");
    const mockService: EmailService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    };
    setEmailService(mockService);
    expect(getEmailService()).toBe(mockService);
  });

  it("allows replacing the service", async () => {
    const { setEmailService, getEmailService } = await import("../emailService");
    const first: EmailService = { sendEmail: jest.fn().mockResolvedValue(undefined) };
    const second: EmailService = { sendEmail: jest.fn().mockResolvedValue(undefined) };
    setEmailService(first);
    expect(getEmailService()).toBe(first);
    setEmailService(second);
    expect(getEmailService()).toBe(second);
  });
});

