import "server-only";
import { sendEmail } from "./sendEmail";
export type { CampaignOptions } from "./send";
export { sendCampaignEmail } from "./send";
export { registerTemplate, renderTemplate, clearTemplates } from "./templates";
export { escapeHtml } from "./escapeHtml";
export type { AbandonedCart } from "./abandonedCart";
export { recoverAbandonedCarts, resolveAbandonedCartDelay } from "./abandonedCart";
export { sendEmail };
export { resolveSegment, createContact, addToList, listSegments } from "./segments";
export { createCampaign, listCampaigns, sendDueCampaigns, syncCampaignAnalytics, } from "./scheduler";
export { setCampaignStore, fsCampaignStore } from "./storage";
export type { CampaignStore } from "./storage";
export type { Campaign } from "./types";
export { onSend, onOpen, onClick, emitSend, emitOpen, emitClick, } from "./hooks";
//# sourceMappingURL=index.d.ts.map