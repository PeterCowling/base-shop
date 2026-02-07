import "server-only";

import type { Campaign } from "./types";

export interface Clock {
    now(): Date;
}
export declare function setClock(c: Clock): void;
export declare function listCampaigns(shop: string): Promise<Campaign[]>;
export declare function createCampaign(opts: {
    shop: string;
    recipients?: string[];
    subject: string;
    body: string;
    segment?: string;
    sendAt?: string;
    templateId?: string | null;
}): Promise<string>;
export declare function sendDueCampaigns(): Promise<void>;
/**
 * Periodically sync campaign analytics for all shops.
 */
export declare function syncCampaignAnalytics(): Promise<void>;
//# sourceMappingURL=scheduler.d.ts.map