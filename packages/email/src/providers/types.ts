import type { CampaignOptions } from "../send";
import type { CampaignStats } from "../analytics";

export interface CampaignProvider {
  send(options: CampaignOptions): Promise<void>;
  getCampaignStats(campaignId: string): Promise<CampaignStats>;
}
