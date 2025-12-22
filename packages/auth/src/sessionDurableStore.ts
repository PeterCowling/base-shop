/* istanbul ignore file */
import type { SessionRecord, SessionStore } from "./store";

// Minimal Durable Object namespace surface to avoid hard dependency on cf types
interface DurableObjectNamespace {
  idFromName(name: string): DurableObjectId;
  get(id: DurableObjectId): DurableObjectStub;
}

interface DurableObjectId {
  toString(): string;
}

interface DurableObjectStub {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

interface DurableObjectStorage {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<boolean>;
  list<T>(opts?: { prefix?: string }): Promise<Map<string, T>>;
}

interface DurableObjectState {
  storage: DurableObjectStorage;
}

type DORequest =
  | { op: "get"; id: string; ttl: number }
  | { op: "set"; record: SerializedSessionRecord; ttl: number }
  | { op: "delete"; id: string; ttl: number }
  | { op: "list"; customerId: string; ttl: number };

type DOResponse =
  | { ok: true; record?: SerializedSessionRecord | null; records?: SerializedSessionRecord[] }
  | { ok: false };

type StoredSession = SessionRecord & { expiresAt: number };
type SerializedSessionRecord = Omit<SessionRecord, "createdAt"> & { createdAt: string };

const SESSION_PREFIX = "session:";
const CUSTOMER_PREFIX = "customer:";

const serializeRecord = (record: SessionRecord): SerializedSessionRecord => ({
  ...record,
  createdAt: record.createdAt.toISOString(),
});

const hydrateRecord = (record: SerializedSessionRecord): SessionRecord => ({
  ...record,
  createdAt: new Date(record.createdAt),
});

/** Cloudflare Durable Object-backed implementation of SessionStore */
export class CloudflareDurableObjectSessionStore implements SessionStore {
  constructor(
    private namespace: DurableObjectNamespace,
    private ttl: number
  ) {}

  private stub(id: string): DurableObjectStub {
    return this.namespace.get(this.namespace.idFromName(id));
  }

  private async call<T = DOResponse>(body: DORequest): Promise<T | undefined> {
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
      if (!res.ok) return undefined;
      return (await res.json()) as T;
    } catch (err) {
      console.warn("Session DO call failed", err); // i18n-exempt -- internal diagnostic log
      return undefined;
    }
  }

  async get(id: string): Promise<SessionRecord | null> {
    const result = await this.call<DOResponse>({ op: "get", id, ttl: this.ttl });
    if (result?.ok) {
      const rec = result.record ?? null;
      return rec ? hydrateRecord(rec) : null;
    }
    return null;
  }

  async set(record: SessionRecord): Promise<void> {
    const payload = serializeRecord(record);
    const result = await this.call<DOResponse>({
      op: "set",
      record: payload,
      ttl: this.ttl,
    });
    if (!result?.ok) {
      throw new Error("Failed to persist session to Durable Object"); // i18n-exempt -- internal diagnostic error
    }
  }

  async delete(id: string): Promise<void> {
    await this.call<DOResponse>({ op: "delete", id, ttl: this.ttl });
  }

  async list(customerId: string): Promise<SessionRecord[]> {
    const result = await this.call<DOResponse>({
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

/** Durable Object implementation (bind as SESSION_DO) */
export class SessionDurableObject {
  constructor(private state: DurableObjectState) {}

  private sessionKey(id: string) {
    return `${SESSION_PREFIX}${id}`;
  }

  private customerKey(customerId: string) {
    return `${CUSTOMER_PREFIX}${customerId}:`;
  }

  private async load(id: string): Promise<StoredSession | null> {
    const stored = await this.state.storage.get<StoredSession>(this.sessionKey(id));
    if (!stored) return null;
    if (stored.expiresAt <= Date.now()) {
      await this.state.storage.delete(this.sessionKey(id));
      return null;
    }
    return stored;
  }

  private async save(record: SessionRecord, ttlSeconds: number): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    await this.state.storage.put(this.sessionKey(record.sessionId), {
      ...record,
      createdAt: record.createdAt,
      expiresAt,
    });
    await this.state.storage.put(
      `${this.customerKey(record.customerId)}${record.sessionId}`,
      record.sessionId
    );
  }

  private async deleteSession(id: string): Promise<void> {
    const rec = await this.state.storage.get<StoredSession>(this.sessionKey(id));
    await this.state.storage.delete(this.sessionKey(id));
    if (rec) {
      await this.state.storage.delete(`${this.customerKey(rec.customerId)}${id}`);
    }
  }

  async fetch(request: Request): Promise<Response> {
    try {
      const body = (await request.json()) as DORequest;
      switch (body.op) {
        case "get": {
          const stored = await this.load(body.id);
          if (!stored) {
            return json({ ok: true, record: null });
          }
          const record: SessionRecord = {
            sessionId: stored.sessionId,
            customerId: stored.customerId,
            userAgent: stored.userAgent,
            createdAt: stored.createdAt,
          };
          return json({ ok: true, record: serializeRecord(record) });
        }
        case "set": {
          const createdAt = new Date(body.record.createdAt);
          const record: SessionRecord = {
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
          const refs = await this.state.storage.list<string>({ prefix });
          const records: SerializedSessionRecord[] = [];
          for (const [, sessionId] of refs) {
            const stored = await this.load(sessionId);
            if (stored) {
              const record: SessionRecord = {
                sessionId: stored.sessionId,
                customerId: stored.customerId,
                userAgent: stored.userAgent,
                createdAt: new Date(stored.createdAt),
              };
              records.push(serializeRecord(record));
            } else {
              await this.state.storage.delete(`${prefix}${sessionId}`);
            }
          }
          return json({ ok: true, records });
        }
        default:
          return json({ ok: false }, 400);
      }
    } catch (err) {
      console.error("SessionDurableObject error", err); // i18n-exempt -- internal diagnostic log
      return json({ ok: false }, 500);
    }
  }
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function shouldLogLatency(): boolean {
  return !(
    typeof process !== "undefined" &&
    process.env &&
    process.env.NODE_ENV === "test"
  );
}
