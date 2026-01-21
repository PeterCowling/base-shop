import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { prisma } from "../src/db";
import { getUserByEmail, getUserById } from "../src/users";

type StoreUser = {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  resetToken: string | null;
  resetTokenExpiresAt: Date | null;
  emailVerified: boolean;
};

const store: Record<string, StoreUser> = {};
let shouldThrow = false;

jest.mock("../src/db", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(async ({ where }) => {
        if (shouldThrow) throw new Error("db error");
        if ("id" in where) return store[where.id] ?? null;
        if ("email" in where)
          return (
            Object.values(store).find((u) => u.email === where.email) ?? null
          );
        return null;
      }),
    },
  },
}));

const findUniqueMock = (prisma as any).user.findUnique as jest.Mock;

beforeEach(() => {
  findUniqueMock.mockClear();
  shouldThrow = false;
  for (const key in store) delete store[key];
});

describe("user lookup", () => {
  const user: StoreUser = {
    id: "u1",
    email: "u1@example.com",
    passwordHash: "hash",
    role: "customer",
    resetToken: null,
    resetTokenExpiresAt: null,
    emailVerified: false,
  };

  it("finds user by id", async () => {
    store[user.id] = user;
    await expect(getUserById("u1")).resolves.toEqual(user);
  });

  it("finds user by email", async () => {
    store[user.id] = user;
    await expect(getUserByEmail("u1@example.com")).resolves.toEqual(user);
  });

  it("throws when user not found", async () => {
    await expect(getUserById("missing")).rejects.toThrow("User not found");
    await expect(getUserByEmail("missing@example.com")).rejects.toThrow(
      "User not found",
    );
  });

  it("propagates backend errors", async () => {
    shouldThrow = true;
    await expect(getUserById("u1")).rejects.toThrow("db error");
    await expect(getUserByEmail("u1@example.com")).rejects.toThrow("db error");
  });
});
