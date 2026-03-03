"use client";

import * as React from "react";

import { useUploaderI18n } from "../../lib/uploaderI18n.client";

import { BTN_SECONDARY_CLASS } from "./catalogStyles";
import type { ActionFeedback } from "./useCatalogConsole.client";

export function CatalogLoginForm({
  token,
  busy,
  feedback,
  onTokenChange,
  onSubmit,
}: {
  token: string;
  busy: boolean;
  feedback: ActionFeedback | null;
  onTokenChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const { t } = useUploaderI18n();
  const tokenInputId = React.useId();
  const tokenInputRef = React.useRef<HTMLInputElement | null>(null);
  const [tokenVisible, setTokenVisible] = React.useState(false);

  React.useEffect(() => {
    if (feedback?.kind === "error") {
      tokenInputRef.current?.focus();
    }
  }, [feedback?.kind]);

  return (
    <div className="space-y-6">
      <div className="text-sm text-gate-muted">
        {t("loginIntro")}
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <label
          htmlFor={tokenInputId}
          className="block text-xs uppercase tracking-label text-gate-muted"
        >
          {t("loginTokenLabel")}
          <div className="mt-2 flex items-center gap-2">
            <input
              id={tokenInputId}
              ref={tokenInputRef}
              value={token}
              onChange={(event) => onTokenChange(event.target.value)}
              className="w-full rounded-md border border-border-2 bg-gate-input px-3 py-3 text-sm text-gate-ink placeholder:text-gate-muted transition-colors focus:border-gate-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-gate-accent/30 focus-visible:ring-offset-1"
              type={tokenVisible ? "text" : "password"}
              autoComplete="off"
              autoFocus
              aria-invalid={feedback?.kind === "error"}
              // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
              data-testid="catalog-login-token"
            />
            <button
              type="button"
              onClick={() => setTokenVisible((prev) => !prev)}
               
              className={BTN_SECONDARY_CLASS}
              aria-label={tokenVisible ? t("loginHideToken") : t("loginShowToken")}
              // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
              data-testid="catalog-login-toggle-visibility"
            >
              {tokenVisible ? t("loginHideToken") : t("loginShowToken")}
            </button>
          </div>
        </label>
        <button
          type="submit"
          disabled={busy}
          // eslint-disable-next-line ds/min-tap-size, ds/enforce-layout-primitives -- XAUP-0001 operator-desktop-tool
          className="inline-flex items-center gap-2 rounded-md bg-gate-accent px-4 py-2.5 text-sm font-semibold text-gate-on-accent transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gate-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
          data-testid="catalog-login-submit"
        >
          {busy ? t("loginButtonBusy") : t("loginButtonIdle")}
        </button>
        {feedback ? (
          <div
            role={feedback.kind === "error" ? "alert" : "status"}
            aria-live={feedback.kind === "error" ? "assertive" : "polite"}
            className={feedback.kind === "error" ? "text-sm text-danger-fg" : "text-sm text-success-fg"}
            // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
            data-testid="catalog-login-feedback"
          >
            {feedback.message}
          </div>
        ) : null}
      </form>
    </div>
  );
}
