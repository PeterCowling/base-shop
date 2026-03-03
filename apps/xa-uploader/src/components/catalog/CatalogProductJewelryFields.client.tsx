"use client";

import type { CatalogProductDraftInput } from "@acme/lib/xa";

import { useUploaderI18n } from "../../lib/uploaderI18n.client";

import { INPUT_CLASS, INPUT_INLINE_CLASS } from "./catalogStyles";

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
    // eslint-disable-next-line ds/container-widths-only-at -- XAUP-0001 operator-tool constrained form
    <div className="mx-auto mt-8 max-w-prose space-y-4">
      <div className="text-xs uppercase tracking-label-lg text-gate-muted">
        {t("jewelryFieldsTitle")}
      </div>
      <div className="grid gap-4">
        <label className="block text-xs uppercase tracking-label text-gate-muted">
          {t("jewelryMetal")}
          <input
            value={draft.taxonomy.metal ?? ""}
            onChange={(event) =>
              onChange({ ...draft, taxonomy: { ...draft.taxonomy, metal: event.target.value } })
            }
            className={INPUT_CLASS}
          />
          {fieldErrors["taxonomy.metal"] ? (
            <div className="mt-1 text-xs text-danger-fg">{fieldErrors["taxonomy.metal"]}</div>
          ) : null}
        </label>

        <label className="block text-xs uppercase tracking-label text-gate-muted">
          {t("jewelryGemstone")}
          <input
            value={draft.taxonomy.gemstone ?? ""}
            onChange={(event) =>
              onChange({
                ...draft,
                taxonomy: { ...draft.taxonomy, gemstone: event.target.value },
              })
            }
            className={INPUT_CLASS}
          />
        </label>

        <label className="block text-xs uppercase tracking-label text-gate-muted">
          {t("jewelrySize")}
          <input
            value={draft.taxonomy.jewelrySize ?? ""}
            onChange={(event) =>
              onChange({
                ...draft,
                taxonomy: { ...draft.taxonomy, jewelrySize: event.target.value },
              })
            }
            className={INPUT_CLASS}
          />
        </label>

        <label className="block text-xs uppercase tracking-label text-gate-muted">
          {t("jewelryStyle")}
          <input
            value={draft.taxonomy.jewelryStyle ?? ""}
            onChange={(event) =>
              onChange({
                ...draft,
                taxonomy: { ...draft.taxonomy, jewelryStyle: event.target.value },
              })
            }
            className={INPUT_CLASS}
          />
        </label>

        <label className="block text-xs uppercase tracking-label text-gate-muted">
          {t("jewelryTier")}
          <input
            value={draft.taxonomy.jewelryTier ?? ""}
            onChange={(event) =>
              onChange({
                ...draft,
                taxonomy: { ...draft.taxonomy, jewelryTier: event.target.value },
              })
            }
            className={INPUT_CLASS}
          />
        </label>

        <label className="block text-xs uppercase tracking-label text-gate-muted">
          {t("jewelryDetailsTitle")}
          <div className="mt-2 grid gap-3">
            <textarea
              value={draft.details?.sizeGuide ?? ""}
              onChange={(event) =>
                onChange({
                  ...draft,
                  details: { ...draft.details, sizeGuide: event.target.value },
                })
              }
              rows={2}
              className={INPUT_INLINE_CLASS}
              placeholder={t("placeholderSizeGuide")}
            />
            <textarea
              value={draft.details?.care ?? ""}
              onChange={(event) =>
                onChange({ ...draft, details: { ...draft.details, care: event.target.value } })
              }
              rows={2}
              className={INPUT_INLINE_CLASS}
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
              className={INPUT_INLINE_CLASS}
              placeholder={t("placeholderWarranty")}
            />
          </div>
        </label>
      </div>
    </div>
  );
}
