import { useCallback } from "react";
export default function useComponentInputs(onChange) {
    const handleInput = useCallback((field, value) => {
        onChange({ [field]: value });
    }, [onChange]);
    return { handleInput };
}
