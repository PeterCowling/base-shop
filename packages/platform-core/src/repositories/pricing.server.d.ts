import "server-only";

import { type PricingMatrix } from "@acme/types";

export declare function readPricing(): Promise<PricingMatrix>;
export declare function writePricing(data: PricingMatrix): Promise<void>;
