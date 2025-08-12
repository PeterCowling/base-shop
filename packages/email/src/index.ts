export type { CampaignOptions } from "./send";
export { sendCampaignEmail } from "./send";
export type { AbandonedCart } from "./abandonedCart";
export { recoverAbandonedCarts } from "./abandonedCart";
export { sendEmail } from "./sendEmail";
export async function sendScheduledCampaigns(): Promise<void> {
  const mod = await import("./scheduler");
  return mod.sendScheduledCampaigns();
}
