import { enrollMfa, verifyMfa } from "../src/mfa";
import { authenticator } from "otplib";

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

  it("verifies valid token", async () => {
    jest
      .spyOn(authenticator, "generateSecret")
      .mockReturnValue("TESTSECRET");
    const { secret } = await enrollMfa("user-valid");
    const token = authenticator.generate(secret);
    await expect(verifyMfa("user-valid", token)).resolves.toBe(true);
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
});

