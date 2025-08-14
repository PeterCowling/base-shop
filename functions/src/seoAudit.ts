import { promises as fs } from "node:fs";
import path from "node:path";
import { DATA_ROOT } from "@platform-core/dataRoot";
import { runSeoAudit } from "../../scripts/seo-audit";
import { trackEvent } from "@platform-core/analytics";
import { sendCampaignEmail } from "@acme/email";
import { coreEnv } from "@acme/config/env/core";
import { nowIso } from "@acme/date-utils";

async function auditShop(shop: string): Promise<void> {
  const url = `http://localhost:3000/${shop}`;
  const { score, recommendations } = await runSeoAudit(url);
  const record = {
    timestamp: nowIso(),
    score,
    recommendations,
  };
  const file = path.join(DATA_ROOT, shop, "seo-audits.jsonl");
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.appendFile(file, JSON.stringify(record) + "\n", "utf8");
  await trackEvent(shop, {
    type: "audit_complete",
    score,
    success: true,
  });
  const alertTo = coreEnv.STOCK_ALERT_RECIPIENT;
  if (alertTo && score < 80) {
    await sendCampaignEmail({
      to: alertTo,
      subject: `Low SEO score for ${shop}`,
      html: `<p>Latest SEO audit score: ${score}</p>`,
    });
  }
}

export default {
  async scheduled() {
    const entries = await fs.readdir(DATA_ROOT, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      try {
        await auditShop(entry.name);
      } catch (err) {
        console.error(`seo audit failed for ${entry.name}`, err);
        await trackEvent(entry.name, {
          type: "audit_complete",
          success: false,
          error: (err as Error).message,
        });
      }
    }
  },
};
