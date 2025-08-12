/* packages/ui/components/cms/ProductEditorForm.tsx */
"use client";

import { Button, Card, CardContent, Input } from "@ui/components/atoms/shadcn";
import type { Locale, ProductPublication } from "@platform-core/src/products";
import { useProductEditorFormState } from "@ui/hooks/useProductEditorFormState";
import type { ProductWithVariants } from "@ui/hooks/useProductEditorFormState";
import MultilingualFields from "./MultilingualFields";
import PublishLocationSelector from "./PublishLocationSelector";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface BaseProps {
  /** Current product snapshot (all locales) */
  product: ProductWithVariants;
  /** Called with FormData → resolves to updated product or errors */
  onSave(fd: FormData): Promise<{
    product?: ProductPublication;
    errors?: Record<string, string[]>;
  }>;
  /** Locales enabled for the current shop */
  locales: readonly Locale[];
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function ProductEditorForm({
  product: init,
  onSave,
  locales,
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
    removeImage,
    moveImage,
  } = useProductEditorFormState(init, locales, onSave);

  /* ---------------- UI ---------------- */
  return (
    <Card className="mx-auto max-w-3xl">
      <CardContent>
        <form onSubmit={handleSubmit} className="@container grid gap-6">
          {Object.keys(errors).length > 0 && (
            <div className="text-sm text-danger">
              {Object.entries(errors).map(([k, v]) => (
                <p key={k}>{v.join("; ")}</p>
              ))}
            </div>
          )}
          <Input type="hidden" name="id" value={product.id} />

          {/* Price ------------------------------------------------------ */}
          <label className="flex max-w-xs flex-col gap-1">
            <span>Price&nbsp;(cents)</span>
            <Input
              type="number"
              name="price"
              value={product.price}
              onChange={handleChange}
              required
            />
          </label>

          {/* Variant attributes -------------------------------------- */}
          {Object.entries(product.variants).map(([attr, values]) => (
            <label key={attr} className="flex max-w-xs flex-col gap-1">
              <span>{`Variant ${attr}`}</span>
              <Input
                name={`variant_${attr}`}
                value={values.join(",")}
                onChange={handleChange}
              />
            </label>
          ))}

          {/* Publish locations ----------------------------------------- */}
          <PublishLocationSelector
            selectedIds={publishTargets}
            onChange={setPublishTargets}
            showReload
          />

          {/* Image upload --------------------------------------------- */}
          {uploader}

          {product.images.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {product.images.map((img, idx) => (
                <div
                  key={img.url}
                  className="relative h-32 w-full overflow-hidden rounded-md border"
                >
                  {img.type === "image" ? (
                    <img
                      src={img.url}
                      alt={img.altText || ""}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <video
                      src={img.url}
                      className="h-full w-full object-cover"
                      controls
                    />
                  )}
                  <div className="absolute inset-x-1 top-1 flex justify-between gap-1">
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => moveImage(idx, idx - 1)}
                        className="rounded bg-fg/50 px-1 text-xs text-bg"
                      >
                        ↑
                      </button>
                    )}
                    {idx < product.images.length - 1 && (
                      <button
                        type="button"
                        onClick={() => moveImage(idx, idx + 1)}
                        className="rounded bg-fg/50 px-1 text-xs text-bg"
                      >
                        ↓
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="ml-auto rounded bg-fg/50 px-1 text-xs text-bg"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Multilingual fields -------------------------------------- */}
          <MultilingualFields
            locales={locales}
            product={product}
            onChange={handleChange}
          />

          {/* Save ------------------------------------------------------ */}
          <Button type="submit" disabled={saving} className="w-fit">
            {saving ? "Saving…" : "Save"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
