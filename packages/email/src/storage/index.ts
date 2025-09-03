import { fsCampaignStore } from "./fsStore.js";
import type { CampaignStore } from "./types.js";
import type { Campaign } from "../types.js";

let store: CampaignStore = fsCampaignStore;

export function setCampaignStore(newStore: CampaignStore) {
  store = newStore;
}

export function getCampaignStore(): CampaignStore {
  return store;
}

export { fsCampaignStore };
export type { CampaignStore, Campaign };
