"use client";

// packages/ui/hooks/useProductInputs.ts
import { parseMultilingualInput } from "@acme/i18n/parseMultilingualInput";
import type { Locale } from "@acme/i18n/locales";
import type { ProductPublication } from "@acme/types";
import {
  useCallback,
  useState,
  type ChangeEvent,
} from "react";

export type ProductWithVariants = ProductPublication & {
  variants: Record<string, string[]>;
};

export interface UseProductInputsResult {
  product: ProductWithVariants;
  setProduct: React.Dispatch<React.SetStateAction<ProductWithVariants>>;
  handleChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  addVariantValue: (attr: string) => void;
  removeVariantValue: (attr: string, index: number) => void;
}

export function useProductInputs(
  init: ProductPublication & { variants?: Record<string, string[]> },
  locales: readonly Locale[]
): UseProductInputsResult {
  const [product, setProduct] = useState<ProductWithVariants>({
    ...init,
    variants: init.variants ?? {},
  });

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      const parsed = parseMultilingualInput(name, locales);

      setProduct((prev: ProductWithVariants) => {
        if (parsed) {
          const { field, locale } = parsed;
          const realField = field === "desc" ? "description" : field;
          const translations = (
            prev[
              realField as keyof Pick<ProductWithVariants, "title" | "description">
            ] ?? {}
          ) as Record<Locale, string>;
          return {
            ...prev,
            [realField]: { ...translations, [locale]: value },
          } as ProductWithVariants;
        }

        if (name === "price") {
          return { ...prev, price: Number(value) };
        }

        if (name.startsWith("variant_")) {
          const indexed = name.match(/^variant_(.+)_(\d+)$/);
          if (indexed) {
            const [, key, idxStr] = indexed;
            const idx = Number(idxStr);
            const existing = prev.variants[key] ?? [];
            const next = [...existing];
            next[idx] = value;
            return {
              ...prev,
              variants: { ...prev.variants, [key]: next },
            };
          }

          const key = name.replace(/^variant_/, "");
          return {
            ...prev,
            variants: {
              ...prev.variants,
              [key]: value ? value.split(",").map((v) => v.trim()) : [""],
            },
          };
        }

        return prev;
      });
    },
    [locales]
  );

  const addVariantValue = useCallback((attr: string) => {
    setProduct((prev: ProductWithVariants) => ({
      ...prev,
      variants: {
        ...prev.variants,
        [attr]: [...(prev.variants[attr] ?? []), ""],
      },
    }));
  }, []);

  const removeVariantValue = useCallback((attr: string, index: number) => {
    setProduct((prev: ProductWithVariants) => {
      const values: string[] = prev.variants[attr] ?? [];
      return {
        ...prev,
        variants: {
          ...prev.variants,
          [attr]: values.filter((_: string, i: number) => i !== index),
        },
      };
    });
  }, []);

  return {
    product,
    setProduct,
    handleChange,
    addVariantValue,
    removeVariantValue,
  };
}

export default useProductInputs;
