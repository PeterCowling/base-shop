import { useEffect, useState } from "react";
export function useImageOrientationValidation(file, required) {
    const [actual, setActual] = useState(null);
    useEffect(() => {
        if (!file) {
            setActual(null);
            return;
        }
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const orientation = img.width >= img.height ? "landscape" : "portrait";
            setActual(orientation);
            URL.revokeObjectURL(url);
        };
        img.onerror = () => {
            setActual(null);
            URL.revokeObjectURL(url);
        };
        img.src = url;
         
    }, [file]);
    const isValid = actual === null ? null : actual === required;
    return { actual, isValid };
}
