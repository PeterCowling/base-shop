import { setResetToken, getUserByResetToken } from "../src/users";
import { prisma } from "../src/db";

type StoreUser = {
  id: string;
  resetToken: string | null;
  resetTokenExpiresAt: Date | null;
};

const store: Record<string, StoreUser> = {};

jest.mock("../src/db", () => ({
  prisma: {
    user: {
      update: jest.fn(async ({ where, data }) => {
        const existing = store[where.id] ?? { id: where.id, resetToken: null, resetTokenExpiresAt: null };
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

const updateMock = (prisma as any).user.update as jest.Mock;
const findFirstMock = (prisma as any).user.findFirst as jest.Mock;

describe("reset token expiry", () => {
  afterEach(() => {
    updateMock.mockClear();
    findFirstMock.mockClear();
    for (const key in store) delete store[key];
  });

  it("returns null for expired tokens", async () => {
    await setResetToken("u1", "tok", new Date(Date.now() - 1000));
    const user = await getUserByResetToken("tok");
    expect(user).toBeNull();
  });

  it("returns user when token valid", async () => {
    const expires = new Date(Date.now() + 1000);
    await setResetToken("u2", "tok2", expires);
    const user = await getUserByResetToken("tok2");
    expect(user?.id).toBe("u2");
  });
});
