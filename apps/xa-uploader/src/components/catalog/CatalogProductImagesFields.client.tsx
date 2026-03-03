"use client";

import { toPositiveInt } from "@acme/lib";
import type { CatalogProductDraftInput } from "@acme/lib/xa";

import { useUploaderI18n } from "../../lib/uploaderI18n.client";

import { INPUT_CLASS } from "./catalogStyles";

export function CatalogProductImagesFields({
  draft,
  fieldErrors,
  onChange,
}: {
  draft: CatalogProductDraftInput;
  fieldErrors: Record<string, string>;
  onChange: (next: CatalogProductDraftInput) => void;
}) {
  const { t } = useUploaderI18n();
  const minEdge = toPositiveInt(
    process.env.NEXT_PUBLIC_XA_UPLOADER_MIN_IMAGE_EDGE ?? 1600,
    1600,
    1,
  );

  return (
    // eslint-disable-next-line ds/container-widths-only-at -- XAUP-0001 operator-tool constrained form
    <div className="mx-auto mt-8 max-w-prose space-y-4">
      <div className="text-xs uppercase tracking-label-lg text-gate-muted">
        {t("imagesFieldsTitle")}
      </div>
      <div className="text-sm text-gate-muted">{t("imageGuidelines", { minEdge })}</div>
      <div className="grid gap-4">
        <label className="block text-xs uppercase tracking-label text-gate-muted">
          {t("imageFiles")}
          <textarea
            // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
            data-testid="catalog-field-image-files"
            value={draft.imageFiles ?? ""}
            onChange={(event) => onChange({ ...draft, imageFiles: event.target.value })}
            rows={3}
            className={INPUT_CLASS}
            // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 operator-tool format hint
            placeholder="images/my-product/*.jpg"
          />
        </label>

        <label className="block text-xs uppercase tracking-label text-gate-muted">
          {t("imageRoles")}
          <textarea
            value={draft.imageRoles ?? ""}
            onChange={(event) => onChange({ ...draft, imageRoles: event.target.value })}
            rows={2}
            className={INPUT_CLASS}
            placeholder={t("placeholderImageRoles")}
          />
          {fieldErrors.imageRoles ? (
            <div className="mt-1 text-xs text-danger-fg">{fieldErrors.imageRoles}</div>
          ) : null}
        </label>

        <label className="block text-xs uppercase tracking-label text-gate-muted">
          {t("imageAltTexts")}
          <textarea
            value={draft.imageAltTexts ?? ""}
            onChange={(event) => onChange({ ...draft, imageAltTexts: event.target.value })}
            rows={2}
            className={INPUT_CLASS}
            placeholder={t("placeholderImageAltTexts")}
          />
          {fieldErrors.imageAltTexts ? (
            <div className="mt-1 text-xs text-danger-fg">{fieldErrors.imageAltTexts}</div>
          ) : null}
        </label>
      </div>
    </div>
  );
}
