"use client";

/* eslint-disable ds/no-raw-typography, ds/no-arbitrary-tailwind, ds/min-tap-size, ds/enforce-layout-primitives -- XAUP-0001 [ttl=2026-12-31] Gate UI pending design token refactor */

import * as React from "react";

import { useUploaderI18n } from "../../lib/uploaderI18n.client";

export function CatalogLoginForm({
  token,
  busy,
  error,
  onTokenChange,
  onSubmit,
}: {
  token: string;
  busy: boolean;
  error: string | null;
  onTokenChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const { t } = useUploaderI18n();

  return (
    <div className="space-y-6">
      <div className="text-sm text-[color:var(--gate-muted)]">
        {t("loginIntro")}
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
          {t("loginTokenLabel")}
          <input
            value={token}
            onChange={(event) => onTokenChange(event.target.value)}
            className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-3 text-sm text-[color:var(--gate-ink)] placeholder:text-[color:var(--gate-muted)] focus:border-[color:var(--gate-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--gate-ink)]/20"
            autoComplete="off"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-md border border-[color:var(--gate-ink)] bg-[color:var(--gate-ink)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? t("loginButtonBusy") : t("loginButtonIdle")}
        </button>
        {error ? <div className="text-sm text-red-700">{error}</div> : null}
      </form>
    </div>
  );
}
