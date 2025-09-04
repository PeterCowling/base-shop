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

  it("resolves when the stub sendEmail succeeds", async () => {
    const { setEmailService, getEmailService } = await import("../emailService");
    const stub: EmailService = { sendEmail: jest.fn().mockResolvedValue(undefined) };
    setEmailService(stub);
    await expect(
      getEmailService().sendEmail("to@example.com", "subject", "body"),
    ).resolves.toBeUndefined();
    expect(stub.sendEmail).toHaveBeenCalledWith("to@example.com", "subject", "body");
  });

  it("propagates rejection when the stub sendEmail rejects", async () => {
    const { setEmailService, getEmailService } = await import("../emailService");
    const error = new Error("fail");
    const stub: EmailService = { sendEmail: jest.fn().mockRejectedValue(error) };
    setEmailService(stub);
    await expect(
      getEmailService().sendEmail("to@example.com", "subject", "body"),
    ).rejects.toBe(error);
    expect(stub.sendEmail).toHaveBeenCalledWith("to@example.com", "subject", "body");
  });
});

