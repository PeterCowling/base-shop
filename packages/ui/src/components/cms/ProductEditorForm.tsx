/* packages/ui/components/cms/ProductEditorForm.tsx */
"use client";

import { Button, Card, CardContent, Input } from "@/components/atoms-shadcn";
import type { Locale, ProductPublication } from "@platform-core/src/products";
import { useProductEditorFormState } from "@ui/hooks/useProductEditorFormState";
import MultilingualFields from "./MultilingualFields";
import PublishLocationSelector from "./PublishLocationSelector";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface BaseProps {
  /** Current product snapshot (all locales) */
  product: ProductPublication;
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
  } = useProductEditorFormState(init, locales, onSave);

  /* ---------------- UI ---------------- */
  return (
    <Card className="mx-auto max-w-3xl">
      <CardContent>
        <form onSubmit={handleSubmit} className="@container grid gap-6">
          {Object.keys(errors).length > 0 && (
            <div className="text-sm text-red-600">
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

          {/* Publish locations ----------------------------------------- */}
          <PublishLocationSelector
            selectedIds={publishTargets}
            onChange={setPublishTargets}
            showReload
          />

          {/* Image upload --------------------------------------------- */}
          {uploader}

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
