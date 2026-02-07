"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisSessionStore = void 0;
class RedisSessionStore {
    client;
    ttl;
    constructor(client, ttl) {
        this.client = client;
        this.ttl = ttl;
    }
    key(id) {
        return `session:${id}`;
    }
    customerKey(customerId) {
        return `customer_sessions:${customerId}`;
    }
    async get(id) {
        const data = await this.client.get(this.key(id));
        if (!data)
            return null;
        return { ...data, createdAt: new Date(data.createdAt) };
    }
    async set(record) {
        await this.client.set(this.key(record.sessionId), record, { ex: this.ttl });
        await this.client.sadd(this.customerKey(record.customerId), record.sessionId);
        await this.client.expire(this.customerKey(record.customerId), this.ttl);
    }
    async delete(id) {
        const rec = await this.get(id);
        await this.client.del(this.key(id));
        if (rec) {
            await this.client.srem(this.customerKey(rec.customerId), id);
        }
    }
    async list(customerId) {
        const ids = await this.client.smembers(this.customerKey(customerId));
        if (!ids || ids.length === 0)
            return [];
        const records = await this.client.mget(...ids.map((id) => this.key(id)));
        return records
            .filter((r) => r !== null)
            .map((r) => ({ ...r, createdAt: new Date(r.createdAt) }));
    }
}
exports.RedisSessionStore = RedisSessionStore;
