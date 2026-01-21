function normalizeInput(value) {
    if (value === null || value === undefined) {
        return Number.NaN;
    }
    if (typeof value === "bigint" || typeof value === "number") {
        return value;
    }
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed === "") {
            return Number.NaN;
        }
        return Number(trimmed);
    }
    return Number.NaN;
}
export function formatNumber(value, optionsOrLocale, localeOrOptions) {
    let resolvedLocale;
    let resolvedOptions;
    if (typeof optionsOrLocale === "string") {
        resolvedLocale = optionsOrLocale;
        if (localeOrOptions && typeof localeOrOptions !== "string") {
            resolvedOptions = localeOrOptions;
        }
    }
    else {
        resolvedOptions = optionsOrLocale;
        if (typeof localeOrOptions === "string") {
            resolvedLocale = localeOrOptions;
        }
        else if (localeOrOptions && typeof localeOrOptions !== "string") {
            resolvedOptions = localeOrOptions;
        }
    }
    const normalized = normalizeInput(value);
    return new Intl.NumberFormat(resolvedLocale, resolvedOptions).format(normalized);
}
