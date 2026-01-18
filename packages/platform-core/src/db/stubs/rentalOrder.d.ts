export type RentalOrder = {
    shop: string;
    sessionId: string;
    trackingNumber?: string | null;
    customerId?: string | null;
    [key: string]: unknown;
};
interface FindManyArgs {
    where?: {
        shop?: string;
        customerId?: string | null;
        stripePaymentIntentId?: string | null;
    };
}
type ShopSessionIdWhere = {
    shop_sessionId: {
        shop: string;
        sessionId: string;
    };
};
type ShopTrackingNumberWhere = {
    shop_trackingNumber: {
        shop: string;
        trackingNumber: string | null;
    };
};
type FindUniqueWhere = ShopSessionIdWhere | ShopTrackingNumberWhere | Record<string, unknown>;
interface FindUniqueArgs {
    where: FindUniqueWhere;
}
interface UpdateArgs {
    where: ShopSessionIdWhere | ShopTrackingNumberWhere;
    data: Partial<RentalOrder>;
}
interface UpdateManyArgs {
    where?: {
        shop?: string;
        stripePaymentIntentId?: string | null;
    };
    data: Partial<RentalOrder>;
}
interface RentalOrderDelegate {
    findMany(args?: FindManyArgs): Promise<RentalOrder[]>;
    findUnique(args: FindUniqueArgs): Promise<RentalOrder | null>;
    create(args: {
        data: RentalOrder;
    }): Promise<RentalOrder>;
    update(args: UpdateArgs): Promise<RentalOrder>;
    updateMany(args: UpdateManyArgs): Promise<{
        count: number;
    }>;
}
export declare function createRentalOrderDelegate(): RentalOrderDelegate;
export {};
