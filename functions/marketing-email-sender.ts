import { sendScheduledCampaigns } from "@acme/email";

export { sendScheduledCampaigns };

export const onScheduled = async () => {
  await sendScheduledCampaigns();
};

