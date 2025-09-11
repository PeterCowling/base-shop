export type CustomerProfile = {
  customerId: string;
  name: string;
  email: string;
};

export function createCustomerProfileDelegate() {
  const customerProfiles: CustomerProfile[] = [];
  return {
    findUnique: async ({ where }: any) =>
      customerProfiles.find((p) => p.customerId === where.customerId) || null,
    findFirst: async ({ where }: any) => {
      const email = where?.email;
      const notCustomerId = where?.NOT?.customerId;
      return (
        customerProfiles.find(
          (p) => p.email === email && (!notCustomerId || p.customerId !== notCustomerId),
        ) || null
      );
    },
    upsert: async ({ where, update, create }: any) => {
      const idx = customerProfiles.findIndex((p) => p.customerId === where.customerId);
      if (idx >= 0) {
        customerProfiles[idx] = { ...customerProfiles[idx], ...update };
        return customerProfiles[idx];
      }
      const profile = { ...create };
      customerProfiles.push(profile);
      return profile;
    },
  } as any;
}
