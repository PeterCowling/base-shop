import {
  enrollMfa,
  verifyMfa,
  isMfaEnabled,
  generateMfaToken,
  verifyMfaToken,
} from "../src/mfa";
import { authenticator } from "otplib";
import { prisma } from "@acme/platform-core/db";

jest.mock("@acme/platform-core/db", () => {
  const store = new Map<string, any>();
  return {
    prisma: {
      customerMfa: {
        upsert: jest.fn(async ({ where, update, create }) => {
          const existing = store.get(where.customerId);
          const record = existing ? { ...existing, ...update } : create;
          store.set(where.customerId, record);
          return record;
        }),
        findUnique: jest.fn(async ({ where: { customerId } }) => {
          return store.get(customerId) ?? null;
        }),
        update: jest.fn(async ({ where: { customerId }, data }) => {
          const existing = store.get(customerId);
          if (!existing) throw new Error("not found");
          const record = { ...existing, ...data };
          store.set(customerId, record);
          return record;
        }),
      },
    },
  };
});

describe("mfa", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-01-01T00:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("generates unique base32 secrets", async () => {
    const first = await enrollMfa("user-one");
    const second = await enrollMfa("user-two");
    expect(first.secret).toMatch(/^[A-Z2-7]{32}$/);
    expect(second.secret).toMatch(/^[A-Z2-7]{32}$/);
    expect(first.secret).not.toBe(second.secret);
  });

  it("is disabled until token verified", async () => {
    await enrollMfa("user-pending");
    await expect(isMfaEnabled("user-pending")).resolves.toBe(false);
  });

  it("verifies valid token", async () => {
    jest
      .spyOn(authenticator, "generateSecret")
      .mockReturnValue("TESTSECRET");
    const { secret } = await enrollMfa("user-valid");
    const token = authenticator.generate(secret);
    await expect(verifyMfa("user-valid", token)).resolves.toBe(true);
    expect(prisma.customerMfa.update).toHaveBeenCalledWith({
      where: { customerId: "user-valid" },
      data: { enabled: true },
    });
    await expect(isMfaEnabled("user-valid")).resolves.toBe(true);
  });

  it("returns false when enrolled but not verified", async () => {
    await enrollMfa("user-unverified");
    await expect(isMfaEnabled("user-unverified")).resolves.toBe(false);
  });

  it("does not re-enable when already enabled", async () => {
    jest
      .spyOn(authenticator, "generateSecret")
      .mockReturnValue("ENABLEDSECRET");
    const { secret } = await enrollMfa("user-repeat");
    const token = authenticator.generate(secret);
    await verifyMfa("user-repeat", token);
    (prisma.customerMfa.update as jest.Mock).mockClear();
    await expect(verifyMfa("user-repeat", token)).resolves.toBe(true);
    expect(prisma.customerMfa.update).not.toHaveBeenCalled();
  });

  it("throws when update fails", async () => {
    jest
      .spyOn(authenticator, "generateSecret")
      .mockReturnValue("ERRORSECRET");
    const { secret } = await enrollMfa("user-error");
    const token = authenticator.generate(secret);
    const err = new Error("update failed");
    (prisma.customerMfa.update as jest.Mock).mockRejectedValueOnce(err);
    await expect(verifyMfa("user-error", token)).rejects.toBe(err);
  });

  it("fails with wrong code", async () => {
    jest
      .spyOn(authenticator, "generateSecret")
      .mockReturnValue("TESTSECRET");
    const { secret } = await enrollMfa("user-wrong");
    const valid = authenticator.generate(secret);
    const wrong = ((parseInt(valid) + 1) % 1000000)
      .toString()
      .padStart(6, "0");
    await expect(verifyMfa("user-wrong", wrong)).resolves.toBe(false);
  });

  it("fails when token expired", async () => {
    jest
      .spyOn(authenticator, "generateSecret")
      .mockReturnValue("TESTSECRET");
    const { secret } = await enrollMfa("user-expired");
    const token = authenticator.generate(secret);
    jest.setSystemTime(Date.now() + 61_000);
    await expect(verifyMfa("user-expired", token)).resolves.toBe(false);
  });

  it("returns false when user not enrolled", async () => {
    await expect(verifyMfa("missing", "123456")).resolves.toBe(false);
    await expect(isMfaEnabled("missing")).resolves.toBe(false);
  });
});

describe("mfa token", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-01-01T00:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("generateMfaToken returns token and expiration", () => {
    const data = generateMfaToken();
    expect(data.token).toMatch(/^\d{6}$/);
    expect(data.expiresAt).toBeInstanceOf(Date);
    expect(data.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("verifyMfaToken validates tokens", () => {
    const data = generateMfaToken();
    expect(verifyMfaToken(data.token, data)).toBe(true);
    expect(verifyMfaToken("000000", data)).toBe(false);
  });

  it("verifyMfaToken respects expiration", () => {
    const data = generateMfaToken();
    jest.setSystemTime(data.expiresAt.getTime() + 1);
    expect(verifyMfaToken(data.token, data)).toBe(false);
  });
});

