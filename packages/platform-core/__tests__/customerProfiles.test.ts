import { jest } from "@jest/globals";

// Use the runtime Prisma stub and override customerProfile methods
const actual = jest.requireActual("../src/db") as typeof import("../src/db");

const prisma = {
  ...actual.prisma,
  customerProfile: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    upsert: jest.fn(),
  },
};

jest.mock("../src/db", () => ({ prisma }));

import { getCustomerProfile, updateCustomerProfile } from "../src/customerProfiles";

describe("customer profiles", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the profile when found", async () => {
    const profile = {
      customerId: "abc",
      name: "Test",
      email: "test@example.com",
    } as any;
    prisma.customerProfile.findUnique.mockResolvedValue(profile);

    await expect(getCustomerProfile("abc")).resolves.toBe(profile);
    expect(prisma.customerProfile.findUnique).toHaveBeenCalledWith({
      where: { customerId: "abc" },
    });
  });

  it("calls findUnique and throws when profile is missing", async () => {
    prisma.customerProfile.findUnique.mockResolvedValue(null);
    await expect(getCustomerProfile("abc")).rejects.toThrow("Customer profile not found");
    expect(prisma.customerProfile.findUnique).toHaveBeenCalledWith({ where: { customerId: "abc" } });
  });

  it("rejects duplicate emails in updateCustomerProfile", async () => {
    prisma.customerProfile.findFirst.mockResolvedValue({ customerId: "other" });
    await expect(
      updateCustomerProfile("abc", { name: "Test", email: "dup@example.com" })
    ).rejects.toThrow("Conflict: email already in use");
    expect(prisma.customerProfile.findFirst).toHaveBeenCalledWith({
      where: { email: "dup@example.com", NOT: { customerId: "abc" } },
    });
  });

  it("upserts data when email is unique", async () => {
    prisma.customerProfile.findFirst.mockResolvedValue(null);
    const updated = { customerId: "abc", name: "Name", email: "n@example.com" } as any;
    prisma.customerProfile.upsert.mockResolvedValue(updated);

    const result = await updateCustomerProfile("abc", { name: "Name", email: "n@example.com" });

    expect(prisma.customerProfile.upsert).toHaveBeenCalledWith({
      where: { customerId: "abc" },
      update: { name: "Name", email: "n@example.com" },
      create: { customerId: "abc", name: "Name", email: "n@example.com" },
    });
    expect(result).toBe(updated);
  });
});

