import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_API_BASE_URL = "https://gmail.googleapis.com/gmail/v1/users/me";
const ACCESS_TOKEN_EXPIRY_SKEW_MS = 60_000;

type GmailSecretName =
  | "GMAIL_CLIENT_ID"
  | "GMAIL_CLIENT_SECRET"
  | "GMAIL_REFRESH_TOKEN";

type GmailCredentials = Record<GmailSecretName, string>;

type AccessTokenCacheEntry = {
  accessToken: string;
  expiresAt: number;
  tokenType: string;
};

type GmailProfile = {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
};

type GmailThreadListResponse = {
  threads?: Array<{
    id?: string;
    snippet?: string;
    historyId?: string;
  }>;
  nextPageToken?: string;
  resultSizeEstimate?: number;
};

type GmailHistoryResponse = {
  history?: Array<{
    id?: string;
    messagesAdded?: Array<{
      message?: {
        id?: string;
        threadId?: string;
      };
    }>;
    messagesDeleted?: Array<{
      message?: {
        id?: string;
        threadId?: string;
      };
    }>;
    labelsAdded?: Array<{
      message?: {
        id?: string;
        threadId?: string;
      };
    }>;
    labelsRemoved?: Array<{
      message?: {
        id?: string;
        threadId?: string;
      };
    }>;
  }>;
  historyId?: string;
  nextPageToken?: string;
};

type GmailHeader = {
  name?: string;
  value?: string;
};

type GmailMessagePayload = {
  mimeType?: string;
  filename?: string;
  headers?: GmailHeader[];
  body?: {
    size?: number;
    data?: string;
  };
  parts?: GmailMessagePayload[];
};

type GmailThreadMessageResponse = {
  id?: string;
  threadId?: string;
  labelIds?: string[];
  snippet?: string;
  historyId?: string;
  internalDate?: string;
  payload?: GmailMessagePayload;
};

type GmailThreadDetailResponse = {
  id?: string;
  historyId?: string;
  snippet?: string;
  messages?: GmailThreadMessageResponse[];
};

export type ParsedGmailThreadMessage = {
  id: string;
  threadId: string;
  labelIds: string[];
  historyId: string | null;
  snippet: string;
  internalDate: string | null;
  receivedAt: string | null;
  from: string | null;
  to: string[];
  subject: string | null;
  inReplyTo: string | null;
  references: string | null;
  body: {
    plain: string;
    html?: string;
  };
  attachments: Array<{
    filename: string;
    mimeType: string;
    size: number;
  }>;
};

export type ParsedGmailThread = {
  id: string;
  historyId: string | null;
  snippet: string;
  messages: ParsedGmailThreadMessage[];
};

type GmailDraftCreateResponse = {
  id?: string;
  message?: {
    id?: string;
    threadId?: string;
  };
};

type GmailDraftSendResponse = {
  id?: string;
  threadId?: string;
  labelIds?: string[];
};

type GmailLabelModifyInput = {
  addLabelIds?: string[];
  removeLabelIds?: string[];
};

type CreateDraftInput = {
  to: string[];
  subject: string;
  bodyPlain: string;
  bodyHtml?: string;
  threadId?: string;
  inReplyTo?: string;
  references?: string;
};

type ListThreadsInput = {
  maxResults?: number;
  query?: string;
  pageToken?: string;
};

type ListHistoryInput = {
  startHistoryId: string;
  maxResults?: number;
  pageToken?: string;
};

type GmailApiErrorPayload = {
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
};

let accessTokenCache: AccessTokenCacheEntry | null = null;

declare global {
  interface CloudflareEnv {
    GMAIL_CLIENT_ID?: string;
    GMAIL_CLIENT_SECRET?: string;
    GMAIL_REFRESH_TOKEN?: string;
  }
}

function encodeBase64Url(input: string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function createRawEmail(
  to: string,
  subject: string,
  bodyPlain: string,
  bodyHtml?: string,
  inReplyTo?: string,
  references?: string,
): string {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const headers = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
  ];

  if (inReplyTo) {
    headers.push(`In-Reply-To: ${inReplyTo}`);
  }
  if (references) {
    headers.push(`References: ${references}`);
  }

  let body: string;
  if (bodyHtml) {
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    body = [
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      "",
      bodyPlain,
      "",
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      "",
      bodyHtml,
      "",
      `--${boundary}--`,
    ].join("\r\n");
  } else {
    headers.push('Content-Type: text/plain; charset="UTF-8"');
    body = bodyPlain;
  }

  return encodeBase64Url(`${headers.join("\r\n")}\r\n\r\n${body}`);
}

async function readSecret(name: GmailSecretName): Promise<string | null> {
  const envValue = process.env[name]?.trim();
  if (envValue) {
    return envValue;
  }

  try {
    const { env } = await getCloudflareContext({ async: true });
    const cloudflareValue = env[name];
    if (typeof cloudflareValue === "string" && cloudflareValue.trim()) {
      return cloudflareValue.trim();
    }
  } catch {
    // Fall through: local validation paths may not have request context.
  }

  return null;
}

