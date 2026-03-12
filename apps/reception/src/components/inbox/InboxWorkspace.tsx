"use client";

import { useState } from "react";
import { ArrowLeft, Inbox, RefreshCw } from "lucide-react";

import { Button } from "@acme/design-system/atoms";

import { PageShell } from "@/components/common/PageShell";
import useInbox from "@/services/useInbox";
import { showToast } from "@/utils/toastUtils";

import ThreadDetailPane from "./ThreadDetailPane";
import ThreadList from "./ThreadList";

function countThreadsNeedingManualDraft(
  threads: ReturnType<typeof useInbox>["threads"],
): number {
  return threads.filter((thread) => thread.needsManualDraft).length;
}

function countThreadsReadyToSend(
  threads: ReturnType<typeof useInbox>["threads"],
): number {
  return threads.filter(
    (thread) =>
      thread.capabilities.supportsDraftSend
      && !thread.needsManualDraft
      && (
        thread.currentDraft?.status === "generated"
        || thread.currentDraft?.status === "edited"
        || thread.currentDraft?.status === "suggested"
        || thread.currentDraft?.status === "under_review"
      ),
  ).length;
}

export default function InboxWorkspace() {
  const {
    threads,
    selectedThreadId,
    selectedThread,
    loadingList,
    loadingThread,
    loadingMoreMessages,
    savingDraft,
    regeneratingDraft,
    sendingDraft,
    resolvingThread,
    dismissingThread,
    syncing,
    listError,
    detailError,
    selectThread,
    loadMoreMessages,
    saveDraft,
    regenerateDraft,
    sendDraft,
    resolveThread,
    dismissThread,
    refreshInboxView,
    syncInbox,
  } = useInbox();

  // Mobile view control: show detail pane when a thread is actively opened
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  async function handleSelectThread(threadId: string) {
    try {
      await selectThread(threadId);
      setMobileShowDetail(true);
    } catch {
      showToast("Failed to load thread details", "error");
    }
  }

  async function handleSaveDraft(input: {
    subject?: string;
    recipientEmails?: string[];
    plainText: string;
    html?: string | null;
  }) {
    try {
      await saveDraft(input);
      showToast("Draft saved", "success");
    } catch {
      showToast("Failed to save draft", "error");
      throw new Error("save-failed");
    }
  }

  async function handleRegenerateDraft(force?: boolean) {
    try {
      await regenerateDraft(force);
      showToast("Draft regenerated", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to regenerate draft";
      showToast(message, "error");
      throw error;
    }
  }

  async function handleSendDraft() {
    try {
      await sendDraft();
      showToast("Draft sent", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send draft";
      showToast(message, "error");
      throw error;
    }
  }

  async function handleResolveThread() {
    try {
      await resolveThread();
      showToast("Thread resolved", "success");
      setMobileShowDetail(false);
    } catch {
      showToast("Failed to resolve thread", "error");
      throw new Error("resolve-failed");
    }
  }

  async function handleDismissThread() {
    try {
      const result = await dismissThread();
      showToast("Thread dismissed", "success");
      setMobileShowDetail(false);
      return result;
    } catch {
      showToast("Failed to dismiss thread", "error");
      throw new Error("dismiss-failed");
    }
  }

  async function handleLoadMoreMessages() {
    try {
      await loadMoreMessages();
    } catch {
      showToast("Failed to load earlier messages", "error");
    }
  }

  async function handleSyncInbox() {
    try {
      await syncInbox();
      showToast("Inbox synced", "success");
    } catch {
      showToast("Failed to sync inbox", "error");
    }
  }

  async function handleRefreshInbox() {
    try {
      await refreshInboxView();
      showToast("Inbox refreshed", "success");
    } catch {
      showToast("Failed to refresh inbox", "error");
    }
  }

  const manualDraftCount = countThreadsNeedingManualDraft(threads);
  const readyToSendCount = countThreadsReadyToSend(threads);

  return (
    <PageShell
      title="Inbox"
      headerSlot={(
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-main">
                <Inbox className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-heading font-semibold text-foreground">
                  Inbox
                </h1>
                <p className="text-xs text-muted-foreground">
                  {threads.length} active
                  {manualDraftCount > 0 && (
                    <span className="ml-2 text-warning-main">
                      {manualDraftCount} need draft
                    </span>
                  )}
                  {readyToSendCount > 0 && (
                    <span className="ml-2 text-success-main">
                      {readyToSendCount} ready
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => void handleRefreshInbox()}
                disabled={loadingList}
                color="info"
                tone="outline"
                className="min-h-10 min-w-10 rounded-xl"
              >
                <RefreshCw className={`h-4 w-4 ${loadingList ? "animate-spin" : ""}`} />
                <span className="ml-2 hidden sm:inline">
                  {loadingList ? "Refreshing..." : "Refresh"}
                </span>
              </Button>

              <Button
                type="button"
                onClick={() => void handleSyncInbox()}
                disabled={syncing}
                color="accent"
                tone="outline"
                className="min-h-10 rounded-xl"
              >
                <span className="hidden sm:inline">
                  {syncing ? "Syncing..." : "Sync"}
                </span>
                <span className="sm:hidden">
                  {syncing ? "..." : "Sync"}
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}
    >
      {/* Desktop: side-by-side. Mobile: list OR detail, never both stacked. */}
      <div className="grid gap-4 xl:grid-cols-12">
        {/* Thread list — hidden on mobile when viewing detail */}
        <div className={`space-y-3 xl:col-span-4 ${mobileShowDetail ? "hidden xl:block" : ""}`}>
          <ThreadList
            threads={threads}
            selectedThreadId={selectedThreadId}
            loading={loadingList}
            error={listError}
            onSelect={handleSelectThread}
          />
        </div>

        {/* Thread detail — hidden on mobile when no thread opened */}
        <div className={`xl:col-span-8 ${mobileShowDetail ? "" : "hidden xl:block"}`}>
          {/* Mobile back button */}
          {mobileShowDetail && (
            <div className="mb-3 xl:hidden">
              <button
                type="button"
                onClick={() => setMobileShowDetail(false)}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-surface-2 hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to inbox
              </button>
            </div>
          )}

          <ThreadDetailPane
            threadDetail={selectedThread}
            loading={loadingThread}
            error={detailError}
            loadingMoreMessages={loadingMoreMessages}
            savingDraft={savingDraft}
            regeneratingDraft={regeneratingDraft}
            sendingDraft={sendingDraft}
            resolvingThread={resolvingThread}
            dismissingThread={dismissingThread}
            onLoadMoreMessages={handleLoadMoreMessages}
            onSaveDraft={handleSaveDraft}
            onRegenerateDraft={handleRegenerateDraft}
            onSendDraft={handleSendDraft}
            onResolveThread={handleResolveThread}
            onDismissThread={handleDismissThread}
          />
        </div>
      </div>
    </PageShell>
  );
}
