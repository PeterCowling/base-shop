/* packages/ui/components/cms/ProductEditorForm.tsx */
"use client";

import { Input } from "../atoms/shadcn";
import { Toast } from "../atoms";
import type { Locale } from "@acme/types";
import Tabs from "./blocks/Tabs";
import PricingTab from "./PricingTab";
import VariantsTab from "./VariantsTab";
import PublishLocationsTab from "./PublishLocationsTab";
import PublishShopsTab from "./PublishShopsTab";
import MediaGalleryTab from "./MediaGalleryTab";
import LocaleContentTab from "./LocaleContentTab";
import { useProductEditorFormState } from "../../hooks/useProductEditorFormState";
import type {
  ProductWithVariants,
  ProductSaveResult,
} from "../../hooks/useProductEditorFormState";
import { useProductEditorNotifications } from "../../hooks/useProductEditorNotifications";
import { usePublishLocations } from "@acme/platform-core/hooks/usePublishLocations";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import { getShopFromPath } from "@acme/shared-utils";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface BaseProps {
  /** Current product snapshot (all locales) */
  product: ProductWithVariants;
  /** Called with FormData → resolves to updated product or errors */
  onSave(fd: FormData): Promise<ProductSaveResult>;
  /** Locales enabled for the current shop */
  locales: readonly Locale[];
  /** Optional id shared with external toolbars */
  formId?: string;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function ProductEditorForm({
  product: init,
  onSave,
  locales,
  formId = "product-editor-form",
}: BaseProps) {
  const {
    product,
    errors,
    saving,
    publishTargets,
    setPublishTargets,
    handleChange,
    handleSubmit,
    uploader,
    removeMedia,
    moveMedia,
    addVariantValue,
    removeVariantValue,
  } = useProductEditorFormState(init, locales, onSave);

  const { locations } = usePublishLocations();

  // Local state for shops selection (kept here to avoid changing the shared form-state hook API)
  const [publishShops, setPublishShops] = useState<string[]>([]);
  const pathname = usePathname() ?? "";
  useEffect(() => {
    // If the product already carries a persisted list, prefer it.
    const preset = (init as unknown as { publishShops?: string[] })
      .publishShops;
    if (Array.isArray(preset) && preset.length > 0) {
      setPublishShops(preset);
      return;
    }
    // Otherwise default to current shop from URL (if available)
    if (publishShops.length === 0) {
      const currentShop = getShopFromPath(pathname);
      if (currentShop) setPublishShops([currentShop]);
    }
    // run once on mount for defaulting/preset
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const errorEntries = useMemo(
    () => Object.entries(errors as Record<string, string[]>),
    [errors],
  );
  const hasErrors = errorEntries.length > 0;

  const { toast, closeToast } = useProductEditorNotifications({
    saving,
    hasErrors,
  });

  const onFormSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      handleSubmit(event);
    },
    [handleSubmit],
  );

  return (
    <>
      <Toast open={toast.open} message={toast.message} onClose={closeToast} />
      <form
        id={formId}
        data-cy="product-editor-form"
        data-testid="product-editor-form"
        onSubmit={onFormSubmit}
        aria-busy={saving}
        className="flex flex-col gap-6"
      >
        <Input type="hidden" name="id" value={product.id} />
        <Input
          type="hidden"
          name="publishShops"
          value={publishShops.join(",")}
          data-testid="publish-shops-input"
        />

        {hasErrors && (
          <div
            className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
            data-token="--color-danger"
          >
            <p className="font-medium">We found some issues:</p>
            <ul className="mt-2 space-y-1">
              {errorEntries.map(([field, messages]) => (
                <li key={field}>
                  <span className="font-semibold capitalize">{field}</span>: {" "}
                  {messages.join(", ")}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Tabs
          labels={[
            "Pricing",
            "Variants",
            "Publish locations",
            "Publish to shops",
            "Media gallery",
            "Localized content",
          ]}
          className="space-y-4"
        >
          <PricingTab
            price={product.price}
            currency={product.currency}
            onPriceChange={(event) => handleChange(event)}
          />

          <VariantsTab
            variants={product.variants}
            onVariantChange={(event) => handleChange(event)}
            onAddVariantValue={addVariantValue}
            onRemoveVariantValue={removeVariantValue}
          />

          <PublishLocationsTab
            selectedIds={publishTargets}
            locations={locations}
            onChange={setPublishTargets}
          />

          <PublishShopsTab
            selectedIds={publishShops}
            onChange={setPublishShops}
          />

          <MediaGalleryTab
            uploader={uploader}
            media={product.media}
            onMoveMedia={moveMedia}
            onRemoveMedia={removeMedia}
          />

          <LocaleContentTab
            locales={locales}
            title={product.title}
            description={product.description}
            onFieldChange={(event) => handleChange(event)}
          />
        </Tabs>

        <button type="submit" className="sr-only">
          Save
        </button>
      </form>
    </>
  );
}
