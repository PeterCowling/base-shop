export function createUserDelegate() {
  const users: any[] = [];
  const findIdx = (where: any) =>
    users.findIndex((u) => Object.entries(where).every(([k, v]) => u[k] === v));
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
