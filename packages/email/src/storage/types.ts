export interface Campaign {
  id: string;
  recipients: string[];
  subject: string;
  body: string;
  segment?: string | null;
  sendAt: string;
  sentAt?: string;
  templateId?: string | null;
}

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
