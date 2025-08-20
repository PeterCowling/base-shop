import { fsCampaignStore } from "./fsStore";
import type { CampaignStore } from "./types";
import type { Campaign } from "../types";
export declare function setCampaignStore(newStore: CampaignStore): void;
export declare function getCampaignStore(): CampaignStore;
export { fsCampaignStore };
export type { CampaignStore, Campaign };