async function readCredentials(): Promise<GmailCredentials> {
  const clientId = await readSecret("GMAIL_CLIENT_ID");
  const clientSecret = await readSecret("GMAIL_CLIENT_SECRET");
  const refreshToken = await readSecret("GMAIL_REFRESH_TOKEN");

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Gmail Worker secrets missing. Expected GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN."
    );
  }

  return {
    GMAIL_CLIENT_ID: clientId,
    GMAIL_CLIENT_SECRET: clientSecret,
    GMAIL_REFRESH_TOKEN: refreshToken,
  };
}

export function clearGmailAccessTokenCache(): void {
  accessTokenCache = null;
}

async function refreshAccessToken(force = false): Promise<AccessTokenCacheEntry> {
  if (
    !force &&
    accessTokenCache &&
    accessTokenCache.expiresAt > Date.now() + ACCESS_TOKEN_EXPIRY_SKEW_MS
  ) {
    return accessTokenCache;
  }

  const credentials = await readCredentials();
  const body = new URLSearchParams({
    client_id: credentials.GMAIL_CLIENT_ID,
    client_secret: credentials.GMAIL_CLIENT_SECRET,
    refresh_token: credentials.GMAIL_REFRESH_TOKEN,
    grant_type: "refresh_token",
  });

  const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    token_type?: string;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !payload.access_token) {
    const detail = payload.error_description ?? payload.error ?? `HTTP ${response.status}`;
    throw new Error(`Failed to refresh Gmail access token: ${detail}`);
  }

  accessTokenCache = {
    accessToken: payload.access_token,
    expiresAt: Date.now() + (payload.expires_in ?? 3600) * 1000,
    tokenType: payload.token_type ?? "Bearer",
  };

  return accessTokenCache;
}

