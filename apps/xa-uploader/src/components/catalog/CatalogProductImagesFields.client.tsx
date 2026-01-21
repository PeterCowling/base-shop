"use client";

/* eslint-disable -- XAUP-0001 [ttl=2026-12-31] legacy uploader images form pending design/i18n overhaul */

import type { CatalogProductDraftInput } from "../../lib/catalogAdminSchema";
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
  const minEdge = Math.max(
    1,
    Number(process.env.NEXT_PUBLIC_XA_UPLOADER_MIN_IMAGE_EDGE ?? 1600) || 1600,
  );

  return (
    <div className="mt-8 space-y-4">
      <div className="text-xs uppercase tracking-[0.35em] text-[color:var(--gate-muted)]">
        {t("imagesFieldsTitle")}
      </div>
      <div className="text-sm text-[color:var(--gate-muted)]">{t("imageGuidelines", { minEdge })}</div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)] md:col-span-2">
          {t("imageFiles")}
          <textarea
            value={draft.imageFiles ?? ""}
            onChange={(event) => onChange({ ...draft, imageFiles: event.target.value })}
            rows={3}
            className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
            placeholder="images/my-product/*.jpg"
          />
        </label>

        <label className="block text-xs uppercase tracking-[0.3em] text-[color:var(--gate-muted)] md:col-span-2">
          {t("imageAltTexts")}
          <textarea
            value={draft.imageAltTexts ?? ""}
            onChange={(event) => onChange({ ...draft, imageAltTexts: event.target.value })}
            rows={2}
            className="mt-2 w-full rounded-md border border-border-2 bg-white px-3 py-2 text-sm text-[color:var(--gate-ink)]"
            placeholder={t("placeholderImageAltTexts")}
          />
          {fieldErrors.imageAltTexts ? (
            <div className="mt-1 text-xs text-red-700">{fieldErrors.imageAltTexts}</div>
          ) : null}
        </label>
      </div>
    </div>
  );
}
