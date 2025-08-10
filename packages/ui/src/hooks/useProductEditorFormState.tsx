// packages/ui/hooks/useProductEditorFormState.tsx
import type { Locale, ProductPublication } from "@platform-core/src/products";
import { useImageUpload } from "@ui";
import { usePublishLocations } from "@ui";
import { parseMultilingualInput } from "@ui";
import {
  useCallback,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactElement,
} from "react";

/* ------------------------------------------------------------------ */
/* Hook return type                                                   */
/* ------------------------------------------------------------------ */
export interface UseProductEditorFormReturn {
  product: ProductPublication;
  errors: Record<string, string[]>;
  saving: boolean;
  publishTargets: string[];
  setPublishTargets: (ids: string[]) => void;
  handleChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleSubmit: (e: FormEvent) => void;
  uploader: ReactElement;
}

/* ------------------------------------------------------------------ */
/* Main hook                                                          */
/* ------------------------------------------------------------------ */
export function useProductEditorFormState(
  init: ProductPublication,
  locales: readonly Locale[],
  onSave: (fd: FormData) => Promise<{
    product?: ProductPublication;
    errors?: Record<string, string[]>;
  }>
): UseProductEditorFormReturn {
  /* ---------- state ------------------------------------------------ */
  const [product, setProduct] = useState(init);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [publishTargets, setPublishTargets] = useState<string[]>([]);

  /* ---------- helpers ---------------------------------------------- */
  const { locations } = usePublishLocations();
  const requiredOrientation =
    locations.find((l) => l.id === publishTargets[0])?.requiredOrientation ??
    "landscape";

  const { file: imageFile, uploader } = useImageUpload(requiredOrientation);

  /* ---------- input change handler --------------------------------- */
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      const parsed = parseMultilingualInput(name, locales);

      setProduct((prev) => {
        /* multilanguage <input name="title_en"> etc. */
        if (parsed) {
          const { field, locale } = parsed;
          const realField = field === "desc" ? "description" : field; // 🎯 map alias

          // previous translations, guaranteed object or default to {}
          const translations =
            (prev as ProductPublication)[
              realField as "title" | "description"
            ] ?? ({} as Record<Locale, string>);

          const updatedTranslations: Record<Locale, string> = {
            ...translations,
            [locale]: value,
          };

          return {
            ...prev,
            [realField]: updatedTranslations,
          } as ProductPublication;
        }

        /* single-field updates */
        if (name === "price") {
          return { ...prev, price: Number(value) };
        }

        return prev;
      });
    },
    [locales]
  );

  /* ---------- assemble FormData ------------------------------------ */
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

  /* ---------- submit handler --------------------------------------- */
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setSaving(true);
      const result = await onSave(formData);

      if (result.errors) {
        setErrors(result.errors);
      } else if (result.product) {
        setProduct(result.product);
        setErrors({});
      }
      setSaving(false);
    },
    [onSave, formData]
  );

  /* ---------- public API ------------------------------------------- */
  return {
    product,
    errors,
    saving,
    publishTargets,
    setPublishTargets,
    handleChange,
    handleSubmit,
    uploader,
  };
}
