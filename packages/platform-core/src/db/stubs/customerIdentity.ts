import { randomUUID } from "crypto";

export type CustomerIdentity = {
  id: string;
  issuer: string;
  subject: string;
  internalCustomerId: string;
  createdAt: Date;
  updatedAt: Date;
};

type FindUniqueArgs = {
  where: {
    id?: string;
    internalCustomerId?: string;
    issuer_subject?: {
      issuer: string;
      subject: string;
    };
  };
};

type CreateArgs = {
  data: Omit<CustomerIdentity, "id" | "createdAt" | "updatedAt"> &
    Partial<Pick<CustomerIdentity, "id" | "createdAt" | "updatedAt">>;
};

export function createCustomerIdentityDelegate() {
  const rows: CustomerIdentity[] = [];

  return {
    findUnique: async ({ where }: FindUniqueArgs): Promise<CustomerIdentity | null> => {
      if (where.id) {
        return rows.find((row) => row.id === where.id) ?? null;
      }
      if (where.internalCustomerId) {
        return (
          rows.find((row) => row.internalCustomerId === where.internalCustomerId) ?? null
        );
      }
      if (where.issuer_subject) {
        const { issuer, subject } = where.issuer_subject;
        return (
          rows.find((row) => row.issuer === issuer && row.subject === subject) ?? null
        );
      }
      return null;
    },
    create: async ({ data }: CreateArgs): Promise<CustomerIdentity> => {
      if (
        rows.some(
          (row) =>
            row.issuer === data.issuer && row.subject === data.subject,
        ) ||
        rows.some((row) => row.internalCustomerId === data.internalCustomerId)
      ) {
        throw new Error("Unique constraint failed"); // i18n-exempt: test-only stub error
      }
      const now = new Date();
      const record: CustomerIdentity = {
        id: data.id ?? randomUUID(),
        issuer: data.issuer,
        subject: data.subject,
        internalCustomerId: data.internalCustomerId,
        createdAt: data.createdAt ?? now,
        updatedAt: data.updatedAt ?? now,
      };
      rows.push(record);
      return record;
    },
  };
}
