"use client";

import { Inbox, RefreshCw, Send, Sparkles, TriangleAlert } from "lucide-react";

import { Button } from "@acme/design-system/atoms";
import { Cluster } from "@acme/design-system/primitives";

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
      !thread.needsManualDraft
      && (thread.currentDraft?.status === "generated" || thread.currentDraft?.status === "edited"),
  ).length;
}

export default function InboxWorkspace() {
  const {
    threads,
    selectedThreadId,
    selectedThread,
    loadingList,
    loadingThread,
    savingDraft,
    regeneratingDraft,
    sendingDraft,
    resolvingThread,
    syncing,
    listError,
    detailError,
    selectThread,
    saveDraft,
    regenerateDraft,
    sendDraft,
    resolveThread,
    syncInbox,
  } = useInbox();

  async function handleSelectThread(threadId: string) {
    try {
      await selectThread(threadId);
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
    } catch {
      showToast("Failed to resolve thread", "error");
      throw new Error("resolve-failed");
    }
  }

  async function handleSyncInbox() {
    try {
      await syncInbox();
      showToast("Inbox refreshed", "success");
    } catch {
      showToast("Failed to refresh inbox", "error");
    }
  }

  return (
    <PageShell
      title="Inbox"
      headerSlot={(
        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-main">
                <Inbox className="h-4 w-4" />
                Reception inbox
              </div>
              <h1 className="text-3xl font-heading font-semibold text-foreground">
                Review admitted guest emails without leaving reception
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Actionable Gmail threads sync into D1, generate staff-review drafts, and stay auditable through send and resolve.
              </p>
            </div>

            <Cluster gap={2}>
              <Button
                type="button"
                onClick={() => void handleSyncInbox()}
                disabled={syncing}
                color="info"
                tone="solid"
                className="min-h-11 min-w-11"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {syncing ? "Refreshing..." : "Refresh inbox"}
              </Button>
            </Cluster>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-border-1 bg-surface px-4 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Active threads
              </p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{threads.length}</p>
            </div>
            <div className="rounded-2xl border border-border-1 bg-surface px-4 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Needs manual draft
              </p>
              <div className="mt-2 flex items-center gap-2">
                <TriangleAlert className="h-5 w-5 text-warning-main" />
                <p className="text-3xl font-semibold text-foreground">
                  {countThreadsNeedingManualDraft(threads)}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-border-1 bg-surface px-4 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Ready to send
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Send className="h-5 w-5 text-success-main" />
                <p className="text-3xl font-semibold text-foreground">
                  {countThreadsReadyToSend(threads)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    >
      <div className="grid gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-4">
          <ThreadList
            threads={threads}
            selectedThreadId={selectedThreadId}
            loading={loadingList}
            error={listError}
            onSelect={handleSelectThread}
          />

          <div className="rounded-2xl border border-border-1 bg-surface px-4 py-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-surface-2 p-2 text-primary-main">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Draft-first workflow
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Save changes before sending. Regenerate creates a fresh agent draft and resolve removes a thread from the active queue.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-8">
          <ThreadDetailPane
            threadDetail={selectedThread}
            loading={loadingThread}
            error={detailError}
            savingDraft={savingDraft}
            regeneratingDraft={regeneratingDraft}
            sendingDraft={sendingDraft}
            resolvingThread={resolvingThread}
            onSaveDraft={handleSaveDraft}
            onRegenerateDraft={handleRegenerateDraft}
            onSendDraft={handleSendDraft}
            onResolveThread={handleResolveThread}
          />
        </div>
      </div>
    </PageShell>
  );
}
