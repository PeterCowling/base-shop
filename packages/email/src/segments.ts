import { listEvents } from "@platform-core/repositories/analytics.server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { DATA_ROOT } from "@platform-core/dataRoot";
import { validateShopName } from "@acme/lib";
import { coreEnv } from "@acme/config/env/core";
import { SendgridProvider } from "./providers/sendgrid";
import { ResendProvider } from "./providers/resend";
import type { CampaignProvider } from "./providers/types";

interface SegmentDef {
  id: string;
  filters: { field: string; value: string }[];
}

const providers: Record<string, CampaignProvider> = {
  sendgrid: new SendgridProvider(),
  resend: new ResendProvider(),
};

function getProvider(): CampaignProvider | undefined {
  const name = coreEnv.EMAIL_PROVIDER ?? "";
  return providers[name];
}

async function readSegments(shop: string): Promise<SegmentDef[]> {
  shop = validateShopName(shop);
  const file = path.join(DATA_ROOT, shop, "segments.json");
  try {
    const buf = await fs.readFile(file, "utf8");
    const json = JSON.parse(buf);
    return Array.isArray(json) ? json : [];
  } catch {
    return [];
  }
}

export async function createContact(email: string): Promise<string> {
  const provider = getProvider();
  return provider?.createContact ? provider.createContact(email) : "";
}

export async function addToList(
  contactId: string,
  listId: string
): Promise<void> {
  const provider = getProvider();
  if (provider?.addToList) await provider.addToList(contactId, listId);
}

export async function listSegments(): Promise<{ id: string; name?: string }[]> {
  const provider = getProvider();
  if (provider?.listSegments) return provider.listSegments();
  return [];
}

/**
 * Resolve a segment identifier to a list of customer email addresses based on
 * stored segment definitions.
 */
export async function resolveSegment(
  shop: string,
  id: string
): Promise<string[]> {
  const segments = await readSegments(shop);
  const def = segments.find((s) => s.id === id);
  if (!def) return [];
  const events = await listEvents(shop);
  const emails = new Set<string>();
  for (const e of events) {
    let match = true;
    for (const f of def.filters) {
      if ((e as any)[f.field] !== f.value) {
        match = false;
        break;
      }
    }
    if (match) {
      const email = (e as any).email;
      if (typeof email === "string") emails.add(email);
    }
  }
  return Array.from(emails);
}
