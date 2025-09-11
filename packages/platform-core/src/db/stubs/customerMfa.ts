export type CustomerMfa = {
  customerId: string;
  secret: string;
  enabled: boolean;
};

export function createCustomerMfaDelegate() {
  const customerMfas: CustomerMfa[] = [];
  return {
    upsert: async ({ where, update, create }: any) => {
      const idx = customerMfas.findIndex((m) => m.customerId === where.customerId);
      if (idx >= 0) {
        customerMfas[idx] = { ...customerMfas[idx], ...update };
        return customerMfas[idx];
      }
      const record = { ...create };
      customerMfas.push(record);
      return record;
    },
    findUnique: async ({ where }: any) =>
      customerMfas.find((m) => m.customerId === where.customerId) || null,
    update: async ({ where, data }: any) => {
      const idx = customerMfas.findIndex((m) => m.customerId === where.customerId);
      if (idx < 0) throw new Error("CustomerMfa not found");
      customerMfas[idx] = { ...customerMfas[idx], ...data };
      return customerMfas[idx];
    },
  } as any;
}
