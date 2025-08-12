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
    openFileDialog,
    removeMedia,
    moveMedia,
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

          {/* Media upload --------------------------------------------- */}
          <div className="flex flex-wrap gap-2">
            {product.media.map((m, idx) => (
              <div key={idx} className="relative h-24 w-24">
                {m.type === "video" ? (
                  <video
                    src={m.url}
                    className="h-full w-full rounded object-cover"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.url}
                    alt={m.altText || ""}
                    className="h-full w-full rounded object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(idx)}
                  className="absolute right-1 top-1 rounded bg-black/50 px-1 text-xs text-white"
                >
                  ×
                </button>
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => moveMedia(idx, idx - 1)}
                    className="absolute left-1 bottom-1 rounded bg-black/50 px-1 text-xs text-white"
                  >
                    ←
                  </button>
                )}
                {idx < product.media.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveMedia(idx, idx + 1)}
                    className="absolute right-1 bottom-1 rounded bg-black/50 px-1 text-xs text-white"
                  >
                    →
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={openFileDialog}
              className="flex h-24 w-24 items-center justify-center rounded border"
            >
              +
            </button>
            {uploader}
          </div>

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
