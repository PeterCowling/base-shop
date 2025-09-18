type StoredUser = Record<string, unknown> & {
  id: string;
  email: string;
};

interface UserWhere extends Partial<StoredUser> {
  NOT?: Partial<StoredUser>;
}

export function createUserDelegate() {
  const users: StoredUser[] = [
    {
      id: "user1",
      email: "u1@test.com",
    },
    {
      id: "user2",
      email: "u2@test.com",
    },
  ];
  const getValue = (user: StoredUser, key: string) =>
    user[key as keyof StoredUser];
  const matches = (
    user: StoredUser,
    criteria: Partial<StoredUser>,
  ) =>
    Object.entries(criteria).every(([key, value]) =>
      value === undefined ? true : getValue(user, key) === value,
    );
  const matchesNot = (
    user: StoredUser,
    criteria: Partial<StoredUser>,
  ) =>
    Object.entries(criteria).some(([key, value]) =>
      value === undefined ? false : getValue(user, key) === value,
    );
  const findIdx = (where: UserWhere | undefined) =>
    users.findIndex((user) => {
      const { NOT, ...rest } = where ?? {};
      if (NOT && matchesNot(user, NOT)) return false;
      return matches(user, rest);
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
    async create({ data }: { data: StoredUser }) {
      users.push({ ...data });
      return data;
    },
    async update({
      where,
      data,
    }: {
      where: UserWhere;
      data: Partial<StoredUser>;
    }) {
      const idx = findIdx(where);
      if (idx < 0) throw new Error("User not found");
      users[idx] = { ...users[idx], ...data };
      return users[idx];
    },
  };
}
