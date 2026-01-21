import type { Redis } from "@upstash/redis";

import type { SessionRecord, SessionStore } from "./store";

export class RedisSessionStore implements SessionStore {
  constructor(private client: Redis, private ttl: number) {}

  private key(id: string) {
    return `session:${id}`;
  }

  private customerKey(customerId: string) {
    return `customer_sessions:${customerId}`;
  }

  async get(id: string): Promise<SessionRecord | null> {
    const data = await this.client.get<SessionRecord>(this.key(id));
    if (!data) return null;
    return { ...data, createdAt: new Date(data.createdAt) };
  }

  async set(record: SessionRecord): Promise<void> {
    await this.client.set(this.key(record.sessionId), record, { ex: this.ttl });
    await this.client.sadd(this.customerKey(record.customerId), record.sessionId);
    await this.client.expire(this.customerKey(record.customerId), this.ttl);
  }

  async delete(id: string): Promise<void> {
    const rec = await this.get(id);
    await this.client.del(this.key(id));
    if (rec) {
      await this.client.srem(this.customerKey(rec.customerId), id);
    }
  }

  async list(customerId: string): Promise<SessionRecord[]> {
    const ids = await this.client.smembers<string[]>(
      this.customerKey(customerId)
    );
    if (!ids || ids.length === 0) return [];
    const records = await this.client.mget<(SessionRecord | null)[]>(
      ...ids.map((id) => this.key(id))
    );
    return records
      .filter((r): r is SessionRecord => r !== null)
      .map((r) => ({ ...r, createdAt: new Date(r.createdAt) }));
  }
}
