import { sendDueCampaigns } from "@acme/email";

export { sendDueCampaigns as sendScheduledCampaigns } from "@acme/email";

export const onScheduled = async () => {
  await sendDueCampaigns();
};
