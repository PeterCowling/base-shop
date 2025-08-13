import { sendDueCampaigns } from "@acme/email";

export { sendDueCampaigns };

export const onScheduled = async () => {
  await sendDueCampaigns();
};

