import { sendScheduledCampaigns } from "@acme/email";

export const onScheduled = async () => {
  await sendScheduledCampaigns();
};
