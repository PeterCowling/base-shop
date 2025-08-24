"use client";
import { useCallback } from "react";
export default function useComponentResize(onResize) {
    const handleResize = useCallback((field, value) => {
        const v = value.trim();
        onResize({ [field]: v || undefined });
    }, [onResize]);
    const handleFullSize = useCallback((field) => {
        onResize({ [field]: "100%" });
    }, [onResize]);
    return { handleResize, handleFullSize };
}
