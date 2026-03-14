import "server-only";

import type {
  InboxDraftApiModel,
  InboxMessageApiModel,
  InboxThreadSummaryApiModel,
} from "./api-models.server";
import { resolveInboxChannelAdapter } from "./channel-adapters.server";

export type PrimeReviewThreadSummary = {
  id: string;
  channel: "prime_direct" | "prime_broadcast" | "prime_activity";
  lane: "support" | "promotion";
  reviewStatus: "pending" | "review_later" | "auto_archived" | "resolved" | "sent";
  subject: string | null;
  snippet: string | null;
  latestMessageAt: string | null;
  updatedAt: string;
  latestAdmissionDecision: string | null;
  latestAdmissionReason: string | null;
  bookingId: string;
};

export type PrimeReviewThreadDetail = {
  thread: PrimeReviewThreadSummary & {
    takeoverState: string;
    suppressionReason: string | null;
    memberUids: string[];
  };
  messages: Array<{
    id: string;
    direction: "inbound" | "outbound";
    senderId: string;
    senderName: string | null;
    senderRole: string;
    content: string;
    kind: string;
    createdAt: string;
    links?: unknown[] | null;
    attachments?: unknown[] | null;
    cards?: unknown[] | null;
    audience?: string | null;
    campaignId?: string | null;
  }>;
  admissions: Array<{
    id: number;
    decision: string;
    reason: string | null;
    source: string;
    classifierVersion: string | null;
    sourceMetadataJson: string | null;
    createdAt: string;
  }>;
  currentDraft: null | {
    id: string;
    status: "suggested" | "under_review" | "approved" | "sent" | "dismissed";
    source: "agent" | "staff";
    content: string;
    kind: string;
    audience: string;
    quality: Record<string, unknown> | null;
    interpret: Record<string, unknown> | null;
    createdByUid: string | null;
    reviewerUid: string | null;
    createdAt: string;
    updatedAt: string;
  };
  currentCampaign: PrimeReviewCampaignDetail | null;
  metadata: Record<string, unknown>;
};

export type PrimeReviewCampaignDetail = {
  id: string;
  threadId: string;
  type: "broadcast" | "referral" | "event_invite" | "return_offer";
  status: "drafting" | "under_review" | "sent" | "resolved" | "archived";
  audience: string;
  title: string | null;
  metadata: Record<string, unknown> | null;
  latestDraftId: string | null;
  sentMessageId: string | null;
  targetCount: number;
  sentCount: number;
  projectedCount: number;
  failedCount: number;
  lastError: string | null;
  createdByUid: string | null;
  reviewerUid: string | null;
  createdAt: string;
  updatedAt: string;
  targetSummary: {
    total: number;
    byKind: Array<{
      kind: string;
      count: number;
    }>;
  };
  deliverySummary: {
    total: number;
    pending: number;
    ready: number;
    sent: number;
    projected: number;
    failed: number;
    cancelled: number;
    replayableCount: number;
    lastError: string | null;
  };
  targets: Array<{
    id: string;
    kind: string;
    key: string;
    threadId: string | null;
    bookingId: string | null;
    roomKey: string | null;
    guestUuid: string | null;
    externalContactKey: string | null;
    metadata: Record<string, unknown> | null;
    eligibilityContext: Record<string, unknown> | null;
    createdAt: string;
    updatedAt: string;
  }>;
  deliveries: Array<{
    id: string;
    targetSnapshotId: string;
    targetKind: string | null;
    targetKey: string | null;
    status: string;
    threadId: string | null;
    draftId: string | null;
    messageId: string | null;
    projectionJobId: string | null;
    attemptCount: number;
    lastAttemptAt: string | null;
    lastError: string | null;
    sentAt: string | null;
    projectedAt: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
    updatedAt: string;
  }>;
};

/**
 * Strip per-recipient PII from campaign detail before it leaves the server layer.
 * The `targets` and `deliveries` arrays contain recipient emails, phone numbers,
 * guest UUIDs, and external contact keys. Aggregate summaries are safe to expose.
 */
function sanitizeCampaignDetail(campaign: PrimeReviewCampaignDetail): PrimeReviewCampaignDetail {
  return {
    ...campaign,
    targets: [],
    deliveries: [],
  };
}

export type PrimeReviewThreadDetailApiModel = {
  thread: InboxThreadSummaryApiModel;
  campaign: PrimeReviewCampaignDetail | null;
  metadata: Record<string, unknown>;
  messages: InboxMessageApiModel[];
  events: Array<{
    id: number;
    event_type: string;
    actor_uid: string | null;
    timestamp: string;
    metadata_json: string | null;
  }>;
  admissionOutcomes: Array<{
    id: number;
    decision: string;
    source: string;
    classifier_version: string | null;
    matched_rule: string | null;
    source_metadata_json: string | null;
    created_at: string;
  }>;
  currentDraft: InboxDraftApiModel | null;
  messageBodiesSource: "gmail" | "d1";
  warning: string | null;
};

