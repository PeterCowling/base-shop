/* packages/ui/components/cms/ProductEditorForm.tsx */
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Locale, ProductPublication } from "@platform-core/products";
import { usePublishLocations } from "@ui/hooks/usePublishLocations";
import { ChangeEvent, FormEvent, useCallback, useMemo, useState } from "react";
import ImageUploaderWithOrientationCheck from "./ImageUploaderWithOrientationCheck";
import PublishLocationSelector from "./PublishLocationSelector";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface BaseProps {
  /** Current product snapshot (all locales) */
  product: ProductPublication;
  /** Called with FormData → resolves to updated product */
  onSave(fd: FormData): Promise<ProductPublication>;
  /** Locales enabled for the current shop */
  locales: Locale[];
}

const label: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  it: "Italiano",
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function ProductEditorForm({
  product: init,
  onSave,
  locales,
}: BaseProps) {
  const [product, setProduct] = useState(init);
  const [saving, setSaving] = useState(false);
  const [publishTargets, setPublishTargets] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { locations } = usePublishLocations();
  const requiredOrientation =
    locations.find((l) => l.id === publishTargets[0])?.requiredOrientation ??
    "landscape";

  /* ---------------- field change ---------------- */
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;

      // matches e.g. "title_en" | "desc_it"
      const match = name.match(
        new RegExp(`^(title|desc)_(${locales.join("|")})$`)
      );

      setProduct((prev) => {
        /* multilingual title / description update */
        if (match) {
          const [, field, lang] = match as [unknown, "title" | "desc", Locale];
          return {
            ...prev,
            [field]: {
              ...prev[field],
              [lang]: value,
            },
          };
        }

        /* price update */
        if (name === "price") {
          return { ...prev, price: Number(value) };
        }

        return prev;
      });
    },
    [locales]
  );

  /* ---------------- form-data ---------------- */
  const formData = useMemo(() => {
    const fd = new FormData();
    fd.append("id", product.id);

    locales.forEach((l) => {
      fd.append(`title_${l}`, product.title[l]);
      fd.append(`desc_${l}`, product.description[l]);
    });

    fd.append("price", String(product.price));

    if (imageFile) fd.append("image", imageFile);

    fd.append("publish", publishTargets.join(","));
    return fd;
  }, [product, imageFile, publishTargets, locales]);

  /* ---------------- submit ---------------- */
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setSaving(true);
      const updated = await onSave(formData);
      setProduct(updated);
      setSaving(false);
    },
    [onSave, formData]
  );

  /* ---------------- UI ---------------- */
  return (
    <Card className="mx-auto max-w-3xl">
      <CardContent>
        <form onSubmit={handleSubmit} className="@container grid gap-6">
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
          <ImageUploaderWithOrientationCheck
            file={imageFile}
            onChange={setImageFile}
            requiredOrientation={requiredOrientation}
          />

          {/* Multilingual fields -------------------------------------- */}
          <div className="grid gap-6 @md:grid-cols-3">
            {locales.map((l) => (
              <div key={l} className="flex flex-col gap-4">
                <h3 className="text-sm font-medium">{label[l]}</h3>

                <label className="flex flex-col gap-1">
                  <span>Title</span>
                  <Input
                    name={`title_${l}`}
                    value={product.title[l]}
                    onChange={handleChange}
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span>Description</span>
                  <Textarea
                    rows={4}
                    name={`desc_${l}`}
                    value={product.description[l]}
                    onChange={handleChange}
                  />
                </label>
              </div>
            ))}
          </div>

          {/* Save ------------------------------------------------------ */}
          <Button type="submit" disabled={saving} className="w-fit">
            {saving ? "Saving…" : "Save"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
