"use client";

/* eslint-disable -- XAUP-0001 [ttl=2026-12-31] legacy uploader clothing form pending design/i18n overhaul */

import type { CatalogProductDraftInput } from "../../lib/catalogAdminSchema";
import { useUploaderI18n } from "../../lib/uploaderI18n.client";

export function CatalogProductClothingFields({
  draft,
  fieldErrors,
  onChange,
}: {
  draft: CatalogProductDraftInput;
  fieldErrors: Record<string, string>;
  onChange: (next: CatalogProductDraftInput) => void;
}) {
  const { t } = useUploaderI18n();

  return (
    <div className="mt-8 space-y-4">
      <div className="text-xs uppercase tracking-[0.35em] text-[color:var(--gate-muted)]">
        {t("clothingFieldsTitle")}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
          {t("clothingSizes")}
          <input
            value={draft.sizes ?? ""}
            onChange={(event) => onChange({ ...draft, sizes: event.target.value })}
            className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
            placeholder="S|M|L|XL"
          />
          {fieldErrors.sizes ? (
            <div className="mt-1 text-xs text-red-700">{fieldErrors.sizes}</div>
          ) : null}
        </label>

        <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
          {t("clothingOccasion")}
          <input
            value={draft.taxonomy.occasion ?? ""}
            onChange={(event) =>
              onChange({
                ...draft,
                taxonomy: { ...draft.taxonomy, occasion: event.target.value },
              })
            }
            className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
          />
        </label>

        <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
          {t("clothingFit")}
          <input
            value={draft.taxonomy.fit ?? ""}
            onChange={(event) =>
              onChange({ ...draft, taxonomy: { ...draft.taxonomy, fit: event.target.value } })
            }
            className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
          />
        </label>

        <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
          {t("clothingLength")}
          <input
            value={draft.taxonomy.length ?? ""}
            onChange={(event) =>
              onChange({ ...draft, taxonomy: { ...draft.taxonomy, length: event.target.value } })
            }
            className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
          />
        </label>

        <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
          {t("clothingNeckline")}
          <input
            value={draft.taxonomy.neckline ?? ""}
            onChange={(event) =>
              onChange({
                ...draft,
                taxonomy: { ...draft.taxonomy, neckline: event.target.value },
              })
            }
            className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
          />
        </label>

        <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
          {t("clothingSleeveLength")}
          <input
            value={draft.taxonomy.sleeveLength ?? ""}
            onChange={(event) =>
              onChange({
                ...draft,
                taxonomy: { ...draft.taxonomy, sleeveLength: event.target.value },
              })
            }
            className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
          />
        </label>

        <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
          {t("clothingPattern")}
          <input
            value={draft.taxonomy.pattern ?? ""}
            onChange={(event) =>
              onChange({
                ...draft,
                taxonomy: { ...draft.taxonomy, pattern: event.target.value },
              })
            }
            className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
          />
        </label>

        <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)] md:col-span-2">
          {t("clothingDetailsTitle")}
          <div className="mt-2 grid gap-3 md:grid-cols-2">
            <input
              value={draft.details?.modelHeight ?? ""}
              onChange={(event) =>
                onChange({
                  ...draft,
                  details: { ...draft.details, modelHeight: event.target.value },
                })
              }
              className="w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
              placeholder={t("placeholderModelHeight")}
            />
            <input
              value={draft.details?.modelSize ?? ""}
              onChange={(event) =>
                onChange({
                  ...draft,
                  details: { ...draft.details, modelSize: event.target.value },
                })
              }
              className="w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
              placeholder={t("placeholderModelSize")}
            />
            <input
              value={draft.details?.fabricFeel ?? ""}
              onChange={(event) =>
                onChange({
                  ...draft,
                  details: { ...draft.details, fabricFeel: event.target.value },
                })
              }
              className="w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
              placeholder={t("placeholderFabricFeel")}
            />
            <input
              value={draft.details?.care ?? ""}
              onChange={(event) =>
                onChange({ ...draft, details: { ...draft.details, care: event.target.value } })
              }
              className="w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
              placeholder={t("placeholderCare")}
            />
            <textarea
              value={draft.details?.fitNote ?? ""}
              onChange={(event) =>
                onChange({
                  ...draft,
                  details: { ...draft.details, fitNote: event.target.value },
                })
              }
              rows={2}
              className="md:col-span-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
              placeholder={t("placeholderFitNote")}
            />
            <textarea
              value={draft.details?.sizeGuide ?? ""}
              onChange={(event) =>
                onChange({
                  ...draft,
                  details: { ...draft.details, sizeGuide: event.target.value },
                })
              }
              rows={2}
              className="md:col-span-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
              placeholder={t("placeholderSizeGuide")}
            />
          </div>
        </label>
      </div>
    </div>
  );
}
