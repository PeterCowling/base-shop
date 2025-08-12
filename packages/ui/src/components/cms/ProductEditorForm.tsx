/* packages/ui/components/cms/ProductEditorForm.tsx */
"use client";

import { Button, Card, CardContent, Input } from "@ui/components/atoms/shadcn";
import type { Locale, ProductPublication } from "@platform-core/src/products";
import { useProductEditorFormState } from "@ui/hooks/useProductEditorFormState";
import MultilingualFields from "./MultilingualFields";
import PublishLocationSelector from "./PublishLocationSelector";
import Image from "next/image";
import { VideoPlayer } from "../atoms/VideoPlayer";

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
    media,
    moveMedia,
    removeMedia,
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

          {/* Publish locations ----------------------------------------- */}
          <PublishLocationSelector
            selectedIds={publishTargets}
            onChange={setPublishTargets}
            showReload
          />

          {/* Media upload --------------------------------------------- */}
          {uploader}
          {media.length > 0 && (
            <div className="flex flex-wrap gap-4">
              {media.map((m, idx) => (
                <div key={m.url} className="relative w-24">
                  <div className="relative h-24 w-24 overflow-hidden rounded">
                    {m.type === "video" ? (
                      <VideoPlayer
                        src={m.url}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Image
                        src={m.url}
                        alt={m.altText || "media"}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="mt-1 flex justify-between text-xs">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveMedia(idx, idx - 1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={idx === media.length - 1}
                      onClick={() => moveMedia(idx, idx + 1)}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeMedia(idx)}
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
