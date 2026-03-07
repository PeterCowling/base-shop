"use client";

import { useCallback, useEffect, useState } from "react";

import { buildMcpAuthHeaders } from "./mcpAuthHeaders";

export type InboxDraft = {
  id: string;
  threadId: string;
  gmailDraftId: string | null;
  status: "generated" | "edited" | "approved" | "sent";
  subject: string | null;
  recipientEmails: string[];
  plainText: string;
  html: string | null;
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
  subject: string | null;
  snippet: string | null;
  latestMessageAt: string | null;
  lastSyncedAt: string | null;
  updatedAt: string;
  needsManualDraft: boolean;
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

  const loadThread = useCallback(async (threadId: string) => {
    setLoadingThread(true);
    setDetailError(null);

    try {
      const detail = await fetchInboxThread(threadId);
      setSelectedThreadId(threadId);
      setSelectedThread(detail);
      return detail;
    } catch (error) {
      setSelectedThreadId(threadId);
      setSelectedThread(null);
      setDetailError(error instanceof Error ? error.message : "Failed to load inbox thread");
      throw error;
    } finally {
      setLoadingThread(false);
    }
  }, []);

  const loadThreads = useCallback(
    async (preferredThreadId?: string | null) => {
      setLoadingList(true);
      setListError(null);

      try {
        const nextThreads = await fetchInboxThreads();
        setThreads(nextThreads);

        const targetThreadId = preferredThreadId
          ?? (selectedThreadId && nextThreads.some((thread) => thread.id === selectedThreadId)
            ? selectedThreadId
            : nextThreads[0]?.id ?? null);

        if (targetThreadId) {
          await loadThread(targetThreadId);
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
    [loadThread, selectedThreadId],
  );

  useEffect(() => {
    void loadThreads(null).catch(() => undefined);
  }, [loadThreads]);

  const saveDraft = useCallback(
    async (payload: InboxDraftUpdateInput) => {
      if (!selectedThreadId) {
        throw new Error("No inbox thread selected");
      }

      setSavingDraft(true);
      setDetailError(null);

      try {
        await updateInboxDraft(selectedThreadId, payload);
        await loadThreads(selectedThreadId);
      } finally {
        setSavingDraft(false);
      }
    },
    [loadThreads, selectedThreadId],
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
        await loadThreads(selectedThreadId);
      } finally {
        setRegeneratingDraft(false);
      }
    },
    [loadThreads, selectedThreadId],
  );

  const sendDraft = useCallback(async () => {
    if (!selectedThreadId) {
      throw new Error("No inbox thread selected");
    }

    setSendingDraft(true);
    setDetailError(null);

    try {
      const result = await sendInboxDraft(selectedThreadId);
      await loadThreads(selectedThreadId);
      return result;
    } finally {
      setSendingDraft(false);
    }
  }, [loadThreads, selectedThreadId]);

  const resolveThread = useCallback(async () => {
    if (!selectedThreadId) {
      throw new Error("No inbox thread selected");
    }

    setResolvingThread(true);
    setDetailError(null);

    try {
      await resolveInboxThread(selectedThreadId);
      await loadThreads(null);
    } finally {
      setResolvingThread(false);
    }
  }, [loadThreads, selectedThreadId]);

  const dismissThread = useCallback(async () => {
    if (!selectedThreadId) {
      throw new Error("No inbox thread selected");
    }

    setDismissingThread(true);
    setDetailError(null);

    try {
      await dismissInboxThread(selectedThreadId);
      await loadThreads(null);
    } finally {
      setDismissingThread(false);
    }
  }, [loadThreads, selectedThreadId]);

  const syncInbox = useCallback(async () => {
    setSyncing(true);
    setListError(null);

    try {
      await runInboxSync();
      await loadThreads(selectedThreadId);
    } finally {
      setSyncing(false);
    }
  }, [loadThreads, selectedThreadId]);

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
    selectThread: loadThread,
    saveDraft,
    regenerateDraft,
    sendDraft,
    resolveThread,
    dismissThread,
    syncInbox,
  };
}
