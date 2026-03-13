"use client";

import { useState } from "react";
import { ArrowLeft, Inbox, Mail, MessageSquare, RefreshCw } from "lucide-react";

import { Button } from "@acme/design-system/atoms";

import { PageShell } from "@/components/common/PageShell";
import useInbox from "@/services/useInbox";
import { showToast } from "@/utils/toastUtils";

import AnalyticsSummary from "./AnalyticsSummary";
import EmailColumn from "./EmailColumn";
import InboxErrorBoundary from "./InboxErrorBoundary";
import PrimeColumn from "./PrimeColumn";
import ThreadDetailPane from "./ThreadDetailPane";

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

type MobileTab = "email" | "prime";

export default function InboxWorkspace() {
  const {
    threads,
    selectedEmailThreadId,
    selectedPrimeThreadId,
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
    selectEmailThread,
    selectPrimeThread,
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
  const [mobileActiveTab, setMobileActiveTab] = useState<MobileTab>("email");
  const [analyticsRefreshKey, setAnalyticsRefreshKey] = useState(0);

  async function handleSelectEmailThread(threadId: string) {
    try {
      await selectEmailThread(threadId);
      setMobileShowDetail(true);
    } catch {
      showToast("Failed to load thread details", "error");
    }
  }

  async function handleSelectPrimeThread(threadId: string) {
    try {
      await selectPrimeThread(threadId);
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
      setAnalyticsRefreshKey((k) => k + 1);
      showToast("Inbox synced", "success");
    } catch {
      showToast("Failed to sync inbox", "error");
    }
  }

  async function handleRefreshInbox() {
    try {
      await refreshInboxView();
      setAnalyticsRefreshKey((k) => k + 1);
      showToast("Inbox refreshed", "success");
    } catch {
      showToast("Failed to refresh inbox", "error");
    }
  }

  const manualDraftCount = countThreadsNeedingManualDraft(threads);
  const readyToSendCount = countThreadsReadyToSend(threads);

  const detailPane = (
    <InboxErrorBoundary>
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
    </InboxErrorBoundary>
  );

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
          <AnalyticsSummary refreshKey={analyticsRefreshKey} />
        </div>
      )}
    >
      {/*
        Desktop (xl+): Three-column grid — Email | Detail | Prime (3-6-3)
        Mobile: Tab strip + single visible column list OR detail pane (never both)
      */}

      {/* ── Mobile layout ─────────────────────────────────────────────── */}
      <div className="xl:hidden">
        {mobileShowDetail ? (
          /* Mobile detail view */
          <div>
            <div className="mb-3">
              <Button
                type="button"
                color="default"
                tone="ghost"
                onClick={() => setMobileShowDetail(false)}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to {mobileActiveTab === "email" ? "Email" : "Prime"}
              </Button>
            </div>
            {detailPane}
          </div>
        ) : (
          /* Mobile list view with tab strip */
          <div className="space-y-3">
            {/* Tab strip */}
            <div className="flex gap-1 rounded-xl border border-border-1 bg-surface-2 p-1">
              <Button
                type="button"
                color="default"
                tone={mobileActiveTab === "email" ? "outline" : "ghost"}
                onClick={() => setMobileActiveTab("email")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                  mobileActiveTab === "email"
                    ? "bg-surface-elevated text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>
              <Button
                type="button"
                color="default"
                tone={mobileActiveTab === "prime" ? "outline" : "ghost"}
                onClick={() => setMobileActiveTab("prime")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                  mobileActiveTab === "prime"
                    ? "bg-surface-elevated text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                Prime
              </Button>
            </div>

            {/* Active channel list */}
            {mobileActiveTab === "email" ? (
              <EmailColumn
                threads={threads}
                selectedThreadId={selectedEmailThreadId}
                loading={loadingList}
                error={listError}
                onSelect={handleSelectEmailThread}
              />
            ) : (
              <PrimeColumn
                threads={threads}
                selectedThreadId={selectedPrimeThreadId}
                loading={loadingList}
                error={listError}
                onSelect={handleSelectPrimeThread}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Desktop layout (xl+) ──────────────────────────────────────── */}
      <div className="hidden xl:grid xl:grid-cols-12 xl:gap-4">
        {/* Email thread list — 3/12 */}
        <div className="xl:col-span-3">
          <EmailColumn
            threads={threads}
            selectedThreadId={selectedEmailThreadId}
            loading={loadingList}
            error={listError}
            onSelect={handleSelectEmailThread}
          />
        </div>

        {/* Thread detail / reply pane — 6/12 */}
        <div className="xl:col-span-6">
          {detailPane}
        </div>

        {/* Prime messaging — 3/12 */}
        <div className="xl:col-span-3">
          <PrimeColumn
            threads={threads}
            selectedThreadId={selectedPrimeThreadId}
            loading={loadingList}
            error={listError}
            onSelect={handleSelectPrimeThread}
          />
        </div>
      </div>
    </PageShell>
  );
}
