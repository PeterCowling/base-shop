import "server-only";

export type { CampaignOptions } from "./send";
export { sendCampaignEmail } from "./send";
export { registerTemplate, renderTemplate, clearTemplates } from "./templates";
export type { AbandonedCart } from "./abandonedCart";
export { recoverAbandonedCarts, resolveAbandonedCartDelay } from "./abandonedCart";
export { sendEmail } from "./sendEmail";
export { resolveSegment, createContact, addToList, listSegments } from "./segments";
export {
  createCampaign,
  listCampaigns,
  sendDueCampaigns,
  syncCampaignAnalytics,
} from "./scheduler";
export { setCampaignStore, fsCampaignStore } from "./storage";
export type { CampaignStore } from "./storage";
export type { Campaign } from "./types";
export {
  onSend,
  onOpen,
  onClick,
  emitSend,
  emitOpen,
  emitClick,
} from "./hooks";
