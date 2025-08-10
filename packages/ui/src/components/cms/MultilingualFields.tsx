// packages/ui/components/cms/MultilingualFields.tsx
"use client";

import { Input, Textarea } from "@ui/components/atoms/shadcn";
import type { Locale, ProductPublication } from "@platform-core/src/products";
import { memo } from "react";

interface Props {
  locales: readonly Locale[];
  product: ProductPublication;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}

const label: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  it: "Italiano",
};

function MultilingualFieldsInner({ locales, product, onChange }: Props) {
  return (
    <div className="grid gap-6 @md:grid-cols-3">
      {locales.map((l) => (
        <div key={l} className="flex flex-col gap-4">
          <h3 className="text-sm font-medium">{label[l]}</h3>

          <label className="flex flex-col gap-1">
            <span>Title</span>
            <Input
              name={`title_${l}`}
              value={product.title[l]}
              onChange={onChange}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span>Description</span>
            <Textarea
              rows={4}
              name={`desc_${l}`}
              value={product.description[l]}
              onChange={onChange}
            />
          </label>
        </div>
      ))}
    </div>
  );
}

export default memo(MultilingualFieldsInner);
