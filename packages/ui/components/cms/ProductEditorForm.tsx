// packages/ui/components/cms/ProductEditorForm.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { updateProduct } from "@cms/actions/products";
import { ProductPublication } from "@platform-core/products";
import { ChangeEvent, FormEvent, useCallback, useMemo, useState } from "react";

interface ProductEditorFormProps {
  /** Snapshot loaded from the server on first render */
  initialProduct: ProductPublication;
  /** Active shop (route param) */
  shop: string;
}

export default function ProductEditorForm({
  initialProduct,
  shop,
}: ProductEditorFormProps) {
  const [product, setProduct] = useState<ProductPublication>(initialProduct);
  const [saving, setSaving] = useState(false);

  /* -----------------------------------------------------------------------
   *  Field change handler
   * --------------------------------------------------------------------- */
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProduct((prev) => {
      if (name === "title_en") {
        return { ...prev, title: { ...prev.title, en: value } };
      }
      if (name === "price") {
        return { ...prev, price: Number(value) };
      }
      return prev;
    });
  }, []);

  /* -----------------------------------------------------------------------
   *  Build FormData (memoised)
   * --------------------------------------------------------------------- */
  const formDataMemo = useMemo(() => {
    const fd = new FormData();
    fd.append("id", product.id);
    fd.append("title_en", product.title.en);
    fd.append("price", String(product.price));
    return fd;
  }, [product]);

  /* -----------------------------------------------------------------------
   *  Submit
   * --------------------------------------------------------------------- */
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setSaving(true);
      const updated = await updateProduct(shop, formDataMemo);
      setProduct(updated);
      setSaving(false);
    },
    [shop, formDataMemo]
  );

  /* -----------------------------------------------------------------------
   *  UI
   * --------------------------------------------------------------------- */
  return (
    <Card className="mx-auto max-w-2xl">
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <input type="hidden" name="id" value={product.id} />

          <label className="flex flex-col gap-1">
            <span>Title&nbsp;(en)</span>
            <Input
              name="title_en"
              value={product.title.en}
              onChange={handleChange}
              required
            />
          </label>

          <label className="flex flex-col gap-1">
            <span>Price&nbsp;(cents)</span>
            <Input
              type="number"
              step="1"
              name="price"
              value={product.price}
              onChange={handleChange}
              required
            />
          </label>

          <Button
            type="submit"
            disabled={saving}
            className="justify-self-start"
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
