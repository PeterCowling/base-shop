import "server-only";

import type { SubscriptionUsage } from "@acme/types";

export declare function getSubscriptionUsage(
  shop: string,
  customerId: string,
  month: string,
): Promise<SubscriptionUsage>;

export declare function incrementSubscriptionUsage(
  shop: string,
  customerId: string,
  month: string,
  count?: number,
): Promise<void>;
