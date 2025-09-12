type SimpleReq = { headers?: Record<string, string | undefined>; url?: string };

export function getCsrfToken(req?: Request | SimpleReq): string | undefined {
  if (req) {
    const headers: any = (req as any).headers;
    const getHeader = typeof headers?.get === "function"
      ? (name: string) => headers.get(name)
      : (name: string) => headers?.[name];

    const headerToken = getHeader("x-csrf-token")?.trim();
    if (headerToken) return headerToken;

    const reqUrl = (req as any).url;
    if (reqUrl) {
      const queryToken = new URL(reqUrl, "http://dummy").searchParams
        .get("csrf_token")
        ?.trim();
      if (queryToken) return queryToken;
    }

    const cookieHeader = getHeader("cookie") ?? "";
    const cookieToken = cookieHeader
      .split(";")
      .map((row: string) => row.trim().split("="))
      .find(
        ([name, value]: string[]) =>
          ["csrf_token", "csrf"].includes(name) &&
          value?.trim() &&
          !value.trim().startsWith("/")
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
