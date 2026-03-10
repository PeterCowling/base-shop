"use client";

import type { CatalogProductDraftInput } from "@acme/lib/xa/catalogAdminSchema";

import { useUploaderI18n } from "../../lib/uploaderI18n.client";


export function CatalogProductBagFields({
  draft: _draft,
  onChange: _onChange,
}: {
  draft: CatalogProductDraftInput;
  onChange: (next: CatalogProductDraftInput) => void;
}) {
  const { t } = useUploaderI18n();

  return (
    // eslint-disable-next-line ds/container-widths-only-at -- XAUP-0001 operator-tool constrained form
    <div className="mx-auto mt-8 max-w-prose space-y-4">
      <div className="text-xs uppercase tracking-label-lg text-gate-muted">
        {t("bagFieldsTitle")}
      </div>
      {/* eslint-disable-next-line ds/enforce-layout-primitives -- XAUP-0001 operator-tool form grid */}
      <div className="grid gap-4">
        {/* Closure type, Interior, and Fits moved to TaxonomyFields (derived description area) */}
      </div>
    </div>
  );
}
