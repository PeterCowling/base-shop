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
    data: Omit<CustomerStripeMapping, "id" | "createdAt" | "updatedAt"> & Partial<Pick<CustomerStripeMapping, "id" | "createdAt" | "updatedAt">>;
};
export declare function createCustomerStripeMappingDelegate(): {
    findUnique: ({ where, }: FindUniqueArgs) => Promise<CustomerStripeMapping | null>;
    create: ({ data }: CreateArgs) => Promise<CustomerStripeMapping>;
};
export {};
