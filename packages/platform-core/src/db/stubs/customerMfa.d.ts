export type CustomerMfa = {
    customerId: string;
    secret: string;
    enabled: boolean;
};
export declare function createCustomerMfaDelegate(): {
    upsert: ({ where, update, create }: {
        where: {
            customerId: string;
        };
        update: Partial<CustomerMfa>;
        create: CustomerMfa;
    }) => Promise<CustomerMfa>;
    findUnique: ({ where }: {
        where: {
            customerId: string;
        };
    }) => Promise<CustomerMfa | null>;
    update: ({ where, data }: {
        where: {
            customerId: string;
        };
        data: Partial<CustomerMfa>;
    }) => Promise<CustomerMfa>;
};
export declare const customerMfaDelegate: {
    upsert: ({ where, update, create }: {
        where: {
            customerId: string;
        };
        update: Partial<CustomerMfa>;
        create: CustomerMfa;
    }) => Promise<CustomerMfa>;
    findUnique: ({ where }: {
        where: {
            customerId: string;
        };
    }) => Promise<CustomerMfa | null>;
    update: ({ where, data }: {
        where: {
            customerId: string;
        };
        data: Partial<CustomerMfa>;
    }) => Promise<CustomerMfa>;
};