const PRIME_THREAD_ID_PREFIX = "prime:";

function readPrimeReviewConfig(): { baseUrl: string; accessToken: string } | null {
  const baseUrl = process.env.RECEPTION_PRIME_API_BASE_URL?.trim();
  const accessToken = process.env.RECEPTION_PRIME_ACCESS_TOKEN?.trim();
  if (!baseUrl || !accessToken) {
    return null;
  }

  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    accessToken,
  };
}

function buildPrimeUrl(path: string): string {
  const config = readPrimeReviewConfig();
  if (!config) {
    throw new Error(
      "Prime review integration is not configured. Set RECEPTION_PRIME_API_BASE_URL and RECEPTION_PRIME_ACCESS_TOKEN.",
    );
  }

  return `${config.baseUrl}${path}`;
}

function buildPrimeHeaders(): Record<string, string> {
  const config = readPrimeReviewConfig();
  if (!config) {
    throw new Error(
      "Prime review integration is not configured. Set RECEPTION_PRIME_API_BASE_URL and RECEPTION_PRIME_ACCESS_TOKEN.",
    );
  }

  return {
    "Content-Type": "application/json",
    "x-prime-access-token": config.accessToken,
  };
}

type PrimeEnvelope<T> = {
  success: boolean;
  error?: string;
  data: T;
};

async function primeRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(buildPrimeUrl(path), {
      ...init,
      headers: {
        ...buildPrimeHeaders(),
        ...(init.headers ?? {}),
      },
      cache: "no-store",
    });
  } catch {
    throw new Error("Failed to reach Prime messaging service");
  }

  let payload: PrimeEnvelope<T>;
  try {
    payload = (await response.json()) as PrimeEnvelope<T>;
  } catch {
    throw new Error("Failed to load Prime threads");
  }

  if (!response.ok || !payload.success) {
    throw new Error("Failed to load Prime threads");
  }

  return payload.data;
}

function buildPrimeActorHeaders(actorUid?: string): Record<string, string> | undefined {
  return actorUid ? { "x-prime-actor-uid": actorUid } : undefined;
}

/**
 * Map Prime reviewStatus values to the shared inbox status string.
 *
 * Prime uses its own status vocabulary. All Prime status values are valid
 * inbox status strings so no transformation is needed for the current set,
 * but the explicit switch makes the mapping auditable and catches any future
 * Prime-side additions at the type level.
 */
function mapPrimeStatus(
  reviewStatus: PrimeReviewThreadSummary["reviewStatus"],
): InboxThreadSummaryApiModel["status"] {
  switch (reviewStatus) {
    case "pending":
      return "pending";
    case "review_later":
      return "review_later";
    case "auto_archived":
      return "auto_archived";
    case "resolved":
      return "resolved";
    case "sent":
      return "sent";
    default:
      return reviewStatus;
  }
}

function mapPrimeSummaryToInboxThread(
  summary: PrimeReviewThreadSummary,
): InboxThreadSummaryApiModel {
  const adapter = resolveInboxChannelAdapter(summary.channel);
  return {
    id: buildPrimeInboxThreadId(summary.id),
    source: "prime",
    status: mapPrimeStatus(summary.reviewStatus),
    channel: adapter.channel,
    channelLabel: adapter.channelLabel,
    lane: adapter.lane,
    reviewMode: adapter.reviewMode,
    capabilities: { ...adapter.capabilities },
    subject: summary.subject,
    snippet: summary.snippet,
    latestMessageAt: summary.latestMessageAt,
    lastSyncedAt: null,
    updatedAt: summary.updatedAt,
    needsManualDraft: false,
    draftFailureCode: null,
    draftFailureMessage: null,
    latestAdmissionDecision: summary.latestAdmissionDecision,
    latestAdmissionReason: summary.latestAdmissionReason,
    currentDraft: null,
    guestBookingRef: summary.channel === "prime_activity" ? null : summary.bookingId,
    guestFirstName: null,
    guestLastName: null,
  };
}

function mapPrimeCurrentDraft(
  threadId: string,
  draft: PrimeReviewThreadDetail["currentDraft"],
): InboxDraftApiModel | null {
  if (!draft) {
    return null;
  }

  return {
    id: draft.id,
    threadId,
    gmailDraftId: null,
    status: draft.status,
    subject: null,
    recipientEmails: [],
    plainText: draft.content,
    html: null,
    originalPlainText: null,
    originalHtml: null,
    templateUsed: null,
    quality: draft.quality,
    interpret: draft.interpret,
    createdByUid: draft.createdByUid,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
  };
}

