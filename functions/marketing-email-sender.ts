import { sendDueCampaigns, type Campaign } from "@acme/email";

export { sendDueCampaigns };
export type { Campaign };

export const onScheduled = async () => {
  await sendDueCampaigns();
};

// backwards compatible helper
export const sendScheduledCampaigns = async () => {
  await sendDueCampaigns();
};

