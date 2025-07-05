import { useImageUpload } from "@ui/hooks/useImageUpload";
import { usePublishLocations } from "@ui/hooks/usePublishLocations";
import { parseMultilingualInput } from "@ui/utils/multilingual";
import { useCallback, useMemo, useState, } from "react";
/* ------------------------------------------------------------------ */
/* Main hook                                                          */
/* ------------------------------------------------------------------ */
export function useProductEditorFormState(init, locales, onSave) {
    /* ---------- state ------------------------------------------------ */
    const [product, setProduct] = useState(init);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [publishTargets, setPublishTargets] = useState([]);
    /* ---------- helpers ---------------------------------------------- */
    const { locations } = usePublishLocations();
    const requiredOrientation = locations.find((l) => l.id === publishTargets[0])?.requiredOrientation ??
        "landscape";
    const { file: imageFile, uploader } = useImageUpload(requiredOrientation);
    /* ---------- input change handler --------------------------------- */
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        const parsed = parseMultilingualInput(name, locales);
        setProduct((prev) => {
            /* multilanguage <input name="title_en"> etc. */
            if (parsed) {
                const { field, locale } = parsed;
                const realField = field === "desc" ? "description" : field; // 🎯 map alias
                // previous translations, guaranteed object or default to {}
                const translations = prev[realField] ?? {};
                const updatedTranslations = {
                    ...translations,
                    [locale]: value,
                };
                return {
                    ...prev,
                    [realField]: updatedTranslations,
                };
            }
            /* single-field updates */
            if (name === "price") {
                return { ...prev, price: Number(value) };
            }
            return prev;
        });
    }, [locales]);
    /* ---------- assemble FormData ------------------------------------ */
    const formData = useMemo(() => {
        const fd = new FormData();
        fd.append("id", product.id);
        locales.forEach((l) => {
            fd.append(`title_${l}`, product.title[l]);
            fd.append(`desc_${l}`, product.description[l]);
        });
        fd.append("price", String(product.price));
        if (imageFile)
            fd.append("image", imageFile);
        fd.append("publish", publishTargets.join(","));
        return fd;
    }, [product, imageFile, publishTargets, locales]);
    /* ---------- submit handler --------------------------------------- */
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setSaving(true);
        const result = await onSave(formData);
        if (result.errors) {
            setErrors(result.errors);
        }
        else if (result.product) {
            setProduct(result.product);
            setErrors({});
        }
        setSaving(false);
    }, [onSave, formData]);
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
