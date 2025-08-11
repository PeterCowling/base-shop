import type { SessionRecord, SessionStore } from "./store";

export class MemorySessionStore implements SessionStore {
  private sessions = new Map<string, { record: SessionRecord; expires: number }>();

  constructor(private ttl: number) {}

  async get(id: string): Promise<SessionRecord | null> {
    const entry = this.sessions.get(id);
    if (!entry) return null;
    if (entry.expires < Date.now()) {
      this.sessions.delete(id);
      return null;
    }
    return entry.record;
  }

  async set(record: SessionRecord): Promise<void> {
    this.sessions.set(record.sessionId, {
      record,
      expires: Date.now() + this.ttl * 1000,
    });
  }

  async delete(id: string): Promise<void> {
    this.sessions.delete(id);
  }

  async list(customerId: string): Promise<SessionRecord[]> {
    const now = Date.now();
    return Array.from(this.sessions.values())
      .filter((s) => s.expires > now && s.record.customerId === customerId)
      .map((s) => s.record);
  }
}
