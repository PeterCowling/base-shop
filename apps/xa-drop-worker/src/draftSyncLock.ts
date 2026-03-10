const DEFAULT_SYNC_LOCK_TTL_MS = 5 * 60 * 1000;

type DraftSyncLockRecord = {
  storefront: string;
  ownerToken: string;
  acquiredAt: string;
  expiresAt: string;
  releasedAt?: string;
};

type R2ObjectWithEtag = {
  text(): Promise<string>;
  httpEtag?: string;
};

function normalizeEtag(raw: string | null | undefined): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "";
  return trimmed.startsWith("\"") ? trimmed : `"${trimmed}"`;
}

function draftSyncLockKey(prefix: string, storefront: string): string {
  return `${prefix}drafts/${storefront}/sync-lock.json`;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseSyncLockRecord(raw: string): DraftSyncLockRecord | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isObjectRecord(parsed)) return null;
  const ownerToken = typeof parsed.ownerToken === "string" ? parsed.ownerToken.trim() : "";
  const acquiredAt = typeof parsed.acquiredAt === "string" ? parsed.acquiredAt.trim() : "";
  const expiresAt = typeof parsed.expiresAt === "string" ? parsed.expiresAt.trim() : "";
  const releasedAt = typeof parsed.releasedAt === "string" ? parsed.releasedAt.trim() : "";

  if (!ownerToken || !acquiredAt || !expiresAt) return null;

  return {
    storefront: typeof parsed.storefront === "string" ? parsed.storefront.trim() : "",
    ownerToken,
    acquiredAt,
    expiresAt,
    ...(releasedAt ? { releasedAt } : {}),
  };
}

function isPreconditionFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes("precondition");
}

function buildLockRecord(storefront: string, now: Date): DraftSyncLockRecord {
  return {
    storefront,
    ownerToken: crypto.randomUUID(),
    acquiredAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + DEFAULT_SYNC_LOCK_TTL_MS).toISOString(),
  };
}

export async function acquireDraftSyncLock(params: {
  bucket: R2Bucket;
  prefix: string;
  storefront: string;
  now?: Date;
}): Promise<
  | { status: "acquired"; ownerToken: string; expiresAt: string }
  | { status: "busy"; expiresAt: string | null }
  | { status: "error"; reason: string }
> {
  const now = params.now ?? new Date();
  const key = draftSyncLockKey(params.prefix, params.storefront);
  const nextRecord = buildLockRecord(params.storefront, now);
  const serialized = `${JSON.stringify(nextRecord)}\n`;

  const existing = (await params.bucket.get(key)) as R2ObjectWithEtag | null;
  if (!existing) {
    try {
      await params.bucket.put(key, serialized, {
        onlyIf: new Headers({ "If-None-Match": "*" }),
        httpMetadata: { contentType: "application/json" },
      });
      return {
        status: "acquired",
        ownerToken: nextRecord.ownerToken,
        expiresAt: nextRecord.expiresAt,
      };
    } catch (error) {
      if (isPreconditionFailure(error)) {
        return { status: "busy", expiresAt: null };
      }
      return { status: "error", reason: "sync_lock_create_failed" };
    }
  }

  const existingRecord = parseSyncLockRecord(await existing.text());
  if (!existingRecord) {
    return { status: "error", reason: "sync_lock_state_invalid" };
  }

  if (Date.parse(existingRecord.expiresAt) > now.getTime()) {
    return { status: "busy", expiresAt: existingRecord.expiresAt };
  }

  const currentEtag = normalizeEtag(existing.httpEtag);
  if (!currentEtag) {
    return { status: "error", reason: "sync_lock_etag_missing" };
  }

  try {
    await params.bucket.put(key, serialized, {
      onlyIf: new Headers({ "If-Match": currentEtag }),
      httpMetadata: { contentType: "application/json" },
    });
    return {
      status: "acquired",
      ownerToken: nextRecord.ownerToken,
      expiresAt: nextRecord.expiresAt,
    };
  } catch (error) {
    if (isPreconditionFailure(error)) {
      return { status: "busy", expiresAt: null };
    }
    return { status: "error", reason: "sync_lock_takeover_failed" };
  }
}

export async function releaseDraftSyncLock(params: {
  bucket: R2Bucket;
  prefix: string;
  storefront: string;
  ownerToken: string;
  now?: Date;
}): Promise<
  | { status: "released" }
  | { status: "missing" }
  | { status: "stale_owner" }
  | { status: "error"; reason: string }
> {
  const now = params.now ?? new Date();
  const key = draftSyncLockKey(params.prefix, params.storefront);
  const existing = (await params.bucket.get(key)) as R2ObjectWithEtag | null;
  if (!existing) {
    return { status: "missing" };
  }

  const existingRecord = parseSyncLockRecord(await existing.text());
  if (!existingRecord) {
    return { status: "error", reason: "sync_lock_state_invalid" };
  }
  if (existingRecord.ownerToken !== params.ownerToken) {
    return { status: "stale_owner" };
  }

  const currentEtag = normalizeEtag(existing.httpEtag);
  if (!currentEtag) {
    return { status: "error", reason: "sync_lock_etag_missing" };
  }

  const releasedRecord: DraftSyncLockRecord = {
    ...existingRecord,
    expiresAt: new Date(now.getTime() - 1000).toISOString(),
    releasedAt: now.toISOString(),
  };

  try {
    await params.bucket.put(key, `${JSON.stringify(releasedRecord)}\n`, {
      onlyIf: new Headers({ "If-Match": currentEtag }),
      httpMetadata: { contentType: "application/json" },
    });
    return { status: "released" };
  } catch (error) {
    if (isPreconditionFailure(error)) {
      return { status: "stale_owner" };
    }
    return { status: "error", reason: "sync_lock_release_failed" };
  }
}
