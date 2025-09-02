"use client";

// packages/ui/hooks/useProductEditorFormState.tsx
import { useProductInputs, type ProductWithVariants } from "./useProductInputs";
import { useProductMediaManager } from "./useProductMediaManager";
import { buildProductFormData } from "../utils/buildProductFormData";
import type { Locale } from "@acme/i18n";

import {
  useCallback,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import type { ProductPublication } from "@acme/types";

export interface ProductSaveResult {
  product?: ProductPublication & { variants?: Record<string, string[]> };
  errors?: Record<string, string[]>;
}

export interface UseProductEditorFormReturn {
  product: ProductWithVariants;
  errors: Record<string, string[]>;
  saving: boolean;
  publishTargets: string[];
  setPublishTargets: (ids: string[]) => void;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleSubmit: (e: FormEvent) => void;
  uploader: React.ReactElement;
  removeMedia: (index: number) => void;
  moveMedia: (from: number, to: number) => void;
  addVariantValue: (attr: string) => void;
  removeVariantValue: (attr: string, index: number) => void;
}

export function useProductEditorFormState(
  init: ProductPublication & { variants?: Record<string, string[]> },
  locales: readonly Locale[],
  onSave: (fd: FormData) => Promise<ProductSaveResult>
): UseProductEditorFormReturn {
  const {
    product,
    setProduct,
    handleChange,
    addVariantValue,
    removeVariantValue,
  } = useProductInputs(init, locales);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [publishTargets, setPublishTargets] = useState<string[]>([]);

  const { uploader, removeMedia, moveMedia } = useProductMediaManager(
    init.shop,
    publishTargets,
    setProduct
  );

  const formData = useMemo(
    () => buildProductFormData(product, publishTargets, locales),
    [product, publishTargets, locales]
  );

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setSaving(true);
      const result = await onSave(formData);

      if (result.errors) {
        setErrors(result.errors);
      } else if (result.product) {
        const product = result.product;
        setProduct((prev: ProductWithVariants) => ({
          ...product,
          variants: product.variants ?? prev.variants,
        }));
        setErrors({});
      }
      setSaving(false);
    },
    [onSave, formData, setProduct]
  );

  return {
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
  };
}

export default useProductEditorFormState;

export type { ProductWithVariants } from "./useProductInputs";
