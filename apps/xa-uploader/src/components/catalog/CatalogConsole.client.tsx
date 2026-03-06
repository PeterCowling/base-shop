"use client";

import * as React from "react";

import { deriveCatalogPublishState, isCatalogPublishableState } from "@acme/lib/xa";

import { useUploaderI18n } from "../../lib/uploaderI18n.client";

import { CatalogLoginForm } from "./CatalogLoginForm.client";
import { CatalogProductForm } from "./CatalogProductForm.client";
import { SKELETON_BLOCK_CLASS } from "./catalogStyles";
import { CatalogSyncPanel } from "./CatalogSyncPanel.client";
import { CurrencyRatesPanel } from "./CurrencyRatesPanel.client";
import { EditProductFilterSelector } from "./EditProductFilterSelector.client";
import { useCatalogConsole } from "./useCatalogConsole.client";

type CatalogConsoleProps = {
  monoClassName?: string;
  onHeaderExtra?: (node: React.ReactNode) => void;
};

function ConsoleSkeletonPlaceholder({ srText }: { srText: string }) {
  return (
    /* eslint-disable-next-line ds/no-arbitrary-tailwind -- XAUP-0001 operator-tool layout */
    <div className="grid gap-6 sm:grid-cols-[240px_1fr]" aria-busy="true">
      <span className="sr-only">{srText}</span>
      {/* Sidebar skeleton */}
      <div className="space-y-3">
        <div className={`h-9 w-full ${SKELETON_BLOCK_CLASS}`} />
        <div className={`h-4 w-3/4 ${SKELETON_BLOCK_CLASS}`} />
        <div className={`h-9 w-full ${SKELETON_BLOCK_CLASS}`} />
        <div className={`h-9 w-full ${SKELETON_BLOCK_CLASS}`} />
      </div>
      {/* Form panel skeleton */}
      <div className="space-y-4">
        <div className={`h-6 w-1/3 ${SKELETON_BLOCK_CLASS}`} />
        <div className={`h-9 w-full ${SKELETON_BLOCK_CLASS}`} />
        <div className={`h-9 w-full ${SKELETON_BLOCK_CLASS}`} />
        <div className={`h-24 w-full ${SKELETON_BLOCK_CLASS}`} />
      </div>
    </div>
  );
}

type ConsoleScreen = "catalog" | "currency";
type ConsoleState = ReturnType<typeof useCatalogConsole>;
type Translator = ReturnType<typeof useUploaderI18n>["t"];

function ProductEditor({
  state,
  monoClassName,
}: {
  state: ConsoleState;
  monoClassName?: string;
}) {
  return (
    <CatalogProductForm
      selectedSlug={state.selectedSlug}
      draft={state.draft}
      storefront={state.storefront}
      fieldErrors={state.fieldErrors}
      monoClassName={monoClassName}
      busy={state.busy}
      autosaveInlineMessage={state.autosaveInlineMessage}
      autosaveStatus={state.autosaveStatus}
      lastAutosaveSavedAt={state.lastAutosaveSavedAt}
      feedback={state.actionFeedback.draft}
      onChangeDraft={state.setDraft}
      onSave={state.handleSave}
      onSavedFeedback={state.handleSaveAdvanceFeedback}
      onSaveWithDraft={state.handleSaveWithDraft}
      onDelete={state.handleDelete}
    />
  );
}

