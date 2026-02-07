import { prisma } from "../src/db";
import {
  createUser,
  getUserByResetToken,
  setResetToken,
  updatePassword,
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
        } as StoreUser;
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
        store[where.id] = { ...existing, ...data } as StoreUser;
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

describe("password reset flow", () => {
  beforeEach(() => {
    createMock.mockClear();
    updateMock.mockClear();
    findFirstMock.mockClear();
    for (const key in store) delete store[key];
  });

  it("completes password reset with valid token", async () => {
    await createUser({
      id: "u1",
      email: "u1@example.com",
      passwordHash: "old",
    });
    const expires = new Date(Date.now() + 1000);
    await setResetToken("u1", "tok", expires);

    const user = await getUserByResetToken("tok");
    expect(user.id).toBe("u1");

    await updatePassword("u1", "new");
    await setResetToken("u1", null, null);

    expect(store["u1"].passwordHash).toBe("new");
    expect(store["u1"].resetToken).toBeNull();
  });

  it("rejects expired token", async () => {
    await createUser({ id: "u2", email: "u2@example.com", passwordHash: "old" });
    await setResetToken("u2", "tok", new Date(Date.now() - 1000));
    await expect(getUserByResetToken("tok")).rejects.toThrow("User not found");
  });

  it("rejects invalid token", async () => {
    await createUser({ id: "u3", email: "u3@example.com", passwordHash: "old" });
    const expires = new Date(Date.now() + 1000);
    await setResetToken("u3", "tok", expires);
    await expect(getUserByResetToken("bad")).rejects.toThrow("User not found");
  });
});

