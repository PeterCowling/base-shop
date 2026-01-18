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
    data: Omit<CustomerIdentity, "id" | "createdAt" | "updatedAt"> & Partial<Pick<CustomerIdentity, "id" | "createdAt" | "updatedAt">>;
};
export declare function createCustomerIdentityDelegate(): {
    findUnique: ({ where }: FindUniqueArgs) => Promise<CustomerIdentity | null>;
    create: ({ data }: CreateArgs) => Promise<CustomerIdentity>;
};
export {};
