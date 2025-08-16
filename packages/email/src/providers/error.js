export function hasProviderErrorFields(err) {
    return typeof err === "object" && err !== null;
}
