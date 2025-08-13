import type { CampaignOptions } from "../send";

export interface CampaignProvider {
  send(options: CampaignOptions): Promise<void>;
  createContact?(email: string): Promise<string>;
  addToList?(email: string, listId: string): Promise<void>;
  listSegments?(id: string): Promise<string[]>;
}
