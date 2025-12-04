import { NextRequest, NextResponse } from "next/server";
import { getSettings } from "@cms/actions/shops.server";
import { listEvents } from "@platform-core/repositories/analytics.server";
import { readSeoAudits } from "@platform-core/repositories/seoAudit.server";
import { env } from "@acme/config";
import { DATA_ROOT } from "@platform-core/dataRoot";
import fs from "fs/promises";
import path from "path";

type LocaleSeo = { title?: string; description?: string; structuredData?: string };
type SeoSettings = {
  languages?: readonly string[];
  seo?: {
    aiCatalog?: { enabled?: boolean; fields?: string[]; pageSize?: number };
  } & Record<string, LocaleSeo | undefined>;
  [key: string]: unknown;
};

type AnalyticsEvent = { shop?: string; type?: string; timestamp?: string };
type AuditEntry = { timestamp?: string };
type NotificationPayload = { shop: string; issues: string[]; timestamp: string };

const LAST_NOTIFIED = new Map<string, number>();
const NOTIFY_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const QUEUE_FILE = path.join(DATA_ROOT, "seo-notify-queue.json");
const PENDING_QUEUE: { shop: string; payload: NotificationPayload }[] = [];

async function loadQueueState(): Promise<{
  queue: typeof PENDING_QUEUE;
  lastNotified: Record<string, number>;
}> {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- SEC-999 queue file path is repo-controlled constant
    const buf = await fs.readFile(QUEUE_FILE, "utf8");
    const parsed = JSON.parse(buf) as { queue?: typeof PENDING_QUEUE; lastNotified?: Record<string, number> };
    return {
      queue: Array.isArray(parsed.queue) ? parsed.queue : [],
      lastNotified: parsed.lastNotified ?? {},
    };
  } catch {
    return { queue: [], lastNotified: {} };
  }
}

async function saveQueueState(queue: typeof PENDING_QUEUE, lastNotified: Record<string, number>) {
  const data = JSON.stringify({ queue, lastNotified }, null, 2);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- SEC-999 queue file path is repo-controlled constant
  await fs.mkdir(path.dirname(QUEUE_FILE), { recursive: true });
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- SEC-999 queue file path is repo-controlled constant
  await fs.writeFile(QUEUE_FILE, data, "utf8");
}

function buildIssues(shop: string, settings: SeoSettings, events: AnalyticsEvent[], audits: AuditEntry[]) {
  const languages = settings.languages ?? [];
  const seo = settings.seo ?? {};
  const aiCatalog = seo.aiCatalog;
  const lastCrawl = events
    .filter((e) => e.shop === shop)
    .filter((e) => e.type === "ai_crawl")
    .map((e) => e.timestamp as string)
    .filter(Boolean)
    .sort()
    .pop();

  const missingTitles = languages.filter(
    (lang: string) => !(seo as Record<string, { title?: string }>)[lang]?.title,
  );
  const missingDescriptions = languages.filter(
    (lang: string) => !(seo as Record<string, { description?: string }>)[lang]?.description,
  );

  const lastAudit = audits.at(-1);
  const lastAuditTs = lastAudit?.timestamp
    ? new Date(lastAudit.timestamp).getTime()
    : undefined;
  const auditStale =
    lastAuditTs === undefined || Date.now() - lastAuditTs > 1000 * 60 * 60 * 24 * 30;

  const issues: string[] = [];
  if (missingTitles.length || missingDescriptions.length) {
    issues.push(
      `Missing metadata: titles(${missingTitles.join(",") || "ok"}), descriptions(${missingDescriptions.join(",") || "ok"})`,
    );
  }
  if (!aiCatalog?.enabled) {
    issues.push("AI catalog feed disabled");
  }
  if (!lastCrawl) {
    issues.push("No AI crawl activity yet");
  }
  if (auditStale) {
    issues.push("SEO audit stale (>30 days) or missing");
  }
  // Validate structured data JSON per locale
  for (const lang of languages) {
    const sd = (seo as Record<string, LocaleSeo>)[lang]?.structuredData;
    if (sd) {
      try {
        JSON.parse(sd);
      } catch {
        issues.push(`Structured data invalid JSON for locale ${lang}`);
      }
    }
  }
  return issues;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { shop?: string };
  const shop = body.shop || "default";
  const webhook = String(env?.SEO_NOTIFY_WEBHOOK ?? process.env.SEO_NOTIFY_WEBHOOK ?? "");
  if (!webhook) {
    return NextResponse.json({ error: "SEO_NOTIFY_WEBHOOK not configured" }, { status: 500 });
  }

  const result = await sendNotificationForShop(shop, { cooldownMs: NOTIFY_COOLDOWN_MS });
  return NextResponse.json(result, result.status === "sent" ? { status: 200 } : { status: 200 });
}

