export type CustomerProfile = {
    customerId: string;
    name: string;
    email: string;
};
export declare function createCustomerProfileDelegate(): {
    findUnique: ({ where }: {
        where: {
            customerId: string;
        };
    }) => Promise<CustomerProfile | null>;
    findFirst: ({ where, }: {
        where?: {
            email?: string;
            NOT?: {
                customerId?: string;
            };
        };
    }) => Promise<CustomerProfile | null>;
    upsert: ({ where, update, create, }: {
        where: {
            customerId: string;
        };
        update: Partial<CustomerProfile>;
        create: CustomerProfile;
    }) => Promise<CustomerProfile>;
};
