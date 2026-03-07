"use client";

import * as React from "react";

import { useUploaderI18n } from "../../lib/uploaderI18n.client";

import { CatalogLoginForm } from "./CatalogLoginForm.client";
import { CatalogProductForm } from "./CatalogProductForm.client";
import { SKELETON_BLOCK_CLASS } from "./catalogStyles";
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
    <div className="grid gap-6 sm:grid-cols-[280px_1fr]" aria-busy="true">
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
      onPublish={state.handlePublish}
      onMarkOutOfStock={() => {
        const nextDraft = { ...state.draft, publishState: "out_of_stock" as const };
        state.setDraft(nextDraft);
        void state.handleSaveWithDraft(nextDraft);
      }}
    />
  );
}

function CurrencyScreen({
  state,
  t,
}: {
  state: ConsoleState;
  t: Translator;
}) {
  if (state.uploaderMode !== "internal") return null;
  return (
    <div className="space-y-6">
      <div className="text-sm text-gate-muted">{t("screenCurrencyHint")}</div>
      <CurrencyRatesPanel
        busy={state.busy}
        syncReadiness={state.syncReadiness}
        onSync={state.handleSync}
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
  if (screen === "currency") return <CurrencyScreen state={state} t={t} />;
  return (
    /* eslint-disable-next-line ds/no-arbitrary-tailwind -- XAUP-0001 operator-tool layout */
    <div className="grid gap-6 sm:grid-cols-[280px_1fr]">
      <aside className="rounded-xl border border-gate-border bg-gate-surface p-4 shadow-elevation-2">
        <EditProductFilterSelector
          products={state.products}
          isLoading={state.isCatalogLoading}
          onSelect={state.handleSelect}
          onNew={state.handleNew}
        />
      </aside>

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
  const currencyHeaderLabel = t("screenCurrencyRates");
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
