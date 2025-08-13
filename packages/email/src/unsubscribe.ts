import { promises as fs } from "node:fs";
import path from "node:path";
import { DATA_ROOT } from "@platform-core/dataRoot";
import { validateShopName } from "@acme/lib";

function filePath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "unsubscribes.json");
}

export async function listUnsubscribed(shop: string): Promise<Set<string>> {
  try {
    const buf = await fs.readFile(filePath(shop), "utf8");
    const arr = JSON.parse(buf);
    if (Array.isArray(arr)) return new Set(arr);
  } catch {}
  return new Set();
}

export async function addUnsubscribed(shop: string, email: string): Promise<void> {
  const list = await listUnsubscribed(shop);
  list.add(email);
  const fp = filePath(shop);
  await fs.mkdir(path.dirname(fp), { recursive: true });
  await fs.writeFile(fp, JSON.stringify(Array.from(list), null, 2), "utf8");
}
