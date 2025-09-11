import { Command } from "commander";
import { promises as fs } from "fs";
import * as fsSync from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { nowIso } from "@date-utils";

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
    if (fsSync.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(process.cwd(), "data", "shops");
}

const DATA_ROOT = resolveDataRoot();

function campaignsPath(shop: string): string {
  return path.join(DATA_ROOT, shop, "campaigns.json");
}

export async function readCampaigns(shop: string): Promise<Campaign[]> {
  try {
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
  await fs.mkdir(path.dirname(campaignsPath(shop)), { recursive: true });
  await fs.writeFile(campaignsPath(shop), JSON.stringify(items, null, 2), "utf8");
}

export async function run(argv = process.argv): Promise<void> {
  const program = new Command();
  program.name("email").description("Email marketing CLI");

  const campaign = program.command("campaign").description("Manage campaigns");

  campaign
    .command("create")
    .argument("<shop>")
    .requiredOption("--subject <subject>", "Email subject")
    .requiredOption("--body <html>", "HTML body")
    .option("--recipients <emails>", "Comma separated recipient emails")
    .option("--segment <segment>", "Recipient segment name")
    .option("--send-at <date>", "ISO send time")
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
      console.log(`Created campaign ${item.id}`);
    });

  campaign
    .command("list")
    .argument("<shop>")
    .action(async (shop) => {
      const campaigns = await readCampaigns(shop);
      console.log(JSON.stringify(campaigns, null, 2));
    });

  campaign
    .command("send")
    .description("Send due campaigns")
    .action(async () => {
      const { sendDueCampaigns } = await import("./scheduler");
      await sendDueCampaigns();
      console.log("Sent due campaigns");
    });

  await program.parseAsync(argv);
}
