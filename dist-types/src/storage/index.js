import { fsCampaignStore } from "./fsStore";
let store = fsCampaignStore;
export function setCampaignStore(newStore) {
    store = newStore;
}
export function getCampaignStore() {
    return store;
}
export { fsCampaignStore };
