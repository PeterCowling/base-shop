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

  it("enrollMfa upserts secret and returns otpauth URI", async () => {
    const { enrollMfa } = await import("../../mfa");
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

  it("verifyMfa enables record on first valid token", async () => {
    const { verifyMfa } = await import("../../mfa");
    findUnique.mockResolvedValue({
      customerId: "cust",
      secret: "secret",
      enabled: false,
    });
    verify.mockReturnValue(true);

    const result = await verifyMfa("cust", "123456");

    expect(verify).toHaveBeenCalledWith({ token: "123456", secret: "secret", window: 1 });
    expect(update).toHaveBeenCalledWith({
      where: { customerId: "cust" },
      data: { enabled: true },
    });
    expect(result).toBe(true);
  });

  it("verifyMfa returns true when already enabled", async () => {
    const { verifyMfa } = await import("../../mfa");
    findUnique.mockResolvedValue({ enabled: true });
    verify.mockReturnValue(true);

    const result = await verifyMfa("cust", "123456");

    expect(verify).toHaveBeenCalledWith({ token: "123456", secret: undefined, window: 1 });
    expect(update).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it("verifyMfa returns false when record missing or token invalid", async () => {
    const { verifyMfa } = await import("../../mfa");

    // Missing record
    findUnique.mockResolvedValueOnce(null);
    await expect(verifyMfa("cust", "123456")).resolves.toBe(false);
    expect(verify).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();

    // Invalid token
    findUnique.mockResolvedValueOnce({
      customerId: "cust",
      secret: "secret",
      enabled: false,
    });
    verify.mockReturnValueOnce(false);
    await expect(verifyMfa("cust", "000000")).resolves.toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("isMfaEnabled returns correct boolean", async () => {
    const { isMfaEnabled } = await import("../../mfa");
    findUnique.mockResolvedValueOnce({ customerId: "cust", enabled: true });
    await expect(isMfaEnabled("cust")).resolves.toBe(true);

    findUnique.mockResolvedValueOnce({ customerId: "cust", enabled: false });
    await expect(isMfaEnabled("cust")).resolves.toBe(false);

    findUnique.mockResolvedValueOnce(null);
    await expect(isMfaEnabled("cust")).resolves.toBe(false);
  });
});
