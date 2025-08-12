import { promises as fs } from "node:fs";
import path from "node:path";
import { DATA_ROOT } from "@platform-core/dataRoot";
import { runSeoAudit } from "../../scripts/seo-audit";

async function auditShop(shop: string): Promise<void> {
  const url = `http://localhost:3000/${shop}`;
  const { score, recommendations } = await runSeoAudit(url);
  const record = {
    timestamp: new Date().toISOString(),
    score,
    recommendations,
  };
  const file = path.join(DATA_ROOT, shop, "seo-audits.jsonl");
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.appendFile(file, JSON.stringify(record) + "\n", "utf8");
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
      }
    }
  },
};