function CurrencyScreen({
  state,
  monoClassName,
  t,
}: {
  state: ConsoleState;
  monoClassName?: string;
  t: Translator;
}) {
  const publishReadiness = React.useMemo(() => {
    const total = state.products.length;
    let publishable = 0;
    for (const product of state.products) {
      if (isCatalogPublishableState(deriveCatalogPublishState(product))) {
        publishable += 1;
      }
    }
    return {
      total,
      publishable,
      draft: Math.max(0, total - publishable),
    };
  }, [state.products]);

  if (state.uploaderMode !== "internal") return null;
  const showCurrencyRates = state.syncReadiness.mode === "local";
  return (
    <div className="space-y-6">
      {showCurrencyRates ? (
        <>
          <div className="text-sm text-gate-muted">{t("screenCurrencyHint")}</div>
          <CurrencyRatesPanel
            busy={state.busy}
            syncReadiness={state.syncReadiness}
            onSync={state.handleSync}
          />
        </>
      ) : null}
      <CatalogSyncPanel
        busy={state.busy}
        syncOptions={state.syncOptions}
        syncReadiness={state.syncReadiness}
        isAutosaveDirty={state.isAutosaveDirty || state.isAutosaveSaving}
        monoClassName={monoClassName}
        feedback={state.actionFeedback.sync}
        syncOutput={state.syncOutput}
        lastSyncData={state.lastSyncData}
        publishReadiness={publishReadiness}
        onSync={state.handleSync}
        onRefreshReadiness={state.refreshSyncReadiness}
        onChangeSyncOptions={state.setSyncOptions}
      />
    </div>
  );
}

function ConsoleBody({
  screen,
  state,
  monoClassName,
  t,
}: {
  screen: ConsoleScreen;
  state: ConsoleState;
  monoClassName?: string;
  t: Translator;
}) {
  if (screen === "currency") return <CurrencyScreen state={state} monoClassName={monoClassName} t={t} />;
  return (
    /* eslint-disable-next-line ds/no-arbitrary-tailwind -- XAUP-0001 operator-tool layout */
    <div className="grid gap-6 sm:grid-cols-[240px_1fr]">
      <EditProductFilterSelector
        products={state.products}
        isLoading={state.isCatalogLoading}
        onSelect={state.handleSelect}
        onNew={state.handleNew}
      />

      <div className="space-y-6">
        <ProductEditor state={state} monoClassName={monoClassName} />
      </div>
    </div>
  );
}

export default function CatalogConsole({ monoClassName, onHeaderExtra }: CatalogConsoleProps) {
  const { t } = useUploaderI18n();
  const state = useCatalogConsole();
  const [screen, setScreen] = React.useState<ConsoleScreen>("catalog");

  const openCurrencyScreen = React.useCallback(() => {
    setScreen("currency");
  }, []);
  const openCatalogScreen = React.useCallback(() => {
    setScreen("catalog");
  }, []);

  const showCurrency = state.session?.authenticated && state.uploaderMode === "internal";
  const currencyHeaderLabel =
    state.syncReadiness.mode === "local" ? t("screenCurrencyRates") : t("screenSync");
  React.useEffect(() => {
    if (!onHeaderExtra) return;
    if (!showCurrency) {
      onHeaderExtra(null);
      return;
    }
    onHeaderExtra(
      <button
        type="button"
        onClick={screen === "currency" ? openCatalogScreen : openCurrencyScreen}
        className={`rounded-md border px-3 py-2 text-2xs uppercase tracking-label-lg transition ${
          screen === "currency"
            ? "border-gate-accent text-gate-accent"
            : "border-gate-header-border text-gate-header-muted hover:text-gate-header-fg"
        }`}
      >
        {currencyHeaderLabel}
      </button>,
    );
  }, [currencyHeaderLabel, onHeaderExtra, showCurrency, screen, openCurrencyScreen, openCatalogScreen, t]);

  if (state.session === null) {
    return <ConsoleSkeletonPlaceholder srText={t("checkingConsoleAccess")} />;
  }
  if (!state.session.authenticated) {
    return (
      <CatalogLoginForm
        token={state.token}
        busy={state.busy}
        feedback={state.actionFeedback.login}
        onTokenChange={state.setToken}
        onSubmit={state.handleLogin}
      />
    );
  }

  return (
    <div className="space-y-6">
      {state.actionFeedback.login ? (
        <p
          role={state.actionFeedback.login.kind === "error" ? "alert" : "status"}
          className={state.actionFeedback.login.kind === "error" ? "text-sm text-danger-fg" : "text-sm text-success-fg"}
        >
          {state.actionFeedback.login.message}
        </p>
      ) : null}

      <ConsoleBody screen={screen} state={state} monoClassName={monoClassName} t={t} />
    </div>
  );
}
