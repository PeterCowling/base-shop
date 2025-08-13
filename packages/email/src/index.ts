export type { CampaignOptions } from "./send";
export { sendCampaignEmail } from "./send";
export type { AbandonedCart } from "./abandonedCart";
export { recoverAbandonedCarts, resolveAbandonedCartDelay } from "./abandonedCart";
export { sendEmail } from "./sendEmail";
export { resolveSegment, createContact, addToList, listSegments } from "./segments";
export {
  createCampaign,
  listCampaigns,
  sendDueCampaigns,
  setClock,
} from "./scheduler";
export type { Clock } from "./scheduler";
export { setCampaignStore, fsCampaignStore } from "./storage";
export type { CampaignStore, Campaign } from "./storage";
