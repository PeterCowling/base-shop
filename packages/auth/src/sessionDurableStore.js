"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionDurableObject = exports.CloudflareDurableObjectSessionStore = void 0;
const SESSION_PREFIX = "session:";
const CUSTOMER_PREFIX = "customer:";
const serializeRecord = (record) => ({
    ...record,
    createdAt: record.createdAt.toISOString(),
});
const hydrateRecord = (record) => ({
    ...record,
    createdAt: new Date(record.createdAt),
});
/** Cloudflare Durable Object-backed implementation of SessionStore */
class CloudflareDurableObjectSessionStore {
    namespace;
    ttl;
    constructor(namespace, ttl) {
        this.namespace = namespace;
        this.ttl = ttl;
    }
    stub(id) {
        return this.namespace.get(this.namespace.idFromName(id));
    }
    async call(body) {
        const start = Date.now();
        try {
            const res = await this.stub("session-hub").fetch("https://session", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(body),
            });
            const duration = Date.now() - start;
            if (duration > 200 && shouldLogLatency()) {
                console.warn(`Session DO latency ${duration}ms for op=${body.op}`); // i18n-exempt -- internal diagnostic log
            }
            if (!res.ok)
                return undefined;
            return (await res.json());
        }
        catch (err) {
            console.warn("Session DO call failed", err); // i18n-exempt -- internal diagnostic log
            return undefined;
        }
    }
    async get(id) {
        const result = await this.call({ op: "get", id, ttl: this.ttl });
        if (result?.ok) {
            const rec = result.record ?? null;
            return rec ? hydrateRecord(rec) : null;
        }
        return null;
    }
    async set(record) {
        const payload = serializeRecord(record);
        const result = await this.call({
            op: "set",
            record: payload,
            ttl: this.ttl,
        });
        if (!result?.ok) {
            throw new Error("Failed to persist session to Durable Object"); // i18n-exempt -- internal diagnostic error
        }
    }
    async delete(id) {
        await this.call({ op: "delete", id, ttl: this.ttl });
    }
    async list(customerId) {
        const result = await this.call({
            op: "list",
            customerId,
            ttl: this.ttl,
        });
        if (result?.ok && result.records) {
            return result.records.map(hydrateRecord);
        }
        return [];
    }
}
exports.CloudflareDurableObjectSessionStore = CloudflareDurableObjectSessionStore;
/** Durable Object implementation (bind as SESSION_DO) */
class SessionDurableObject {
    state;
    constructor(state) {
        this.state = state;
    }
    sessionKey(id) {
        return `${SESSION_PREFIX}${id}`;
    }
    customerKey(customerId) {
        return `${CUSTOMER_PREFIX}${customerId}:`;
    }
    async load(id) {
        const stored = await this.state.storage.get(this.sessionKey(id));
        if (!stored)
            return null;
        if (stored.expiresAt <= Date.now()) {
            await this.state.storage.delete(this.sessionKey(id));
            return null;
        }
        return stored;
    }
    async save(record, ttlSeconds) {
        const expiresAt = Date.now() + ttlSeconds * 1000;
        await this.state.storage.put(this.sessionKey(record.sessionId), {
            ...record,
            createdAt: record.createdAt,
            expiresAt,
        });
        await this.state.storage.put(`${this.customerKey(record.customerId)}${record.sessionId}`, record.sessionId);
    }
    async deleteSession(id) {
        const rec = await this.state.storage.get(this.sessionKey(id));
        await this.state.storage.delete(this.sessionKey(id));
        if (rec) {
            await this.state.storage.delete(`${this.customerKey(rec.customerId)}${id}`);
        }
    }
    async fetch(request) {
        try {
            const body = (await request.json());
            switch (body.op) {
                case "get": {
                    const stored = await this.load(body.id);
                    if (!stored) {
                        return json({ ok: true, record: null });
                    }
                    const record = {
                        sessionId: stored.sessionId,
                        customerId: stored.customerId,
                        userAgent: stored.userAgent,
                        createdAt: stored.createdAt,
                    };
                    return json({ ok: true, record: serializeRecord(record) });
                }
                case "set": {
                    const createdAt = new Date(body.record.createdAt);
                    const record = {
                        ...body.record,
                        createdAt,
                    };
                    await this.save(record, body.ttl);
                    return json({ ok: true });
                }
                case "delete": {
                    await this.deleteSession(body.id);
                    return json({ ok: true });
                }
                case "list": {
                    const prefix = this.customerKey(body.customerId);
                    const refs = await this.state.storage.list({ prefix });
                    const records = [];
                    for (const [, sessionId] of refs) {
                        const stored = await this.load(sessionId);
                        if (stored) {
                            const record = {
                                sessionId: stored.sessionId,
                                customerId: stored.customerId,
                                userAgent: stored.userAgent,
                                createdAt: new Date(stored.createdAt),
                            };
                            records.push(serializeRecord(record));
                        }
                        else {
                            await this.state.storage.delete(`${prefix}${sessionId}`);
                        }
                    }
                    return json({ ok: true, records });
                }
                default:
                    return json({ ok: false }, 400);
            }
        }
        catch (err) {
            console.error("SessionDurableObject error", err); // i18n-exempt -- internal diagnostic log
            return json({ ok: false }, 500);
        }
    }
}
exports.SessionDurableObject = SessionDurableObject;
function json(payload, status = 200) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: { "content-type": "application/json" },
    });
}
function shouldLogLatency() {
    return !(typeof process !== "undefined" &&
        process.env &&
        process.env.NODE_ENV === "test");
}
