import { fsCampaignStore } from "./fsStore";
import type { CampaignStore, Campaign } from "./types";

let store: CampaignStore = fsCampaignStore;

export function setCampaignStore(newStore: CampaignStore) {
  store = newStore;
}

export function getCampaignStore(): CampaignStore {
  return store;
}

export { fsCampaignStore };
export type { CampaignStore, Campaign };
