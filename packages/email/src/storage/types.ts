export interface Campaign {
  id: string;
  recipients: string[];
  subject: string;
  body: string;
  segment?: string | null;
  sendAt: string;
  sentAt?: string;
}

export interface CampaignStore {
  /**
   * Return a list of shop identifiers that have campaign data.
   */
  listShops(): Promise<string[]>;

  /**
   * Read the scheduled campaigns for a shop. Implementations should
   * return an empty array when no campaigns exist.
   */
  readCampaigns(shop: string): Promise<Campaign[]>;

  /**
   * Persist campaign data for a shop.
   */
  writeCampaigns(shop: string, campaigns: Campaign[]): Promise<void>;
}
