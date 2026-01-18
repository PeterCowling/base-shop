type StripeWebhookEvent = {
    id: string;
    shop: string;
    type: string;
    status: string;
    lastError?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
};
export declare function createStripeWebhookEventDelegate(): {
    findUnique({ where }: {
        where: {
            id: string;
        };
    }): Promise<{
        id: string;
        shop: string;
        type: string;
        status: string;
        lastError?: string | null;
        createdAt?: Date;
        updatedAt?: Date;
    } | null>;
    upsert({ where, create, update, }: {
        where: {
            id: string;
        };
        create: StripeWebhookEvent;
        update: Partial<StripeWebhookEvent>;
    }): Promise<{
        id: string;
        shop: string;
        type: string;
        status: string;
        lastError?: string | null;
        createdAt?: Date;
        updatedAt?: Date;
    }>;
    deleteMany({ where, }?: {
        where?: {
            createdAt?: {
                lt?: Date;
            };
        };
    }): Promise<{
        count: number;
    }>;
};
export {};
