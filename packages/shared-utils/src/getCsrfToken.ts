export function getCsrfToken(req?: Request): string | undefined {
  if (req) {
    const headerToken = req.headers.get("x-csrf-token")?.trim();
    if (headerToken) return headerToken;
    const queryToken = new URL(req.url).searchParams.get("csrf_token")?.trim();
    if (queryToken) return queryToken;
    const cookieToken = req.headers
      .get("cookie")
      ?.split(";")
      .map((row) => row.trim().split("="))
      .find(
        ([name, value]) =>
          name === "csrf_token" && value?.trim() && !value.trim().startsWith("/")
      )?.[1]
      ?.trim();
    return cookieToken || undefined;
  }
  if (typeof document === "undefined") return undefined;
  let csrfToken =
    document
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute("content")
      ?.trim() ??
    document.cookie
      .split(";")
      .map((row) => row.trim())
      .find((row) => row.startsWith("csrf_token="))
      ?.split("=")[1]
      ?.trim();
  if (!csrfToken) {
    csrfToken = crypto.randomUUID();
    document.cookie = `csrf_token=${csrfToken}; path=/; SameSite=Strict${
      location.protocol === "https:" ? "; secure" : ""
    }`;
  }
  return csrfToken;
}
