"use client";

/* eslint-disable ds/no-raw-typography, ds/no-arbitrary-tailwind, ds/min-tap-size -- XAUP-0001 [ttl=2026-12-31] Gate UI pending design token refactor */

import { useUploaderI18n } from "../../lib/uploaderI18n.client";

import { CatalogLoginForm } from "./CatalogLoginForm.client";
import { CatalogProductForm } from "./CatalogProductForm.client";
import { CatalogProductsList } from "./CatalogProductsList.client";
import { CatalogSubmissionPanel } from "./CatalogSubmissionPanel.client";
import { CatalogSyncPanel } from "./CatalogSyncPanel.client";
import { useCatalogConsole } from "./useCatalogConsole.client";

type CatalogConsoleProps = {
  monoClassName?: string;
};

export default function CatalogConsole({ monoClassName }: CatalogConsoleProps) {
  const { t } = useUploaderI18n();
  const consoleState = useCatalogConsole();

  if (consoleState.session === null) {
    return (
      <div className="text-sm text-[color:var(--gate-muted)]">
        {t("checkingConsoleAccess")}
      </div>
    );
  }

  if (!consoleState.session.authenticated) {
    return (
      <CatalogLoginForm
        token={consoleState.token}
        busy={consoleState.busy}
        error={consoleState.error}
        onTokenChange={consoleState.setToken}
        onSubmit={consoleState.handleLogin}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
            {t("consoleActive")}
          </div>
          <label className="block text-[10px] uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
            {t("storefrontLabel")}
          </label>
          <select
            value={consoleState.storefront}
            onChange={(event) =>
              consoleState.handleStorefrontChange(
                event.target.value as typeof consoleState.storefront,
              )
            }
            disabled={consoleState.busy}
            className="rounded-md border border-border-2 bg-transparent px-3 py-2 text-xs uppercase tracking-[0.2em] text-[color:var(--gate-ink)]"
          >
            {consoleState.storefronts.map((storefront) => (
              <option key={storefront.id} value={storefront.id}>
                {t(storefront.labelKey)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => consoleState.loadCatalog().catch(() => null)}
            className="rounded-md border border-border-2 px-4 py-2 text-xs uppercase tracking-[0.3em] text-[color:var(--gate-ink)] transition hover:underline"
          >
            {t("refresh")}
          </button>
          {consoleState.uploaderMode === "internal" ? (
            <button
              type="button"
              onClick={consoleState.handleLogout}
              className="rounded-md border border-border-2 px-4 py-2 text-xs uppercase tracking-[0.3em] text-[color:var(--gate-ink)] transition hover:underline"
            >
              {t("exitConsole")}
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <CatalogProductsList
          products={consoleState.products}
          query={consoleState.query}
          selectedSlug={consoleState.selectedSlug}
          submissionSlugs={consoleState.submissionSlugs}
          submissionMax={consoleState.submissionMax}
          monoClassName={monoClassName}
          onQueryChange={consoleState.setQuery}
          onSelect={consoleState.handleSelect}
          onToggleSubmissionSlug={consoleState.handleToggleSubmissionSlug}
          onNew={consoleState.handleNew}
        />

        <div className="space-y-6">
          <CatalogProductForm
            selectedSlug={consoleState.selectedSlug}
            draft={consoleState.draft}
            fieldErrors={consoleState.fieldErrors}
            monoClassName={monoClassName}
            busy={consoleState.busy}
            error={consoleState.error}
            onChangeDraft={consoleState.setDraft}
            onSave={consoleState.handleSave}
            onDelete={consoleState.handleDelete}
          />

          <CatalogSubmissionPanel
            busy={consoleState.busy}
            submissionAction={consoleState.submissionAction}
            selectedCount={consoleState.submissionSlugs.size}
            maxProducts={consoleState.submissionMax}
            maxBytes={consoleState.submissionMaxBytes}
            minImageEdge={consoleState.minImageEdge}
            r2Destination={consoleState.r2Destination}
            uploadUrl={consoleState.submissionUploadUrl}
            submissionStatus={consoleState.submissionStatus}
            onUploadUrlChange={consoleState.setSubmissionUploadUrl}
            onUploadToR2={consoleState.handleUploadSubmissionToR2}
            onExport={consoleState.handleExportSubmission}
            onClear={consoleState.handleClearSubmission}
          />

          {consoleState.uploaderMode === "internal" ? (
            <CatalogSyncPanel
              busy={consoleState.busy}
              syncOptions={consoleState.syncOptions}
              monoClassName={monoClassName}
              syncOutput={consoleState.syncOutput}
              onSync={consoleState.handleSync}
              onChangeSyncOptions={consoleState.setSyncOptions}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
