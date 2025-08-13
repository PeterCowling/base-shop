import { sendScheduledCampaigns, type Campaign } from "@acme/email";

export { sendScheduledCampaigns };
export type { Campaign };

export const onScheduled = async () => {
  await sendScheduledCampaigns();
};

