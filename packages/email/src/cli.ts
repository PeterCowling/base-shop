import { Command } from "commander";
import { promises as fs } from "fs";
import * as fsSync from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { nowIso } from "@date-utils";
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
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Deterministic search up from CWD for monorepo data root
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
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Path is DATA_ROOT/<validated shop>/campaigns.json
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
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Path is DATA_ROOT/<validated shop>
  await fs.mkdir(path.dirname(campaignsPath(shop)), { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- Path is DATA_ROOT/<validated shop>/campaigns.json
  await fs.writeFile(campaignsPath(shop), JSON.stringify(items, null, 2), "utf8");
}

export async function run(argv = process.argv): Promise<void> {
  const program = new Command();
  program.name("email").description("Email marketing CLI"); // i18n-exempt: developer CLI description

  const campaign = program.command("campaign").description("Manage campaigns"); // i18n-exempt: developer CLI description

  campaign
    .command("create")
    .argument("<shop>")
    .requiredOption("--subject <subject>", "Email subject") // i18n-exempt: developer CLI flag help
    .requiredOption("--body <html>", "HTML body") // i18n-exempt: developer CLI flag help
    .option("--recipients <emails>", "Comma separated recipient emails") // i18n-exempt: developer CLI flag help
    .option("--segment <segment>", "Recipient segment name") // i18n-exempt: developer CLI flag help
    .option("--send-at <date>", "ISO send time") // i18n-exempt: developer CLI flag help
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
      console.log(`Created campaign ${item.id}`); // i18n-exempt: developer CLI output
    });

  campaign
    .command("list")
    .argument("<shop>")
    .action(async (shop) => {
      const campaigns = await readCampaigns(shop);
      console.log(JSON.stringify(campaigns, null, 2)); // i18n-exempt: developer CLI output
    });

  campaign
    .command("send")
    .description("Send due campaigns") // i18n-exempt: developer CLI description
    .action(async () => {
      const { sendDueCampaigns } = await import("./scheduler");
      await sendDueCampaigns();
      console.log("Sent due campaigns"); // i18n-exempt: developer CLI output
    });

  await program.parseAsync(argv);
}
