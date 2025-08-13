import { sendDueCampaigns, type Campaign } from "@acme/email";

export { sendDueCampaigns };
export type { Campaign };

export const onScheduled = async (): Promise<void> => {
  await sendDueCampaigns();
};

