import "server-only";

import { sendEmail } from "./sendEmail";

export type { AbandonedCart } from "./abandonedCart";
export { recoverAbandonedCarts, resolveAbandonedCartDelay } from "./abandonedCart";
export { escapeHtml } from "./escapeHtml";
export type { CampaignOptions } from "./send";
export { sendCampaignEmail } from "./send";
export { clearTemplates,registerTemplate, renderTemplate } from "./templates";
export { sendEmail };
export { emitClick,emitOpen, emitSend, onClick, onOpen, onSend,  } from "./hooks";
export { createCampaign, listCampaigns, sendDueCampaigns, syncCampaignAnalytics, } from "./scheduler";
export { addToList, createContact, listSegments,resolveSegment } from "./segments";
export type { CampaignStore } from "./storage";
export { fsCampaignStore,setCampaignStore } from "./storage";
export type { Campaign } from "./types";
//# sourceMappingURL=index.d.ts.map