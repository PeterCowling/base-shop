export function createUserDelegate() {
  const users: any[] = [
    { id: "user1", email: "u1@test.com" },
    { id: "user2", email: "u2@test.com" },
  ];
  const findIdx = (where: any) =>
    users.findIndex((u) => {
      const { NOT, ...rest } = where || {};
      if (NOT && Object.entries(NOT).some(([k, v]) => u[k] === v)) return false;
      return Object.entries(rest).every(([k, v]) => u[k] === v);
    });
  return {
    findUnique: async ({ where }: any) => {
      const idx = findIdx(where);
      return idx >= 0 ? users[idx] : null;
    },
    findFirst: async ({ where }: any) => {
      const idx = findIdx(where);
      return idx >= 0 ? users[idx] : null;
    },
    create: async ({ data }: any) => {
      users.push({ ...data });
      return data;
    },
    update: async ({ where, data }: any) => {
      const idx = findIdx(where);
      if (idx < 0) throw new Error("User not found");
      users[idx] = { ...users[idx], ...data };
      return users[idx];
    },
  } as any;
}
