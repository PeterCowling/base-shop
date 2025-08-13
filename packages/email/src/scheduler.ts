import { syncCampaignStats } from "./analytics";

/**
 * Starts a periodic job that syncs campaign analytics.
 * @returns timer identifier that can be cleared to stop the job.
 */
export function scheduleAnalyticsSync(
  shop: string,
  intervalMs = 60 * 60 * 1000,
): NodeJS.Timeout {
  async function run(): Promise<void> {
    try {
      await syncCampaignStats(shop);
    } catch (err) {
      console.error("Analytics sync failed", err);
    }
  }

  // run immediately then schedule
  void run();
  return setInterval(run, intervalMs);
}
