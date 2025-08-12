import type { CampaignOptions } from "../send";

export interface CampaignProvider {
  send(options: CampaignOptions): Promise<void>;
}
