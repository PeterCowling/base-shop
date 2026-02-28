"use client";

import { toPositiveInt } from "@acme/lib";
import type { CatalogProductDraftInput } from "@acme/lib/xa";

import { useUploaderI18n } from "../../lib/uploaderI18n.client";

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
    <div className="mt-8 space-y-4">
      <div className="text-xs uppercase tracking-label-lg text-gate-muted">
        {t("imagesFieldsTitle")}
      </div>
      <div className="text-sm text-gate-muted">{t("imageGuidelines", { minEdge })}</div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-xs uppercase tracking-label text-gate-muted md:col-span-2">
          {t("imageFiles")}
          <textarea
            // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 test-id
            data-testid="catalog-field-image-files"
            value={draft.imageFiles ?? ""}
            onChange={(event) => onChange({ ...draft, imageFiles: event.target.value })}
            rows={3}
            className="mt-2 w-full rounded-md border border-border-2 bg-surface px-3 py-2 text-sm text-gate-ink"
            // eslint-disable-next-line ds/no-hardcoded-copy -- XAUP-0001 operator-tool format hint
            placeholder="images/my-product/*.jpg"
          />
        </label>

        <label className="block text-xs uppercase tracking-label text-gate-muted md:col-span-2">
          {t("imageAltTexts")}
          <textarea
            value={draft.imageAltTexts ?? ""}
            onChange={(event) => onChange({ ...draft, imageAltTexts: event.target.value })}
            rows={2}
            className="mt-2 w-full rounded-md border border-border-2 bg-surface px-3 py-2 text-sm text-gate-ink"
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
