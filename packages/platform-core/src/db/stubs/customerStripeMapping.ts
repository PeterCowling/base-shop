import { randomUUID } from "crypto";

export type CustomerStripeMapping = {
  id: string;
  internalCustomerId: string;
  stripeCustomerId: string;
  environment: string;
  createdAt: Date;
  updatedAt: Date;
};

type FindUniqueArgs = {
  where: {
    id?: string;
    internalCustomerId_environment?: {
      internalCustomerId: string;
      environment: string;
    };
    stripeCustomerId_environment?: {
      stripeCustomerId: string;
      environment: string;
    };
  };
};

type CreateArgs = {
  data: Omit<CustomerStripeMapping, "id" | "createdAt" | "updatedAt"> &
    Partial<Pick<CustomerStripeMapping, "id" | "createdAt" | "updatedAt">>;
};

export function createCustomerStripeMappingDelegate() {
  const rows: CustomerStripeMapping[] = [];

  return {
    findUnique: async ({
      where,
    }: FindUniqueArgs): Promise<CustomerStripeMapping | null> => {
      if (where.id) {
        return rows.find((row) => row.id === where.id) ?? null;
      }
      if (where.internalCustomerId_environment) {
        const { internalCustomerId, environment } =
          where.internalCustomerId_environment;
        return (
          rows.find(
            (row) =>
              row.internalCustomerId === internalCustomerId &&
              row.environment === environment,
          ) ?? null
        );
      }
      if (where.stripeCustomerId_environment) {
        const { stripeCustomerId, environment } =
          where.stripeCustomerId_environment;
        return (
          rows.find(
            (row) =>
              row.stripeCustomerId === stripeCustomerId &&
              row.environment === environment,
          ) ?? null
        );
      }
      return null;
    },
    create: async ({ data }: CreateArgs): Promise<CustomerStripeMapping> => {
      const conflict = rows.some(
        (row) =>
          (row.internalCustomerId === data.internalCustomerId &&
            row.environment === data.environment) ||
          (row.stripeCustomerId === data.stripeCustomerId &&
            row.environment === data.environment),
      );
      if (conflict) {
        throw new Error("Unique constraint failed"); // i18n-exempt: test-only stub error
      }
      const now = new Date();
      const record: CustomerStripeMapping = {
        id: data.id ?? randomUUID(),
        internalCustomerId: data.internalCustomerId,
        stripeCustomerId: data.stripeCustomerId,
        environment: data.environment,
        createdAt: data.createdAt ?? now,
        updatedAt: data.updatedAt ?? now,
      };
      rows.push(record);
      return record;
    },
  };
}
