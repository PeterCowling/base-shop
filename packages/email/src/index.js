"use server";
import "server-only";

export { sendCampaignEmail } from "./send";
export { registerTemplate, renderTemplate, clearTemplates } from "./templates";
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
export {
  onSend,
  onOpen,
  onClick,
  emitSend,
  emitOpen,
  emitClick,
} from "./hooks";
