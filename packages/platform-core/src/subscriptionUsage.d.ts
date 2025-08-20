import "server-only";
export interface SubscriptionUsage {
    id: string;
    shop: string;
    customerId: string;
    month: string;
    shipments: number;
}
export declare function getSubscriptionUsage(shop: string, customerId: string, month: string): Promise<SubscriptionUsage | null>;
export declare function incrementSubscriptionUsage(shop: string, customerId: string, month: string, count?: number): Promise<void>;
//# sourceMappingURL=subscriptionUsage.d.ts.map