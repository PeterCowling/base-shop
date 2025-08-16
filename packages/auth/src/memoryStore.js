export class MemorySessionStore {
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
        return Array.from(this.sessions.values())
            .filter((s) => s.expires > now && s.record.customerId === customerId)
            .map((s) => s.record);
    }
}
