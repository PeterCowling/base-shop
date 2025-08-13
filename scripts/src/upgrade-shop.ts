import { createHmac } from "node:crypto";
import { env } from "@acme/config";

const secret = env.PREVIEW_TOKEN_SECRET;

if (!secret) {
  throw new Error("PREVIEW_TOKEN_SECRET is required");
}

export function previewToken(id: string): string {
  return createHmac("sha256", secret).update(id).digest("hex");
}

export function upgradeToken(id: string): string {
  return createHmac("sha256", secret).update(`upgrade:${id}`).digest("hex");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const id = process.argv[2];
  if (!id) {
    console.error("Usage: pnpm ts-node scripts/src/upgrade-shop.ts <pageId>");
    process.exit(1);
  }
  console.log("Preview token:", previewToken(id));
  console.log("Upgrade token:", upgradeToken(id));
}
