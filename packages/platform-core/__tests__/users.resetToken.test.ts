import { prisma } from "../src/db";
import {
  createUser,
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
        };
        return store[data.id];
      }),
      update: jest.fn(async ({ where, data }) => {
        const existing =
          store[where.id] ?? {
            id: where.id,
            email: "",
            passwordHash: "",
            role: "customer",
            resetToken: null,
            resetTokenExpiresAt: null,
            emailVerified: false,
          };
        store[where.id] = { ...existing, ...data };
        return store[where.id];
      }),
      findFirst: jest.fn(async ({ where }) => {
        const match = Object.values(store).find(
          (u) =>
            u.resetToken === where.resetToken &&
            u.resetTokenExpiresAt &&
            u.resetTokenExpiresAt > where.resetTokenExpiresAt.gt,
        );
        return match ?? null;
      }),
    },
  },
}));

const createMock = (prisma as any).user.create as jest.Mock;
const updateMock = (prisma as any).user.update as jest.Mock;
const findFirstMock = (prisma as any).user.findFirst as jest.Mock;

describe("user operations", () => {
  afterEach(() => {
    createMock.mockClear();
    updateMock.mockClear();
    findFirstMock.mockClear();
    for (const key in store) delete store[key];
  });

  it("creates user with default role and email verification", async () => {
    const user = await createUser({
      id: "u1",
      email: "u1@example.com",
      passwordHash: "hash",
    });
    expect(user.role).toBe("customer");
    expect(user.emailVerified).toBe(false);
  });

  it("sets and clears reset token", async () => {
    await createUser({ id: "u2", email: "u2@example.com", passwordHash: "hash" });
    const expires = new Date(Date.now() + 1000);
    await setResetToken("u2", "tok", expires);
    expect(store["u2"].resetToken).toBe("tok");
    await setResetToken("u2", null, null);
    expect(store["u2"].resetToken).toBeNull();
    expect(store["u2"].resetTokenExpiresAt).toBeNull();
  });

  it("throws for expired tokens", async () => {
    await createUser({ id: "u3", email: "u3@example.com", passwordHash: "hash" });
    await setResetToken("u3", "tok", new Date(Date.now() - 1000));
    await expect(getUserByResetToken("tok")).rejects.toThrow("User not found");
  });

  it("returns user when token valid", async () => {
    await createUser({ id: "u4", email: "u4@example.com", passwordHash: "hash" });
    const expires = new Date(Date.now() + 1000);
    await setResetToken("u4", "tok2", expires);
    const user = await getUserByResetToken("tok2");
    expect(user?.id).toBe("u4");
  });

  it("updates password hash", async () => {
    await createUser({ id: "u5", email: "u5@example.com", passwordHash: "old" });
    await updatePassword("u5", "new");
    expect(store["u5"].passwordHash).toBe("new");
  });

  it("verifies email", async () => {
    await createUser({ id: "u6", email: "u6@example.com", passwordHash: "hash" });
    await verifyEmail("u6");
    expect(store["u6"].emailVerified).toBe(true);
  });
});
