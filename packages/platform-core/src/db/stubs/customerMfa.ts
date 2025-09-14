export type CustomerMfa = {
  customerId: string;
  secret: string;
  enabled: boolean;
};

export function createCustomerMfaDelegate() {
  const customerMfas: CustomerMfa[] = [];
  return {
    upsert: async ({ where, update, create }: {
      where: { customerId: string };
      update: Partial<CustomerMfa>;
      create: CustomerMfa;
    }): Promise<CustomerMfa> => {
      const idx = customerMfas.findIndex((m) => m.customerId === where.customerId);
      if (idx >= 0) {
        customerMfas[idx] = { ...customerMfas[idx], ...update };
        return customerMfas[idx];
      }
      const record = { ...create };
      customerMfas.push(record);
      return record;
    },
    findUnique: async ({ where }: { where: { customerId: string } }): Promise<CustomerMfa | null> =>
      customerMfas.find((m) => m.customerId === where.customerId) || null,
    update: async ({ where, data }: {
      where: { customerId: string };
      data: Partial<CustomerMfa>;
    }): Promise<CustomerMfa> => {
      const idx = customerMfas.findIndex((m) => m.customerId === where.customerId);
      if (idx < 0) throw new Error("CustomerMfa not found");
      customerMfas[idx] = { ...customerMfas[idx], ...data };
      return customerMfas[idx];
    },
  };
}

export const customerMfaDelegate = createCustomerMfaDelegate();
