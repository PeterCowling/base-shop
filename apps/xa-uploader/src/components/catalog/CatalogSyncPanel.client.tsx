"use client";

/* eslint-disable -- XAUP-0001 [ttl=2026-12-31] legacy uploader sync panel pending design/i18n overhaul */

import { useUploaderI18n } from "../../lib/uploaderI18n.client";

export function CatalogSyncPanel({
  busy,
  syncOptions,
  monoClassName,
  syncOutput,
  onSync,
  onChangeSyncOptions,
}: {
  busy: boolean;
  syncOptions: { strict: boolean; dryRun: boolean; replace: boolean; recursive: boolean };
  monoClassName?: string;
  syncOutput: string | null;
  onSync: () => void;
  onChangeSyncOptions: (next: { strict: boolean; dryRun: boolean; replace: boolean; recursive: boolean }) => void;
}) {
  const { t } = useUploaderI18n();

  const optionLabels: Record<keyof typeof syncOptions, string> = {
    strict: t("syncOptionStrict"),
    recursive: t("syncOptionRecursive"),
    replace: t("syncOptionReplace"),
    dryRun: t("syncOptionDryRun"),
  };

  return (
    <section className="rounded-xl border border-border-2 bg-white p-6 shadow-elevation-1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs uppercase tracking-[0.35em] text-[color:var(--gate-muted)]">
          {t("validateAndSync")}
        </div>
        <button
          type="button"
          onClick={onSync}
          disabled={busy}
          className="rounded-md border border-[color:var(--gate-ink)] bg-[color:var(--gate-ink)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white disabled:opacity-60"
        >
          {busy ? t("running") : t("runSync")}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        {(["strict", "recursive", "replace", "dryRun"] as const).map((key) => (
          <label
            key={key}
            className="inline-flex items-center gap-2 text-xs text-[color:var(--gate-muted)]"
          >
            <input
              type="checkbox"
              checked={syncOptions[key]}
              onChange={(event) => onChangeSyncOptions({ ...syncOptions, [key]: event.target.checked })}
            />
            {optionLabels[key]}
          </label>
        ))}
      </div>

      {syncOutput ? (
        <pre
          className={`mt-4 max-h-80 overflow-auto rounded-md border border-border-2 bg-muted p-3 text-xs text-[color:var(--gate-ink)] ${monoClassName}`}
        >
          {syncOutput}
        </pre>
      ) : null}
    </section>
  );
}
