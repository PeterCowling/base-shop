import { Command } from "commander";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import * as fsSync from "fs";
import path from "path";

import { nowIso } from "@acme/date-utils";
import { useTranslations as loadTranslations } from "@acme/i18n/useTranslations.server";
import { validateShopName } from "@acme/lib";

interface Campaign {
  id: string;
  recipients: string[];
  subject: string;
  body: string;
  segment?: string | null;
  sendAt: string;
  sentAt?: string;
}

export function resolveDataRoot(): string {
  let dir = process.cwd();
  while (true) {
    const candidate = path.join(dir, "data", "shops");
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Deterministic search up from CWD for monorepo data root [EMAIL-1000]
    if (fsSync.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(process.cwd(), "data", "shops");
}

const DATA_ROOT = resolveDataRoot();

function campaignsPath(shop: string): string {
  return path.join(DATA_ROOT, validateShopName(shop), "campaigns.json");
}

export async function readCampaigns(shop: string): Promise<Campaign[]> {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Path is DATA_ROOT/<validated shop>/campaigns.json [EMAIL-1000]
    const buf = await fs.readFile(campaignsPath(shop), "utf8");
    const json = JSON.parse(buf);
    if (Array.isArray(json)) return json as Campaign[];
  } catch {}
  return [];
}

export async function writeCampaigns(
  shop: string,
  items: Campaign[],
): Promise<void> {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Path is DATA_ROOT/<validated shop> [EMAIL-1000]
  await fs.mkdir(path.dirname(campaignsPath(shop)), { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Path is DATA_ROOT/<validated shop>/campaigns.json [EMAIL-1000]
  await fs.writeFile(campaignsPath(shop), JSON.stringify(items, null, 2), "utf8");
}

export async function run(argv = process.argv): Promise<void> {
  const t = await loadTranslations("en");
  const program = new Command();
  program.name("email").description(t("email.cli.description"));

  const campaign = program.command("campaign").description(t("email.cli.campaign.description"));

  campaign
    .command("create")
    .argument("<shop>")
    .requiredOption("--subject <subject>", t("email.cli.campaign.create.flags.subject")) // i18n-exempt -- EMAIL-1001 developer CLI flag signature [ttl=2026-12-31]
    .requiredOption("--body <html>", t("email.cli.campaign.create.flags.body")) // i18n-exempt -- EMAIL-1001 developer CLI flag signature [ttl=2026-12-31]
    .option("--recipients <emails>", t("email.cli.campaign.create.flags.recipients")) // i18n-exempt -- EMAIL-1001 developer CLI flag signature [ttl=2026-12-31]
    .option("--segment <segment>", t("email.cli.campaign.create.flags.segment")) // i18n-exempt -- EMAIL-1001 developer CLI flag signature [ttl=2026-12-31]
    .option("--send-at <date>", t("email.cli.campaign.create.flags.sendAt")) // i18n-exempt -- EMAIL-1001 developer CLI flag signature [ttl=2026-12-31]
    .action(async (shop, options) => {
      const campaigns = await readCampaigns(shop);
      const recipients = options.recipients
        ? String(options.recipients)
            .split(",")
            .map((e: string) => e.trim())
            .filter(Boolean)
        : [];
      const item: Campaign = {
        id: randomUUID(),
        recipients,
        subject: options.subject,
        body: options.body,
        segment: options.segment ?? null,
        sendAt: new Date(options.sendAt ?? nowIso()).toISOString(),
      };
      campaigns.push(item);
      await writeCampaigns(shop, campaigns);
      console.info(t("email.cli.campaign.create.result", { id: item.id }));
    });

  campaign
    .command("list")
    .argument("<shop>")
    .action(async (shop) => {
      const campaigns = await readCampaigns(shop);
      console.info(JSON.stringify(campaigns, null, 2));
    });

  campaign
    .command("send")
    .description(t("email.cli.campaign.send.description"))
    .action(async () => {
      const { sendDueCampaigns } = await import("./scheduler");
      await sendDueCampaigns();
      console.info(t("email.cli.campaign.send.result"));
    });

  await program.parseAsync(argv);
}