export function buildPrimeInboxThreadId(threadId: string): string {
  return `${PRIME_THREAD_ID_PREFIX}${encodeURIComponent(threadId)}`;
}

export function parsePrimeInboxThreadId(threadId: string): string | null {
  if (!threadId.startsWith(PRIME_THREAD_ID_PREFIX)) {
    return null;
  }

  try {
    return decodeURIComponent(threadId.slice(PRIME_THREAD_ID_PREFIX.length));
  } catch {
    return null;
  }
}

export function isPrimeInboxThreadId(threadId: string): boolean {
  return parsePrimeInboxThreadId(threadId) !== null;
}

export function isPrimeThreadVisibleInInbox(row: { reviewStatus: PrimeReviewThreadSummary["reviewStatus"] }): boolean {
  return row.reviewStatus !== 'resolved' && row.reviewStatus !== 'sent' && row.reviewStatus !== 'auto_archived';
}

export async function listPrimeInboxThreadSummaries(status?: string): Promise<InboxThreadSummaryApiModel[]> {
  if (!readPrimeReviewConfig()) {
    return [];
  }

  const url = status
    ? `/api/review-threads?limit=50&status=${encodeURIComponent(status)}`
    : "/api/review-threads?limit=50";
  try {
    const summaries = await primeRequest<PrimeReviewThreadSummary[]>(url);
    return summaries.map(mapPrimeSummaryToInboxThread);
  } catch {
    // Re-throw with a safe message so callers can surface the failure.
    // The original error (which may contain infrastructure details) is not forwarded.
    throw new Error("Failed to load Prime threads");
  }
}

export async function getPrimeInboxThreadDetail(
  prefixedThreadId: string,
): Promise<PrimeReviewThreadDetailApiModel | null> {
  const threadId = parsePrimeInboxThreadId(prefixedThreadId);
  if (!threadId) {
    return null;
  }

  const detail = await primeRequest<PrimeReviewThreadDetail>(
    `/api/review-thread?threadId=${encodeURIComponent(threadId)}`,
  );

  return {
    thread: {
      ...mapPrimeSummaryToInboxThread(detail.thread),
    },
    campaign: detail.currentCampaign ? sanitizeCampaignDetail(detail.currentCampaign) : null,
    metadata: {
      ...detail.metadata,
      bookingId: detail.thread.bookingId,
      takeoverState: detail.thread.takeoverState,
      suppressionReason: detail.thread.suppressionReason,
      memberUids: detail.thread.memberUids,
      sourceThreadId: detail.thread.id,
    },
    messages: detail.messages.map((message) => ({
      id: message.id,
      threadId: buildPrimeInboxThreadId(detail.thread.id),
      direction: message.direction,
      senderEmail: null,
      recipientEmails: [],
      subject: null,
      snippet: message.content,
      sentAt: message.createdAt,
      bodyPlain: message.content,
      bodyHtml: null,
      inReplyTo: null,
      references: null,
      attachments: [],
      links: message.links ?? null,
      primeAttachments: message.attachments ?? null,
      cards: message.cards ?? null,
      audience: message.audience ?? null,
      campaignId: message.campaignId ?? null,
    })),
    events: [],
    admissionOutcomes: detail.admissions.map((admission) => ({
      id: admission.id,
      decision: admission.decision,
      source: admission.source,
      classifier_version: admission.classifierVersion,
      matched_rule: null,
      source_metadata_json: admission.sourceMetadataJson,
      created_at: admission.createdAt,
    })),
    currentDraft: mapPrimeCurrentDraft(buildPrimeInboxThreadId(detail.thread.id), detail.currentDraft),
    messageBodiesSource: "d1",
    warning: null,
  };
}

export async function getPrimeInboxCampaign(
  campaignId: string,
): Promise<PrimeReviewCampaignDetail | null> {
  if (!readPrimeReviewConfig()) {
    return null;
  }

  const campaign = await primeRequest<PrimeReviewCampaignDetail>(
    `/api/review-campaign?campaignId=${encodeURIComponent(campaignId)}`,
  );
  return sanitizeCampaignDetail(campaign);
}

export async function savePrimeInboxDraft(
  prefixedThreadId: string,
  payload: { plainText: string; templateUsed?: string },
  actorUid?: string,
): Promise<InboxDraftApiModel | null> {
  const threadId = parsePrimeInboxThreadId(prefixedThreadId);
  if (!threadId) {
    return null;
  }

  const response = await primeRequest<{ detail: PrimeReviewThreadDetail }>(
    `/api/review-thread-draft?threadId=${encodeURIComponent(threadId)}`,
    {
      method: "PUT",
      headers: buildPrimeActorHeaders(actorUid),
      body: JSON.stringify({ plainText: payload.plainText }),
    },
  );

  const draft = mapPrimeCurrentDraft(buildPrimeInboxThreadId(threadId), response.detail.currentDraft);
  if (draft && payload.templateUsed) {
    draft.templateUsed = payload.templateUsed;
  }
  return draft;
}

