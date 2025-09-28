import "server-only"; // i18n-exempt -- EMAIL-1000 [ttl=2026-03-31]
import { sendEmail } from "./sendEmail";
import { createRequire } from "module";

try {
  const req =
    typeof require !== "undefined"
      ? require
      : createRequire(process.cwd() + "/");
  const { setEmailService } = req(
    "@acme/platform-core/services/emailService" // i18n-exempt -- EMAIL-1000 [ttl=2026-03-31]
  );
  setEmailService({ sendEmail });
} catch {
  // The core email service isn't available in the current environment.
}

export type { CampaignOptions } from "./send";
export { sendCampaignEmail } from "./send";
export { registerTemplate, renderTemplate, clearTemplates } from "./templates";
export { escapeHtml } from "./escapeHtml";
export type { AbandonedCart } from "./abandonedCart";
export { recoverAbandonedCarts, resolveAbandonedCartDelay } from "./abandonedCart";
export { sendEmail };
import type * as Segments from "./segments";
import type * as Scheduler from "./scheduler";

export const resolveSegment: typeof Segments.resolveSegment = async (
  ...args
) => {
  const mod: typeof Segments = await import("./segments");
  return mod.resolveSegment(...args);
};

export const createContact: typeof Segments.createContact = async (
  ...args
) => {
  const mod: typeof Segments = await import("./segments");
  return mod.createContact(...args);
};

export const addToList: typeof Segments.addToList = async (...args) => {
  const mod: typeof Segments = await import("./segments");
  return mod.addToList(...args);
};

export const listSegments: typeof Segments.listSegments = async (
  ...args
) => {
  const mod: typeof Segments = await import("./segments");
  return mod.listSegments(...args);
};

export const createCampaign: typeof Scheduler.createCampaign = async (
  ...args
) => {
  const mod: typeof Scheduler = await import("./scheduler");
  return mod.createCampaign(...args);
};

export const listCampaigns: typeof Scheduler.listCampaigns = async (
  ...args
) => {
  const mod: typeof Scheduler = await import("./scheduler");
  return mod.listCampaigns(...args);
};

export const sendDueCampaigns: typeof Scheduler.sendDueCampaigns = async (
  ...args
) => {
  const mod: typeof Scheduler = await import("./scheduler");
  return mod.sendDueCampaigns(...args);
};

export const syncCampaignAnalytics: typeof Scheduler.syncCampaignAnalytics = async (
  ...args
) => {
  const mod: typeof Scheduler = await import("./scheduler");
  return mod.syncCampaignAnalytics(...args);
};
import type * as Storage from "./storage";

export const setCampaignStore: typeof Storage.setCampaignStore = async (
  ...args
) => {
  const mod: typeof Storage = await import("./storage");
  return mod.setCampaignStore(...args);
};

export const fsCampaignStore: Storage.CampaignStore = {
  readCampaigns: async (...args) => {
    const mod: typeof Storage = await import("./storage");
    return mod.fsCampaignStore.readCampaigns(...args);
  },
  writeCampaigns: async (...args) => {
    const mod: typeof Storage = await import("./storage");
    return mod.fsCampaignStore.writeCampaigns(...args);
  },
  listShops: async (...args) => {
    const mod: typeof Storage = await import("./storage");
    return mod.fsCampaignStore.listShops(...args);
  },
};

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
