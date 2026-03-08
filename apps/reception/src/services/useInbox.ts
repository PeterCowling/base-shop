"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type {
  InboxChannel,
  InboxChannelCapabilities,
  InboxReviewMode,
} from "@/lib/inbox/channels";

import { buildMcpAuthHeaders } from "./mcpAuthHeaders";

export type InboxDraft = {
  id: string;
  threadId: string;
  gmailDraftId: string | null;
  status:
    | "generated"
    | "edited"
    | "approved"
    | "sent"
    | "suggested"
    | "under_review"
    | "dismissed";
  subject: string | null;
  recipientEmails: string[];
  plainText: string;
  html: string | null;
  originalPlainText: string | null;
  originalHtml: string | null;
  templateUsed: string | null;
  quality: Record<string, unknown> | null;
  interpret: Record<string, unknown> | null;
  createdByUid: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InboxThreadSummary = {
  id: string;
  status: string;
  channel: InboxChannel;
  channelLabel: string;
  lane: "support" | "promotion";
  reviewMode: InboxReviewMode;
  capabilities: InboxChannelCapabilities;
  subject: string | null;
  snippet: string | null;
  latestMessageAt: string | null;
  lastSyncedAt: string | null;
  updatedAt: string;
  needsManualDraft: boolean;
  draftFailureCode: string | null;
  draftFailureMessage: string | null;
  latestAdmissionDecision: string | null;
  latestAdmissionReason: string | null;
  currentDraft: InboxDraft | null;
  guestBookingRef?: string | null;
  guestFirstName?: string | null;
  guestLastName?: string | null;
};

export type InboxMessage = {
  id: string;
  threadId: string;
  direction: string;
  senderEmail: string | null;
  recipientEmails: string[];
  subject: string | null;
  snippet: string | null;
  sentAt: string | null;
  bodyPlain: string | null;
  bodyHtml: string | null;
  inReplyTo: string | null;
  references: string | null;
  attachments: Array<{
    filename: string;
    mimeType: string;
    size: number;
  }>;
};

export type InboxThreadDetail = {
  thread: InboxThreadSummary;
  campaign: InboxCampaign | null;
  metadata: Record<string, unknown>;
  messages: InboxMessage[];
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
  currentDraft: InboxDraft | null;
  messageBodiesSource: "gmail" | "d1";
  warning: string | null;
};

export type InboxCampaign = {
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
};

type DraftEnvelope = {
  draft: InboxDraft | null;
};

type InboxRequestInit = RequestInit & {
  errorCode?: string;
};

type InboxEnvelope<T> = {
  success: boolean;
  error?: string;
  code?: string;
  data: T;
};

export type InboxDraftUpdateInput = {
  subject?: string;
  recipientEmails?: string[];
  plainText: string;
  html?: string | null;
};

function sortThreads(threads: InboxThreadSummary[]): InboxThreadSummary[] {
  return [...threads].sort((left, right) => {
    const leftKey = left.latestMessageAt ?? left.updatedAt;
    const rightKey = right.latestMessageAt ?? right.updatedAt;
    return rightKey.localeCompare(leftKey);
  });
}

async function inboxRequest<T>(path: string, init: InboxRequestInit = {}): Promise<T> {
  const headers = await buildMcpAuthHeaders();
  const response = await fetch(path, {
    ...init,
    headers: {
      ...headers,
      ...(init.headers ?? {}),
    },
  });

  const payload = (await response.json()) as InboxEnvelope<T>;
  if (!response.ok || !payload.success) {
    throw new Error(payload.error ?? init.errorCode ?? "Inbox request failed");
  }

  return payload.data;
}

export async function fetchInboxThreads(): Promise<InboxThreadSummary[]> {
  const data = await inboxRequest<InboxThreadSummary[]>("/api/mcp/inbox", {
    errorCode: "Failed to load inbox threads",
  });
  return sortThreads(data);
}

export async function fetchInboxThread(threadId: string): Promise<InboxThreadDetail> {
  return inboxRequest<InboxThreadDetail>(`/api/mcp/inbox/${threadId}`, {
    errorCode: "Failed to load inbox thread",
  });
}

export async function updateInboxDraft(
  threadId: string,
  payload: InboxDraftUpdateInput,
): Promise<InboxDraft | null> {
  const data = await inboxRequest<DraftEnvelope>(`/api/mcp/inbox/${threadId}/draft`, {
    method: "PUT",
    body: JSON.stringify(payload),
    errorCode: "Failed to save inbox draft",
  });
  return data.draft;
}

export async function regenerateInboxDraft(
  threadId: string,
  payload: { force?: boolean } = {},
): Promise<InboxDraft | null> {
  const data = await inboxRequest<DraftEnvelope>(`/api/mcp/inbox/${threadId}/draft/regenerate`, {
    method: "POST",
    body: JSON.stringify(payload),
    errorCode: "Failed to regenerate inbox draft",
  });
  return data.draft;
}

export async function sendInboxDraft(threadId: string): Promise<{ sentMessageId: string | null }> {
  return inboxRequest<{ sentMessageId: string | null }>(`/api/mcp/inbox/${threadId}/send`, {
    method: "POST",
    errorCode: "Failed to send inbox draft",
  });
}

export async function resolveInboxThread(threadId: string): Promise<void> {
  await inboxRequest<{ thread: InboxThreadSummary }>(`/api/mcp/inbox/${threadId}/resolve`, {
    method: "POST",
    errorCode: "Failed to resolve inbox thread",
  });
}

export async function dismissInboxThread(threadId: string): Promise<void> {
  await inboxRequest<{ thread: InboxThreadSummary }>(`/api/mcp/inbox/${threadId}/dismiss`, {
    method: "POST",
    errorCode: "Failed to dismiss inbox thread",
  });
}

export async function runInboxSync(rescanWindowDays?: number): Promise<void> {
  await inboxRequest("/api/mcp/inbox-sync", {
    method: "POST",
    body: JSON.stringify(
      typeof rescanWindowDays === "number" ? { rescanWindowDays } : {},
    ),
    errorCode: "Failed to sync inbox",
  });
}

export default function useInbox() {
  const [threads, setThreads] = useState<InboxThreadSummary[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [selectedThread, setSelectedThread] = useState<InboxThreadDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [regeneratingDraft, setRegeneratingDraft] = useState(false);
  const [sendingDraft, setSendingDraft] = useState(false);
  const [resolvingThread, setResolvingThread] = useState(false);
  const [dismissingThread, setDismissingThread] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  const detailCacheRef = useRef<Map<string, InboxThreadDetail>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);
  const selectedThreadIdRef = useRef<string | null>(null);
  selectedThreadIdRef.current = selectedThreadId;

  const refreshThreadDetail = useCallback(async (threadId: string): Promise<InboxThreadDetail> => {
    detailCacheRef.current.delete(threadId);
    const detail = await fetchInboxThread(threadId);
    detailCacheRef.current.set(threadId, detail);
    setSelectedThreadId(threadId);
    setSelectedThread(detail);
    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? detail.thread : t)),
    );
    return detail;
  }, []);

  const selectThread = useCallback(async (threadId: string) => {
    abortControllerRef.current?.abort();

    const cached = detailCacheRef.current.get(threadId);
    if (cached) {
      setSelectedThreadId(threadId);
      setSelectedThread(cached);
      setDetailError(null);
      return cached;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoadingThread(true);
    setDetailError(null);

    try {
      const detail = await fetchInboxThread(threadId);
      if (controller.signal.aborted) return detail;
      detailCacheRef.current.set(threadId, detail);
      setSelectedThreadId(threadId);
      setSelectedThread(detail);
      return detail;
    } catch (error) {
      if (controller.signal.aborted) throw error;
      setSelectedThreadId(threadId);
      setSelectedThread(null);
      setDetailError(error instanceof Error ? error.message : "Failed to load inbox thread");
      throw error;
    } finally {
      if (!controller.signal.aborted) {
        setLoadingThread(false);
      }
    }
  }, []);

  const loadThreads = useCallback(
    async (preferredThreadId?: string | null) => {
      setLoadingList(true);
      setListError(null);

      try {
        const nextThreads = await fetchInboxThreads();
        setThreads(nextThreads);

        const currentId = selectedThreadIdRef.current;
        const targetThreadId = preferredThreadId
          ?? (currentId && nextThreads.some((thread) => thread.id === currentId)
            ? currentId
            : nextThreads[0]?.id ?? null);

        if (targetThreadId) {
          await selectThread(targetThreadId);
        } else {
          setSelectedThreadId(null);
          setSelectedThread(null);
          setDetailError(null);
        }
      } catch (error) {
        setListError(error instanceof Error ? error.message : "Failed to load inbox threads");
        throw error;
      } finally {
        setLoadingList(false);
      }
    },
    [selectThread],
  );

  useEffect(() => {
    void loadThreads(null).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- IDEA-DISPATCH-20260307130300-9040 mount-only effect uses ref for selectedThreadId
  }, []);

  const saveDraft = useCallback(
    async (payload: InboxDraftUpdateInput) => {
      if (!selectedThreadId) {
        throw new Error("No inbox thread selected");
      }

      setSavingDraft(true);
      setDetailError(null);

      try {
        await updateInboxDraft(selectedThreadId, payload);
        await refreshThreadDetail(selectedThreadId);
      } finally {
        setSavingDraft(false);
      }
    },
    [refreshThreadDetail, selectedThreadId],
  );

  const regenerateDraft = useCallback(
    async (force = false) => {
      if (!selectedThreadId) {
        throw new Error("No inbox thread selected");
      }

      setRegeneratingDraft(true);
      setDetailError(null);

      try {
        await regenerateInboxDraft(selectedThreadId, { force });
        await refreshThreadDetail(selectedThreadId);
      } finally {
        setRegeneratingDraft(false);
      }
    },
    [refreshThreadDetail, selectedThreadId],
  );

  const sendDraft = useCallback(async () => {
    if (!selectedThreadId) {
      throw new Error("No inbox thread selected");
    }

    setSendingDraft(true);
    setDetailError(null);

    try {
      const result = await sendInboxDraft(selectedThreadId);
      detailCacheRef.current.delete(selectedThreadId);
      const threadId = selectedThreadId;
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? {
                ...t,
                status: "sent",
                currentDraft: t.currentDraft
                  ? { ...t.currentDraft, status: "sent" }
                  : null,
              }
            : t,
        ),
      );
      if (selectedThread) {
        setSelectedThread({
          ...selectedThread,
          thread: {
            ...selectedThread.thread,
            status: "sent",
            currentDraft: selectedThread.thread.currentDraft
              ? { ...selectedThread.thread.currentDraft, status: "sent" }
              : null,
          },
          currentDraft: selectedThread.currentDraft
            ? { ...selectedThread.currentDraft, status: "sent" }
            : null,
        });
      }
      return result;
    } finally {
      setSendingDraft(false);
    }
  }, [selectedThreadId, selectedThread]);

  const resolveThread = useCallback(async () => {
    if (!selectedThreadId) {
      throw new Error("No inbox thread selected");
    }

    setResolvingThread(true);
    setDetailError(null);

    try {
      await resolveInboxThread(selectedThreadId);
      detailCacheRef.current.delete(selectedThreadId);
      const removedId = selectedThreadId;
      setThreads((prev) => {
        const next = prev.filter((t) => t.id !== removedId);
        const nextSelected = next[0] ?? null;
        if (nextSelected) {
          void selectThread(nextSelected.id).catch(() => undefined);
        } else {
          setSelectedThreadId(null);
          setSelectedThread(null);
          setDetailError(null);
        }
        return next;
      });
    } finally {
      setResolvingThread(false);
    }
  }, [selectThread, selectedThreadId]);

  const dismissThread = useCallback(async () => {
    if (!selectedThreadId) {
      throw new Error("No inbox thread selected");
    }

    setDismissingThread(true);
    setDetailError(null);

    try {
      await dismissInboxThread(selectedThreadId);
      detailCacheRef.current.delete(selectedThreadId);
      const removedId = selectedThreadId;
      setThreads((prev) => {
        const next = prev.filter((t) => t.id !== removedId);
        const nextSelected = next[0] ?? null;
        if (nextSelected) {
          void selectThread(nextSelected.id).catch(() => undefined);
        } else {
          setSelectedThreadId(null);
          setSelectedThread(null);
          setDetailError(null);
        }
        return next;
      });
    } finally {
      setDismissingThread(false);
    }
  }, [selectThread, selectedThreadId]);

  const syncInbox = useCallback(async () => {
    setSyncing(true);
    setListError(null);
    detailCacheRef.current.clear();

    try {
      await runInboxSync();
      await loadThreads(selectedThreadIdRef.current);
    } finally {
      setSyncing(false);
    }
  }, [loadThreads]);

  return {
    threads,
    selectedThreadId,
    selectedThread,
    loadingList,
    loadingThread,
    savingDraft,
    regeneratingDraft,
    sendingDraft,
    resolvingThread,
    dismissingThread,
    syncing,
    listError,
    detailError,
    loadThreads,
    selectThread,
    saveDraft,
    regenerateDraft,
    sendDraft,
    resolveThread,
    dismissThread,
    syncInbox,
  };
}
