"use client";
// packages/ui/hooks/useProductEditorFormState.tsx
import { useFileUpload } from "./useFileUpload";
import { usePublishLocations } from "../../../platform-core/src/hooks/usePublishLocations";
import { parseMultilingualInput } from "@acme/i18n/parseMultilingualInput";
import { useCallback, useMemo, useState, } from "react";
/* ------------------------------------------------------------------ */
/* Main hook                                                          */
/* ------------------------------------------------------------------ */
export function useProductEditorFormState(init, locales, onSave) {
    /* ---------- state ------------------------------------------------ */
    const [product, setProduct] = useState({
        ...init,
        variants: init.variants ?? {},
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [publishTargets, setPublishTargets] = useState([]);
    /* ---------- helpers ---------------------------------------------- */
    const { locations } = usePublishLocations();
    const requiredOrientation = locations.find((l) => l.id === publishTargets[0])?.requiredOrientation ??
        "landscape";
    const { uploader } = useFileUpload({
        shop: init.shop,
        requiredOrientation,
        onUploaded: (item) => setProduct((prev) => ({
            ...prev,
            media: [...prev.media, item],
        })),
    });
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
                const translations = (prev[realField] ?? {});
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
            if (name.startsWith("variant_")) {
                const match = name.match(/^variant_(.+)_(\d+)$/);
                if (!match)
                    return prev;
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
        fd.append("media", JSON.stringify(product.media));
        fd.append("publish", publishTargets.join(","));
        Object.entries(product.variants).forEach(([k, vals]) => {
            fd.append(`variant_${k}`, vals.filter(Boolean).join(","));
        });
        return fd;
    }, [product, publishTargets, locales]);
    /* ---------- submit handler --------------------------------------- */
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setSaving(true);
        const result = await onSave(formData);
        if (result.errors) {
            setErrors(result.errors);
        }
        else if (result.product) {
            const updated = {
                ...result.product,
                variants: result.product.variants ?? product.variants,
            };
            setProduct(updated);
            setErrors({});
        }
        setSaving(false);
    }, [onSave, formData, product.variants]);
    /* ---------- media helpers --------------------------------------- */
    const removeMedia = useCallback((index) => {
        setProduct((prev) => ({
            ...prev,
            media: prev.media.filter((_, i) => i !== index),
        }));
    }, []);
    const moveMedia = useCallback((from, to) => {
        setProduct((prev) => {
            const gallery = [...prev.media];
            const [moved] = gallery.splice(from, 1);
            gallery.splice(to, 0, moved);
            return { ...prev, media: gallery };
        });
    }, []);
    const addVariantValue = useCallback((attr) => {
        setProduct((prev) => ({
            ...prev,
            variants: {
                ...prev.variants,
                [attr]: [...(prev.variants[attr] ?? []), ""],
            },
        }));
    }, []);
    const removeVariantValue = useCallback((attr, index) => {
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
