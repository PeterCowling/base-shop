export type CustomerProfile = {
  customerId: string;
  name: string;
  email: string;
};

export function createCustomerProfileDelegate() {
  const customerProfiles: CustomerProfile[] = [];
  return {
    findUnique: async ({ where }: { where: { customerId: string } }): Promise<CustomerProfile | null> =>
      customerProfiles.find((p) => p.customerId === where.customerId) || null,
    findFirst: async ({
      where,
    }: {
      where?: { email?: string; NOT?: { customerId?: string } };
    }): Promise<CustomerProfile | null> => {
      const email = where?.email;
      const notCustomerId = where?.NOT?.customerId;
      return (
        customerProfiles.find(
          (p) => p.email === email && (!notCustomerId || p.customerId !== notCustomerId),
        ) || null
      );
    },
    upsert: async ({
      where,
      update,
      create,
    }: {
      where: { customerId: string };
      update: Partial<CustomerProfile>;
      create: CustomerProfile;
    }): Promise<CustomerProfile> => {
      const idx = customerProfiles.findIndex((p) => p.customerId === where.customerId);
      if (idx >= 0) {
        customerProfiles[idx] = { ...customerProfiles[idx], ...update };
        return customerProfiles[idx];
      }
      const profile = { ...create };
      customerProfiles.push(profile);
      return profile;
    },
  };
}
