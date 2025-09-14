import type { User } from "@acme/types";

interface UserWhere extends Partial<User> {
  NOT?: Partial<User>;
}

export function createUserDelegate() {
  const users: User[] = [
    {
      id: "user1",
      email: "u1@test.com",
      passwordHash: "",
      role: "",
      resetToken: null,
      resetTokenExpiresAt: null,
      emailVerified: false,
    },
    {
      id: "user2",
      email: "u2@test.com",
      passwordHash: "",
      role: "",
      resetToken: null,
      resetTokenExpiresAt: null,
      emailVerified: false,
    },
  ];
  const findIdx = (where: UserWhere | undefined) =>
    users.findIndex((u) => {
      const { NOT, ...rest } = where || {};
      if (
        NOT &&
        Object.entries(NOT).some(
          ([k, v]) => u[k as keyof User] === v,
        )
      )
        return false;
      return Object.entries(rest).every(
        ([k, v]) => u[k as keyof User] === v,
      );
    });
  return {
    async findUnique({ where }: { where: UserWhere }) {
      const idx = findIdx(where);
      return idx >= 0 ? users[idx] : null;
    },
    async findFirst({ where }: { where: UserWhere }) {
      const idx = findIdx(where);
      return idx >= 0 ? users[idx] : null;
    },
    async create({ data }: { data: User }) {
      users.push({ ...data });
      return data;
    },
    async update({ where, data }: { where: UserWhere; data: Partial<User> }) {
      const idx = findIdx(where);
      if (idx < 0) throw new Error("User not found");
      users[idx] = { ...users[idx], ...data };
      return users[idx];
    },
  };
}
