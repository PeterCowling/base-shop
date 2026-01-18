import type { SubscriptionUsage } from "@acme/types";
type SubscriptionUsageWhere = Partial<SubscriptionUsage>;
interface UpsertArgs {
    where: SubscriptionUsageWhere;
    update: Partial<SubscriptionUsage>;
    create: SubscriptionUsage;
}
export declare function createSubscriptionUsageDelegate(): {
    findUnique({ where }: {
        where: SubscriptionUsageWhere;
    }): Promise<SubscriptionUsage | null>;
    upsert({ where, update, create }: UpsertArgs): Promise<SubscriptionUsage>;
};
export {};
