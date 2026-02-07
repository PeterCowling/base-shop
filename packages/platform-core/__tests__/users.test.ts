import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { prisma } from "../src/db";
import {
  createUser,
  getUserByEmail,
  getUserById,
  getUserByResetToken,
  setResetToken,
  updatePassword,
  verifyEmail,
} from "../src/users";

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

jest.mock("../src/db", () => ({
  prisma: {
    user: {
      create: jest.fn(async ({ data }) => {
        store[data.id] = {
          ...data,
          resetToken: null,
          resetTokenExpiresAt: null,
          emailVerified: data.emailVerified ?? false,
        } as StoreUser;
        return store[data.id];
      }),
      update: jest.fn(async ({ where, data }) => {
        store[where.id] = { ...store[where.id], ...data };
        return store[where.id];
      }),
      findFirst: jest.fn(async ({ where }) => {
        return (
          Object.values(store).find(
            (u) =>
              u.resetToken === where.resetToken &&
              u.resetTokenExpiresAt &&
              u.resetTokenExpiresAt > where.resetTokenExpiresAt.gt,
          ) ?? null
        );
      }),
      findUnique: jest.fn(async ({ where }) => {
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

const createMock = (prisma as any).user.create as jest.Mock;
const updateMock = (prisma as any).user.update as jest.Mock;
const findFirstMock = (prisma as any).user.findFirst as jest.Mock;
const findUniqueMock = (prisma as any).user.findUnique as jest.Mock;

beforeEach(() => {
  createMock.mockClear();
  updateMock.mockClear();
  findFirstMock.mockClear();
  findUniqueMock.mockClear();
  for (const key in store) delete store[key];
});

describe("users", () => {
  it("createUser sends correct data", async () => {
    await createUser({
      id: "u1",
      email: "u1@example.com",
      passwordHash: "hash",
      role: "admin",
      emailVerified: true,
    });
    expect(createMock).toHaveBeenCalledWith({
      data: {
        id: "u1",
        email: "u1@example.com",
        passwordHash: "hash",
        role: "admin",
        emailVerified: true,
      },
    });
  });

  it("setResetToken stores token and getUserByResetToken respects expiry", async () => {
    await createUser({ id: "u2", email: "u2@example.com", passwordHash: "hash" });
    const expires = new Date(Date.now() + 1000);
    await setResetToken("u2", "tok", expires);
    expect(updateMock).toHaveBeenLastCalledWith({
      where: { id: "u2" },
      data: { resetToken: "tok", resetTokenExpiresAt: expires },
    });
    const user = await getUserByResetToken("tok");
    expect(user.id).toBe("u2");
    store["u2"].resetTokenExpiresAt = new Date(Date.now() - 1000);
    await expect(getUserByResetToken("tok")).rejects.toThrow("User not found");
  });

  it("updatePassword issues update call", async () => {
    await updatePassword("u3", "new");
    expect(updateMock).toHaveBeenLastCalledWith({
      where: { id: "u3" },
      data: { passwordHash: "new" },
    });
  });

  it("verifyEmail issues update call", async () => {
    await verifyEmail("u4");
    expect(updateMock).toHaveBeenLastCalledWith({
      where: { id: "u4" },
      data: { emailVerified: true },
    });
  });

  it("getUserById/Email throw when missing", async () => {
    await expect(getUserById("missing")).rejects.toThrow("User not found");
    await expect(getUserByEmail("missing@example.com")).rejects.toThrow(
      "User not found",
    );
  });
});

