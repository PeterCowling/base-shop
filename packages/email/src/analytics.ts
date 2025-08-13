import { coreEnv } from "@acme/config/env/core";
import type { CampaignProvider, CampaignStat } from "./providers/types";
import { ResendProvider } from "./providers/resend";
import { SendgridProvider } from "./providers/sendgrid";

function resolveProvider(override?: CampaignProvider): CampaignProvider | undefined {
  if (override) return override;
  const key = coreEnv.EMAIL_PROVIDER ?? "";
  if (key === "sendgrid") return new SendgridProvider();
  if (key === "resend") return new ResendProvider();
  return undefined;
}

/**
 * Fetch campaign stats from the selected provider and forward them to the
 * platform analytics system.
 */
export async function syncCampaignStats(
  shop: string,
  override?: CampaignProvider,
): Promise<void> {
  const provider = resolveProvider(override);
  if (!provider) return;
  const { trackEvent } = await import("@platform-core/analytics");
  const stats: CampaignStat[] = await provider.getCampaignStats();
  for (const stat of stats) {
    const { id, ...metrics } = stat;
    await trackEvent(shop, {
      type: "email_campaign_stats",
      campaign: id,
      ...metrics,
    });
  }
}
