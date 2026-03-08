import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

import type { D1Database } from "@acme/platform-core/d1";

declare global {
  interface CloudflareEnv {
    RECEPTION_INBOX_DB?: D1Database;
  }
}

export async function getInboxDb(): Promise<D1Database> {
  const { env } = await getCloudflareContext({ async: true });

  if (!env.RECEPTION_INBOX_DB) {
    throw new Error(
      "RECEPTION_INBOX_DB binding not found in Cloudflare environment. Ensure apps/reception/wrangler.toml has [[d1_databases]] with binding = 'RECEPTION_INBOX_DB' and that the binding is configured for the deployed environment."
    );
  }

  return env.RECEPTION_INBOX_DB;
}

export async function hasInboxDb(): Promise<boolean> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return !!env.RECEPTION_INBOX_DB;
  } catch {
    return false;
  }
}