type NotifyResult =
  | { ok: true; status: "skipped"; message: string }
  | { ok: true; status: "sent"; sent: number }
  | { ok: true; status: "queued"; detail: string };

export async function sendNotificationForShop(
  shop: string,
  { cooldownMs = NOTIFY_COOLDOWN_MS, force = false }: { cooldownMs?: number; force?: boolean } = {},
): Promise<NotifyResult> {
  const webhook = String(env?.SEO_NOTIFY_WEBHOOK ?? process.env.SEO_NOTIFY_WEBHOOK ?? "");
  if (!webhook) {
    return { ok: true, status: "skipped", message: "SEO_NOTIFY_WEBHOOK not configured" };
  }

  const now = Date.now();

  // Load persisted state and merge into in-memory structures
  const state = await loadQueueState();
  Object.entries(state.lastNotified).forEach(([s, ts]) => LAST_NOTIFIED.set(s, ts));
  state.queue.forEach((item) => {
    if (!PENDING_QUEUE.find((q) => q.shop === item.shop && q.payload.timestamp === item.payload.timestamp)) {
      PENDING_QUEUE.push(item);
    }
  });

  const last = LAST_NOTIFIED.get(shop);
  if (!force && last && now - last < (cooldownMs ?? NOTIFY_COOLDOWN_MS)) {
    return { ok: true, status: "skipped", message: "Notification recently sent; skipping" };
  }

  const [settings, events, audits] = await Promise.all([
    getSettings(shop) as Promise<SeoSettings>,
    listEvents() as Promise<AnalyticsEvent[]>,
    readSeoAudits(shop) as Promise<AuditEntry[]>,
  ]);

  const issues = buildIssues(shop, settings, events, audits);
  if (issues.length === 0) {
    return { ok: true, status: "skipped", message: "No issues to notify" };
  }

  const payload: NotificationPayload = {
    shop,
    issues,
    timestamp: new Date().toISOString(),
  };

  const sendWithRetry = async () => {
    let attempt = 0;
    let lastErr: unknown;
    while (attempt < 3) {
      attempt += 1;
      try {
        const res = await fetch(webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Webhook returned ${res.status}`);
        LAST_NOTIFIED.set(shop, now);
        return true;
      } catch (err) {
        lastErr = err;
      }
    }
    return lastErr;
  };

  const result = await sendWithRetry();
  if (result !== true) {
    // Enqueue a deferred attempt; best-effort in-memory retry
    PENDING_QUEUE.push({ shop, payload });
    await saveQueueState(PENDING_QUEUE, Object.fromEntries(LAST_NOTIFIED.entries()));
    setTimeout(() => {
      void sendWithRetry().then((r) => {
        if (r === true) {
          const idx = PENDING_QUEUE.findIndex((p) => p.shop === shop && p.payload.timestamp === payload.timestamp);
          if (idx !== -1) PENDING_QUEUE.splice(idx, 1);
          void saveQueueState(PENDING_QUEUE, Object.fromEntries(LAST_NOTIFIED.entries()));
        }
      });
    }, 30_000);
    return { ok: true, status: "queued", detail: String(result) };
  }

  await saveQueueState(PENDING_QUEUE, Object.fromEntries(LAST_NOTIFIED.entries()));
  return { ok: true, status: "sent", sent: issues.length };
}
