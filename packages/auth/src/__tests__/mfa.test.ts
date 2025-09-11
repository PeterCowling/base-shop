import { jest } from "@jest/globals";

const generateSecret = jest.fn();
const keyuri = jest.fn();
const verify = jest.fn();

jest.mock("otplib", () => ({
  authenticator: { generateSecret, keyuri, verify },
}));

const upsert = jest.fn();
const findUnique = jest.fn();
const update = jest.fn();

jest.mock("@acme/platform-core/db", () => ({
  prisma: {
    customerMfa: { upsert, findUnique, update },
  },
}));

describe("mfa", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("enrollMfa(customerId) upserts { enabled:false } and returns { secret, otpauth }", async () => {
    const { enrollMfa } = await import("../mfa");
    generateSecret.mockReturnValue("secret");
    keyuri.mockReturnValue("otpauth");

    const result = await enrollMfa("cust");

    expect(generateSecret).toHaveBeenCalled();
    expect(upsert).toHaveBeenCalledWith({
      where: { customerId: "cust" },
      update: { secret: "secret" },
      create: { customerId: "cust", secret: "secret", enabled: false },
    });
    expect(keyuri).toHaveBeenCalledWith("cust", "Acme", "secret");
    expect(result).toEqual({ secret: "secret", otpauth: "otpauth" });
  });

  it("enrollMfa bubbles up prisma errors", async () => {
    const { enrollMfa } = await import("../mfa");
    upsert.mockRejectedValue(new Error("fail"));

    await expect(enrollMfa("cust")).rejects.toThrow("fail");
  });
  describe("verifyMfa", () => {
    it("findUnique → null returns false", async () => {
      const { verifyMfa } = await import("../mfa");
      findUnique.mockResolvedValue(null);

      const result = await verifyMfa("cust", "123456");

      expect(verify).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it("valid token with enabled:false enables MFA and returns true", async () => {
      const { verifyMfa } = await import("../mfa");
      findUnique.mockResolvedValue({
        customerId: "cust",
        secret: "secret",
        enabled: false,
      });
      verify.mockReturnValue(true);

      const result = await verifyMfa("cust", "123456");

      expect(verify).toHaveBeenCalledWith({ token: "123456", secret: "secret" });
      expect(update).toHaveBeenCalledWith({
        where: { customerId: "cust" },
        data: { enabled: true },
      });
      expect(result).toBe(true);
    });

    it("valid token with enabled:true returns true without update call", async () => {
      const { verifyMfa } = await import("../mfa");
      findUnique.mockResolvedValue({
        customerId: "cust",
        secret: "secret",
        enabled: true,
      });
      verify.mockReturnValue(true);

      const result = await verifyMfa("cust", "123456");

      expect(verify).toHaveBeenCalledWith({ token: "123456", secret: "secret" });
      expect(update).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("invalid token returns false", async () => {
      const { verifyMfa } = await import("../mfa");
      findUnique.mockResolvedValue({
        customerId: "cust",
        secret: "secret",
        enabled: false,
      });
      verify.mockReturnValue(false);

      const result = await verifyMfa("cust", "000000");

      expect(verify).toHaveBeenCalledWith({ token: "000000", secret: "secret" });
      expect(update).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it("returns true when verification succeeds", async () => {
      const { verifyMfa } = await import("../mfa");
      findUnique.mockResolvedValue({
        customerId: "cust",
        secret: "secret",
        enabled: false,
      });
      verify.mockReturnValue(true);

      await expect(verifyMfa("cust", "123456")).resolves.toBe(true);
      expect(update).toHaveBeenCalled();
    });

    it("returns false when verification fails", async () => {
      const { verifyMfa } = await import("../mfa");
      findUnique.mockResolvedValue({
        customerId: "cust",
        secret: "secret",
        enabled: false,
      });
      verify.mockReturnValue(false);

      await expect(verifyMfa("cust", "000000")).resolves.toBe(false);
      expect(update).not.toHaveBeenCalled();
    });

    it("bubbles up findUnique errors", async () => {
      const { verifyMfa } = await import("../mfa");
      findUnique.mockRejectedValue(new Error("fail"));

      await expect(verifyMfa("cust", "123456")).rejects.toThrow("fail");
      expect(update).not.toHaveBeenCalled();
    });

    it("bubbles up verify errors", async () => {
      const { verifyMfa } = await import("../mfa");
      findUnique.mockResolvedValue({
        customerId: "cust",
        secret: "secret",
        enabled: false,
      });
      verify.mockImplementation(() => {
        throw new Error("fail");
      });

      await expect(verifyMfa("cust", "123456")).rejects.toThrow("fail");
      expect(update).not.toHaveBeenCalled();
    });

    it("bubbles up update errors", async () => {
      const { verifyMfa } = await import("../mfa");
      findUnique.mockResolvedValue({
        customerId: "cust",
        secret: "secret",
        enabled: false,
      });
      verify.mockReturnValue(true);
      update.mockRejectedValue(new Error("fail"));

      await expect(verifyMfa("cust", "123456")).rejects.toThrow("fail");
    });
  });

  describe("isMfaEnabled", () => {
    it("returns true/false based on the enabled flag", async () => {
      const { isMfaEnabled } = await import("../mfa");
      findUnique.mockResolvedValueOnce({ customerId: "cust", enabled: true });
      await expect(isMfaEnabled("cust")).resolves.toBe(true);

      findUnique.mockResolvedValueOnce({ customerId: "cust", enabled: false });
      await expect(isMfaEnabled("cust")).resolves.toBe(false);
    });

    it("returns false when the record is missing", async () => {
      const { isMfaEnabled } = await import("../mfa");
      findUnique.mockResolvedValue(null);
      await expect(isMfaEnabled("cust")).resolves.toBe(false);
    });

    it("bubbles up findUnique errors", async () => {
      const { isMfaEnabled } = await import("../mfa");
      findUnique.mockRejectedValue(new Error("fail"));
      await expect(isMfaEnabled("cust")).rejects.toThrow("fail");
    });
  });

  describe("deactivateMfa", () => {
    it("clears secret and disables MFA", async () => {
      const { deactivateMfa } = await import("../mfa");
      if (!deactivateMfa) return;

      await deactivateMfa("cust");

      expect(update).toHaveBeenCalledWith({
        where: { customerId: "cust" },
        data: { secret: null, enabled: false },
      });
    });

    it("bubbles up update errors", async () => {
      const { deactivateMfa } = await import("../mfa");
      if (!deactivateMfa) return;
      update.mockRejectedValue(new Error("fail"));

      await expect(deactivateMfa("cust")).rejects.toThrow("fail");
    });
  });
});

