import type { CampaignOptions } from "../send";

export interface CampaignStat {
  /** Identifier of the campaign */
  id: string;
  /** Additional metric fields provided by the vendor */
  [key: string]: string | number;
}

export interface CampaignProvider {
  send(options: CampaignOptions): Promise<void>;
  getCampaignStats(): Promise<CampaignStat[]>;
}
