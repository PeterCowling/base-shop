// packages/ui/hooks/useProductEditorFormState.tsx
import type { Locale, ProductPublication } from "@platform-core/src/products";
import { useFileUpload } from "@ui/hooks/useFileUpload";
import { usePublishLocations } from "@ui/hooks/usePublishLocations";
import { parseMultilingualInput } from "@i18n/parseMultilingualInput";
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
export interface ProductWithVariants extends ProductPublication {
  variants: Record<string, string[]>;
}

export interface UseProductEditorFormReturn {
  product: ProductWithVariants;
  errors: Record<string, string[]>;
  saving: boolean;
  publishTargets: string[];
  setPublishTargets: (ids: string[]) => void;
  handleChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleSubmit: (e: FormEvent) => void;
  uploader: ReactElement;
  removeMedia: (index: number) => void;
  moveMedia: (from: number, to: number) => void;
  addVariantValue: (attr: string) => void;
  removeVariantValue: (attr: string, index: number) => void;
}

/* ------------------------------------------------------------------ */
/* Main hook                                                          */
/* ------------------------------------------------------------------ */
export function useProductEditorFormState(
  init: ProductPublication & { variants?: Record<string, string[]> },
  locales: readonly Locale[],
  onSave: (fd: FormData) => Promise<{
    product?: ProductPublication;
    errors?: Record<string, string[]>;
  }>
): UseProductEditorFormReturn {
  /* ---------- state ------------------------------------------------ */
  const [product, setProduct] = useState<ProductWithVariants>({
    ...init,
    variants: init.variants ?? {},
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [publishTargets, setPublishTargets] = useState<string[]>([]);

  /* ---------- helpers ---------------------------------------------- */
  const { locations } = usePublishLocations();
  const requiredOrientation =
    locations.find((l) => l.id === publishTargets[0])?.requiredOrientation ??
    "landscape";

  const { uploader } = useFileUpload({
    shop: init.shop,
    requiredOrientation,
    onUploaded: (item) =>
      setProduct((prev) => ({ ...prev, media: [...prev.media, item] })),
  });

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

        if (name.startsWith("variant_")) {
          const match = name.match(/^variant_(.+)_(\d+)$/);
          if (!match) return prev;
          const [, key, idxStr] = match;
          const idx = Number(idxStr);
          const existing = prev.variants[key] ?? [];
          const next = [...existing];
          next[idx] = value;
          return {
            ...prev,
            variants: { ...prev.variants, [key]: next },
          };
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
    fd.append("media", JSON.stringify(product.media));

    fd.append("publish", publishTargets.join(","));

    Object.entries(product.variants).forEach(([k, vals]) => {
      fd.append(`variant_${k}`, vals.filter(Boolean).join(","));
    });
    return fd;
  }, [product, publishTargets, locales]);

  /* ---------- submit handler --------------------------------------- */
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setSaving(true);
      const result = await onSave(formData);

      if (result.errors) {
        setErrors(result.errors);
      } else if (result.product) {
        setProduct({
          ...(result.product as ProductWithVariants),
          variants: (result.product as any).variants ?? product.variants,
        });
        setErrors({});
      }
      setSaving(false);
    },
    [onSave, formData, product.variants]
  );

  /* ---------- media helpers --------------------------------------- */
  const removeMedia = useCallback((index: number) => {
    setProduct((prev) => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index),
    }));
  }, []);

  const moveMedia = useCallback((from: number, to: number) => {
    setProduct((prev) => {
      const gallery = [...prev.media];
      const [moved] = gallery.splice(from, 1);
      gallery.splice(to, 0, moved);
      return { ...prev, media: gallery };
    });
  }, []);

  const addVariantValue = useCallback((attr: string) => {
    setProduct((prev) => ({
      ...prev,
      variants: {
        ...prev.variants,
        [attr]: [...(prev.variants[attr] ?? []), ""],
      },
    }));
  }, []);

  const removeVariantValue = useCallback((attr: string, index: number) => {
    setProduct((prev) => {
      const values = prev.variants[attr] ?? [];
      return {
        ...prev,
        variants: {
          ...prev.variants,
          [attr]: values.filter((_, i) => i !== index),
        },
      };
    });
  }, []);

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
    removeMedia,
    moveMedia,
    addVariantValue,
    removeVariantValue,
  };
}
