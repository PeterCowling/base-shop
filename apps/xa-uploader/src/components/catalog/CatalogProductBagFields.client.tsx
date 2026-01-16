"use client";

/* eslint-disable -- XAUP-0001 [ttl=2026-12-31] legacy gate form pending design token refactor */

import type { CatalogProductDraftInput } from "../../lib/catalogAdminSchema";
import { useUploaderI18n } from "../../lib/uploaderI18n.client";

export function CatalogProductBagFields({
  draft,
  onChange,
}: {
  draft: CatalogProductDraftInput;
  onChange: (next: CatalogProductDraftInput) => void;
}) {
  const { t } = useUploaderI18n();

  return (
    <div className="mt-8 space-y-4">
      <div className="text-xs uppercase tracking-[0.35em] text-[color:var(--gate-muted)]">
        {t("bagFieldsTitle")}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
          {t("bagSizeClass")}
          <input
            value={draft.taxonomy.sizeClass ?? ""}
            onChange={(event) =>
              onChange({
                ...draft,
                taxonomy: { ...draft.taxonomy, sizeClass: event.target.value },
              })
            }
            className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
          />
        </label>

        <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
          {t("bagFits")}
          <input
            value={draft.taxonomy.fits ?? ""}
            onChange={(event) =>
              onChange({
                ...draft,
                taxonomy: { ...draft.taxonomy, fits: event.target.value },
              })
            }
            className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
          />
        </label>

        <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
          {t("bagStrapStyle")}
          <input
            value={draft.taxonomy.strapStyle ?? ""}
            onChange={(event) =>
              onChange({
                ...draft,
                taxonomy: { ...draft.taxonomy, strapStyle: event.target.value },
              })
            }
            className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
          />
        </label>

        <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
          {t("bagHardwareColor")}
          <input
            value={draft.taxonomy.hardwareColor ?? ""}
            onChange={(event) =>
              onChange({
                ...draft,
                taxonomy: { ...draft.taxonomy, hardwareColor: event.target.value },
              })
            }
            className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
          />
        </label>

        <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
          {t("bagClosureType")}
          <input
            value={draft.taxonomy.closureType ?? ""}
            onChange={(event) =>
              onChange({
                ...draft,
                taxonomy: { ...draft.taxonomy, closureType: event.target.value },
              })
            }
            className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
          />
        </label>

        <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)] md:col-span-2">
          {t("bagDetailsTitle")}
          <div className="mt-2 grid gap-3 md:grid-cols-2">
            <input
              value={draft.details?.dimensions ?? ""}
              onChange={(event) =>
                onChange({
                  ...draft,
                  details: { ...draft.details, dimensions: event.target.value },
                })
              }
              className="w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
              placeholder={t("placeholderDimensions")}
            />
            <input
              value={draft.details?.strapDrop ?? ""}
              onChange={(event) =>
                onChange({
                  ...draft,
                  details: { ...draft.details, strapDrop: event.target.value },
                })
              }
              className="w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
              placeholder={t("placeholderStrapDrop")}
            />
            <textarea
              value={draft.details?.whatFits ?? ""}
              onChange={(event) =>
                onChange({ ...draft, details: { ...draft.details, whatFits: event.target.value } })
              }
              rows={2}
              className="w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
              placeholder={t("placeholderWhatFits")}
            />
            <textarea
              value={draft.details?.interior ?? ""}
              onChange={(event) =>
                onChange({ ...draft, details: { ...draft.details, interior: event.target.value } })
              }
              rows={2}
              className="w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
              placeholder={t("placeholderInterior")}
            />
          </div>
        </label>
      </div>
    </div>
  );
}
