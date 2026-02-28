"use client";

import * as React from "react";

import type { CatalogProductDraftInput } from "@acme/lib/xa";

import { useUploaderI18n } from "../../lib/uploaderI18n.client";

import { CatalogProductBagFields } from "./CatalogProductBagFields.client";
import { CatalogProductBaseFields } from "./CatalogProductBaseFields.client";
import { CatalogProductClothingFields } from "./CatalogProductClothingFields.client";
import { CatalogProductImagesFields } from "./CatalogProductImagesFields.client";
import { CatalogProductJewelryFields } from "./CatalogProductJewelryFields.client";
import type { ActionFeedback } from "./useCatalogConsole.client";

export function CatalogProductForm({
  selectedSlug,
  draft,
  fieldErrors,
  monoClassName,
  busy,
  feedback,
  onChangeDraft,
  onSave,
  onDelete,
}: {
  selectedSlug: string | null;
  draft: CatalogProductDraftInput;
  fieldErrors: Record<string, string>;
  monoClassName?: string;
  busy: boolean;
  feedback: ActionFeedback | null;
  onChangeDraft: (draft: CatalogProductDraftInput) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const { t } = useUploaderI18n();
  const category = draft.taxonomy.category;

  return (
    <section className="rounded-xl border border-border-2 bg-surface p-6 shadow-elevation-1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs uppercase tracking-label-lg text-gate-muted">
          {selectedSlug ? t("editProduct") : t("newProduct")}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedSlug ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={busy}
              // eslint-disable-next-line ds/min-tap-size -- XAUP-0001 operator-desktop-tool
              className="rounded-md border border-danger px-3 py-1 text-xs uppercase tracking-label text-danger-fg disabled:opacity-50"
            >
              {t("delete")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onSave}
            disabled={busy}
            // eslint-disable-next-line ds/min-tap-size -- XAUP-0001 operator-desktop-tool
            className="rounded-md border border-gate-ink bg-gate-ink px-4 py-2 text-xs font-semibold uppercase tracking-label text-primary-fg disabled:opacity-60"
            // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
            data-testid="catalog-save-details"
          >
            {busy ? t("saving") : t("saveDetails")}
          </button>
        </div>
      </div>

      {feedback ? (
        <div
          role={feedback.kind === "error" ? "alert" : "status"}
          aria-live={feedback.kind === "error" ? "assertive" : "polite"}
          className={feedback.kind === "error" ? "mt-4 text-sm text-danger-fg" : "mt-4 text-sm text-success-fg"}
          // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
          data-testid="catalog-draft-feedback"
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="mt-6">
        <CatalogProductBaseFields
          draft={draft}
          fieldErrors={fieldErrors}
          monoClassName={monoClassName}
          onChange={onChangeDraft}
        />

        {category === "clothing" ? (
          <CatalogProductClothingFields
            draft={draft}
            fieldErrors={fieldErrors}
            onChange={onChangeDraft}
          />
        ) : null}
        {category === "bags" ? (
          <CatalogProductBagFields draft={draft} onChange={onChangeDraft} />
        ) : null}
        {category === "jewelry" ? (
          <CatalogProductJewelryFields
            draft={draft}
            fieldErrors={fieldErrors}
            onChange={onChangeDraft}
          />
        ) : null}

        <CatalogProductImagesFields
          draft={draft}
          fieldErrors={fieldErrors}
          onChange={onChangeDraft}
        />
      </div>
    </section>
  );
}
