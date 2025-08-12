// packages/ui/hooks/useProductEditorFormState.tsx
import type { Locale, ProductPublication } from "@platform-core/src/products";
import { useFileUpload } from "@ui/hooks/useFileUpload";
import { parseMultilingualInput } from "@i18n/parseMultilingualInput";
import {
  useCallback,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactElement,
} from "react";
import type { MediaItem } from "@acme/types";

/* ------------------------------------------------------------------ */
/* Hook return type                                                   */
/* ------------------------------------------------------------------ */
export interface ProductWithVariants extends ProductPublication {
  variants: Record<string, string[]>;
}

interface MediaWithFile extends MediaItem {
  file?: File;
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
  openFileDialog: () => void;
  removeMedia: (idx: number) => void;
  moveMedia: (from: number, to: number) => void;
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
    media: (init.media as MediaWithFile[]) ?? [],
    variants: init.variants ?? {},
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [publishTargets, setPublishTargets] = useState<string[]>([]);

  /* ---------- helpers ---------------------------------------------- */
  const handleFiles = useCallback((files: File[]) => {
    const items: MediaWithFile[] = files.map((f) => ({
      url: URL.createObjectURL(f),
      type: f.type.startsWith("video/") ? "video" : "image",
      file: f,
    }));
    setProduct((prev) => ({ ...prev, media: [...prev.media, ...items] }));
  }, []);

  const { uploader, open } = useFileUpload(handleFiles);

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
          const key = name.replace(/^variant_/, "");
          const values = value
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean);
          return {
            ...prev,
            variants: { ...prev.variants, [key]: values },
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
    product.media.forEach((m) => {
      if ((m as MediaWithFile).file) {
        fd.append("media", (m as MediaWithFile).file as File);
      } else {
        fd.append("mediaUrl", m.url);
      }
    });

    fd.append("publish", publishTargets.join(","));

    Object.entries(product.variants).forEach(([k, vals]) => {
      fd.append(`variant_${k}`, vals.join(","));
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

  const removeMedia = useCallback((idx: number) => {
    setProduct((prev) => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== idx),
    }));
  }, []);

  const moveMedia = useCallback((from: number, to: number) => {
    setProduct((prev) => {
      const updated = [...prev.media];
      const [item] = updated.splice(from, 1);
      updated.splice(to, 0, item);
      return { ...prev, media: updated };
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
    openFileDialog: open,
    removeMedia,
    moveMedia,
  };
}
