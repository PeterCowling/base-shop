import "server-only";

import { coreEnv } from "@acme/config/env/core";

export const OIDC_FLOW_TTL_S = 60 * 10;

export type OidcAuthFlowRecord = {
  state: string;
  nonce: string;
  codeVerifier: string;
  redirectUri: string;
  returnTo: string;
  flowId: string;
  createdAt: Date;
};

export interface OidcAuthFlowStore {
  get(state: string): Promise<OidcAuthFlowRecord | null>;
  set(record: OidcAuthFlowRecord): Promise<void>;
  delete(state: string): Promise<void>;
}

class MemoryOidcAuthFlowStore implements OidcAuthFlowStore {
  private flows = new Map<string, { record: OidcAuthFlowRecord; expires: number }>();

  constructor(private ttlSeconds: number) {}

  async get(state: string): Promise<OidcAuthFlowRecord | null> {
    const entry = this.flows.get(state);
    if (!entry) return null;
    if (entry.expires <= Date.now()) {
      this.flows.delete(state);
      return null;
    }
    return entry.record;
  }

  async set(record: OidcAuthFlowRecord): Promise<void> {
    this.flows.set(record.state, {
      record,
      expires: Date.now() + this.ttlSeconds * 1000,
    });
  }

  async delete(state: string): Promise<void> {
    this.flows.delete(state);
  }
}

type RedisClient = {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, opts: { ex: number }): Promise<unknown>;
  del(key: string): Promise<unknown>;
};

class RedisOidcAuthFlowStore implements OidcAuthFlowStore {
  constructor(private client: RedisClient, private ttlSeconds: number) {}

  private key(state: string) {
    return `oidc_flow:${state}`;
  }

  async get(state: string): Promise<OidcAuthFlowRecord | null> {
    const data = await this.client.get<OidcAuthFlowRecord>(this.key(state));
    if (!data) return null;
    return { ...data, createdAt: new Date(data.createdAt) };
  }

  async set(record: OidcAuthFlowRecord): Promise<void> {
    await this.client.set(this.key(record.state), record, { ex: this.ttlSeconds });
  }

  async delete(state: string): Promise<void> {
    await this.client.del(this.key(state));
  }
}

export async function createOidcAuthFlowStore(): Promise<OidcAuthFlowStore> {
  const storeType = coreEnv.SESSION_STORE_PROVIDER ?? coreEnv.SESSION_STORE;
  if (
    storeType === "redis" ||
    (!storeType &&
      coreEnv.UPSTASH_REDIS_REST_URL &&
      coreEnv.UPSTASH_REDIS_REST_TOKEN)
  ) {
    try {
      const { Redis } = await import("@upstash/redis"); // i18n-exempt: module specifier; not user-facing copy
      const client = new Redis({
        url: coreEnv.UPSTASH_REDIS_REST_URL!,
        token: coreEnv.UPSTASH_REDIS_REST_TOKEN!,
      });
      return new RedisOidcAuthFlowStore(client, OIDC_FLOW_TTL_S);
    } catch (error) {
      console.error(
        "Failed to initialize Redis OIDC flow store", // i18n-exempt: internal diagnostic log; not user-facing
        error,
      );
    }
  }

  return new MemoryOidcAuthFlowStore(OIDC_FLOW_TTL_S);
}
