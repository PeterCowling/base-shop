export function getCsrfToken() {
    if (typeof document === "undefined")
        return undefined;
    let csrfToken = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content") ??
        document.cookie
            .split("; ")
            .find((row) => row.startsWith("csrf_token="))
            ?.split("=")[1];
    if (!csrfToken) {
        csrfToken = crypto.randomUUID();
        document.cookie = `csrf_token=${csrfToken}; path=/; SameSite=Strict${location.protocol === "https:" ? "; secure" : ""}`;
    }
    return csrfToken;
}
