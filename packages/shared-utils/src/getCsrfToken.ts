export function getCsrfToken(req?: Request): string | undefined {
  if (req) {
    const headerToken = req.headers.get("x-csrf-token");
    if (headerToken) return headerToken;
    return new URL(req.url).searchParams.get("csrf_token") ?? undefined;
  }
  if (typeof document === "undefined") return undefined;
  let csrfToken =
    document
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute("content") ??
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("csrf_token="))
      ?.split("=")[1];
  if (!csrfToken) {
    csrfToken = crypto.randomUUID();
    document.cookie = `csrf_token=${csrfToken}; path=/; SameSite=Strict${
      location.protocol === "https:" ? "; secure" : ""
    }`;
  }
  return csrfToken;
}