export async function resolvePrimeInboxThread(
  prefixedThreadId: string,
  actorUid?: string,
): Promise<InboxThreadSummaryApiModel | null> {
  const threadId = parsePrimeInboxThreadId(prefixedThreadId);
  if (!threadId) {
    return null;
  }

  const payload = await primeRequest<{ thread: PrimeReviewThreadSummary }>(
    `/api/review-thread-resolve?threadId=${encodeURIComponent(threadId)}`,
    {
      method: "POST",
      headers: buildPrimeActorHeaders(actorUid),
    },
  );

  return mapPrimeSummaryToInboxThread(payload.thread);
}

export async function dismissPrimeInboxThread(
  prefixedThreadId: string,
  actorUid?: string,
): Promise<InboxThreadSummaryApiModel | null> {
  const threadId = parsePrimeInboxThreadId(prefixedThreadId);
  if (!threadId) {
    return null;
  }

  const payload = await primeRequest<{ thread: PrimeReviewThreadSummary }>(
    `/api/review-thread-dismiss?threadId=${encodeURIComponent(threadId)}`,
    {
      method: "POST",
      headers: buildPrimeActorHeaders(actorUid),
    },
  );

  return mapPrimeSummaryToInboxThread(payload.thread);
}

export async function sendPrimeInboxThread(
  prefixedThreadId: string,
  actorUid?: string,
): Promise<{
  draft: InboxDraftApiModel | null;
  sentMessageId: string | null;
}> {
  const threadId = parsePrimeInboxThreadId(prefixedThreadId);
  if (!threadId) {
    return {
      draft: null,
      sentMessageId: null,
    };
  }

  const detail = await getPrimeInboxThreadDetail(prefixedThreadId);
  if (detail?.campaign?.id && detail.thread.channel === "prime_broadcast") {
    const payload = await primeRequest<{
      campaign: PrimeReviewCampaignDetail;
      sentMessageId: string | null;
    }>(
      `/api/review-campaign-send?campaignId=${encodeURIComponent(detail.campaign.id)}`,
      {
        method: "POST",
        headers: buildPrimeActorHeaders(actorUid),
      },
    );

    return {
      draft: detail.currentDraft,
      sentMessageId: payload.sentMessageId,
    };
  }

  const payload = await primeRequest<{
    thread: PrimeReviewThreadSummary;
    draft: PrimeReviewThreadDetail["currentDraft"];
    sentMessageId: string | null;
  }>(
    `/api/review-thread-send?threadId=${encodeURIComponent(threadId)}`,
    {
      method: "POST",
      headers: buildPrimeActorHeaders(actorUid),
    },
  );

  return {
    draft: mapPrimeCurrentDraft(buildPrimeInboxThreadId(threadId), payload.draft),
    sentMessageId: payload.sentMessageId,
  };
}

/**
 * Initiate a whole-hostel outbound broadcast thread on Prime.
 *
 * Calls POST /api/staff-initiate-thread with the provided text, creating the
 * broadcast thread and an initial draft ready for sending.
 *
 * Returns null when Prime is not configured (graceful degrade — caller should 503).
 * Propagates throws from primeRequest for Prime 4xx/5xx errors (caller should 502).
 */
export async function initiatePrimeOutboundThread(input: {
  text: string;
  actorUid?: string;
}): Promise<{ detail: PrimeReviewThreadDetail } | null> {
  if (!readPrimeReviewConfig()) {
    return null;
  }

  const payload = await primeRequest<{ detail: PrimeReviewThreadDetail }>(
    "/api/staff-initiate-thread",
    {
      method: "POST",
      body: JSON.stringify({ plainText: input.text }),
      headers: buildPrimeActorHeaders(input.actorUid),
    },
  );

  return { detail: payload.detail };
}

export async function replayPrimeInboxCampaignDelivery(
  campaignId: string,
  deliveryId: string,
  actorUid?: string,
): Promise<PrimeReviewCampaignDetail> {
  const payload = await primeRequest<{
    campaign: PrimeReviewCampaignDetail;
    deliveryId: string;
  }>(
    `/api/review-campaign-replay?campaignId=${encodeURIComponent(campaignId)}&deliveryId=${encodeURIComponent(deliveryId)}`,
    {
      method: "POST",
      headers: buildPrimeActorHeaders(actorUid),
    },
  );

  return sanitizeCampaignDetail(payload.campaign);
}
