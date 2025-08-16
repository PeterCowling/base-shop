import { sendDueCampaigns } from "@acme/email";
export { sendDueCampaigns };
export const onScheduled = async () => {
    await sendDueCampaigns();
};
// backwards compatible helper
export const sendScheduledCampaigns = async () => {
    await sendDueCampaigns();
};
