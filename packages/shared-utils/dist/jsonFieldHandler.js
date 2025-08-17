export function jsonFieldHandler(field, updater, setErrors) {
    return (e) => {
        const { value } = e.target;
        try {
            const parsed = JSON.parse(value);
            updater(parsed);
            setErrors((prev) => {
                const { [field]: _omit, ...rest } = prev;
                return rest;
            });
        }
        catch {
            setErrors((prev) => ({ ...prev, [field]: ["Invalid JSON"] }));
        }
    };
}