async function gmailApiRequest<T>(
  path: string,
  init: RequestInit = {},
  retryOnUnauthorized = true,
): Promise<T> {
  const token = await refreshAccessToken();
  const response = await fetch(`${GMAIL_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `${token.tokenType} ${token.accessToken}`,
      ...(init.headers ?? {}),
    },
  });

  if (response.status === 401 && retryOnUnauthorized) {
    await refreshAccessToken(true);
    return gmailApiRequest<T>(path, init, false);
  }

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const payload = (await response.json()) as GmailApiErrorPayload;
      detail = payload.error?.message ?? payload.error?.status ?? detail;
    } catch {
      // Ignore JSON parse failure and fall back to status code.
    }
    throw new Error(`Gmail API request failed: ${detail}`);
  }

  return (await response.json()) as T;
}

export async function getGmailProfile(): Promise<GmailProfile> {
  return gmailApiRequest<GmailProfile>("/profile");
}

export async function listGmailThreads(
  input: ListThreadsInput = {},
): Promise<GmailThreadListResponse> {
  const params = new URLSearchParams();
  if (typeof input.maxResults === "number") {
    params.set("maxResults", String(Math.min(Math.max(Math.trunc(input.maxResults), 1), 100)));
  }
  if (input.query?.trim()) {
    params.set("q", input.query.trim());
  }
  if (input.pageToken?.trim()) {
    params.set("pageToken", input.pageToken.trim());
  }

  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return gmailApiRequest<GmailThreadListResponse>(`/threads${suffix}`);
}

export async function listGmailHistory(
  input: ListHistoryInput,
): Promise<GmailHistoryResponse> {
  const params = new URLSearchParams({
    startHistoryId: input.startHistoryId,
  });
  if (typeof input.maxResults === "number") {
    params.set("maxResults", String(Math.min(Math.max(Math.trunc(input.maxResults), 1), 500)));
  }
  if (input.pageToken?.trim()) {
    params.set("pageToken", input.pageToken.trim());
  }

  return gmailApiRequest<GmailHistoryResponse>(`/history?${params.toString()}`);
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

function decodeHtmlEntities(raw: string): string {
  return raw
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_match, digits) => {
      const codePoint = Number.parseInt(digits, 10);
      return Number.isNaN(codePoint) ? "" : String.fromCharCode(codePoint);
    });
}

function normalizeWhitespace(raw: string): string {
  return decodeHtmlEntities(raw).replace(/\s+/g, " ").trim();
}

function extractBody(payload: GmailMessagePayload | undefined): { plain: string; html?: string } {
  const result: { plain: string; html?: string } = { plain: "" };

  function extractFromPart(part: GmailMessagePayload): void {
    if (part.mimeType === "text/plain" && part.body?.data) {
      result.plain = decodeBase64Url(part.body.data);
      return;
    }

    if (part.mimeType === "text/html" && part.body?.data) {
      result.html = decodeBase64Url(part.body.data);
      return;
    }

    if (part.parts) {
      for (const subpart of part.parts) {
        extractFromPart(subpart);
      }
    }
  }

  if (!payload) {
    return result;
  }

  if (payload.mimeType === "text/plain" && payload.body?.data) {
    result.plain = decodeBase64Url(payload.body.data);
  } else if (payload.mimeType === "text/html" && payload.body?.data) {
    result.html = decodeBase64Url(payload.body.data);
    result.plain = normalizeWhitespace(result.html.replace(/<[^>]+>/g, " "));
  } else if (payload.parts) {
    for (const part of payload.parts) {
      extractFromPart(part);
    }
  }

  if (!result.plain && result.html) {
    result.plain = normalizeWhitespace(result.html.replace(/<[^>]+>/g, " "));
  }

  result.plain = normalizeWhitespace(result.plain);
  if (result.html) {
    result.html = result.html.trim();
  }

  return result;
}

function extractAttachments(payload: GmailMessagePayload | undefined): ParsedGmailThreadMessage["attachments"] {
  const attachments: ParsedGmailThreadMessage["attachments"] = [];

  function extractFromPart(part: GmailMessagePayload): void {
    if (part.filename && part.filename.length > 0) {
      attachments.push({
        filename: part.filename,
        mimeType: part.mimeType ?? "application/octet-stream",
        size: part.body?.size ?? 0,
      });
    }

    if (part.parts) {
      for (const subpart of part.parts) {
        extractFromPart(subpart);
      }
    }
  }

  if (payload) {
    extractFromPart(payload);
  }

  return attachments;
}

function getHeaderValue(headers: GmailHeader[] | undefined, name: string): string | null {
  const header = headers?.find((entry) => entry.name?.toLowerCase() === name.toLowerCase());
  const value = header?.value?.trim();
  return value?.length ? value : null;
}

function toIsoFromInternalDate(internalDate: string | undefined): string | null {
  if (!internalDate) {
    return null;
  }

  const milliseconds = Number.parseInt(internalDate, 10);
  if (Number.isNaN(milliseconds)) {
    return null;
  }

  return new Date(milliseconds).toISOString();
}

function toParsedThreadMessage(
  threadId: string,
  message: GmailThreadMessageResponse,
): ParsedGmailThreadMessage | null {
  if (!message.id) {
    return null;
  }

  const headers = message.payload?.headers;
  return {
    id: message.id,
    threadId: message.threadId ?? threadId,
    labelIds: message.labelIds ?? [],
    historyId: message.historyId ?? null,
    snippet: normalizeWhitespace(message.snippet ?? ""),
    internalDate: message.internalDate ?? null,
    receivedAt: toIsoFromInternalDate(message.internalDate),
    from: getHeaderValue(headers, "From"),
    to: (getHeaderValue(headers, "To") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    subject: getHeaderValue(headers, "Subject"),
    inReplyTo: getHeaderValue(headers, "In-Reply-To"),
    references: getHeaderValue(headers, "References"),
    body: extractBody(message.payload),
    attachments: extractAttachments(message.payload),
  };
}

export async function getGmailThread(threadId: string): Promise<ParsedGmailThread> {
  if (!threadId.trim()) {
    throw new Error("threadId is required to fetch a Gmail thread.");
  }

  const detail = await gmailApiRequest<GmailThreadDetailResponse>(
    `/threads/${encodeURIComponent(threadId)}?format=full`,
  );

  return {
    id: detail.id ?? threadId,
    historyId: detail.historyId ?? null,
    snippet: normalizeWhitespace(detail.snippet ?? ""),
    messages: (detail.messages ?? [])
      .map((message) => toParsedThreadMessage(detail.id ?? threadId, message))
      .filter((message): message is ParsedGmailThreadMessage => Boolean(message)),
  };
}

export async function createGmailDraft(
  input: CreateDraftInput,
): Promise<GmailDraftCreateResponse> {
  const raw = createRawEmail(
    input.to.join(", "),
    input.subject,
    input.bodyPlain,
    input.bodyHtml,
    input.inReplyTo,
    input.references,
  );

  return gmailApiRequest<GmailDraftCreateResponse>("/drafts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        raw,
        ...(input.threadId ? { threadId: input.threadId } : {}),
      },
    }),
  });
}

export async function sendGmailDraft(draftId: string): Promise<GmailDraftSendResponse> {
  if (!draftId.trim()) {
    throw new Error("draftId is required to send a Gmail draft.");
  }

  return gmailApiRequest<GmailDraftSendResponse>("/drafts/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: draftId }),
  });
}

export async function modifyGmailThreadLabels(
  threadId: string,
  input: GmailLabelModifyInput,
): Promise<GmailThreadDetailResponse> {
  if (!threadId.trim()) {
    throw new Error("threadId is required to modify a Gmail thread.");
  }

  return gmailApiRequest<GmailThreadDetailResponse>(
    `/threads/${encodeURIComponent(threadId)}/modify`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        addLabelIds: input.addLabelIds ?? [],
        removeLabelIds: input.removeLabelIds ?? [],
      }),
    },
  );
}

export async function markGmailThreadRead(threadId: string): Promise<void> {
  await modifyGmailThreadLabels(threadId, {
    removeLabelIds: ["UNREAD"],
  });
}
