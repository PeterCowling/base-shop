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
  media: (File | { url: string })[];
  removeMedia: (idx: number) => void;
  moveMedia: (from: number, to: number) => void;
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
  const [media, setMedia] = useState<(File | { url: string })[]>(
    init.media ?? []
  );

  /* ---------- helpers ---------------------------------------------- */

  const { uploader } = useFileUpload({
    onFilesSelected: (files) =>
      setMedia((prev) => [...prev, ...Array.from(files)]),
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

    media.forEach((m) => {
      if (m instanceof File) fd.append("media", m);
    });
    fd.append(
      "mediaOrder",
      JSON.stringify(
        media.map((m) => (m instanceof File ? m.name : m.url))
      )
    );

    fd.append("publish", publishTargets.join(","));
    return fd;
  }, [product, media, publishTargets, locales]);

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
    media,
    removeMedia: (idx: number) =>
      setMedia((prev) => prev.filter((_, i) => i !== idx)),
    moveMedia: (from: number, to: number) =>
      setMedia((prev) => {
        const next = [...prev];
        const [m] = next.splice(from, 1);
        next.splice(to, 0, m);
        return next;
      }),
  };
}
