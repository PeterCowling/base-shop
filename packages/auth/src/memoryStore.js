"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemorySessionStore = void 0;
class MemorySessionStore {
    ttl;
    sessions = new Map();
    constructor(ttl) {
        this.ttl = ttl;
    }
    async get(id) {
        const entry = this.sessions.get(id);
        if (!entry)
            return null;
        if (entry.expires < Date.now()) {
            this.sessions.delete(id);
            return null;
        }
        return entry.record;
    }
    async set(record) {
        this.sessions.set(record.sessionId, {
            record,
            expires: Date.now() + this.ttl * 1000,
        });
    }
    async delete(id) {
        this.sessions.delete(id);
    }
    async list(customerId) {
        const now = Date.now();
        const records = [];
        for (const [id, { record, expires }] of this.sessions) {
            if (expires <= now) {
                this.sessions.delete(id);
                continue;
            }
            if (record.customerId === customerId) {
                records.push(record);
            }
        }
        return records;
    }
}
exports.MemorySessionStore = MemorySessionStore;
