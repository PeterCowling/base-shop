import type { Campaign } from "../types";

export interface CampaignStore {
    /**
     * Retrieve all campaigns for a shop.
     */
    readCampaigns(shop: string): Promise<Campaign[]>;
    /**
     * Persist campaigns for a shop.
     */
    writeCampaigns(shop: string, campaigns: Campaign[]): Promise<void>;
    /**
     * List all shops with campaigns.
     */
    listShops(): Promise<string[]>;
}
//# sourceMappingURL=types.d.ts.map