import type { D1Database } from '@acme/platform-core/d1';

export type PrimeMessagingEnv = {
  PRIME_MESSAGING_DB?: D1Database;
};

export function getPrimeMessagingDb(env: PrimeMessagingEnv): D1Database {
  if (!env.PRIME_MESSAGING_DB) {
    throw new Error(
      "PRIME_MESSAGING_DB binding missing. Ensure apps/prime/wrangler.toml has [[d1_databases]] with binding = 'PRIME_MESSAGING_DB' and configure the database in Cloudflare Pages."
    );
  }

  return env.PRIME_MESSAGING_DB;
}

export function hasPrimeMessagingDb(env: PrimeMessagingEnv): boolean {
  return !!env.PRIME_MESSAGING_DB;
}
