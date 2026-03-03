"use client";

import * as React from "react";

import { useUploaderI18n } from "../../lib/uploaderI18n.client";

import { CatalogLoginForm } from "./CatalogLoginForm.client";
import { CatalogProductForm } from "./CatalogProductForm.client";
import { CatalogProductsList } from "./CatalogProductsList.client";
import { BTN_PRIMARY_CLASS } from "./catalogStyles";
import { CatalogSyncPanel } from "./CatalogSyncPanel.client";
import { CurrencyRatesPanel } from "./CurrencyRatesPanel.client";
import { useCatalogConsole } from "./useCatalogConsole.client";

type CatalogConsoleProps = {
  monoClassName?: string;
};

type ConsoleScreen = "new" | "revise" | "currency";
type ConsoleState = ReturnType<typeof useCatalogConsole>;
type Translator = ReturnType<typeof useUploaderI18n>["t"];

function ConsoleHeader({
  storefront,
  storefronts,
  onStorefrontChange,
  onLogout,
  busy,
  t,
}: {
  storefront: string;
  storefronts: ConsoleState["storefronts"];
  onStorefrontChange: ConsoleState["handleStorefrontChange"];
  onLogout: () => void;
  busy: boolean;
  t: Translator;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border-2 px-4 py-2">
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gate-muted">{t("storefrontLabel")}:</span>
        {storefronts.length > 1 ? (
          <select
            value={storefront}
            onChange={(e) => onStorefrontChange(e.target.value as Parameters<typeof onStorefrontChange>[0])}
            className="rounded border border-border-2 bg-transparent px-2 py-1 text-sm text-gate-ink"
          >
            {storefronts.map((sf) => (
              <option key={sf.id} value={sf.id}>
                {t(sf.labelKey)}
              </option>
            ))}
          </select>
        ) : (
          <span className="font-medium text-gate-ink">{t(storefronts[0]?.labelKey ?? "")}</span>
        )}
      </div>
      <button
        type="button"
        onClick={onLogout}
        disabled={busy}
        className="size-10 rounded border border-border-2 px-3 py-1.5 text-xs text-gate-muted transition-colors hover:border-gate-ink hover:text-gate-ink"
      >
        {t("exitConsole")}
      </button>
    </div>
  );
}

function ScreenTabs({
  screen,
  onNew,
  onRevise,
  onCurrency,
  showCurrency,
  busy,
  onSave,
  t,
}: {
  screen: ConsoleScreen;
  onNew: () => void;
  onRevise: () => void;
  onCurrency: () => void;
  showCurrency: boolean;
  busy: boolean;
  onSave: () => void;
  t: Translator;
}) {
  const tabClass = (active: boolean) =>
    `border-b-2 px-4 py-2.5 text-xs uppercase tracking-label transition-colors ${
      active
        ? "border-gate-accent text-gate-accent font-semibold"
        : "border-transparent text-gate-muted hover:text-gate-ink hover:border-gate-ink/20"
    }`;
  return (
    <div className="flex items-center border-b border-border-2">
      <button type="button" onClick={onNew} className={tabClass(screen === "new")}>
        {t("screenNewProduct")}
      </button>
      <button type="button" onClick={onRevise} className={tabClass(screen === "revise")}>
        {t("screenReviseExisting")}
      </button>
      {showCurrency ? (
        <button type="button" onClick={onCurrency} className={tabClass(screen === "currency")}>
          {t("screenCurrencyRates")}
        </button>
      ) : null}
      {screen === "currency" ? null : (
        <button
          type="button"
          onClick={onSave}
          disabled={busy}
          className={`${BTN_PRIMARY_CLASS} ms-auto`}
          // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
          data-testid="catalog-save-details"
        >
          {busy ? t("saving") : t("saveDetails")}
        </button>
      )}
    </div>
  );
}

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
      fieldErrors={state.fieldErrors}
      monoClassName={monoClassName}
      busy={state.busy}
      feedback={state.actionFeedback.draft}
      onChangeDraft={state.setDraft}
      onSave={state.handleSave}
      onDelete={state.handleDelete}
    />
  );
}

function ReviseScreen({
  state,
  monoClassName,
}: {
  state: ConsoleState;
  monoClassName?: string;
}) {
  return (
    <>
      {/* eslint-disable-next-line ds/no-arbitrary-tailwind -- XAUP-0001 operator-tool layout */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <CatalogProductsList
          products={state.products}
          query={state.query}
          selectedSlug={state.selectedSlug}
          monoClassName={monoClassName}
          onQueryChange={state.setQuery}
          onSelect={state.handleSelect}
          onNew={state.handleNew}
        />

        <div className="space-y-6">
          <ProductEditor state={state} monoClassName={monoClassName} />
        </div>
      </div>
    </>
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
  if (state.uploaderMode !== "internal") return null;
  return (
    <div className="space-y-6">
      <div className="text-sm text-gate-muted">{t("screenCurrencyHint")}</div>
      <CurrencyRatesPanel
        busy={state.busy}
        syncReadiness={state.syncReadiness}
        onSync={() => void state.handleSync()}
      />
      <CatalogSyncPanel
        busy={state.busy}
        syncOptions={state.syncOptions}
        syncReadiness={state.syncReadiness}
        monoClassName={monoClassName}
        feedback={state.actionFeedback.sync}
        syncOutput={state.syncOutput}
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
  if (screen === "revise") return <ReviseScreen state={state} monoClassName={monoClassName} />;
  if (screen === "currency") return <CurrencyScreen state={state} monoClassName={monoClassName} t={t} />;
  return (
    <div className="space-y-6">
      <ProductEditor state={state} monoClassName={monoClassName} />
    </div>
  );
}

export default function CatalogConsole({ monoClassName }: CatalogConsoleProps) {
  const { t } = useUploaderI18n();
  const state = useCatalogConsole();
  const [screen, setScreen] = React.useState<ConsoleScreen>("new");

  const openNewScreen = React.useCallback(() => {
    setScreen("new");
    state.handleNew();
  }, [state]);
  const openReviseScreen = React.useCallback(() => {
    setScreen("revise");
    void state.loadCatalog().catch(() => null);
  }, [state]);
  const openCurrencyScreen = React.useCallback(() => {
    setScreen("currency");
  }, []);

  if (state.session === null) {
    return <div className="text-sm text-gate-muted">{t("checkingConsoleAccess")}</div>;
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
      {/* Console chrome: header + tabs */}
      <div className="space-y-0">
        <ConsoleHeader
          storefront={state.storefront}
          storefronts={state.storefronts}
          onStorefrontChange={state.handleStorefrontChange}
          onLogout={() => void state.handleLogout()}
          busy={state.busy}
          t={t}
        />
        <ScreenTabs
          screen={screen}
          onNew={openNewScreen}
          onRevise={openReviseScreen}
          onCurrency={openCurrencyScreen}
          showCurrency={state.uploaderMode === "internal"}
          busy={state.busy}
          onSave={state.handleSave}
          t={t}
        />
      </div>

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
