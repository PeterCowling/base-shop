"use client";

/* eslint-disable -- XAUP-0001 [ttl=2026-12-31] legacy uploader jewelry form pending design/i18n overhaul */

import type { CatalogProductDraftInput } from "../../lib/catalogAdminSchema";
import { useUploaderI18n } from "../../lib/uploaderI18n.client";

export function CatalogProductJewelryFields({
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
        {t("jewelryFieldsTitle")}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
          {t("jewelryMetal")}
          <input
            value={draft.taxonomy.metal ?? ""}
            onChange={(event) =>
              onChange({ ...draft, taxonomy: { ...draft.taxonomy, metal: event.target.value } })
            }
            className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
          />
          {fieldErrors["taxonomy.metal"] ? (
            <div className="mt-1 text-xs text-red-700">{fieldErrors["taxonomy.metal"]}</div>
          ) : null}
        </label>

        <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
          {t("jewelryGemstone")}
          <input
            value={draft.taxonomy.gemstone ?? ""}
            onChange={(event) =>
              onChange({
                ...draft,
                taxonomy: { ...draft.taxonomy, gemstone: event.target.value },
              })
            }
            className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
          />
        </label>

        <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
          {t("jewelrySize")}
          <input
            value={draft.taxonomy.jewelrySize ?? ""}
            onChange={(event) =>
              onChange({
                ...draft,
                taxonomy: { ...draft.taxonomy, jewelrySize: event.target.value },
              })
            }
            className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
          />
        </label>

        <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
          {t("jewelryStyle")}
          <input
            value={draft.taxonomy.jewelryStyle ?? ""}
            onChange={(event) =>
              onChange({
                ...draft,
                taxonomy: { ...draft.taxonomy, jewelryStyle: event.target.value },
              })
            }
            className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
          />
        </label>

        <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)]">
          {t("jewelryTier")}
          <input
            value={draft.taxonomy.jewelryTier ?? ""}
            onChange={(event) =>
              onChange({
                ...draft,
                taxonomy: { ...draft.taxonomy, jewelryTier: event.target.value },
              })
            }
            className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
          />
        </label>

        <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)] md:col-span-2">
          {t("jewelryDetailsTitle")}
          <div className="mt-2 grid gap-3 md:grid-cols-2">
            <textarea
              value={draft.details?.sizeGuide ?? ""}
              onChange={(event) =>
                onChange({
                  ...draft,
                  details: { ...draft.details, sizeGuide: event.target.value },
                })
              }
              rows={2}
              className="w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
              placeholder={t("placeholderSizeGuide")}
            />
            <textarea
              value={draft.details?.care ?? ""}
              onChange={(event) =>
                onChange({ ...draft, details: { ...draft.details, care: event.target.value } })
              }
              rows={2}
              className="w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
              placeholder={t("placeholderCare")}
            />
            <textarea
              value={draft.details?.warranty ?? ""}
              onChange={(event) =>
                onChange({
                  ...draft,
                  details: { ...draft.details, warranty: event.target.value },
                })
              }
              rows={2}
              className="md:col-span-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
              placeholder={t("placeholderWarranty")}
            />
          </div>
        </label>
      </div>
    </div>
  );
}
