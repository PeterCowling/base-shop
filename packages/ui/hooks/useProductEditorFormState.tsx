import type { Locale, ProductPublication } from "@platform-core/products";
import { useImageUpload } from "@ui/hooks/useImageUpload";
import { usePublishLocations } from "@ui/hooks/usePublishLocations";
import { parseMultilingualInput } from "@ui/utils/multilingual";
import { useCallback, useMemo, useState } from "react";

export interface UseProductEditorFormReturn {
  product: ProductPublication;
  errors: Record<string, string[]>;
  saving: boolean;
  publishTargets: string[];
  setPublishTargets: (ids: string[]) => void;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleSubmit: (e: React.FormEvent) => void;
  uploader: JSX.Element;
}

export function useProductEditorFormState(
  init: ProductPublication,
  locales: readonly Locale[],
  onSave: (fd: FormData) => Promise<{
    product?: ProductPublication;
    errors?: Record<string, string[]>;
  }>
): UseProductEditorFormReturn {
  const [product, setProduct] = useState(init);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [publishTargets, setPublishTargets] = useState<string[]>([]);

  const { locations } = usePublishLocations();
  const requiredOrientation =
    locations.find((l) => l.id === publishTargets[0])?.requiredOrientation ??
    "landscape";

  const { file: imageFile, uploader } = useImageUpload(requiredOrientation);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      const parsed = parseMultilingualInput(name, locales);

      setProduct((prev) => {
        if (parsed) {
          const { field, locale } = parsed;
          return {
            ...prev,
            [field]: {
              ...prev[field],
              [locale]: value,
            },
          };
        }

        if (name === "price") {
          return { ...prev, price: Number(value) };
        }

        return prev;
      });
    },
    [locales]
  );

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

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
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
