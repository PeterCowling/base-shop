import "server-only";
import type { PricingMatrix, SKU } from "@types";
export declare function getPricing(): Promise<PricingMatrix>;
export declare function applyDurationDiscount(baseRate: number, days: number, discounts: {
    minDays: number;
    rate: number;
}[]): number;
export declare function priceForDays(sku: SKU, days: number): Promise<number>;
export declare function computeDamageFee(kind: string | number | undefined, deposit: number): Promise<number>;
//# sourceMappingURL=pricing.d.ts.map